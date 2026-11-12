import type { CSSProperties, ReactElement } from "react";
import { PlainExplanation } from "./PlainExplanation";

export interface PassageBlockProps {
  text: string;
  workTitle: string;
  workYear: number;
  location: string;
  explanation?: string;
  accentColor?: string;
}

/**
 * Verbatim public-domain passage styled as a tilted paper slip with source citation and optional plain-English note.
 */
export function PassageBlock({
  text,
  workTitle,
  workYear,
  location,
  explanation,
  accentColor,
}: Readonly<PassageBlockProps>): ReactElement {
  return (
    <div
      style={
        accentColor
          ? ({ "--figure-accent": accentColor } as CSSProperties)
          : undefined
      }
      className="bg-slip border-[1.5px] border-line border-l-[5px] border-l-[var(--figure-accent,var(--blue))] rounded-[4px_12px_10px_4px] px-4 pt-4 pb-3.5 shadow-slip -rotate-[0.8deg]"
    >
      <figure className="m-0">
        <blockquote className="m-0 font-serif italic text-[1.05rem] leading-[1.6] text-ink before:content-['“'] after:content-['”']">
          {text}
        </blockquote>
        <figcaption className="mt-2 text-[0.84rem] text-muted">
          {`${workTitle}, ${workYear}, ${location}`}
        </figcaption>
      </figure>
      {explanation ? (
        <div className="mt-3 pt-2.5 border-t border-dashed border-line">
          <PlainExplanation explanation={explanation} />
        </div>
      ) : null}
    </div>
  );
}
