export function deploymentId(): string {
  return process.env.NEXT_DEPLOYMENT_ID
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.VERCEL_URL
    ?? "";
}
