import React from "react";
import { X } from "lucide-react";

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
}: {
  visible: boolean;
  data: SparepartDetail | null;
  onClose: () => void;
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

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            {data.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.imageUrl} alt={data.name} className="w-full h-full object-cover" />
            ) : (
              <div className="aspect-square w-full h-full min-h-[240px] flex items-center justify-center text-white/40 text-sm">Tidak ada gambar</div>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-white/90 mb-1 truncate">{data.name}</h3>
            <div className="text-sm text-white/60 mb-3">Ditambahkan: {formatWIBDateTime(data.createdAt)}</div>

            <div className="mb-3">
              <span className="inline-flex items-center gap-2 h-7 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm">Stok: {data.stock}</span>
            </div>

            <div>
              <div className="text-xs text-white/60 mb-1">Deskripsi</div>
              <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
                {data.description?.trim() ? data.description : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


