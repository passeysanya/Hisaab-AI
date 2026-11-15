import { GoogleGenAI } from "@google/genai";
import { EXTRACTION_PROMPT } from "../prompt";
import type { Extractor } from "../types";

const clients = new Map<string, GoogleGenAI>();

function client(apiKey: string): GoogleGenAI {
  let c = clients.get(apiKey);
  if (!c) {
    c = new GoogleGenAI({ apiKey });
    clients.set(apiKey, c);
  }
  return c;
}

/** A Gemini model that reads the bill directly (PDF or image, sent inline). */
export function geminiExtractor(apiKey: string, model: string): Extractor {
  return {
    id: `gemini:${model}`,
    label: model,
    kind: "ai",
    async run({ data, mimeType }) {
      const res = await client(apiKey).models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: data.toString("base64") } },
              { text: EXTRACTION_PROMPT },
            ],
          },
        ],
        config: { responseMimeType: "application/json", temperature: 0 },
      });
      const text = res.text;
      if (!text) throw new Error("Gemini returned an empty response");
      return text;
    },
  };
}
