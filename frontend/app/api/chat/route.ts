import { NextResponse } from "next/server";

import { officialAssistantReply } from "../../../features/comparison/domain/official-assistant";

const DEFAULT_API_URL = "http://127.0.0.1:8000";

export async function GET() {
  return NextResponse.json({ available: true });
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
    const availability = await fetch(`${apiUrl}/v1/chat/availability`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    const status = availability.ok
      ? await availability.json() as { available?: unknown }
      : { available: false };
    if (status.available === true) {
      const upstream = await fetch(`${apiUrl}/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: body.message.trim(),
          thread_id: body.thread_id,
          history: Array.isArray(body.history) ? body.history : [],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (upstream.ok) {
        return NextResponse.json(await upstream.json());
      }
    }
  } catch {
    // The deterministic official-source guide below keeps help available.
  }

  return NextResponse.json({
    ...officialAssistantReply(body.message.trim()),
    thread_id: body.thread_id,
  });
}
