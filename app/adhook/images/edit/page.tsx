// ======================================================
// FILE: app/adhook/images/edit/page.tsx   (Image → Image, progressive)
// ======================================================
"use client";
import { useState, useRef } from "react";
import Link from "next/link";

export default function EditImagesPage() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [size, setSize] = useState("1024x1536");
  const [count, setCount] = useState(2);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [maskFile, setMaskFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  function buildPrompt() {
    const base = `Enhance/transform the uploaded product photo into a high-performing ad visual for ${productName} on ${platform}. ${description}`;
    const style =
      "Commercial ad look, flattering lighting, color pop, clean composition, text-safe margins; avoid heavy text overlays";
    return `${base}. Style: ${style}.`;
  }

  async function editOne(fdBase: FormData) {
    try {
      const r = await fetch("/api/edit-image", { method: "POST", body: fdBase });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Edit failed");
      const first = (data.urls || [])[0];
      if (first) setUrls((u) => [...u, first]);
    } catch (e: any) {
      setError((prev) => prev ?? e.message);
    }
  }

  async function onGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;

    setError(null);
    setUrls([]);
    setLoading(true);

    try {
      if (!imageFile) throw new Error("Please choose an image");

      const prompt = buildPrompt();

      // Build a FormData *template* we can clone per request (n=1 each)
      const base = new FormData();
      base.append("image", imageFile);
      if (maskFile) base.append("mask", maskFile);
      base.append("prompt", prompt);
      base.append("size", size);
      base.append("n", "1");

      // Launch N parallel edits for progressive display
      await Promise.allSettled(
        Array.from({ length: count }, () => {
          const fd = new FormData();
          base.forEach((v, k) => fd.append(k, v as any));
          return editOne(fd);
        })
      );

      // Save (fire-and-forget) after images are shown
      if (urls.length > 0) {
        fetch("/api/save-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productName,
            description,
            platform,
            prompt,
            urls,
          }),
        }).catch(() => {});
      }
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Image → Image (Enhance/Transform)</h1>
          <div className="flex gap-4 text-sm">
            <Link href="/adhook/images" className="underline underline-offset-4 hover:opacity-80">
              Text → Image
            </Link>
            <Link href="/adhook/history" className="underline underline-offset-4 hover:opacity-80">
              View History
            </Link>
          </div>
        </div>

        <form onSubmit={onGenerate} className="grid gap-3 md:grid-cols-2 bg-white p-4 rounded-lg shadow">
          <input
            className="border rounded p-2 col-span-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />

          <textarea
            className="border rounded p-2 col-span-2 text-gray-900 placeholder:text-gray-500"
            placeholder="Describe the desired ad look (e.g., lifestyle, studio, color mood, props)"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="col-span-2 grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload image</label>
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              {imageFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(imageFile)} alt="preview" className="mt-2 max-h-48 rounded border" />
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Optional mask (transparent area = editable)</label>
              <input type="file" accept="image/*" onChange={(e) => setMaskFile(e.target.files?.[0] || null)} />
              {maskFile && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={URL.createObjectURL(maskFile)} alt="mask preview" className="mt-2 max-h-48 rounded border" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 col-span-2 md:col-span-1">
            <label className="text-sm font-medium">Platform</label>
            <select className="border rounded p-2" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option>Facebook</option>
              <option>Instagram</option>
              <option>TikTok</option>
            </select>

            <label className="text-sm font-medium">Size</label>
            <select className="border rounded p-2" value={size} onChange={(e) => setSize(e.target.value)}>
              <option value="1024x1024">Square 1024×1024</option>
              <option value="1024x1536">Story 1024×1536</option>
              <option value="1536x1024">Wide 1536×1024</option>
              <option value="auto">Auto</option>
            </select>

            <label className="text-sm font-medium">Count</label>
            <select className="border rounded p-2" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10))}>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
            </select>
          </div>

          <button
            type="submit"
            className="col-span-2 md:col-span-1 px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Enhancing…" : "Generate Enhanced Images"}
          </button>
        </form>

        {loading && (
          <div className="text-sm text-gray-600">{urls.length}/{count} ready… keep this tab open.</div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!!urls.length && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {urls.map((u, i) => (
              <div key={i} className="bg-white border rounded-lg shadow overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Edited ${i + 1}`} className="w-full h-auto block" />
                <div className="p-3 flex gap-3">
                  <a href={u} download className="text-sm px-3 py-1 rounded bg-gray-900 text-white hover:opacity-90">
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(u)}
                    className="text-sm px-3 py-1 rounded border hover:bg-gray-50"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
