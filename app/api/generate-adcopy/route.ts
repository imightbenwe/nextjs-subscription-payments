import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // avoid caching

export async function POST(req: NextRequest) {
  try {
    const { productName, description, platform = "Facebook" } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }
    if (!productName || !description) {
      return NextResponse.json({ error: "productName and description required" }, { status: 400 });
    }

    const userPrompt = `
Return JSON with key "variations" = array of 3 objects:
{ "headline": string (≤60 chars),
  "primary_text": string (2–4 short sentences, direct-response tone),
  "cta": string,
  "keywords": string[] (≤6)
}
Product: ${productName}
Description: ${description}
Platform: ${platform}
Audience: buyers on ${platform}.
Constraints: punchy, compliant, no claims, no emojis unless natural.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a senior DTC ad copywriter. Always return valid JSON." },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(content);
    return NextResponse.json(parsed);
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
