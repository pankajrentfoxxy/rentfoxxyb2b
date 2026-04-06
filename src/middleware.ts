import { copyCookies } from "@/lib/supabase/merge-response-cookies";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Must match Auth.js cookie names: `__Secure-authjs.session-token` on HTTPS, plain prefix on HTTP (local dev). */
function authUsesSecureCookies(req: NextRequest): boolean {
  const forwarded = req.headers.get("x-forwarded-proto");
  return forwarded === "https" || req.nextUrl.protocol === "https:";
}

export async function middleware(req: NextRequest) {
  const supabaseRes = await updateSupabaseSession(req);
  const path = req.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return supabaseRes;

  const secureCookie = authUsesSecureCookies(req);
  const token = await getToken({ req, secret, secureCookie });

  const redirectSignin = () => {
    const url = new URL("/auth/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", path);
    const res = NextResponse.redirect(url);
    copyCookies(supabaseRes, res);
    return res;
  };

  if (path.startsWith("/customer")) {
    if (!token) return redirectSignin();
    if (token.role !== "CUSTOMER") {
      const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
      copyCookies(supabaseRes, res);
      return res;
    }
  }

  if (path.startsWith("/vendor")) {
    if (!token) return redirectSignin();
    if (token.role !== "VENDOR") {
      const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
      copyCookies(supabaseRes, res);
      return res;
    }
  }

  if (path.startsWith("/admin")) {
    if (!token) return redirectSignin();
    if (token.role === "INSPECTION_MANAGER") {
      if (!path.startsWith("/admin/verifications")) {
        const res = NextResponse.redirect(new URL("/admin/verifications", req.nextUrl.origin));
        copyCookies(supabaseRes, res);
        return res;
      }
    } else if (token.role !== "ADMIN") {
      const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
      copyCookies(supabaseRes, res);
      return res;
    }
  }

  if (path.startsWith("/inspector")) {
    if (!token) return redirectSignin();
    if (token.role !== "INSPECTOR") {
      const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
      copyCookies(supabaseRes, res);
      return res;
    }
  }

  return supabaseRes;
}

export const config = {
  matcher: [
    /*
     * Run Supabase session refresh + auth on all non-static routes.
     * Static/image assets are excluded.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
