"use client";
import React from "react";
import { X, Download } from "lucide-react";

export default function ImagePreviewModal({
  visible,
  src,
  alt,
  onClose,
}: {
  visible: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
}) {
  if (!visible || !src) return null;
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} aria-hidden />
      <button
        type="button"
        onClick={onClose}
        aria-label="Tutup"
        className="absolute right-3 top-3 rounded-md p-2 text-zinc-300 hover:bg-white/10"
      >
        <X className="h-5 w-5" />
      </button>
      <a href={src} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-12 rounded-md p-2 text-zinc-300 hover:bg-white/10" title="Buka / Download">
        <Download className="h-5 w-5" />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt || "preview"} className="relative max-h-[90vh] max-w-[90vw] object-contain rounded-lg border border-white/10 shadow-2xl" />
    </div>
  );
}


