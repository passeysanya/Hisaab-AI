export const EXTRACTION_PROMPT = `You are reading an Indian GST vendor invoice (PDF, scan or phone photo).
Extract the fields below and reply with ONLY a JSON object, no prose.

Every scalar field is an object: {"value": <value or null>, "confidence": <0..1>, "note": <string or null>}.
- confidence: how sure you are the value is exactly right as printed.
- note: REQUIRED when confidence < 0.85 or when you inferred / calculated the value. Say what you saw and why you're unsure.
- Use null when a value is not on the bill. Never invent values.

Fields:
- vendorName: the supplier issuing the bill (not the buyer)
- vendorGstin: the SUPPLIER's 15-character GSTIN (not the buyer's)
- invoiceNumber: exactly as printed
- invoiceDate: YYYY-MM-DD. Indian bills write dates day-first (04/11/2026 = 4 November 2026)
- dueDate: YYYY-MM-DD. If only payment terms are printed (e.g. "30 days"), compute it from invoiceDate, set confidence <= 0.75 and explain in note
- poNumber: the buyer's purchase order reference, if printed
- subtotal: taxable value before GST, as a number
- cgst, sgst, igst: tax AMOUNTS (not rates) as numbers; null if absent
- total: grand total payable, as a number

Also "lineItems": an array of {"description", "quantity", "unit", "unitPrice", "amount", "taxRate", "confidence"}.
- Numbers must be plain JSON numbers without currency symbols or commas (101900, not "₹1,01,900").
- taxRate is the GST percentage for that line, e.g. 18.

Example shape:
{"vendorName":{"value":"ABC Traders","confidence":0.97,"note":null}, "...": "...", "lineItems":[{"description":"OPC 53 Cement 50kg","quantity":120,"unit":"bag","unitPrice":420,"amount":50400,"taxRate":18,"confidence":0.93}]}`;
