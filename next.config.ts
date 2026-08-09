import type { NextConfig } from "next";
import { execSync } from "node:child_process";

// Short commit SHA baked in at build time so admin pages can show which
// deploy is actually live (Vercel sets VERCEL_GIT_COMMIT_SHA automatically;
// git rev-parse covers local dev builds).
function resolveBuildVersion(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  }
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: resolveBuildVersion(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.logo.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
