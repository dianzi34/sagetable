"use client";

import { useState, type ReactElement } from "react";

export interface FlagButtonProps {
  figureName: string;
  onFlag?: () => void;
}

/**
 * Interactive single-use button for flagging an answer as inaccurate.
 */
export function FlagButton({
  figureName,
  onFlag,
}: Readonly<FlagButtonProps>): ReactElement {
  const [flagged, setFlagged] = useState(false);

  function handleClick(): void {
    if (flagged) {
      return;
    }
    setFlagged(true);
    onFlag?.();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={flagged}
      aria-label={flagged ? undefined : `Flag ${figureName}'s answer as inaccurate`}
      className="rounded-full border-[1.5px] border-line bg-transparent px-3.5 py-1.5 text-[0.9rem] font-medium text-ink transition-colors hover:border-ink cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      {flagged ? "Flagged, thanks" : "Flag"}
    </button>
  );
}
