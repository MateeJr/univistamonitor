"use client";
import React from "react";
import { AlertTriangle, X, Trash2 } from "lucide-react";

export default function ConfirmDeleteProductModal({
  visible,
  productName,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  productName?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-[#7f1d1d]/20">
            <AlertTriangle className="h-5 w-5 text-[#fca5a5]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-semibold text-[#f2f2f2]">Hapus Produk?</h2>
            <p className="mt-1 text-[13px] leading-relaxed text-[#b5b5b5] truncate">Anda akan menghapus <span className="text-white/90 font-medium">{productName || 'produk'}</span>. Tindakan ini tidak dapat dibatalkan.</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0f172a]/90"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-900/60 bg-rose-900/40 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-900/60"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Produk
          </button>
        </div>
      </div>
    </div>
  );
}


