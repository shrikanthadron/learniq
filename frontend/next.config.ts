import type { NextConfig } from "next";
import path from "path";

const prismaIncludes = ["./node_modules/.prisma/**", "./node_modules/@prisma/client/**"];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/[...path]/route": prismaIncludes,
    "/api/health/route": prismaIncludes,
    "/api/auth/register/route": prismaIncludes,
    "/api/auth/login/route": prismaIncludes,
    "/api/auth/me/route": prismaIncludes,
    "/api/auth/profile/route": prismaIncludes,
  },
  serverExternalPackages: ["@prisma/client", "bcryptjs", "jsonwebtoken"],
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
