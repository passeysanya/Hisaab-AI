# Hisaab AI: Invoice Inbox That Does the Bookkeeping

## Product
Businesses forward vendor bills (PDF, photo, WhatsApp image) to one email or number.
AI extracts GSTIN, invoice number, line items, amounts, tax and due dates, matches each
bill against purchase orders, and flags duplicates or price increases.

## Stack
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Prisma ORM, SQLite for local dev (Postgres in production)
- Google Gemini API free tier (GEMINI_MODEL, fallback GEMINI_FALLBACK_MODEL), then offline Tesseract.js OCR; Claude provider stubbed for later
- Zod for validating all AI output

## Design system (apply to every page)
- White base (#FFFFFF), black text (#0A0A0A), orange accent (#FF5A1F) for highlights,
  buttons, underlines, badges and hover states
- Bold editorial look in the style of a creative studio site: very large headline
  type, generous whitespace, thin black dividers, uppercase small labels, minimal
  shadows
- Font: "Inter" for body, "Space Grotesk" for headings
- Every page must make the AI visible: show what the AI extracted, confidence scores,
  and why something was flagged

## Rules
- Never hardcode API keys; use .env.local
- Validate GSTIN format (15 chars, regex + checksum) after extraction
- Write a test for every matching or flagging function
- Keep components small; one feature per commit
