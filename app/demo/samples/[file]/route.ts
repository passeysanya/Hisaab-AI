import { SAMPLE_BILLS } from "@/lib/demo/sample-bills";
import { renderSampleSvg } from "@/lib/demo/sample-svg";

export const dynamic = "force-static";

export function generateStaticParams() {
  return SAMPLE_BILLS.map((b) => ({ file: `${b.id}.svg` }));
}

/** Serves the watermarked sample bills as SVG images, e.g. /demo/samples/sample-kaveri-0812.svg */
export function GET(_req: Request, { params }: { params: { file: string } }) {
  const bill = SAMPLE_BILLS.find((b) => `${b.id}.svg` === params.file);
  if (!bill) return new Response("Not found", { status: 404 });
  return new Response(renderSampleSvg(bill), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
    },
  });
}
