import React from "react";
import { Passage } from "@/types";

interface PassageBlockProps {
  passage: Passage;
  accentColor?: string;
  className?: string;
}

export function PassageBlock({
  passage,
  accentColor,
  className = "",
}: PassageBlockProps): React.JSX.Element {
  return (
    <figure
      className={`m-0 p-4 pb-3 rounded-[4px_12px_10px_4px] bg-slip border border-line border-l-[5px] shadow-[2px_3px_0_var(--line)] -rotate-[0.8deg] transition-transform ${className}`}
      style={{
        borderLeftColor: accentColor || "var(--c, #2d5be3)",
      }}
    >
      <blockquote className="m-0 font-serif italic text-[1.05rem] leading-relaxed text-ink">
        “{passage.text}”
      </blockquote>
      <figcaption className="mt-2 text-muted text-[0.84rem]">
        {passage.source}
      </figcaption>
    </figure>
  );
}
