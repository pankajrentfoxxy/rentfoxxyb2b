import { copyCookies } from "@/lib/supabase/merge-response-cookies";
import { updateSupabaseSession } from "@/lib/supabase/middleware";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const supabaseRes = await updateSupabaseSession(req);
  const path = req.nextUrl.pathname;
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) return supabaseRes;

  const token = await getToken({ req, secret });

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
    if (token.role !== "ADMIN") {
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
