import type { NextConfig } from "next";

const deploymentId = process.env.NEXT_DEPLOYMENT_ID
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.VERCEL_URL;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  ...(deploymentId ? { deploymentId } : {}),
};

export default nextConfig;
