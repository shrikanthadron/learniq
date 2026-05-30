import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/[...path]": [
      "./server-dist/**",
      "./node_modules/.prisma/**",
      "./node_modules/@prisma/client/**",
    ],
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  async rewrites() {
    if (process.env.VERCEL) {
      return [];
    }
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
