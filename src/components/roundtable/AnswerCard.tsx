import React from "react";
import { AnswerCardProps, AnswerCardStatus, Figure } from "@/types";
import { FigureAvatar } from "./FigureAvatar";
import { PassageBlock } from "./PassageBlock";
import { PlainExplanation } from "./PlainExplanation";

function getPossessivePronoun(figure: Figure): string {
  if (figure.pronoun) {
    return figure.pronoun;
  }
  const lower = (figure.name + " " + figure.id).toLowerCase();
  if (
    lower.includes("curie") ||
    lower.includes("keller") ||
    lower.includes("marie") ||
    lower.includes("helen")
  ) {
    return "her";
  }
  if (
    lower.includes("twain") ||
    lower.includes("vincent") ||
    lower.includes("leonardo")
  ) {
    return "his";
  }
  return "their";
}

export function AnswerCard({
  figure,
  status: statusProp,
  answer,
  passage,
  explanation,
  onRetry,
  onFlag,
  isFlagged = false,
}: AnswerCardProps): React.JSX.Element {
  const status: AnswerCardStatus =
    statusProp ?? (passage ? "complete" : "noPassage");

  const pronoun = getPossessivePronoun(figure);

  return (
    <article
      id={`card-${figure.id}`}
      className="bg-paper border-2 border-ink rounded-[255px_18px_225px_18px/18px_225px_18px_255px] p-5 pb-4 flex flex-col gap-3.5 shadow-sm transition-all text-ink"
      style={{ "--c": figure.accentColor } as React.CSSProperties}
    >
      {/* Figure Header */}
      <div className="flex items-center gap-3">
        <FigureAvatar
          avatarId={figure.avatarId || figure.id}
          name={figure.name}
        />
        <div>
          <h3 className="m-0 font-heading text-[1.15rem] font-bold text-ink leading-tight">
            {figure.name}
          </h3>
          <span className="text-muted text-[0.86rem] leading-tight block mt-0.5">
            {figure.meta}
          </span>
        </div>
      </div>

      {/* Card Content by Status */}
      {status === "failed" ? (
        <>
          <p
            className="m-0 text-danger text-[0.95rem] leading-relaxed"
            role="alert"
          >
            {figure.name}’s answer stopped before it finished. The other answers
            are not affected.
          </p>
          <div className="flex justify-end gap-2 border-t border-dashed border-line pt-3 mt-auto">
            <button
              type="button"
              onClick={onRetry}
              className="text-[0.9rem] border rounded-full px-3.5 py-1.5 cursor-pointer font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: "var(--c, #2d5be3)",
                borderColor: "var(--c, #2d5be3)",
              }}
            >
              Retry this answer
            </button>
          </div>
        </>
      ) : status === "streaming" ? (
        <>
          <p className="m-0 leading-relaxed text-ink" aria-live="polite">
            {answer}
            <span className="streaming-cursor" aria-hidden="true" />
          </p>
          <div
            className="h-[70px] rounded-xl border border-dashed border-line bg-[repeating-linear-gradient(-45deg,var(--grid),var(--grid)_8px,transparent_8px,transparent_16px)]"
            aria-hidden="true"
          />
          <div className="flex justify-end gap-2 border-t border-dashed border-line pt-3 mt-auto">
            <button
              type="button"
              disabled
              aria-label={`Flag ${figure.name}’s answer as inaccurate`}
              className="text-[0.9rem] border border-line rounded-full px-3.5 py-1.5 opacity-45 cursor-not-allowed text-ink bg-transparent"
            >
              Flag
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="m-0 leading-relaxed text-ink">{answer}</p>

          {passage ? (
            <>
              <PassageBlock
                passage={passage}
                accentColor={figure.accentColor}
              />
              {explanation && <PlainExplanation explanation={explanation} />}
            </>
          ) : (
            <p className="m-0 p-3.5 border border-dashed border-line rounded-xl text-muted text-sm leading-relaxed">
              No passage in {pronoun} uploaded writings closely matches this
              question, so none is shown. SageTable never invents a quote.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-dashed border-line pt-3 mt-auto">
            <button
              type="button"
              onClick={onFlag}
              aria-label={`Flag ${figure.name}’s answer as inaccurate`}
              className="text-[0.9rem] border border-line rounded-full px-3.5 py-1.5 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-ink bg-transparent"
            >
              {isFlagged ? "Flagged for review" : "Flag"}
            </button>
          </div>
        </>
      )}
    </article>
  );
}
