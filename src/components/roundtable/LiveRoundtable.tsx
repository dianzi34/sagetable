"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { AnswerCard } from "@/components/AnswerCard";
import type { AnswerCardData, AnswerPassageItem, RoundtableFigure } from "@/types/roundtable";

export interface LiveRoundtableProps {
  initialThemeSlug?: string;
  initialFigureIds?: string[];
  initialQuestion?: string;
  roundtableId?: string;
}

interface FigureCardState {
  figure: RoundtableFigure;
  status: "pending" | "streaming" | "completed" | "no_match" | "failed";
  body: string;
  passages: AnswerPassageItem[];
}

export function LiveRoundtable({
  initialThemeSlug,
  initialFigureIds = [],
  initialQuestion = "",
  roundtableId,
}: LiveRoundtableProps): ReactElement {
  const [cards, setCards] = useState<Map<string, FigureCardState>>(new Map());
  const [question, setQuestion] = useState<string>(initialQuestion);
  const [themeName, setThemeName] = useState<string>(
    initialThemeSlug ? initialThemeSlug.replace(/-/g, " ") : "Roundtable",
  );
  const [error, setError] = useState<string | null>(null);
  const [, setIsDone] = useState<boolean>(false);
  const isDoneRef = useRef<boolean>(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const postPromiseRef = useRef<Promise<string | null> | null>(null);
  const createdRoundtableIdRef = useRef<string | null>(roundtableId ?? null);

  const figureIdsKey = initialFigureIds.join(",");

  useEffect(() => {
    let cancelled = false;

    async function initRoundtable(): Promise<void> {
      setError(null);
      isDoneRef.current = false;
      setIsDone(false);

      let targetId = createdRoundtableIdRef.current ?? roundtableId;

      if (!targetId) {
        const figureIds = figureIdsKey ? figureIdsKey.split(",") : [];
        if (!initialQuestion || figureIds.length === 0) {
          setError("Missing question or figures to start roundtable.");
          return;
        }

        try {
          if (!postPromiseRef.current) {
            postPromiseRef.current = (async () => {
              const res = await fetch("/api/roundtables", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  themeSlug: initialThemeSlug,
                  figureIds,
                  question: initialQuestion,
                }),
              });

              if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(
                  errJson.error?.message ?? "Failed to create roundtable",
                );
              }

              const data = await res.json();
              const id = data.data?.id ?? data.id;
              createdRoundtableIdRef.current = id;
              if (data.data?.roundtable?.theme?.name) {
                setThemeName(data.data.roundtable.theme.name);
              }
              if (data.data?.roundtable?.question) {
                setQuestion(data.data.roundtable.question);
              }
              return id;
            })();
          }

          targetId = (await postPromiseRef.current) ?? undefined;
        } catch (err) {
          postPromiseRef.current = null;
          if (!cancelled) {
            setError(
              err instanceof Error
                ? err.message
                : "Unable to start roundtable session.",
            );
          }
          return;
        }
      }

      if (cancelled || !targetId) return;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`/api/roundtables/${targetId}/stream`);
      eventSourceRef.current = es;

      es.addEventListener("figure-start", (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          const fig = payload.figure ?? {
            id: payload.figureId,
            slug: payload.figureSlug ?? payload.figureId,
            name: payload.figureName ?? "Figure",
            field: "",
            era: "",
          };

          setCards((prev) => {
            const next = new Map(prev);
            next.set(payload.figureId, {
              figure: fig,
              status: "streaming",
              body: "",
              passages: [],
            });
            return next;
          });
        } catch {
          // ignore malformed
        }
      });

      es.addEventListener("chunk", (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          setCards((prev) => {
            const next = new Map(prev);
            const existing = next.get(payload.figureId);
            if (existing) {
              next.set(payload.figureId, {
                ...existing,
                body: existing.body + payload.text,
              });
            }
            return next;
          });
        } catch {
          // ignore
        }
      });

      es.addEventListener("figure-done", (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          setCards((prev) => {
            const next = new Map(prev);
            const existing = next.get(payload.figureId);
            if (existing) {
              next.set(payload.figureId, {
                ...existing,
                status: "completed",
                passages: payload.passages ?? [],
              });
            }
            return next;
          });
        } catch {
          // ignore
        }
      });

      es.addEventListener("no-match", (event: MessageEvent) => {
        if (cancelled) return;
        try {
          const payload = JSON.parse(event.data);
          const fig = payload.figure ?? {
            id: payload.figureId,
            slug: payload.figureId,
            name: payload.figureName ?? "Figure",
            field: "",
            era: "",
          };

          setCards((prev) => {
            const next = new Map(prev);
            next.set(payload.figureId, {
              figure: fig,
              status: "no_match",
              body: "",
              passages: [],
            });
            return next;
          });
        } catch {
          // ignore
        }
      });

      es.addEventListener("done", () => {
        if (cancelled) return;
        isDoneRef.current = true;
        setIsDone(true);
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      });

      es.addEventListener("error", () => {
        if (cancelled || isDoneRef.current) return;
        setError(
          "Connection interrupted. Answers may be incomplete.",
        );
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
      });
    }

    void initRoundtable();

    return () => {
      cancelled = true;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [figureIdsKey, initialQuestion, initialThemeSlug, roundtableId]);

  const cardList: AnswerCardData[] = Array.from(cards.values()).map((state) => ({
    figure: state.figure,
    answer:
      state.status === "no_match"
        ? null
        : {
            body: state.body,
            passages: state.passages,
          },
  }));

  return (
    <>
      <section className="bg-grid-floor pt-8 pb-10 px-6">
        <div className="max-w-[760px] mx-auto text-center flex flex-col items-center gap-3">
          <span className="inline-block rounded-full border-[1.5px] border-line bg-paper px-3.5 py-1 text-sm text-muted shadow-pill capitalize">
            {themeName}
          </span>
          <h1 className="font-display font-semibold text-[clamp(1.35rem,2.8vw,1.9rem)] leading-snug text-ink m-0">
            {question}
          </h1>
        </div>
      </section>

      {error && (
        <section className="w-full max-w-page mx-auto px-6 pt-4">
          <div
            role="alert"
            className="p-4 rounded-xl border border-red-300 bg-red-50 text-red-900 text-sm flex items-center justify-between"
          >
            <span>{error}</span>
          </div>
        </section>
      )}

      <section
        aria-label="Roundtable answers"
        className="w-full max-w-page mx-auto px-6 pt-2 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
      >
        {cardList.length === 0 && !error ? (
          <div className="col-span-full text-center py-12 text-muted">
            <p className="animate-pulse">Gathering figures around the table…</p>
          </div>
        ) : (
          cardList.map((card) => (
            <AnswerCard key={card.figure.slug} data={card} />
          ))
        )}
      </section>
    </>
  );
}
