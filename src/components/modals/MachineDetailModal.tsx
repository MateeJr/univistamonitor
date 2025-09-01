"use client";
import React, { useEffect, useRef, useState } from "react";
import { X, Save, Image as ImageIcon, Server } from "lucide-react";

type MachineDetail = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  image?: { url?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

function formatWIBDateTime(iso?: string | null) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.day || "00"}/${(map.month || "").slice(0, 3)}/${map.year || "0000"} ${map.hour || "00"}:${map.minute || "00"}`;
  } catch { return iso || '-'; }
}

export default function MachineDetailModal({
  visible,
  data,
  onClose,
  onSave,
  onSetStatus,
  statusList,
  saving = false,
  loading = false,
}: {
  visible: boolean;
  data: MachineDetail | null;
  onClose: () => void;
  onSave: (payload: { id: string; name: string; description?: string; imageDataUrl?: string | null }) => void | Promise<void>;
  onSetStatus: (id: string, status: string) => void | Promise<void>;
  statusList: string[];
  saving?: boolean;
  loading?: boolean;
}) {
  if (!visible || !data) return null;

  const [name, setName] = useState<string>(data.name || "");
  const [description, setDescription] = useState<string>(data.description || "");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [status, setStatus] = useState<string>(String(data.status || 'normal'));
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [imageLoading, setImageLoading] = useState<boolean>(false);

  // Compute current image source used by the preview box
  const imgSrc = removeImage
    ? (imageDataUrl || undefined)
    : (imageDataUrl || (data.image?.url || undefined));

  useEffect(() => {
    setName(data.name || "");
    setDescription(data.description || "");
    setImageDataUrl(null);
    setRemoveImage(false);
    setStatus(String(data.status || 'normal'));
  }, [data]);

  // When the image source changes, enter loading state; it will turn off on load/error
  useEffect(() => {
    setImageLoading(!!imgSrc);
  }, [imgSrc]);

  const handleFile = (file?: File | null) => {
    if (!file) return setImageDataUrl(null);
    const reader = new FileReader();
    reader.onload = () => {
      try { setImageDataUrl(reader.result as string); } catch { setImageDataUrl(null); }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ id: data.id, name: name.trim(), description: description.trim(), imageDataUrl: removeImage ? null : imageDataUrl || undefined });
  };

  const onChangeStatus = async (v: string) => {
    try { setStatus(v); await onSetStatus(data.id, v); } catch {}
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-3xl rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/10 flex items-center justify-center text-white">
            <Server className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[15px] font-semibold text-[#f2f2f2]">Detail Mesin</div>
            <div className="text-[13px] text-white/80">{data.name}</div>
            <div className="text-[12px] text-white/50">ID: {data.id}</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="w-full h-56 md:h-64 rounded-xl border border-white/10 bg-white/5 overflow-hidden relative flex items-center justify-center">
              {imgSrc ? (
                <>
                  <img
                    src={imgSrc}
                    alt={data.name}
                    className="absolute inset-0 w-full h-full object-contain"
                    onLoad={() => setImageLoading(false)}
                    onError={() => setImageLoading(false)}
                  />
                  {imageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-7 w-7 rounded-full border-2 border-white/25 border-t-white/70 animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">Tidak ada gambar</div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-white text-sm">
                <ImageIcon className="w-4 h-4" /> Pilih Gambar
              </button>
              {(data.image?.url || imageDataUrl) && (
                <label className="inline-flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input type="checkbox" className="accent-rose-500" checked={removeImage} onChange={(e) => setRemoveImage(e.target.checked)} /> Hapus gambar
                </label>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </div>
            <div className="mt-3 text-xs text-white/60">Ditambahkan: {formatWIBDateTime(data.createdAt)}</div>
          </div>

          <div className="min-w-0 md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-white/60">Nama Mesin</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full px-3 h-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
              </div>
              <div>
                <label className="block text-xs text-white/60">Status</label>
                <select value={status} onChange={(e) => onChangeStatus(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 focus:outline-none focus:border-white/30 appearance-none">
                  {statusList.map((s) => (<option key={s} value={s}>{String(s).replace(/-/g, ' ')}</option>))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/60">Deskripsi</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="mt-1 w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm" />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f172a]/90">
                Batal
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 text-sm font-semibold transition">
                <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
