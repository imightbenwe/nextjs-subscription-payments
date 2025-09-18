// ======================================================
// FILE: app/api/edit-image/route.ts  (img2img + optional mask)
// ======================================================
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const form = await req.formData();
    const image = form.get("image") as File | null;
    const mask = form.get("mask") as File | null; // optional
    const prompt = (form.get("prompt") as string) || "";
    const size = (form.get("size") as string) || "1024x1024";
    const n = parseInt((form.get("n") as string) || "4", 10);

    if (!image) return NextResponse.json({ error: "image file required" }, { status: 400 });
    if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

    const fd = new FormData();
    fd.append("model", "gpt-image-1");
    fd.append("image", image, "input.png");
    if (mask) fd.append("mask", mask, "mask.png");
    fd.append("prompt", prompt);
    fd.append("n", String(n));
    fd.append("size", size);

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
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
