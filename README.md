# Hisaab AI

An invoice inbox that does the bookkeeping. Businesses forward vendor bills (PDFs, photos, WhatsApp images). AI extracts the GSTIN, invoice number, line items, tax and due dates, matches each bill to its purchase order, and flags duplicates and price increases, explaining why each time.

## Stack
Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma (SQLite locally), Anthropic API, Zod, Vitest.

## Getting started
```powershell
npm install
Copy-Item .env.example .env.local   # fill in keys (needed from Phase 3)
npm run dev                          # http://localhost:3000
```

## Scripts
| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (next/core-web-vitals) |
| `npm test` | Vitest unit tests |

## Live demo (`/demo`)
Upload up to 5 bills, or use 3 watermarked sample bills with pre-computed results. You get "Your Hisaab":
- every extracted field, with a confidence score and the AI's notes
- GSTIN checksum and arithmetic checks
- cross-bill flags for duplicates and price rises
- CSV export

Extraction tries `GEMINI_MODEL` first. On a 429 / quota error it moves to `GEMINI_FALLBACK_MODEL`, and then to offline Tesseract.js OCR. Uploads are processed in memory and never stored. The API is rate limited to 5 runs per hour per IP, in memory.

## Roadmap
1. ✅ Landing page
2. Data model + seed data
3. Upload + AI extraction
4. PO matching + duplicate / price-increase flags
5. Dashboard
6. Email ingestion
7. WhatsApp ingestion
