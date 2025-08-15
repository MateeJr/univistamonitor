"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import AddSparepartModal, { NewSparepartPayload } from "@/components/modals/AddSparepartModal";
import SparepartDetailModal, { SparepartDetail } from "@/components/modals/SparepartDetailModal";
import ImagePreviewModal from "@/components/modals/ImagePreviewModal";
import ConfirmDeleteProductModal from "@/components/modals/ConfirmDeleteProductModal";
import { Plus, RefreshCw, PlusCircle, MinusCircle, FileDown } from "lucide-react";

type StockItem = {
  id: string;
  name: string;
  stock: number;
  description?: string;
  imageUrl?: string | null;
  createdAt?: string | null;
  lastChange?: {
    at?: string;
    by?: string;
    reason?: string;
    tujuan?: string;
    from?: number;
    to?: number;
    delta?: number;
  } | null;
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
  const [serverTimeIso, setServerTimeIso] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [stockRangeFilter, setStockRangeFilter] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, timeRes] = await Promise.all([
        fetch(ENDPOINTS.stockList),
        fetch(ENDPOINTS.time).catch(() => null as any),
      ]);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat stock");
      const list: StockItem[] = Array.isArray(json.items) ? json.items.map((it: any) => {
        const url = typeof it.imageUrl === 'string' && it.imageUrl
          ? (it.imageUrl.startsWith('http') ? it.imageUrl : `${ENDPOINTS.filesBase}${it.imageUrl}`)
          : null;
        return {
          id: String(it.id),
          name: String(it.name || ''),
          stock: Number(it.stock || 0),
          description: it.description || '',
          imageUrl: url,
          createdAt: it.createdAt || null,
          lastChange: it.lastChange || null,
        } as StockItem;
      }) : [];
      setItems(list);
      if (timeRes && (timeRes as Response).ok) {
        try {
          const tj = await (timeRes as Response).json();
          if (tj && tj.ok && typeof tj.iso === 'string') setServerTimeIso(tj.iso);
        } catch {}
      }
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

  const deleteSparepart = async (id: string) => {
    try {
      const res = await fetch(`${ENDPOINTS.stockCreate}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menghapus');
      await fetchList();
      setDetailOpen(false);
      setDetailData(null);
      setConfirmDeleteOpen(false);
    } catch (e) {
      alert('Gagal menghapus sparepart');
    }
  };

  const generateMonthlyPdf = async () => {
    try {
      setGeneratingPdf(true);
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed
      
      const res = await fetch(`${ENDPOINTS.stockList}/monthly-report?year=${year}&month=${month}`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month })
      });
      
      if (!res.ok) {
        throw new Error('Gagal generate laporan');
      }
      
      const htmlContent = await res.text();
      
      // Open the report in a new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(htmlContent);
        newWindow.document.close();
        
        // Add print functionality and instructions
        setTimeout(() => {
          newWindow.focus();
          alert('Laporan berhasil dibuat! Gunakan Ctrl+P (atau Cmd+P) untuk print/save as PDF.');
        }, 500);
      } else {
        throw new Error('Popup diblokir. Mohon ijinkan popup untuk website ini.');
      }
      
    } catch (e: any) {
      alert(e?.message || 'Gagal generate laporan');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const saveSparepart = async (payload: { id: string; name: string; stock: number; description?: string; imageDataUrl?: string | null; changedBy?: string; changeTujuan?: string }) => {
    try {
      const res = await fetch(`${ENDPOINTS.stockCreate}/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menyimpan');
      await fetchList();
      setDetailOpen(false);
      setDetailData(null);
    } catch (e) {
      alert('Gagal menyimpan perubahan');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = items;
    if (q) {
      base = base.filter((it) => [it.name, it.description, it.id].some((v) => (v || "").toString().toLowerCase().includes(q)));
    }
    if (stockRangeFilter) {
      const inFilter = (s: number) => {
        if (stockRangeFilter === '0 - 100') return s >= 0 && s <= 100;
        if (stockRangeFilter === '100 - 1000') return s > 100 && s <= 1000;
        if (stockRangeFilter === '1000 - 10000') return s > 1000 && s <= 10000;
        return true;
      };
      base = base.filter((it) => inFilter(Number(it.stock || 0)));
    }
    return base;
  }, [items, search, stockRangeFilter]);

  const summary = useMemo(() => {
    let totalProducts = items.length;
    let totalUnits = 0;
    const ranges = [
      { label: '0 - 100', min: 0, max: 100, includeMin: true, includeMax: true, units: 0, products: 0 },
      { label: '100 - 1000', min: 100, max: 1000, includeMin: false, includeMax: true, units: 0, products: 0 },
      { label: '1000 - 10000', min: 1000, max: 10000, includeMin: false, includeMax: true, units: 0, products: 0 },
    ];
    const inRange = (s: number, r: typeof ranges[number]) => {
      const geMin = r.includeMin ? s >= r.min : s > r.min;
      const leMax = r.includeMax ? s <= r.max : s < r.max;
      return geMin && leMax;
    };
    for (const it of items) {
      const s = Number(it.stock || 0);
      totalUnits += isFinite(s) ? s : 0;
      for (const r of ranges) {
        if (inRange(s, r)) {
          r.units += s;
          r.products += 1;
          break;
        }
      }
    }
    return { totalProducts, totalUnits, ranges };
  }, [items]);

  function formatTimeWIBFromISO(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.hour || '00'}:${map.minute || '00'}`;
  }

  function formatDateTimeWIBFromISO(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const dd = map.day || '00';
    const mmm = (map.month || '').slice(0, 3);
    const yyyy = map.year || '0000';
    const HH = map.hour || '00';
    const mm = map.minute || '00';
    return `${dd}/${mmm}/${yyyy} ${HH}:${mm}`;
  }

  function isSameWIBDay(targetIso?: string | null, serverIso?: string | null) {
    if (!targetIso) return false;
    const target = new Date(targetIso);
    if (isNaN(target.getTime())) return false;
    const now = serverIso ? new Date(serverIso) : new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    return fmt.format(target) === fmt.format(now);
  }

  const lastUpdatedLabel = useMemo(() => {
    if (!serverTimeIso) return '-';
    return isSameWIBDay(serverTimeIso, serverTimeIso) ? formatTimeWIBFromISO(serverTimeIso) : formatDateTimeWIBFromISO(serverTimeIso);
  }, [serverTimeIso]);

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
            <button
              type="button"
              onClick={generateMonthlyPdf}
              disabled={generatingPdf}
              className="inline-flex items-center gap-2 h-10 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 disabled:bg-gray-600/50 border border-emerald-500/50 disabled:border-gray-500/50 text-white text-sm font-semibold disabled:cursor-not-allowed transition-all"
            >
              <FileDown className="w-4 h-4" />
              {generatingPdf ? 'Generating...' : 'PDF Bulanan'}
            </button>
            <div className="hidden md:flex items-center h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
              Terakhir diupdate: <span className="ml-1 text-white/90">{lastUpdatedLabel}</span>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 md:gap-6 flex-1 min-h-0">
          {/* Summary Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4 md:min-h-0 md:overflow-y-auto">
            <div>
              <div className="text-sm font-semibold text-white/90">Ringkasan Stok</div>
              <div className="mt-1 text-xs text-white/60">Total Produk: <span className="text-white/90">{summary.totalProducts}</span></div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="space-y-3">
              {summary.ranges.map((r) => {
                const active = stockRangeFilter === r.label;
                return (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => setStockRangeFilter(active ? null : r.label)}
                    className={`w-full text-left rounded-xl border p-3 transition ${active ? 'border-emerald-400/30 bg-emerald-500/5 ring-1 ring-emerald-400/40' : 'border-white/10 bg-white/5 hover:bg-white/8'}`}
                  >
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <div>{r.label}</div>
                      <div className={`inline-flex items-center gap-1 text-xs rounded-md px-2 py-0.5 ${active ? 'text-white bg-emerald-500/30 border border-emerald-500/40' : 'text-emerald-200 bg-emerald-500/10 border border-emerald-500/20'}`}>{r.products}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-white/50 pt-1">
              <div>Filter: {stockRangeFilter ? stockRangeFilter : 'Semua'}</div>
              {stockRangeFilter ? (
                <button type="button" onClick={() => setStockRangeFilter(null)} className="underline hover:text-white/80">Reset</button>
              ) : <span />}
            </div>
            <div className="mt-auto text-[11px] text-white/40" />
          </div>

          {/* Product Area */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col min-h-0">
            {/* Grid Area (scrollable). On mobile, cap height so ~2 products are visible before internal scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 max-h-[70vh] md:max-h-none">
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
                          <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover cursor-zoom-in" onClick={(e) => { e.stopPropagation(); setPreviewSrc(it.imageUrl!); setPreviewOpen(true); }} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 text-xs">
                            <div className="h-10 w-10 rounded-md border border-white/10 bg-white/10 mb-2" />
                            Tidak ada gambar
                          </div>
                        )}
                        {!!it.lastChange && typeof it.lastChange?.delta === 'number' ? (
                          <div className="absolute top-2 right-2 z-10">
                            {it.lastChange.delta > 0 ? (
                              <span title="Penambahan stok" className="inline-flex items-center gap-1 rounded-full bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 px-2 py-1 text-[11px]">
                                <PlusCircle className="w-3.5 h-3.5" />
                                +{it.lastChange.delta}
                              </span>
                            ) : it.lastChange.delta < 0 ? (
                              <span title="Pengurangan stok" className="inline-flex items-center gap-1 rounded-full bg-rose-900/60 border border-rose-500/50 text-rose-200 px-2 py-1 text-[11px]">
                                <MinusCircle className="w-3.5 h-3.5" />
                                {it.lastChange.delta}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="pointer-events-none absolute inset-0 ring-0 group-hover:ring-1 group-hover:ring-white/10" />
                      </div>
                      <div className="mt-3 space-y-1">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="text-white/90 font-semibold truncate">{it.name}</div>
                          <div className="shrink-0 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[11px]">Stok: {it.stock}</span>
                            {!!it.lastChange && typeof it.lastChange.delta === 'number' && it.lastChange.delta !== 0 ? (
                              it.lastChange.delta > 0 ? (
                                <span title="Penambahan terbaru" className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 text-[11px]">
                                  <PlusCircle className="w-3.5 h-3.5" /> +{it.lastChange.delta}
                                </span>
                              ) : (
                                <span title="Pengurangan terbaru" className="inline-flex items-center gap-1 h-5 px-2 rounded-md bg-rose-900/60 border border-rose-500/50 text-rose-200 text-[11px]">
                                  <MinusCircle className="w-3.5 h-3.5" /> {it.lastChange.delta}
                                </span>
                              )
                            ) : null}
                          </div>
                        </div>
                        <div className="text-white/60 text-sm truncate">{it.description || '-'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* No pagination footer; clean layout */}
          </div>
        </div>
      </div>

      {/* Modal */}
      {addOpen ? (
        <AddSparepartModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAddSubmit} submitting={adding} />
      ) : null}
      {detailOpen ? (
        <SparepartDetailModal
          visible={detailOpen}
          data={detailData}
          onClose={() => { setDetailOpen(false); setDetailData(null); }}
          onDelete={(id) => { setConfirmDeleteOpen(true); }}
          onSave={saveSparepart}
          serverTimeIso={serverTimeIso}
        />
      ) : null}
      {confirmDeleteOpen && detailData ? (
        <ConfirmDeleteProductModal
          visible={confirmDeleteOpen}
          productName={detailData.name}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={() => deleteSparepart(detailData.id)}
        />
      ) : null}
      {previewOpen ? (
        <ImagePreviewModal visible={previewOpen} src={previewSrc} onClose={() => { setPreviewOpen(false); setPreviewSrc(null); }} />
      ) : null}
    </div>
  );
}
