import { NextResponse } from "next/server";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  const apiUrl = (process.env.COMPARE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  try {
    const upstream = await fetch(`${apiUrl}/v1/locations${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const result = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch (error) {
    console.error(
      "Location proxy request failed",
      error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error",
    );
    return NextResponse.json(
      { detail: "Location search is unavailable." },
      { status: 502 },
    );
  }
}
