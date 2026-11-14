"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";

export interface SignOutButtonProps {
  redirectTo?: string;
}

/**
 * Interactive button that clears the session cookie and navigates to sign-in.
 */
export function SignOutButton({
  redirectTo = "/sign-in",
}: Readonly<SignOutButtonProps>): ReactElement {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleSignOut(): Promise<void> {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      router.push(redirectTo);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={submitting}
      className="rounded-full border-[1.5px] border-ink bg-paper px-4 py-1.5 text-sm font-semibold text-ink shadow-pill hover:bg-table focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
    >
      {submitting ? "Signing out…" : "Sign out"}
    </button>
  );
}
