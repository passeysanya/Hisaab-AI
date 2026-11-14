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

## Roadmap
1. ✅ Landing page
2. Data model + seed data
3. Upload + AI extraction
4. PO matching + duplicate / price-increase flags
5. Dashboard
6. Email ingestion
7. WhatsApp ingestion
