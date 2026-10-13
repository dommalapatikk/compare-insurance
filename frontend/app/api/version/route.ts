import { NextResponse } from "next/server";

import { deploymentId } from "../../../lib/deployment-id";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { deploymentId: deploymentId() },
    { headers: { "Cache-Control": "no-store, max-age=0" } },
  );
}
