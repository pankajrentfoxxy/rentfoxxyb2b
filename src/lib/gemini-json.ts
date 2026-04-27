import { GoogleGenerativeAI } from "@google/generative-ai";

export async function geminiGenerateJson(prompt: string): Promise<unknown> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  const genAI = new GoogleGenerativeAI(key);
  const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash-latest";
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return JSON.parse(text) as unknown;
}
