import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const deploymentId = process.env.NEXT_PUBLIC_DEPLOYMENT_ID;
  return NextResponse.json(
    { deploymentId: typeof deploymentId === "string" ? deploymentId : "" },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
