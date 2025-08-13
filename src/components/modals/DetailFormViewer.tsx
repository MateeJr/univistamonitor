import React, { useState } from "react";
import { X, Calendar, Clock3, FileText, Images } from "lucide-react";

export type LaporanImage = {
  filename: string;
  mime: string;
  size: number;
  url: string; // relative URL from server (e.g. /files/laporan/...)
  relative?: string;
};

export type LaporanDetail = {
  id: string;
  jenis: "harian" | "kerusakan";
  namaMesin: string;
  jenisMesin: string;
  alasan: string;
  tanggalLaporan: string;
  createdAt: string;
  images: LaporanImage[];
};

export default function DetailFormViewer({
  visible,
  data,
  filesBase = "",
  onClose,
}: {
  visible: boolean;
  data: LaporanDetail | null;
  filesBase?: string; // prefix for server files (ENDPOINTS.filesBase)
  onClose: () => void;
}) {
  if (!visible || !data) return null;

  const jenisLabel = data.jenis === "harian" ? "Laporan Harian" : "Laporan Kerusakan";
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const monthShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] as const;
  function formatDDMMMYYYYFromYMD(ymd: string | undefined | null): string {
    if (!ymd) return "-";
    // Expecting YYYY-MM-DD
    const parts = ymd.split("-");
    if (parts.length !== 3) return ymd;
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    if (!y || !m || !d) return ymd;
    const date = new Date(y, m - 1, d);
    const dd = String(date.getDate()).padStart(2, "0");
    const mmm = monthShort[date.getMonth()];
    const yyyy = date.getFullYear();
    return `${dd}/${mmm}/${yyyy}`;
  }
  function formatDDMMMYYYYFromISO(iso: string | undefined | null): string {
    if (!iso) return "-";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return iso;
    const dd = String(date.getDate()).padStart(2, "0");
    const mmm = monthShort[date.getMonth()];
    const yyyy = date.getFullYear();
    return `${dd}/${mmm}/${yyyy}`;
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <h2 className="text-[15px] font-semibold text-[#f2f2f2] mb-1">Detail Laporan</h2>
        <div className="text-[12px] text-white/50 mb-4">ID: {data.id}</div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow label="Jenis" value={jenisLabel} />
          <InfoRow label="Nama Mesin" value={data.namaMesin || "-"} />
          <InfoRow label="Jenis Mesin" value={data.jenisMesin || "-"} />
          <InfoRow label="Tanggal Laporan" value={formatDDMMMYYYYFromYMD(data.tanggalLaporan)} icon={<Calendar className="h-4 w-4" />} />
          <InfoRow label="Dibuat" value={formatDDMMMYYYYFromISO(data.createdAt)} icon={<Clock3 className="h-4 w-4" />} />
          <div className="md:col-span-2">
            <div className="text-[12px] text-white/60 mb-1 flex items-center gap-2"><FileText className="h-4 w-4" /> Alasan</div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/90 whitespace-pre-wrap min-h-[60px]">{data.alasan || "-"}</div>
          </div>
        </div>

        {/* Images */}
        <div className="mt-4">
          <div className="text-[12px] text-white/60 mb-2 flex items-center gap-2"><Images className="h-4 w-4" /> Foto</div>
          {Array.isArray(data.images) && data.images.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[40vh] overflow-auto uv-scrollbar pr-1">
              {data.images.map((img, idx) => (
                <button
                  key={`${img.filename}-${idx}`}
                  type="button"
                  onClick={() => setPreviewSrc(`${filesBase}${img.url}`)}
                  className="relative rounded-lg overflow-hidden border border-white/10 bg-black/30 cursor-zoom-in"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={img.filename}
                    src={`${filesBase}${img.url}`}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[11px] px-2 py-1 truncate text-white/80">{img.filename}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/60">Tidak ada foto</div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f172a]/90"
          >
            Tutup
          </button>
        </div>
      </div>
      {/* Image Preview Overlay */}
      {previewSrc && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setPreviewSrc(null)} aria-hidden />
          <div className="relative max-w-[95vw] max-h-[90vh]">
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => setPreviewSrc(null)}
              className="absolute -top-3 -right-3 rounded-full bg-black/70 hover:bg-black/80 border border-white/20 p-2 text-white"
            >
              <X className="h-4 w-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Preview" className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg border border-white/10 shadow-xl" />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[12px] text-white/60 mb-1 flex items-center gap-2">
        {icon}
        {label}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-2 text-sm text-white/90">{value}</div>
    </div>
  );
}
