import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { productName, description, platform = "Facebook", prompt, urls } = await req.json();

    if (!productName || !description || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: "productName, description, urls required" }, { status: 400 });
    }

    const { error } = await supabase.from("adhook_generations").insert({
      product_name: productName,
      description,
      platform,
      variations: { type: "images", prompt, images: urls },
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Server error" }, { status: 500 });
  }
}
