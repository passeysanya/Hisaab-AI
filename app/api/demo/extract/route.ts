import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildExtractors } from "@/lib/ai/build-extractors";
import { extractBatch } from "@/lib/ai/extract-with-fallback";
import { clientIp, demoLimiter } from "@/lib/demo/rate-limit";
import type { BillInput, DemoExtractResponse } from "@/lib/demo/types";
import { MAX_BILLS, sniffType, validateUploads } from "@/lib/demo/validate-upload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby caps functions at 60 s. Bills are read in sequence by Gemini (a few s each);
// slow image OCR runs in the browser, not here.
export const maxDuration = 60;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

/**
 * POST multipart/form-data with up to 5 "bills". Files are processed in memory and
 * never written to disk or a database. Returns the extracted bills; the browser OCRs
 * any images handed off to it, then builds "Your Hisaab" with buildReport.
 */
export async function POST(req: Request) {
  const limit = await demoLimiter().check(clientIp(req.headers));
  if (!limit.allowed) {
    const mins = Math.ceil(limit.retryAfterSec / 60);
    return json(
      { error: `Demo limit reached for your network. Try again in about ${mins} minute${mins === 1 ? "" : "s"}, or use the sample bills.` },
      429,
      { "Retry-After": String(limit.retryAfterSec) },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Send the bills as multipart form data." }, 400);
  }

  const files = form.getAll("bills").filter((f): f is File => f instanceof File);
  if (files.length > MAX_BILLS) {
    return json({ error: `Up to ${MAX_BILLS} bills per run.` }, 400);
  }

  const loaded = await Promise.all(
    files.map(async (file) => {
      const data = Buffer.from(await file.arrayBuffer());
      return { file, data, head: new Uint8Array(data.subarray(0, 16)) };
    }),
  );
  const errors = validateUploads(loaded.map(({ file, data, head }) => ({ name: file.name, size: data.length, head })));
  if (errors.length > 0) return json({ error: errors.join(" ") }, 400);

  const { extractors, plan } = await buildExtractors(process.env);
  const inputs = loaded.map(({ file, data, head }) => ({
    data,
    mimeType: sniffType(head)!,
    fileName: file.name || "bill",
  }));
  const outcomes = await extractBatch(inputs, extractors);

  const bills: BillInput[] = loaded.map(({ data }, i) => ({
    id: randomUUID(),
    fileName: inputs[i].fileName,
    source: "upload",
    sha256: createHash("sha256").update(data).digest("hex"),
    previewUrl: null,
    outcome: outcomes[i],
  }));

  const body: DemoExtractResponse = { bills, notes: plan.notes };
  return json(body, 200, { "X-RateLimit-Remaining": String(limit.remaining) });
}
