import React from "react";
import { X, User, Briefcase, Building2, Phone, Clock, Pencil } from "lucide-react";

export type WorkerDetail = {
  id: string;
  fullName: string;
  role: string;
  bidang?: string;
  description: string;
  phone?: string;
  createdAt: string;
  status?: 'tersedia' | 'sibuk' | 'tidak-hadir' | 'sedang-bekerja';
  statusNote?: string;
};

function formatDDMMMYYYYFromISO(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const monthShort = [
    "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec",
  ] as const;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = monthShort[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}/${mmm}/${yyyy}`;
}

export default function WorkerDetailModal({
  visible,
  data,
  onClose,
  onSaveNote,
}: {
  visible: boolean;
  data: WorkerDetail | null;
  onClose: () => void;
  onSaveNote?: (id: string, note: string) => void;
}) {
  if (!visible || !data) return null;

  const initials = (data.fullName || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-xl rounded-2xl border border-[#2a2a2a] bg-[#0b0b0b] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.6)] max-h-[85vh] overflow-auto uv-scrollbar">
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute right-2 top-2 rounded-md p-2 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-white font-semibold text-base">
            {initials}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-[#f2f2f2]">Detail Anggota</div>
            <div className="text-[13px] text-white/80">{data.fullName}</div>
            <div className="text-[12px] text-white/50">ID: {data.id}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InfoRow icon={<User className="h-4 w-4" />} label="Nama" value={data.fullName || "-"} />
          <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Role" value={data.role || "-"} />
          <InfoRow icon={<Building2 className="h-4 w-4" />} label="Bidang" value={data.bidang || "-"} />
          <InfoRow icon={<Clock className="h-4 w-4" />} label="Ditambahkan" value={formatDDMMMYYYYFromISO(data.createdAt)} />
          <InfoRow icon={<Phone className="h-4 w-4" />} label="Telepon" value={data.phone || "-"} />
        </div>

        <div className="mt-3">
          <div className="text-[12px] text-white/60 mb-1">Deskripsi</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/90 whitespace-pre-wrap min-h-[60px]">
            {data.description || "-"}
          </div>
        </div>

        <EditableNote
          initialValue={data.statusNote || ''}
          onSave={(val) => onSaveNote && onSaveNote(data.id, val)}
        />

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

function EditableNote({ initialValue, onSave }: { initialValue: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialValue);
  React.useEffect(() => { setValue(initialValue); }, [initialValue]);
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[12px] text-white/60">Catatan Status (opsional)</div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white">
            <Pencil className="w-3.5 h-3.5" /> Ubah
          </button>
        )}
      </div>
      {editing ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Tuliskan apa yang sedang dikerjakan..."
            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition text-sm"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { onSave(value); setEditing(false); }}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"
            >
              Simpan
            </button>
            <button
              type="button"
              onClick={() => { setValue(initialValue); setEditing(false); }}
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs text-white/80"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/90 min-h-[44px]">
          {initialValue ? initialValue : <span className="text-white/40">Belum ada catatan</span>}
        </div>
      )}
    </div>
  );
}


