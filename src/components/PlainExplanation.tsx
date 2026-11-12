import type { ReactElement } from "react";

export interface PlainExplanationProps {
  explanation: string;
}

/**
 * Plain-English summary accompanying a verbatim historical passage.
 */
export function PlainExplanation({
  explanation,
}: Readonly<PlainExplanationProps>): ReactElement {
  return (
    <div className="space-y-1">
      <h3 className="m-0 text-[0.95rem] font-semibold text-ink">
        In plain English
      </h3>
      <p className="m-0 text-muted leading-relaxed">{explanation}</p>
    </div>
  );
}
