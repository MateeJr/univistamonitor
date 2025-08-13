import React, { useState, useEffect } from "react";
import { X, UserPlus2 } from "lucide-react";

export type NewWorkerPayload = {
  fullName: string;
  role: string;
  bidang: string;
  description: string;
  phone?: string;
};

export default function AddWorkerModal({
  visible,
  onClose,
  onSubmit,
  submitting = false,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: NewWorkerPayload) => void | Promise<void>;
  submitting?: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [bidang, setBidang] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!visible) return;
    // Reset when opened
    setFullName("");
    setRole("");
    setBidang("");
    setDescription("");
    setPhone("");
  }, [visible]);

  if (!visible) return null;

  const initials = (fullName || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

  const canSubmit = fullName.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    onSubmit({ fullName: fullName.trim(), role: role.trim(), bidang: bidang.trim(), description: description.trim(), phone: phone.trim() });
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-white font-semibold">
            {initials}
          </div>
          <h2 className="text-[15px] font-semibold text-[#f2f2f2]">Tambah Anggota</h2>
        </div>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs text-white/60">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nama"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/60">Jabatan/Role</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Contoh: Operator"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-white/60">Bidang (opsional)</label>
              <input
                type="text"
                value={bidang}
                onChange={(e) => setBidang(e.target.value)}
                placeholder="Contoh: Produksi / Maintenance"
                className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/60">Telepon (opsional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxx"
              className="mt-1 w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Deskripsi</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat, skill, atau catatan lain"
              className="mt-1 w-full px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
            />
          </div>
          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 hover:bg-white/15 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-semibold transition"
            >
              <UserPlus2 className="h-4 w-4" />
              {submitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


