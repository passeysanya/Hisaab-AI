# Hisaab AI

**An invoice inbox that does the bookkeeping.**

Small Indian businesses get vendor bills as PDFs, phone photos and WhatsApp images. Hisaab AI reads each one and pulls out:
- the vendor, GSTIN and invoice number
- the dates
- the line items, CGST/SGST/IGST and the total

It then checks the numbers and compares bills with each other, flagging duplicates and price rises. Every flag says why.

The live demo at `/demo` runs this end to end on up to 5 bills, or on 3 watermarked sample bills. It needs no account and no database.

## What you get ("Your Hisaab")
- **Every extracted field with a confidence score** and the AI's own note, for example "due date inferred from 30-day terms". Fields below 85% are marked for review.
- **Per-bill checks:**
  - GSTIN format, state code and mod-36 checksum
  - qty × rate = amount on each line
  - lines add up to the subtotal
  - subtotal + tax = total
  - CGST = SGST
- **Cross-bill flags**, each with a plain-English reason and its evidence:
  - an exact duplicate (same file hash, or same vendor and invoice number)
  - a possible duplicate (same vendor and amount within 7 days)
  - a unit price that went up between bills
- **Totals**: billed, payable (duplicates excluded) and amount at risk. The bill table and line items download as CSV.

## How the AI works
```
bill ──► Gemini (GEMINI_MODEL) ──429/quota──► Gemini (GEMINI_FALLBACK_MODEL) ──429/quota──► offline OCR
                    │                                       │                                      │
                    └──────────── JSON with a value + confidence for every field ──────────────────┘
                                                            │
                                         Zod schema ─► GSTIN + arithmetic checks ─► cross-bill flags
```
1. **Extraction.** The file is sent inline to the Gemini API (free tier). The prompt asks for JSON that gives every field a value, a confidence from 0 to 1 and an optional note.
2. **Fallback, only on quota errors.** A 429 or `RESOURCE_EXHAUSTED` moves the bill to the fallback model, and then to offline OCR. Any other error is shown as an error, so a worse extractor never quietly hides a real failure. Once a model runs out of quota, later bills in the same batch skip it.
3. **Offline OCR.**
   - Photos are read by Tesseract.js **in the visitor's browser**. Its language file loads from the jsDelivr CDN and is cached in IndexedDB. Nothing is cached on the server.
   - PDFs are read from their text layer on the server, using pdf-parse.
   - A heuristic parser maps the text to the same schema. Confidence is capped at 60%, so OCR results are always marked for review.
4. **Validation.** Every extractor's output must pass the same Zod schema. Amounts such as "₹1,01,900" and dates such as 04/11/2026 are normalised. Output that doesn't parse counts as an error.
5. **Checks and flags** are pure TypeScript functions in `lib/demo` and `lib/flags`, with unit tests. No AI is involved, so the reasons are deterministic.

Without a `GEMINI_API_KEY`, the demo still works: it goes straight to offline OCR.

## Run it locally
Requirements: Node 18.17+ (20 LTS recommended).

```powershell
npm install
Copy-Item .env.example .env.local   # then fill in GEMINI_API_KEY and GEMINI_MODEL (optional)
npm run dev                          # http://localhost:3000  ·  demo at /demo
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Vitest unit tests (no API key or network needed) |

## Environment variables
Every variable is listed in `.env.example`, with comments. All of them are optional for the demo.

| Variable | Purpose |
| --- | --- |
| `AI_PROVIDER` | `gemini` (default). `claude` is a stub for later |
| `GEMINI_API_KEY` | Gemini API key. Server only; never sent to the browser |
| `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` | Primary model, and the model used on 429 / quota errors |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limit shared across serverless instances. If unset, the limit is kept in memory |
| `DATABASE_URL` | For the Phase 2 data model. Not used by the demo or the build |

## Deploying to Vercel (free tier)
1. Import the repo into Vercel. The framework preset is detected as Next.js; no build settings need changing.
2. Add `GEMINI_API_KEY`, `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL` in Project → Settings → Environment Variables.
3. Create a free Redis database at [Upstash](https://console.upstash.com) and add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Without these, each serverless instance keeps its own count, so the limit of 5 runs per IP per hour isn't really enforced.

Design choices for serverless:
- **No disk.** Uploads are handled in memory. OCR for images runs in the browser, and its assets come from a CDN.
- **4.5 MB body limit.** Photos over 1 MB are shrunk in the browser (longest side 2000 px, JPEG) before upload, and one run is capped at 4 MB.
- **60 s function limit.** The route sets `maxDuration = 60`. Gemini takes a few seconds per bill, and slow OCR doesn't run on the server.
- **No database** is needed to build or run the demo.

## Privacy
Uploaded bills are never stored by Hisaab AI. They go to Google's Gemini API, and Google may use free-tier content to improve its products, so the demo warns visitors not to upload sensitive bills. Results stay in the browser tab (sessionStorage) and are gone when it closes.

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Google Gemini API (`@google/genai`), validated with Zod
- Tesseract.js (in the browser) and pdf-parse
- Upstash Redis rate limiting
- Vitest

Planned for later phases: Prisma, with SQLite locally and Postgres in production.

## Roadmap
1. ✅ Landing page
2. Data model + seed data
3. Upload + AI extraction (✅ in `/demo`, without storage)
4. PO matching + duplicate / price-increase flags (✅ cross-bill flags in `/demo`; PO matching still to do)
5. Dashboard
6. Email ingestion
7. WhatsApp ingestion
