import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "GEMINI_API_KEY not set" }, { status: 500 });
  }
  try {
    const genAI = new GoogleGenerativeAI(key);
    const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash-latest";
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say exactly: Rentfoxxy AI Ready");
    return NextResponse.json({ ok: true, model: modelName, response: result.response.text() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
