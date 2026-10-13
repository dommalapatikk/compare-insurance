import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

import type { NextConfig } from "next";

function sourceFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(path, entry.name);
      return entry.isDirectory() ? sourceFiles(entryPath) : [entryPath];
    })
    .sort();
}

function sourceFingerprint(): string {
  const projectRoot = process.cwd();
  const files = [
    ...sourceFiles(join(projectRoot, "app")),
    ...sourceFiles(join(projectRoot, "features")),
    ...sourceFiles(join(projectRoot, "lib")),
    join(projectRoot, "next.config.ts"),
    join(projectRoot, "package.json"),
    join(projectRoot, "package-lock.json"),
  ].filter(existsSync).sort();
  const hash = createHash("sha256");

  files.forEach((file) => {
    hash.update(relative(projectRoot, file));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  });
  return hash.digest("hex").slice(0, 20);
}

const suppliedDeploymentId = [
  process.env.NEXT_DEPLOYMENT_ID,
  process.env.VERCEL_GIT_COMMIT_SHA,
  process.env.VERCEL_URL,
].find((value): value is string => typeof value === "string" && value.length > 0);
const deploymentId = suppliedDeploymentId
  ? createHash("sha256").update(suppliedDeploymentId).digest("hex").slice(0, 20)
  : sourceFingerprint();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  deploymentId,
  env: {
    NEXT_PUBLIC_DEPLOYMENT_ID: deploymentId,
  },
};

export default nextConfig;
