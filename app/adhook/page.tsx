"use client";
import { useState } from "react";

export default function AdHookPage() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("Facebook");
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVariations([]);
    try {
      const r = await fetch("/api/generate-adcopy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, description, platform }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Request failed");

      setVariations(data.variations || []);

      // NEW: save to Supabase via server route
      await fetch("/api/save-adcopy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          description,
          platform,
          variations: data.variations || [],
          // userId: optional; wire later from session
        }),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white shadow rounded-lg p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Generate Ad Copy</h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            className="w-full border rounded p-2"
            placeholder="Product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded p-2"
            placeholder="Short product description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <select
            className="w-full border rounded p-2"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option>Facebook</option>
            <option>Instagram</option>
            <option>TikTok</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate 3 Variations"}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {variations.map((v, i) => (
          <div key={i} className="border rounded p-4 space-y-2 bg-gray-50">
            <div className="font-semibold">{v.headline}</div>
            <div className="text-sm leading-6">{v.primary_text}</div>
            <div className="text-xs opacity-70">CTA: {v.cta}</div>
            {Array.isArray(v.keywords) && (
              <div className="text-xs opacity-70">Keywords: {v.keywords.join(", ")}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
