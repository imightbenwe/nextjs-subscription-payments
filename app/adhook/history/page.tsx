"use client";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch("/api/list-adcopy");
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load history");
        setRows(data.rows || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Saved Generations</h1>
        {loading && <p>Loading…</p>}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {rows.map((row) => (
          <div
            key={row.id}
            className="bg-white border rounded-lg p-4 shadow space-y-2"
          >
            <div className="font-semibold">{row.product_name}</div>
            <div className="text-sm opacity-70">
              {row.description} — {row.platform}
            </div>
            {Array.isArray(row.variations) &&
              row.variations.map((v: any, i: number) => (
                <div
                  key={i}
                  className="border-t pt-2 mt-2 space-y-1 text-sm leading-5"
                >
                  <div className="font-medium">{v.headline}</div>
                  <div>{v.primary_text}</div>
                  <div className="text-xs opacity-70">CTA: {v.cta}</div>
                  <div className="text-xs opacity-70">
                    Keywords: {v.keywords?.join(", ")}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
