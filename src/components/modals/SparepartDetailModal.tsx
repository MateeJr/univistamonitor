"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Trash2, Save, Image as ImageIcon } from "lucide-react";

export type SparepartDetail = {
  id: string;
  name: string;
  stock: number;
  description?: string | null;
  imageUrl?: string | null;
  createdAt?: string | null;
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
  onSave: (payload: { id: string; name: string; stock: number; description?: string; imageDataUrl?: string | null }) => void | Promise<void>;
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

  useEffect(() => {
    setName(data.name || "");
    setStock(String(data.stock ?? 0));
    setDescription(data.description || "");
    setImageDataUrl(null);
    setRemoveImage(false);
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
    onSave({ id: data.id, name: name.trim(), stock: parsedStock, description: description.trim(), imageDataUrl: removeImage ? null : imageDataUrl || undefined });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
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

            <div>
              <label className="text-xs text-white/60">Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="mt-1 w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
            </div>

            <div className="mt-4 flex items-center justify-between">
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


