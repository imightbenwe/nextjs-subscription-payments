"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Saved Generations</h1>
          <Link
            href="/adhook"
            className="text-sm underline underline-offset-4 hover:opacity-80"
          >
            ← Back to generator
          </Link>
        </div>

        {loading && <p className="text-gray-600">Loading…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && !rows.length && (
          <div className="bg-white border rounded-lg p-6 shadow text-gray-600">
            No generations yet. Create one on the generator page.
          </div>
        )}

        {rows.map((row) => (
          <div key={row.id} className="bg-white border rounded-lg p-4 shadow space-y-2">
            <div className="font-semibold">{row.product_name}</div>
            <div className="text-sm text-gray-600">
              {row.description} — {row.platform}
            </div>

            {Array.isArray(row.variations) &&
              row.variations.map((v: any, i: number) => (
                <div key={i} className="border-t pt-3 mt-2 space-y-1">
                  <div className="font-medium">{v.headline}</div>
                  <div className="text-sm leading-6">{v.primary_text}</div>
                  <div className="text-xs text-gray-500">CTA: {v.cta}</div>
                  <div className="text-xs text-gray-500">
                    Keywords: {Array.isArray(v.keywords) ? v.keywords.join(", ") : ""}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
