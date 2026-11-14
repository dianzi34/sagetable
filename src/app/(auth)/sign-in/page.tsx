import type { ReactElement } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthForm } from "@/components/AuthForm";
import { getSafeCallbackUrl } from "@/lib/auth";
import { getOptionalUser } from "@/server/auth/session";

interface SignInPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

/**
 * Public sign-in page accepting an optional relative callbackUrl.
 */
export default async function SignInPage({
  searchParams,
}: Readonly<SignInPageProps>): Promise<ReactElement> {
  const [params, user] = await Promise.all([searchParams, getOptionalUser()]);
  const callbackUrl = getSafeCallbackUrl(params.callbackUrl, "/");

  return (
    <AppShell user={user}>
      <AuthForm mode="sign-in" callbackUrl={callbackUrl} currentUser={user} />
    </AppShell>
  );
}
