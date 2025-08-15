"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Save, Image as ImageIcon } from "lucide-react";
import { ENDPOINTS } from "@/components/config/server";

export type StockChangeEntry = {
  at: string;
  by?: string;
  tujuan?: string;
  reason?: string; // Penambahan | Pengurangan
  from?: number;
  to?: number;
  delta?: number;
};

export type SparepartDetail = {
  id: string;
  name: string;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  history?: StockChangeEntry[];
};

export default function SparepartDetailModal({
  visible,
  data,
  onClose,
  onDelete,
  onSave,
}: {
  visible: boolean;
  data: SparepartDetail | null;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
  onSave: (payload: { id: string; name: string; stock: number; description?: string; imageDataUrl?: string | null; changedBy?: string; changeTujuan?: string }) => void | Promise<void>;
  serverTimeIso?: string | null;
}) {
  if (!visible || !data) return null;

  const formatWIBDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.day || "00"}/${(map.month || "").slice(0, 3)}/${map.year || "0000"} ${map.hour || "00"}:${map.minute || "00"}`;
  };

  // Local form state for editing
  const [name, setName] = useState(data.name || "");
  const [stock, setStock] = useState<string>(String(data.stock ?? 0));
  const [description, setDescription] = useState(data.description || "");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [history, setHistory] = useState<StockChangeEntry[]>(Array.isArray(data.history) ? data.history : []);
  const [tujuan, setTujuan] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    setName(data.name || "");
    setStock(String(data.stock ?? 0));
    setDescription(data.description || "");
    setImageDataUrl(null);
    setRemoveImage(false);
    setHistory(Array.isArray(data.history) ? data.history : []);
    // Try load full history detail from server
    (async () => {
      try {
        const res = await fetch(`${ENDPOINTS.stockDetailBase}/${data.id}`, { cache: "no-store" });
        if (res.ok) {
          const j = await res.json().catch(() => ({} as any));
          const h = j?.data?.history;
          if (Array.isArray(h)) setHistory(h);
        }
      } catch {}
    })();
    // Get current user name from local storage (@akun/profile)
    try {
      const raw = localStorage.getItem("@akun/profile");
      if (raw) {
        const parsed = JSON.parse(raw);
        const n = (parsed?.adminName || parsed?.loginId || "").trim();
        if (n) setUserName(n);
      }
    } catch {}
  }, [data]);

  const handleFile = (file?: File | null) => {
    if (!file) return setImageDataUrl(null);
    const reader = new FileReader();
    reader.onload = () => {
      try { setImageDataUrl(reader.result as string); } catch { setImageDataUrl(null); }
    };
    reader.readAsDataURL(file);
  };

  const parsedStock = (() => {
    const n = Number(stock);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  })();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const base = { id: data.id, name: name.trim(), stock: parsedStock, description: description.trim(), imageDataUrl: removeImage ? null : imageDataUrl || undefined } as any;
    if (parsedStock !== (data.stock ?? 0)) {
      base.changedBy = userName;
      base.changeTujuan = tujuan.trim();
    }
    onSave(base);
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[280px_1fr_320px] gap-4 md:h-[70vh] min-h-0">
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden p-3 flex flex-col items-center justify-center">
            {imageDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDataUrl} alt={name} className="w-full aspect-square object-cover rounded-lg border border-white/10" />
            ) : data.imageUrl && !removeImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={name} className="w-full aspect-square object-cover rounded-lg border border-white/10 cursor-zoom-in" onClick={(e) => { e.stopPropagation(); window.open(data.imageUrl!, '_blank'); }} />
            ) : (
              <div className="aspect-square w-full min-h-[240px] flex items-center justify-center text-white/40 text-sm">Tidak ada gambar</div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-white text-sm">
                <ImageIcon className="w-4 h-4" /> Pilih Gambar
              </button>
              {data.imageUrl || imageDataUrl ? (
                <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input type="checkbox" className="accent-rose-500" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Hapus gambar
                </label>
              ) : null}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white/90 mb-1 truncate">{data.name}</h3>
            <div className="text-sm text-white/60 mb-4">Ditambahkan: {formatWIBDateTime(data.createdAt)}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-white/60">Nama Sparepart</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/60">Stok</label>
                <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min={0} step={1} className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
              </div>
            </div>

            {parsedStock !== (data.stock ?? 0) ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 mb-3">
                <div className="text-sm font-medium text-amber-200 mb-2">Detail Perubahan Stok</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60">Nama</label>
                    <input value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Nama pengguna" className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Alasan Perubahan</label>
                    <input value={parsedStock - (data.stock ?? 0) > 0 ? 'Penambahan' : 'Pengurangan'} readOnly className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none transition text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Tujuan</label>
                    <input value={tujuan} onChange={(e) => setTujuan(e.target.value)} placeholder="Tujuan penggunaan" className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/60">Tanggal</label>
                    <input value={formatWIBDateTime(new Date().toISOString())} readOnly className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 text-sm" />
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label className="text-xs text-white/60">Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
            </div>

            {/* action buttons moved to footer */}
          </div>

          {/* Right history panel */}
          <aside className="md:pl-1 min-h-0">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 h-full overflow-y-auto uv-scrollbar">
              <div className="text-sm font-medium text-white/80 mb-3">Riwayat Perubahan</div>
              {history && history.length ? (
                <div className="space-y-2">
                  {history.slice().reverse().map((h, idx) => {
                    const isUp = typeof h.delta === 'number' ? h.delta > 0 : (h.reason || '').toLowerCase().includes('tambah');
                    const reason = h.reason || (isUp ? 'Penambahan' : 'Pengurangan');
                    return (
                      <div key={idx} className="p-2.5 rounded-lg border border-white/10 bg-black/20">
                        <div className="flex items-center justify-between gap-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isUp ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>{reason}</span>
                          <span className="text-white/50 text-[11px]">{h.at ? formatWIBDateTime(h.at) : '-'}</span>
                        </div>
                        <div className="mt-1 text-white/70 text-[12px]">
                          <span>Oleh: {h.by || '-'}</span>
                          <span className="mx-2 text-white/30">•</span>
                          <span>Tujuan: {h.tujuan || '-'}</span>
                        </div>
                        <div className="mt-1 text-white/80 text-[12px] font-mono">
                          Stok: {typeof h.from === 'number' ? h.from : '-'} → {typeof h.to === 'number' ? h.to : '-'} {typeof h.delta === 'number' ? (h.delta > 0 ? `(+${h.delta})` : `(${h.delta})`) : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-white/40 text-sm">Belum ada perubahan.</div>
              )}
            </div>
          </aside>

          {/* Footer action bar spanning all columns */}
          <div className="mt-3 md:col-span-3 col-span-1">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
              <button type="button" onClick={() => onDelete(data.id)} className="inline-flex items-center gap-2 rounded-lg border border-rose-800/50 bg-rose-900/30 hover:bg-rose-900/40 px-3 py-2 text-white text-sm">
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
              <button type="submit" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-white text-sm">
                <Save className="w-4 h-4" /> Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


