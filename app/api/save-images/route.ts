// ======================================================
// FILE: app/api/save-images/route.ts
// ======================================================
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BUCKET = "adhook";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// helper: tiny slug
function slugify(s: string) {
  return (s || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60) || "project";
}

async function ensureBucket() {
  // try create; ignore "already exists" error
  // @ts-ignore supabase-js returns { data, error }
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: "20MB",
  });
  if (error && !`${error.message}`.toLowerCase().includes("exists")) {
    // bucket might already exist; only throw on other errors
    throw error;
  }
}

async function fetchAsBuffer(urlOrDataUrl: string): Promise<{ buf: Buffer; contentType: string }> {
  if (urlOrDataUrl.startsWith("data:")) {
    const m = urlOrDataUrl.match(/^data:(.+?);base64,(.*)$/);
    const contentType = m?.[1] || "image/png";
    const b64 = m?.[2] || "";
    return { buf: Buffer.from(b64, "base64"), contentType };
  } else {
    const res = await fetch(urlOrDataUrl);
    if (!res.ok) throw new Error(`fetch ${urlOrDataUrl} failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "image/png";
    const ab = await res.arrayBuffer();
    return { buf: Buffer.from(ab), contentType };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { productName, description, platform = "Facebook", prompt, urls } = await req.json();

    if (!productName || !description || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "productName, description, urls required" }, { status: 400 });
    }

    await ensureBucket();

    const base = `${slugify(productName)}/${Date.now()}`;
    const publicUrls: string[] = [];

    for (let i = 0; i < urls.length; i++) {
      const { buf, contentType } = await fetchAsBuffer(urls[i]);
      const ext =
        contentType.includes("jpeg") ? "jpg" :
        contentType.includes("png") ? "png" :
        contentType.includes("webp") ? "webp" : "png";
      const path = `${base}/img-${i + 1}.${ext}`;

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buf, {
        contentType,
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      publicUrls.push(pub.publicUrl);
    }

    const { error } = await supabase.from("adhook_generations").insert({
      product_name: productName,
      description,
      platform,
      variations: { type: "images", prompt, images: publicUrls },
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, images: publicUrls });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
