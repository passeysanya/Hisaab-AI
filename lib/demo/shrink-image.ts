// Phone photos are often 3–8 MB, over Vercel's 4.5 MB request limit. Before upload,
// the browser redraws large images at a size that's still sharp enough to read a bill.

export const SHRINK_ABOVE_BYTES = 1024 * 1024;
export const MAX_SIDE_PX = 2000;

/** Target size that keeps the aspect ratio and fits within maxSide. Pure, tested. */
export function fitWithin(width: number, height: number, maxSide = MAX_SIDE_PX): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

/** Returns a smaller JPEG for big images; PDFs, small images and failures pass through unchanged. Browser only. */
export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size <= SHRINK_ABOVE_BYTES) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#FFFFFF"; // transparent PNGs become white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.(png|webp|jpe?g)$/i, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
