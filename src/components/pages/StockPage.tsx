"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import AddSparepartModal, { NewSparepartPayload } from "@/components/modals/AddSparepartModal";
import SparepartDetailModal, { SparepartDetail } from "@/components/modals/SparepartDetailModal";
import { Plus, RefreshCw } from "lucide-react";

type StockItem = {
  id: string;
  name: string;
  stock: number;
  description?: string;
  imageUrl?: string | null;
  createdAt?: string | null;
};

export default function StockPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<SparepartDetail | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.stockList);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat stock");
      const list: StockItem[] = Array.isArray(json.items) ? json.items.map((it: any) => {
        const url = typeof it.imageUrl === 'string' && it.imageUrl
          ? (it.imageUrl.startsWith('http') ? it.imageUrl : `${ENDPOINTS.filesBase}${it.imageUrl}`)
          : null;
        return { id: String(it.id), name: String(it.name || ''), stock: Number(it.stock || 0), description: it.description || '', imageUrl: url, createdAt: it.createdAt || null } as StockItem;
      }) : [];
      setItems(list);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    const id = setInterval(fetchList, 15000);
    return () => clearInterval(id);
  }, []);

  const onAddSubmit = async (payload: NewSparepartPayload) => {
    try {
      setAdding(true);
      const res = await fetch(ENDPOINTS.stockCreate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menambah sparepart");
      setAddOpen(false);
      await fetchList();
    } catch (e) {
      alert("Gagal menambah sparepart");
    } finally {
      setAdding(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => [it.name, it.description, it.id].some((v) => (v || "").toString().toLowerCase().includes(q)));
  }, [items, search]);

  return (
    <div className="px-4 md:px-6 pt-2 md:pt-4 pb-6 min-h-[calc(100dvh-80px)] md:h-[100dvh] overflow-visible md:overflow-hidden box-border">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0 h-full">
        {/* Top Bar */}
        <div className="mb-4 md:mb-6 flex items-center gap-3 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="hidden md:inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Tambahkan Sparepart
          </button>
          <div className="relative w-full sm:flex-1 min-w-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari sparepart..."
              className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="sm:hidden inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
            <button
              type="button"
              onClick={fetchList}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
            >
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 md:gap-6 flex-1 min-h-0">
          {/* Filter Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4 md:min-h-0 md:overflow-y-auto">
            <div className="h-4 w-24 rounded bg-white/10 shrink-0" />
            <div className="space-y-2 shrink-0">
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
            </div>
            <div className="h-px bg-white/10 shrink-0" />
            <div className="h-4 w-20 rounded bg-white/10 shrink-0" />
            <div className="space-y-2 shrink-0">
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
            </div>
            <div className="mt-auto flex gap-2 shrink-0">
              <div className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5" />
            </div>
          </div>

          {/* Product Area */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-28 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-28 h-9 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5" />
                <button
                  type="button"
                  onClick={() => setAddOpen(true)}
                  className="w-36 h-9 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white text-sm"
                >
                  Tambahkan Sparepart
                </button>
              </div>
            </div>

            {/* Grid Area (scrollable) */}
            <div className="flex-1 md:min-h-0 overflow-visible md:overflow-y-auto p-4 md:p-6">
              {loading ? (
                <div className="text-sm text-white/60">Memuat...</div>
              ) : error ? (
                <div className="text-sm text-rose-400">{error}</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {filtered.map((it) => (
                    <button key={it.id} type="button" onClick={() => { setDetailData(it as SparepartDetail); setDetailOpen(true); }} className="text-left group rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3 flex flex-col">
                      <div className="relative aspect-square rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                        {it.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 text-xs">
                            <div className="h-10 w-10 rounded-md border border-white/10 bg-white/10 mb-2" />
                            Tidak ada gambar
                          </div>
                        )}
                        <div className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-1 group-hover:ring-white/10" />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="text-white/90 font-semibold truncate">{it.name}</div>
                        <div className="text-white/60 text-sm truncate">{it.description || '-'}</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-2 h-6 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-xs">Stok: {it.stock}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination (placeholder) */}
            <div className="border-t border-white/10 px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-20 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-20 h-9 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AddSparepartModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAddSubmit} submitting={adding} />
      <SparepartDetailModal visible={detailOpen} data={detailData} onClose={() => { setDetailOpen(false); setDetailData(null); }} />
    </div>
  );
}
