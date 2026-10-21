import { NextResponse } from "next/server";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export async function GET() {
  const apiUrl = (process.env.COMPARE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
  try {
    const upstream = await fetch(`${apiUrl}/v1/chat/availability`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!upstream.ok) return NextResponse.json({ available: false });
    const result = await upstream.json() as { available?: unknown };
    return NextResponse.json({ available: result.available === true });
  } catch {
    return NextResponse.json({ available: false });
  }
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Invalid JSON request." }, { status: 400 });
  }

  const body = payload as { message?: unknown; thread_id?: unknown; history?: unknown };
  if (
    typeof body.message !== "string" ||
    !body.message.trim() ||
    typeof body.thread_id !== "string" ||
    !body.thread_id.trim()
  ) {
    return NextResponse.json(
      { detail: "message and thread_id are required." },
      { status: 422 },
    );
  }

  const apiUrl = (process.env.COMPARE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");

  try {
    const upstream = await fetch(`${apiUrl}/v1/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message.trim(),
        thread_id: body.thread_id,
        history: Array.isArray(body.history) ? body.history : [],
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    const result = await upstream.json();
    return NextResponse.json(result, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { detail: "The insurance assistant API is unavailable." },
      { status: 502 },
    );
  }
}
