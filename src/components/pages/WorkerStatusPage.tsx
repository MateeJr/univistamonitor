"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import AddWorkerModal, { NewWorkerPayload } from "@/components/modals/AddWorkerModal";
import WorkerDetailModal, { WorkerDetail } from "@/components/modals/WorkerDetailModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { Eye, Trash2, Plus } from "lucide-react";

type WorkerListItem = {
  id: string;
  fullName: string;
  role: string;
  bidang?: string;
  createdAt: string | null;
};

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

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(ENDPOINTS.workersList);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat daftar worker");
      setItems(Array.isArray(json.items) ? json.items : []);
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
    if (!q) return items;
    return items.filter((it) =>
      [it.fullName, it.role, it.bidang].some((v) => (v || "").toLowerCase().includes(q))
    );
  }, [items, search]);

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
              placeholder="Cari anggota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
            />
          </div>
          {loading && <div className="text-sm text-white/50">Memuat...</div>}
          {error && <div className="text-sm text-rose-400">{error}</div>}
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-x-auto">
            <div className="min-w-[900px] flex flex-col h-full">
              {/* Table Header */}
              <div className="px-4 md:px-6 py-3 border-b border-white/10 shrink-0">
                <div className="grid grid-cols-12 gap-3 text-xs text-white/50">
                  <div className="col-span-4">Anggota</div>
                  <div className="col-span-2">Role</div>
                  <div className="col-span-2">Bidang</div>
                  <div className="col-span-3">Ditambahkan</div>
                  <div className="col-span-1 text-right">Aksi</div>
                </div>
              </div>

              {/* Table Rows */}
              <div className="px-4 md:px-6 py-2 flex-1 min-h-0 overflow-y-auto uv-scrollbar">
                {filtered.length === 0 && !loading ? (
                  <div className="text-center text-white/50 text-sm py-8">Belum ada anggota</div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {filtered.map((it) => (
                      <div key={it.id} className="py-3">
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-4 flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white text-sm font-semibold">
                              {getInitials(it.fullName)}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white/90 truncate">{it.fullName || '-'}</div>
                              <div className="text-xs text-white/50 truncate">ID: {it.id}</div>
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-white/80 truncate">{it.role || '-'}</div>
                          <div className="col-span-2 text-sm text-white/80 truncate">{it.bidang || '-'}</div>
                          <div className="col-span-3 text-sm text-white/70 truncate">{formatDDMMMYYYYFromISO(it.createdAt)}</div>
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openDetail(it.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"
                            >
                              <Eye className="w-4 h-4" /> Detail
                            </button>
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

              {/* Footer */}
              <div className="px-4 md:px-6 py-3 border-t border-white/10 flex items-center justify-between shrink-0">
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
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddWorkerModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAddSubmit} submitting={adding} />
      <WorkerDetailModal visible={detailOpen} data={detailData} onClose={() => { setDetailOpen(false); setDetailData(null); }} />
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
