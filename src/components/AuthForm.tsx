"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent, type ReactElement } from "react";
import {
  PASSWORD_MIN_LENGTH,
  getSafeCallbackUrl,
  registerSchema,
  signInSchema,
} from "@/lib/auth";
import type { SessionUser } from "@/types/auth";
import { SignOutButton } from "./SignOutButton";

export interface AuthFormProps {
  mode: "sign-in" | "register";
  callbackUrl?: string;
  currentUser?: SessionUser | null;
}

interface ApiErrorPayload {
  error?: {
    message?: string;
  };
}

/**
 * Hand-drawn email/password authentication form supporting sign-in and registration.
 */
export function AuthForm({
  mode,
  callbackUrl,
  currentUser = null,
}: Readonly<AuthFormProps>): ReactElement {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();
  const passwordHintId = useId();
  const errorId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === "register";
  const safeCallback = getSafeCallbackUrl(callbackUrl, "/");
  const toggleQuery =
    safeCallback !== "/" ? `?callbackUrl=${encodeURIComponent(safeCallback)}` : "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setErrorMessage(null);

    const schema = isRegister ? registerSchema : signInSchema;
    const validation = schema.safeParse({ email, password });
    if (!validation.success) {
      setErrorMessage(
        validation.error.issues[0]?.message ?? "Please check your details",
      );
      return;
    }

    setSubmitting(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/sign-in";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validation.data),
      });

      if (!response.ok) {
        const body = (await response
          .json()
          .catch(() => null)) as ApiErrorPayload | null;
        setErrorMessage(
          body?.error?.message ?? "Authentication failed. Please try again.",
        );
        return;
      }

      router.push(safeCallback);
      router.refresh();
    } catch {
      setErrorMessage("Network error. Please check your connection and retry.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-md py-6">
      <div className="bg-grid-floor rounded-2xl border-[1.5px] border-line p-4 sm:p-6">
        <div className="border-2 border-ink bg-paper p-6 sm:p-8 border-wobbly shadow-slip">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">
            {isRegister ? "Create your SageTable account" : "Sign in to SageTable"}
          </h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            {isRegister
              ? "Keep your roundtables and saved passages private."
              : "Step back up to the table with your saved conversations."}
          </p>

          {currentUser ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border-[1.5px] border-line bg-table px-4 py-3 text-sm text-ink">
              <span>
                Signed in as <strong>{currentUser.email}</strong>
              </span>
              <SignOutButton redirectTo={isRegister ? "/register" : "/sign-in"} />
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
            {errorMessage ? (
              <div
                id={errorId}
                role="alert"
                className="rounded-xl border-2 border-danger bg-paper px-4 py-3 text-sm font-medium text-danger"
              >
                {errorMessage}
              </div>
            ) : null}

            <div>
              <label
                htmlFor={emailId}
                className="block text-sm font-semibold text-ink"
              >
                Email
              </label>
              <input
                id={emailId}
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={errorMessage ? "true" : undefined}
                aria-describedby={errorMessage ? errorId : undefined}
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-xl border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
              />
            </div>

            <div>
              <label
                htmlFor={passwordId}
                className="block text-sm font-semibold text-ink"
              >
                Password
              </label>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={errorMessage ? "true" : undefined}
                aria-describedby={
                  [
                    isRegister ? passwordHintId : undefined,
                    errorMessage ? errorId : undefined,
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                placeholder="••••••••"
                className="mt-1.5 w-full rounded-xl border-[1.5px] border-ink bg-paper px-3.5 py-2.5 text-base text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
              />
              {isRegister ? (
                <p id={passwordHintId} className="mt-1.5 text-xs text-muted">
                  Minimum {PASSWORD_MIN_LENGTH} characters.
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full border-2 border-ink bg-blue px-5 py-2.5 text-base font-semibold text-action-ink shadow-pill hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRegister
                ? submitting
                  ? "Creating account…"
                  : "Create account"
                : submitting
                  ? "Signing in…"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link
                  href={`/sign-in${toggleQuery}`}
                  className="rounded font-semibold text-ink underline underline-offset-4 hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                Need an account?{" "}
                <Link
                  href={`/register${toggleQuery}`}
                  className="rounded font-semibold text-ink underline underline-offset-4 hover:text-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
                >
                  Register
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
