import React from "react";
import { X, CheckCircle2 } from "lucide-react";

export type SelectOption = {
  label: string;
  value: string;
  description?: string;
};

export default function SelectModal({
  visible,
  title = "Pilih Opsi",
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title?: string;
  options: SelectOption[];
  selected?: string | null;
  onSelect: (option: SelectOption) => void;
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
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
        <h2 className="text-[15px] font-semibold text-[#f2f2f2] mb-3">{title}</h2>

        {/* Options */}
        <div className="space-y-2 max-h-[50vh] overflow-auto uv-scrollbar pr-1">
          {options.map((opt) => {
            const isActive = selected === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onSelect(opt)}
                className={`w-full text-left rounded-xl border px-3 py-3 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
                  isActive
                    ? "border-blue-500/30 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[12px] text-white/50 mt-0.5 truncate">{opt.description}</div>
                    )}
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-blue-400 flex-shrink-0" />}
                </div>
              </button>
            );
          })}
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
    </div>
  );
}
