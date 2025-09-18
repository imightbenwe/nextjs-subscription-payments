// ======================================================
// FILE: app/adhook/history/page.tsx
// ======================================================
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type CopyVar = { headline: string; primary_text: string; cta: string; keywords?: string[] };
type ImageVar = { type: "images"; prompt?: string; images: string[] };

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/list-adcopy");
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load history");
        setRows(data.rows || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function isImageVar(v: any): v is ImageVar {
    return v && typeof v === "object" && v.type === "images" && Array.isArray(v.images);
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Saved Generations</h1>
          <div className="flex gap-4 text-sm">
            <Link href="/adhook" className="underline underline-offset-4 hover:opacity-80">Copy Generator</Link>
            <Link href="/adhook/images" className="underline underline-offset-4 hover:opacity-80">Text → Image</Link>
            <Link href="/adhook/images/edit" className="underline underline-offset-4 hover:opacity-80">Image → Image</Link>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && !rows.length && (
          <div className="bg-white border rounded-lg p-6 shadow text-gray-600">
            No generations yet.
          </div>
        )}

        {rows.map((row) => {
          const v = row.variations;
          return (
            <div key={row.id} className="bg-white border rounded-lg p-4 shadow space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{row.product_name}</div>
                <div className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm text-gray-600">{row.description} — {row.platform}</div>

              {/* Images entry */}
              {isImageVar(v) && (
                <div className="space-y-2">
                  {v.prompt && <div className="text-sm"><span className="font-medium">Prompt:</span> {v.prompt}</div>}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {v.images.map((u, i) => (
                      <div key={i} className="border rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt={`img ${i + 1}`} className="w-full h-auto block" />
                        <div className="p-2 flex gap-2">
                          <a href={u} download className="text-xs px-2 py-1 rounded bg-gray-900 text-white">Download</a>
                          <button
                            className="text-xs px-2 py-1 rounded border"
                            onClick={() => copy(u)}
                          >
                            Copy URL
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copy variations entry */}
              {Array.isArray(v) && v.length > 0 && (
                <div className="space-y-3">
                  {(v as CopyVar[]).map((c, i) => (
                    <div key={i} className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{c.headline}</div>
                        <button
                          className="text-xs px-2 py-1 rounded border"
                          onClick={() => copy(`${c.headline}\n\n${c.primary_text}\n\nCTA: ${c.cta}`)}
                        >
                          Copy
                        </button>
                      </div>
                      <div className="text-sm leading-6">{c.primary_text}</div>
                      <div className="text-xs text-gray-500">CTA: {c.cta}</div>
                      {Array.isArray(c.keywords) && (
                        <div className="text-xs text-gray-500">Keywords: {c.keywords.join(", ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
