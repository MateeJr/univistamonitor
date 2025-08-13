import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Save, Image as ImageIcon, PackagePlus } from "lucide-react";

export type NewSparepartPayload = {
  name: string;
  stock: number;
  description?: string;
  imageDataUrl?: string | null;
};

export default function AddSparepartModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: NewSparepartPayload) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState<string>("0");
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // Reset values whenever the modal opens
  useEffect(() => {
    if (!visible) return;
    setName("");
    setStock("0");
    setDescription("");
    setImageDataUrl(null);
  }, [visible]);

  const canSubmit = name.trim().length > 0 && !submitting;
  const parsedStock = useMemo(() => {
    const n = Number(stock);
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }, [stock]);

  const handleFile = async (file?: File | null) => {
    if (!file) return setImageDataUrl(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = reader.result as string;
        setImageDataUrl(result);
      } catch {
        setImageDataUrl(null);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!visible) return null;

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer?.files?.[0];
    if (f) handleFile(f);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ name: name.trim(), stock: parsedStock, description: description.trim(), imageDataUrl });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-500/30 to-teal-500/30 border border-white/10 flex items-center justify-center text-white">
            <PackagePlus className="w-4 h-4" />
          </div>
          <h2 className="text-[15px] font-semibold text-[#f2f2f2]">Tambahkan Sparepart</h2>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60">Nama Sparepart</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bearing 6203"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Sisa Stok</label>
              <input
                type="number"
                min={0}
                step={1}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60">Deskripsi Sparepart</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Catatan tambahan, ukuran, merk, dsb (opsional)"
              className="mt-1 w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-white/60">Foto Sparepart (opsional)</label>
            <div
              className="mt-1 flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-6 text-white/60 text-sm"
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={handleDrop}
            >
              {imageDataUrl ? (
                <div className="flex items-center gap-3 w-full">
                  <img src={imageDataUrl} alt="preview" className="h-20 w-20 object-cover rounded-lg border border-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/70 truncate">Preview gambar terpilih</div>
                    <div className="text-[11px] text-white/50">Tarik gambar lain untuk mengganti</div>
                  </div>
                  <button type="button" className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10" onClick={() => setImageDataUrl(null)}>Hapus</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-2 text-white"
                >
                  <ImageIcon className="w-4 h-4" /> Pilih / Tarik Gambar
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition"
            >
              <Save className="h-4 w-4" /> {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


