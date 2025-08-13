"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import AddWorkerModal, { NewWorkerPayload } from "@/components/modals/AddWorkerModal";
import WorkerDetailModal, { WorkerDetail } from "@/components/modals/WorkerDetailModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { Eye, Trash2, Plus, Circle, Pencil } from "lucide-react";

type WorkerListItem = {
  id: string;
  fullName: string;
  role: string;
  bidang?: string;
  status?: 'tersedia' | 'sibuk' | 'tidak-hadir' | 'sedang-bekerja';
  statusNote?: string;
  createdAt: string | null;
  updatedAt?: string | null;
};

type StatusFilter = WorkerListItem['status'] | 'all';

function getInitials(name?: string) {
  if (!name) return "?";
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

const monthShort = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;
function formatDDMMMYYYYFromISO(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = monthShort[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}/${mmm}/${yyyy}`;
}

export default function WorkerStatusPage() {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<WorkerListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<WorkerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [serverTimeIso, setServerTimeIso] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, timeRes] = await Promise.all([
        fetch(ENDPOINTS.workersList),
        fetch(ENDPOINTS.time).catch(() => null as any),
      ]);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat daftar worker");
      setItems(Array.isArray(json.items) ? json.items : []);
      if (timeRes && (timeRes as Response).ok) {
        try {
          const tj = await (timeRes as Response).json();
          if (tj && tj.ok && typeof tj.iso === 'string') setServerTimeIso(tj.iso);
        } catch {}
      }
    } catch (e: any) {
      setError(e?.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    const id = setInterval(fetchList, 15000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = items;
    if (q) {
      base = base.filter((it) => {
        const fields = [
          it.fullName,
          it.role,
          it.bidang,
          it.id,
          it.status,
          it.statusNote,
        ];
        return fields.some((v) => (v || '').toString().toLowerCase().includes(q));
      });
    }
    if (statusFilter !== 'all') {
      base = base.filter((it) => (it.status || 'tersedia') === statusFilter);
    }
    return base;
  }, [items, search, statusFilter]);

  const onAddSubmit = async (payload: NewWorkerPayload) => {
    try {
      setAdding(true);
      const res = await fetch(ENDPOINTS.workersCreate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menambah anggota");
      setAddOpen(false);
      await fetchList();
    } catch (e) {
      alert("Gagal menambah anggota");
    } finally {
      setAdding(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      setDetailData(null);
      const res = await fetch(`${ENDPOINTS.workersDetailBase}/${id}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat detail");
      setDetailData(json.data as WorkerDetail);
    } catch (e) {
      alert("Gagal memuat detail anggota");
      setDetailOpen(false);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${ENDPOINTS.workersDeleteBase}/${deleteTarget}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal menghapus");
      await fetchList();
    } catch (e) {
      alert("Gagal menghapus anggota");
    } finally {
      setDeleteTarget(null);
    }
  };

  const setStatus = async (id: string, status: WorkerListItem['status']) => {
    try {
      const res = await fetch(`${ENDPOINTS.workersDetailBase}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal update status');
      await fetchList();
    } catch (e) {
      alert('Gagal mengubah status');
    }
  };

  const setStatusNote = async (id: string, note: string) => {
    try {
      const res = await fetch(`${ENDPOINTS.workersDetailBase}/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal update catatan');
      await fetchList();
    } catch (e) {
      alert('Gagal menyimpan catatan');
    }
  };

  function StatusPill({ value }: { value?: WorkerListItem['status'] }) {
    const v = value || 'tersedia';
    const color = v === 'tersedia' ? 'text-green-400' : v === 'sibuk' ? 'text-yellow-400' : v === 'sedang-bekerja' ? 'text-red-400' : 'text-white/40';
    const label = v === 'tersedia' ? 'TERSEDIA' : v === 'sibuk' ? 'SIBUK' : v === 'sedang-bekerja' ? 'SEDANG BEKERJA' : 'TIDAK HADIR';
    return (
      <div className="inline-flex items-center gap-1.5">
        <Circle className={`w-2.5 h-2.5 ${color}`} fill="currentColor" />
        <span className="text-xs text-white/70">{label}</span>
      </div>
    );
  }

  function getStatusBorderClass(value?: WorkerListItem['status']) {
    const v = value || 'tersedia';
    if (v === 'tersedia') return 'border-green-400/40';
    if (v === 'sibuk') return 'border-yellow-400/40';
    if (v === 'sedang-bekerja') return 'border-red-400/40';
    return 'border-zinc-500/30';
  }

  function formatTimeWIBFromISO(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.hour || '00'}:${map.minute || '00'}`;
  }

  function formatDateTimeWIBFromISO(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "-";
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const dd = map.day || '00';
    const mmm = (map.month || '').slice(0, 3);
    const yyyy = map.year || '0000';
    const HH = map.hour || '00';
    const mm = map.minute || '00';
    return `${dd}/${mmm}/${yyyy} ${HH}:${mm}`;
  }

  function isSameWIBDay(targetIso?: string | null, serverIso?: string | null) {
    if (!targetIso) return false;
    const target = new Date(targetIso);
    if (isNaN(target.getTime())) return false;
    const now = serverIso ? new Date(serverIso) : new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    return fmt.format(target) === fmt.format(now);
  }

  function formatLastUpdateLabel(updatedAt?: string | null) {
    if (!updatedAt) return "-";
    return isSameWIBDay(updatedAt, serverTimeIso) ? formatTimeWIBFromISO(updatedAt) : formatDateTimeWIBFromISO(updatedAt);
  }

  return (
    <section className="w-full box-border flex flex-col flex-1 min-h-0">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0 h-full">
        {/* Header */}
        <div className="mb-4 md:mb-6 flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-white">Anggota</h1>
            <p className="text-sm text-white/60">Kelola dan pantau daftar anggota</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Tambah Anggota
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative w-full sm:flex-1 min-w-0">
            <input
              type="text"
              placeholder="Cari anggota, bidang, status, catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/60">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 focus:outline-none focus:border-white/30"
            >
              <option value="all">Semua Status</option>
              <option value="tersedia">Tersedia</option>
              <option value="sibuk">Sibuk</option>
              <option value="sedang-bekerja">Sedang bekerja</option>
              <option value="tidak-hadir">Tidak hadir</option>
            </select>
          </div>
          {loading && <div className="text-sm text-white/50">Memuat...</div>}
          {error && <div className="text-sm text-rose-400">{error}</div>}
        </div>

        {/* Cards Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex-1 min-h-0 flex flex-col">
          <div className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
            <div className="text-xs text-white/50">Total: {filtered.length}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchList}
                className="w-24 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white"
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="p-4 md:p-6 flex-1 min-h-0 overflow-y-auto uv-scrollbar">
            {filtered.length === 0 && !loading ? (
              <div className="text-center text-white/50 text-sm py-8">Belum ada anggota</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((it) => (
                  <div key={it.id} className={`group relative rounded-2xl border-2 bg-white/[0.03] hover:bg-white/[0.06] transition-colors ${getStatusBorderClass(it.status)}`}>
                    <div className="p-4 md:p-5 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {getInitials(it.fullName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm md:text-base font-semibold text-white/90 truncate">{it.fullName || '-'}</div>
                              <div className="text-xs text-white/50 truncate">{it.role || '-'}</div>
                            </div>
                            <StatusPill value={it.status} />
                          </div>
                          <div className="text-[11px] text-white/40 mt-1 truncate">ID: {it.id}</div>
                          {it.bidang ? <div className="text-[11px] text-white/40 truncate">Bidang: {it.bidang}</div> : null}
                          {it.updatedAt && it.updatedAt !== it.createdAt ? (
                            <div className="text-[11px] text-white/40 truncate">Terakhir Update: {formatLastUpdateLabel(it.updatedAt)}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-white/50" />
                        <select
                          value={it.status || 'tersedia'}
                          onChange={(e) => setStatus(it.id, e.target.value as WorkerListItem['status'])}
                          className="appearance-none text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/80 hover:bg-white/10 focus:outline-none focus:border-white/30"
                        >
                          <option value="tersedia">Tersedia</option>
                          <option value="sibuk">Sibuk</option>
                          <option value="sedang-bekerja">Sedang bekerja</option>
                          <option value="tidak-hadir">Tidak hadir</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => openDetail(it.id)}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"
                        >
                          <Eye className="w-4 h-4" /> Detail
                        </button>
                      </div>

                      <div>
                        <input
                          type="text"
                          defaultValue={it.statusNote || ''}
                          placeholder="Tuliskan pekerjaan/catatan..."
                          onBlur={(e) => {
                            const val = e.target.value;
                            if ((it.statusNote || '') !== val) setStatusNote(it.id, val);
                          }}
                          className="w-full box-border px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 text-xs"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-white/40">Catatan: {it.statusNote ? it.statusNote.length : 0} karakter</div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(it.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-900/50 bg-rose-900/30 hover:bg-rose-900/40 px-3 py-1.5 text-xs text-white"
                        >
                          <Trash2 className="w-4 h-4" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddWorkerModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAddSubmit} submitting={adding} />
      <WorkerDetailModal
        visible={detailOpen}
        data={detailData}
        onClose={() => { setDetailOpen(false); setDetailData(null); }}
        onSaveNote={(id, note) => setStatusNote(id, note)}
      />
      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Hapus Worker?"
        description="Tindakan ini akan menghapus worker dari daftar. Tidak dapat dibatalkan."
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        confirmLabel="Hapus Worker"
      />
    </section>
  );
}
