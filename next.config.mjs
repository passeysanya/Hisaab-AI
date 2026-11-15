/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Native/worker-based packages used by offline OCR: load them from node_modules
    // at runtime instead of bundling (Tesseract spawns a worker by file path).
    serverComponentsExternalPackages: ["tesseract.js", "pdf-parse"],
  },
};

export default nextConfig;
