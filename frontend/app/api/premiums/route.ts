import { NextResponse } from "next/server";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  const apiUrl = (process.env.COMPARE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  try {
    const upstream = await fetch(`${apiUrl}/v1/premiums/search${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    const result = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "The premium comparison API is unavailable." },
      { status: 502 },
    );
  }
}
