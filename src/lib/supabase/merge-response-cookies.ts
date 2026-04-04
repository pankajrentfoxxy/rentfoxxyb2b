import { NextResponse } from "next/server";

/** Preserve Supabase session refresh cookies when returning a different NextResponse (e.g. redirect). */
export function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((c) => {
    target.cookies.set(c.name, c.value);
  });
}
