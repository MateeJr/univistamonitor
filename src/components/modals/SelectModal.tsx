import React from "react";
import { X } from "lucide-react";

type StatusItem = { key: string; color: string };

export default function SelectModal({
  visible,
  title,
  placeholder = "Tambah item baru...",
  items,
  onClose,
  onAdd,
  onDelete,
  onEdit,
}: {
  visible: boolean;
  title: string;
  placeholder?: string;
  items: string[] | StatusItem[];
  onClose: () => void;
  onAdd: (value: string, color?: string) => void | Promise<void>;
  onDelete?: (key: string) => void | Promise<void>;
  onEdit?: (oldKey: string, newKey: string, color?: string) => void | Promise<void>;
}) {
  const [value, setValue] = React.useState("");
  const [color, setColor] = React.useState("#818cf8");
  React.useEffect(() => { if (visible) setValue(""); }, [visible]);
  if (!visible) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <h3 className="text-[15px] font-semibold text-[#f2f2f2] mb-3">{title}</h3>
        <div className="space-y-3">
          <div className="text-xs text-white/60">Status yang tersedia</div>
          <div className="flex flex-col gap-2">
            {(items as any[]).map((raw) => {
              const obj: StatusItem = typeof raw === 'string' ? { key: raw, color: '#818cf8' } : raw;
              return (
                <div key={obj.key} className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2">
                    <input
                      type="color"
                      defaultValue={obj.color || '#818cf8'}
                      onChange={(e) => onEdit && onEdit(obj.key, obj.key, e.target.value)}
                      title="Ubah warna"
                      className="h-6 w-6 rounded-md border border-white/10 bg-white/5"
                    />
                    <input
                      type="text"
                      defaultValue={obj.key}
                      onBlur={(e) => {
                        const next = e.target.value.trim();
                        if (next && next !== obj.key && onEdit) onEdit(obj.key, next, undefined);
                      }}
                      className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(obj.key)}
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 px-2 py-1 text-[11px] text-white/70"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="pt-2">
            <label className="text-xs text-white/60">Tambah status kustom</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                title="Warna status"
                className="h-10 w-12 rounded-md border border-white/10 bg-white/5"
              />
              <button
                type="button"
                onClick={() => value.trim() && onAdd(value, color)}
                className="h-10 px-3 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 text-white text-sm"
              >
                Tambah
              </button>
            </div>
            <div className="text-[11px] text-white/40 mt-1">Karakter yang diizinkan: huruf, angka, spasi, dan tanda - (spasi akan diubah menjadi -)</div>
          </div>
        </div>
      </div>
    </div>
  );
}

 
