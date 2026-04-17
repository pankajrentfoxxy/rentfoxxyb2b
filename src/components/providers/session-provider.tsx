"use client";

import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

/**
 * Pass `session` from `await auth()` in the root layout so client trees hydrate
 * correctly with NextAuth v5 + App Router (avoids blank / stuck loading UIs).
 */
export function AppSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session | null;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
