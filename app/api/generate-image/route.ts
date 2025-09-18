import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid caching

export async function POST(req: NextRequest) {
  try {
    const { prompt, n = 4, size = "1024x1024" } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }

    // OpenAI Images (DALL·E / gpt-image-1) generation
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1", // falls back to dall-e-3 on some accounts
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
    const urls = (data?.data || []).map((d: any) => d.url).filter(Boolean);
    return NextResponse.json({ urls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
