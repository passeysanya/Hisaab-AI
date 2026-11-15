export const MAX_BILLS = 5;
export const MAX_BILL_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export type AcceptedType = (typeof ACCEPTED_TYPES)[number];

/** Detects the real file type from its first bytes (don't trust the extension). */
export function sniffType(bytes: Uint8Array): AcceptedType | null {
  const b = (i: number) => bytes[i];
  if (b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) return "application/pdf"; // %PDF
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  if (
    b(0) === 0x52 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x46 &&
    b(8) === 0x57 && b(9) === 0x45 && b(10) === 0x42 && b(11) === 0x50
  ) return "image/webp"; // RIFF....WEBP
  return null;
}

export type UploadCheck = { name: string; size: number; head: Uint8Array };

/** Returns one message per problem; empty means all good. */
export function validateUploads(files: UploadCheck[]): string[] {
  if (files.length === 0) return ["Add at least one bill."];
  if (files.length > MAX_BILLS) return [`Up to ${MAX_BILLS} bills per run (you added ${files.length}).`];
  const errors: string[] = [];
  for (const f of files) {
    if (f.size === 0) errors.push(`${f.name} is empty.`);
    else if (f.size > MAX_BILL_BYTES) errors.push(`${f.name} is over 5 MB.`);
    else if (!sniffType(f.head)) errors.push(`${f.name} isn't a PDF, JPG, PNG or WebP.`);
  }
  return errors;
}
