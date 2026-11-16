/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // pdf-parse reads PDF text layers on the server; load it from node_modules at
    // runtime instead of bundling it. (Tesseract.js only runs in the browser.)
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
