import { jsonError } from "@/server/auth/routeHelper";
import { authErrorResponse, requireUser } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { matchAnswers } from "@/server/matching";

export const runtime = "nodejs";
export const maxDuration = 60;

interface StreamRouteContext {
  params: Promise<{ id: string }>;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatSse(event: string, data: unknown): string {
  return `retry: 600000\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function chunkText(text: string, wordsPerChunk = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    const chunkWords = words.slice(i, i + wordsPerChunk);
    const suffix = i + wordsPerChunk < words.length ? " " : "";
    chunks.push(chunkWords.join(" ") + suffix);
  }
  return chunks;
}

export async function GET(
  request: Request,
  context: StreamRouteContext,
): Promise<Response> {
  let user;
  try {
    user = await requireUser(request);
  } catch (error) {
    return (
      authErrorResponse(error) ??
      jsonError(401, "UNAUTHORIZED", "Authentication required")
    );
  }

  const { id } = await Promise.resolve(context.params);

  const roundtable = await prisma.roundtable.findUnique({
    where: { id },
    include: {
      answers: {
        include: { figure: true },
      },
      theme: true,
    },
  });

  if (!roundtable || roundtable.userId !== user.id) {
    return jsonError(404, "NOT_FOUND", "Roundtable not found");
  }

  const figureIds = roundtable.answers.map((a) => a.figureId);
  let matches;
  try {
    matches = await matchAnswers({
      question: roundtable.question,
      figureIds,
      themeId: roundtable.themeId,
    });
  } catch {
    return jsonError(500, "INTERNAL_ERROR", "Failed to match answers");
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown): void => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(formatSse(event, data)));
        } catch {
          closed = true;
        }
      };

      const abortHandler = (): void => {
        closed = true;
        try {
          controller.close();
        } catch {
          // ignore already closed
        }
      };

      request.signal.addEventListener("abort", abortHandler);

      try {
        const figureMap = new Map(
          roundtable.answers.map((a) => [a.figureId, a.figure]),
        );

        const matchingFigures: Array<{
          figure: { id: string; slug: string; name: string };
          chunks: string[];
          match: (typeof matches)[number];
        }> = [];

        // Identify matched vs no-match figures
        for (const match of matches) {
          const figure = figureMap.get(match.figureId);
          if (!figure) continue;

          if (!match.answer) {
            send("no-match", {
              figureId: figure.id,
              figure: {
                id: figure.id,
                slug: figure.slug,
                name: figure.name,
                field: figure.field,
                era: figure.era,
              },
              message: `${figure.name} hasn't written about this yet.`,
            });

            await prisma.roundtableAnswer
              .update({
                where: {
                  roundtableId_figureId: {
                    roundtableId: roundtable.id,
                    figureId: figure.id,
                  },
                },
                data: { status: "no_match" },
              })
              .catch(() => {});
          } else {
            send("figure-start", {
              figureId: figure.id,
              figureSlug: figure.slug,
              figureName: figure.name,
              figure: {
                id: figure.id,
                slug: figure.slug,
                name: figure.name,
                field: figure.field,
                era: figure.era,
              },
            });

            matchingFigures.push({
              figure,
              chunks: chunkText(match.answer.body),
              match,
            });
          }
        }

        // Interleave streaming chunks across all matching figures
        const maxChunks = matchingFigures.reduce(
          (max, item) => Math.max(max, item.chunks.length),
          0,
        );

        for (let round = 0; round < maxChunks; round++) {
          if (closed || request.signal.aborted) break;

          for (const item of matchingFigures) {
            if (round < item.chunks.length) {
              send("chunk", {
                figureId: item.figure.id,
                text: item.chunks[round],
              });
            }
          }

          if (process.env.NODE_ENV !== "test") {
            await delay(30);
          }
        }

        // Emit figure-done with verbatim passages and explanations
        for (const item of matchingFigures) {
          if (closed || request.signal.aborted) break;

          send("figure-done", {
            figureId: item.figure.id,
            answerId: item.match.answer!.id,
            passages: item.match.answer!.passages,
          });

          await prisma.roundtableAnswer
            .update({
              where: {
                roundtableId_figureId: {
                  roundtableId: roundtable.id,
                  figureId: item.figure.id,
                },
              },
              data: {
                status: "completed",
                answerId: item.match.answer!.id,
              },
            })
            .catch(() => {});
        }

        if (!closed && !request.signal.aborted) {
          send("done", { status: "complete" });
        }
      } catch (err) {
        send("error", {
          message:
            err instanceof Error ? err.message : "Failed to stream answers",
        });
      } finally {
        request.signal.removeEventListener("abort", abortHandler);
        if (!closed) {
          try {
            controller.close();
          } catch {
            // ignore
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
