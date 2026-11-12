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
      <h3 className="m-0 text-xs font-semibold text-muted">
        In plain English
      </h3>
      <p className="m-0 text-ink leading-relaxed">{explanation}</p>
    </div>
  );
}
