// ==============================================
// FILE: app/api/generate-image/route.ts
// ==============================================
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(["1024x1024", "1024x1536", "1536x1024", "auto"]);
function normalizeSize(s: string | undefined) {
  if (!s) return "1024x1024";
  // Back-compat for old options
  if (s === "1024x1792") return "1024x1536";
  if (s === "1792x1024") return "1536x1024";
  return ALLOWED.has(s) ? s : "1024x1024";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt: string = body?.prompt;
    const n: number = body?.n ?? 4;
    const size = normalizeSize(body?.size);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        n,
        size,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const items = Array.isArray(data?.data) ? data.data : [];
    const urls: string[] = items
      .map((d: any) => (d?.url ? d.url : d?.b64_json ? `data:image/png;base64,${d.b64_json}` : null))
      .filter(Boolean);

    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
