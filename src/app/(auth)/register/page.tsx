import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";
import { getSafeCallbackUrl } from "@/lib/auth";
import { getOptionalUser } from "@/server/auth/session";

interface RegisterPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

/**
 * Public account registration page accepting an optional relative callbackUrl.
 */
export default async function RegisterPage({
  searchParams,
}: Readonly<RegisterPageProps>): Promise<ReactElement> {
  const [params, user] = await Promise.all([searchParams, getOptionalUser()]);
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/");

  return (
    <AppShell user={user}>
      <AuthForm mode="register" callbackUrl={callbackUrl} currentUser={user} />
    </AppShell>
  );
}
