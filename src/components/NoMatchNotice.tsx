import type { ReactElement } from "react";

export interface NoMatchNoticeProps {
  figureName: string;
}

/**
 * Honest notice shown when a figure has no matching curated passage for a question.
 */
export function NoMatchNotice({
  figureName,
}: Readonly<NoMatchNoticeProps>): ReactElement {
  return (
    <p className="m-0 rounded-xl border-[1.5px] border-dashed border-line px-3.5 py-3 text-sm leading-relaxed text-muted">
      {figureName} hasn&apos;t written about this yet.
    </p>
  );
}
