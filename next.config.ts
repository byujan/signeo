import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-lib and pdfjs-dist need this
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  // Allow external images for signature rendering if needed
  images: {
    remotePatterns: [],
  },
  // Increase serverless function body size for PDF uploads
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
