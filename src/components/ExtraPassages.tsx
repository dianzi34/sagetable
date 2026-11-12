"use client";

import { useState, type ReactElement } from "react";
import type { AnswerPassageItem } from "@/types/roundtable";
import { PassageBlock } from "./PassageBlock";

export interface ExtraPassagesProps {
  passages: AnswerPassageItem[];
}

/**
 * Interactive reveal toggle for additional verbatim passages on an answer card.
 */
export function ExtraPassages({
  passages,
}: Readonly<ExtraPassagesProps>): ReactElement | null {
  const [expanded, setExpanded] = useState(false);

  if (passages.length === 0) {
    return null;
  }

  if (!expanded) {
    const count = passages.length;
    const label =
      count === 1 ? "Show 1 more passage" : `Show ${count} more passages`;

    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-expanded={false}
        className="self-start rounded-full border-[1.5px] border-line bg-transparent px-3.5 py-1.5 text-[0.86rem] font-medium text-ink transition-colors hover:border-ink cursor-pointer"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {passages.map((passage) => (
        <PassageBlock
          key={`${passage.workTitle}-${passage.location}`}
          text={passage.text}
          workTitle={passage.workTitle}
          workYear={passage.workYear}
          location={passage.location}
          explanation={passage.explanation}
        />
      ))}
    </div>
  );
}
