import React from "react";

interface PlainExplanationProps {
  explanation: string;
  className?: string;
}

export function PlainExplanation({
  explanation,
  className = "",
}: PlainExplanationProps): React.JSX.Element {
  return (
    <div className={`space-y-1 ${className}`}>
      <h4 className="m-0 text-[0.95rem] font-semibold text-ink">
        In plain English
      </h4>
      <p className="m-0 text-muted leading-relaxed">
        {explanation}
      </p>
    </div>
  );
}
