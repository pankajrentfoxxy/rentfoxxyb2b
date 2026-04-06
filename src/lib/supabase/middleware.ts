import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Refreshes Supabase Auth session cookies. Call once per request from root middleware.
 * No-op when Supabase env is unset (local Prisma + Auth.js only).
 */
export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!url || !key) {
    return NextResponse.next({
      request: { headers: request.headers },
    });
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Avoid hanging the whole app if Supabase URL/key are wrong or the network stalls.
  const supabaseTimeoutMs = Math.min(
    15000,
    Math.max(2000, Number(process.env.SUPABASE_MIDDLEWARE_TIMEOUT_MS) || 5000),
  );
  try {
    await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("supabase_middleware_timeout")), supabaseTimeoutMs),
      ),
    ]);
  } catch {
    /* continue without refreshing Supabase session */
  }
  return supabaseResponse;
}
