import type { CSSProperties, ReactElement } from "react";
import { getFigureAccent } from "@/lib/figures";
import type { AnswerCardData } from "@/types/roundtable";
import { ExtraPassages } from "./ExtraPassages";
import { FigureAvatar } from "./FigureAvatar";
import { FlagButton } from "./FlagButton";
import { NoMatchNotice } from "./NoMatchNotice";
import { PassageBlock } from "./PassageBlock";

export interface AnswerCardProps {
  data: AnswerCardData;
  onFlag?: () => void;
}

/**
 * Hand-drawn card displaying one figure's curated answer, verbatim passages, or no-match notice.
 */
export function AnswerCard({
  data,
  onFlag,
}: Readonly<AnswerCardProps>): ReactElement {
  const { figure, answer } = data;
  const accent = getFigureAccent(figure.slug);
  const [firstPassage, ...extraPassages] = answer?.passages ?? [];

  return (
    <article
      style={{ "--figure-accent": accent } as CSSProperties}
      className="bg-paper border-2 border-ink border-wobbly p-5 pb-4 flex flex-col gap-3.5"
    >
      <div className="flex items-center gap-3">
        <FigureAvatar slug={figure.slug} name={figure.name} />
        <div className="min-w-0">
          <h2 className="m-0 font-display font-semibold text-[1.15rem] leading-tight text-ink">
            {figure.name}
          </h2>
          <p className="m-0 mt-0.5 text-[0.86rem] leading-snug text-muted">
            {figure.field} · {figure.era}
          </p>
        </div>
      </div>

      {answer === null ? (
        <NoMatchNotice figureName={figure.name} />
      ) : (
        <>
          <p className="m-0 text-ink leading-relaxed">{answer.body}</p>

          {firstPassage ? (
            <PassageBlock
              text={firstPassage.text}
              workTitle={firstPassage.workTitle}
              workYear={firstPassage.workYear}
              location={firstPassage.location}
              explanation={firstPassage.explanation}
            />
          ) : null}

          {extraPassages.length > 0 ? (
            <ExtraPassages passages={extraPassages} />
          ) : null}

          <div className="mt-auto pt-3 border-t-[1.5px] border-dashed border-line flex flex-wrap items-center justify-between gap-2">
            <p className="m-0 text-xs text-muted">
              Curated interpretation in {figure.name}&apos;s voice
            </p>
            <FlagButton
              figureName={figure.name}
              {...(onFlag ? { onFlag } : {})}
            />
          </div>
        </>
      )}
    </article>
  );
}
