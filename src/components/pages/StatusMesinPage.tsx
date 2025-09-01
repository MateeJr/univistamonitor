"use client";
import React, { useEffect, useMemo, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import SelectModal from "@/components/modals/SelectModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import { Server, Plus, ListPlus, Eye, Trash2, Pencil, Image as ImageIcon } from "lucide-react";
import AddMachineModal from "@/components/modals/AddMachineModal";
import dynamic from "next/dynamic";

// Workaround for React static flag issue by client-only dynamic import
const MachineDetailModal = dynamic(() => import("@/components/modals/MachineDetailModal"), { ssr: false, loading: () => null });

// Local type to avoid static import that can trip RSC analyzer
type MachineDetail = {
  id: string;
  name: string;
  description?: string | null;
  status?: string | null;
  image?: { url?: string | null } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type MachineItem = {
  id: string;
  name: string;
  description?: string;
  status?: string; // 'normal' | 'dalam-perhatian' | 'bermasalah' | custom
  imageUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type StatusFilter = string | 'all';

function defaultColorForKey(key?: string) {
  const k = String(key || '').toLowerCase();
  if (k === 'normal') return '#22c55e';
  if (k === 'dalam-perhatian') return '#eab308';
  if (k === 'bermasalah') return '#ef4444';
  return '#818cf8';
}

function statusKeyToLabel(v: string) {
  const k = v.toLowerCase();
  if (k === 'normal') return 'NORMAL';
  if (k === 'dalam-perhatian') return 'DALAM PERHATIAN';
  if (k === 'bermasalah') return 'BERMASALAH';
  return v.replace(/-/g, ' ').toUpperCase();
}

function slugifyStatusKey(input: string) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\-\s]/g, '')
    .replace(/\s+/g, '-');
}

function formatTimeWIBFromISO(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const map: Record<string, string> = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.hour || '00'}:${map.minute || '00'}`;
}

function formatDateTimeWIBFromISO(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
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

function formatLastUpdateLabel(updatedAt?: string | null, serverIso?: string | null) {
  if (!updatedAt) return "-";
  return isSameWIBDay(updatedAt, serverIso) ? formatTimeWIBFromISO(updatedAt) : formatDateTimeWIBFromISO(updatedAt);
}

export default function StatusMesinPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<MachineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverTimeIso, setServerTimeIso] = useState<string | null>(null);
  const [listLastUpdatedIso, setListLastUpdatedIso] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState<MachineDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  type StatusItem = { key: string; color: string };
  const [statusList, setStatusList] = useState<StatusItem[] | string[]>([
    { key: 'normal', color: defaultColorForKey('normal') },
    { key: 'dalam-perhatian', color: defaultColorForKey('dalam-perhatian') },
    { key: 'bermasalah', color: defaultColorForKey('bermasalah') },
  ]);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const statusColorMap = useMemo(() => {
    const map = new Map<string, string>();
    (statusList as any[]).forEach((raw) => {
      const obj = typeof raw === 'string' ? { key: raw, color: defaultColorForKey(raw) } : raw;
      map.set(String(obj.key).toLowerCase(), obj.color || defaultColorForKey(obj.key));
    });
    return map;
  }, [statusList]);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, timeRes] = await Promise.all([
        fetch(ENDPOINTS.machinesList, { cache: 'no-store' }),
        fetch(ENDPOINTS.time).catch(() => null as any),
      ]);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Gagal memuat daftar mesin");
      const list: MachineItem[] = Array.isArray(json.items) ? json.items.map((it: any) => {
        const url = typeof it.imageUrl === 'string' && it.imageUrl
          ? (it.imageUrl.startsWith('http') ? it.imageUrl : `${ENDPOINTS.filesBase}${it.imageUrl}`)
          : null;
        return {
          id: String(it.id),
          name: String(it.name || ''),
          description: it.description || '',
          status: it.status || 'normal',
          imageUrl: url,
          createdAt: it.createdAt || null,
          updatedAt: it.updatedAt || null,
        } as MachineItem;
      }) : [];
      setItems(list);
      // If server includes statuses with the list, prefer that authoritative source
      if (Array.isArray(json.statuses) && json.statuses.length > 0) {
        setStatusList(json.statuses);
        try { localStorage.setItem('uv_machines_statuslist', JSON.stringify(json.statuses)); } catch {}
      }
      if (typeof json.lastUpdatedIso === 'string') setListLastUpdatedIso(json.lastUpdatedIso);
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
    (async () => {
      try {
        const r = await fetch(ENDPOINTS.machinesStatusList, { cache: 'no-store' });
        const j = await r.json();
        if (r.ok && j && j.ok && Array.isArray(j.statuses)) {
          setStatusList(j.statuses);
          try { localStorage.setItem('uv_machines_statuslist', JSON.stringify(j.statuses)); } catch {}
        } else {
          // Fallback to last known list
          try {
            const raw = localStorage.getItem('uv_machines_statuslist');
            if (raw) {
              const arr = JSON.parse(raw);
              if (Array.isArray(arr)) setStatusList(arr);
            }
          } catch {}
        }
      } catch {
        // Network error → fallback
        try {
          const raw = localStorage.getItem('uv_machines_statuslist');
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) setStatusList(arr);
          }
        } catch {}
      }
    })();
    const id = setInterval(fetchList, 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const keys = (statusList as any[]).map((s) => (typeof s === 'string' ? s : s.key));
    if (statusFilter !== 'all' && !keys.includes(statusFilter)) setStatusFilter('all');
  }, [statusList]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let base = items;
    if (q) {
      base = base.filter((it) => [it.name, it.description, it.id, it.status].some((v) => (v || '').toString().toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') {
      const target = String(statusFilter).toLowerCase();
      base = base.filter((it) => String(it.status || 'normal').toLowerCase() === target);
    }
    return base;
  }, [items, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const countMap = new Map<string, number>();
    filtered.forEach((it) => {
      const k = String(it.status || 'normal').toLowerCase();
      countMap.set(k, (countMap.get(k) || 0) + 1);
    });
    const keys: string[] = [];
    (statusList as any[]).forEach((raw) => {
      const k = typeof raw === 'string' ? raw : raw.key;
      keys.push(String(k).toLowerCase());
    });
    for (const k of countMap.keys()) if (!keys.includes(k)) keys.push(k);
    return keys.map((k) => ({ key: k, label: statusKeyToLabel(k), color: statusColorMap.get(k) || defaultColorForKey(k), count: countMap.get(k) || 0 }));
  }, [filtered, statusList, statusColorMap]);

  const onAddSubmit = async (payload: { name: string; description?: string; imageDataUrl?: string | null }) => {
    try {
      setAdding(true);
      const res = await fetch(ENDPOINTS.machinesCreate, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menambah mesin');
      setAddOpen(false);
      await fetchList();
    } catch (e) {
      alert('Gagal menambah mesin');
    } finally {
      setAdding(false);
    }
  };

  const openDetail = async (id: string) => {
    try {
      setDetailLoading(true);
      setDetailOpen(true);
      setDetailData(null);
      const res = await fetch(`${ENDPOINTS.machinesDetailBase}/${id}`);
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal memuat detail');
      const data: MachineDetail = json.data;
      if (data && data.image && data.image.url && !String(data.image.url).startsWith('http')) {
        data.image.url = `${ENDPOINTS.filesBase}${data.image.url}`;
      }
      setDetailData(data);
    } catch (e) {
      alert('Gagal memuat detail mesin');
      setDetailOpen(false);
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${ENDPOINTS.machinesDetailBase}/${deleteTarget}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menghapus');
      await fetchList();
    } catch (e) {
      alert('Gagal menghapus mesin');
    } finally {
      setDeleteTarget(null);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`${ENDPOINTS.machinesDetailBase}/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal update status');
      await fetchList();
    } catch (e) {
      alert('Gagal mengubah status');
    }
  };

  const saveMachine = async (payload: { id: string; name: string; description?: string; imageDataUrl?: string | null }) => {
    try {
      const res = await fetch(`${ENDPOINTS.machinesDetailBase}/${payload.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Gagal menyimpan');
      setDetailOpen(false);
      setDetailData(null);
      await fetchList();
    } catch (e) {
      alert('Gagal menyimpan perubahan');
    }
  };

  function getStatusColor(value?: string | null) {
    const key = String(value || 'normal').toLowerCase();
    return statusColorMap.get(key) || defaultColorForKey(key);
  }

  function StatusPill({ value }: { value?: string | null }) {
    const v = (value || 'normal').toString().toLowerCase();
    const color = getStatusColor(v);
    const label = statusKeyToLabel(v);
    return (
      <span className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] text-white" style={{ borderColor: color + '80' }}>
        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="tracking-wide font-medium">{label}</span>
      </span>
    );
  }

  // Optional overall "last updated" label (using server time as reference)
  const lastUpdatedLabel = useMemo(() => {
    if (!listLastUpdatedIso) return '-';
    return isSameWIBDay(listLastUpdatedIso, serverTimeIso) ? formatTimeWIBFromISO(listLastUpdatedIso) : formatDateTimeWIBFromISO(listLastUpdatedIso);
  }, [listLastUpdatedIso, serverTimeIso]);

  return (
    <section className="w-full box-border flex flex-col flex-1 min-h-0">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0 h-full">
        {/* Header */}
        <div className="mb-4 md:mb-6 flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-white">Status Mesin</h1>
              <p className="text-sm text-white/60">Kelola dan pantau status mesin</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setAddOpen(true)} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold"><Plus className="w-4 h-4" /> Tambah Mesin</button>
            <button type="button" onClick={() => setStatusModalOpen(true)} className="inline-flex items-center gap-2 h-9 px-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold" title="Kelola status kustom"><ListPlus className="w-4 h-4" /> Kelola Status</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative w-full sm:flex-1 min-w-0">
            <input type="text" placeholder="Cari mesin, status, deskripsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/60">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 focus:outline-none focus:border-white/30">
              <option value="all">Semua Status</option>
              {(statusList as any[]).map((raw) => { const s = typeof raw === 'string' ? raw : raw.key; return (<option key={s} value={s}>{String(s).replace(/-/g, ' ')}</option>); })}
            </select>
          </div>
          {loading && <div className="text-sm text-white/50">Memuat...</div>}
          {error && <div className="text-sm text-rose-400">{error}</div>}
        </div>

        {/* Cards Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex-1 min-h-0 flex flex-col">
          <div className="px-4 md:px-6 py-3 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-xs text-white/50">Total: {filtered.length}</div>
              {statusCounts.map((sc) => (
                <span key={sc.key} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-white/80" style={{ borderColor: sc.color }}>
                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                  <span>{sc.label}: {sc.count}</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden lg:flex items-center h-8 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 whitespace-nowrap">
                Terakhir diupdate: {lastUpdatedLabel}
              </div>
              <button type="button" onClick={fetchList} className="w-24 h-8 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs text-white">Refresh</button>
            </div>
          </div>
          <div className="p-4 md:p-6 flex-1 min-h-0 overflow-y-auto uv-scrollbar">
            {filtered.length === 0 && !loading ? (
              <div className="text-center text-white/50 text-sm py-8">Belum ada mesin</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filtered.map((it) => (
                  <div key={it.id} className="group relative rounded-2xl border-2 bg-white/[0.03] hover:bg-white/[0.06] transition-colors" style={{ borderColor: getStatusColor(it.status) + '66' }}>
                    <div className="p-4 md:p-5 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-white/40" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm md:text-base font-semibold text-white/90 truncate">{it.name || '-'}</div>
                              <div className="text-[11px] text-white/50 truncate">ID: {it.id}</div>
                            </div>
                            <StatusPill value={it.status} />
                          </div>
                          {it.updatedAt && it.updatedAt !== it.createdAt ? (
                            <div className="text-[11px] text-white/40 truncate">Terakhir Update: {formatLastUpdateLabel(it.updatedAt, serverTimeIso)}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-white/50" />
                        <select value={it.status || 'normal'} onChange={(e) => setStatus(it.id, e.target.value)} className="appearance-none text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/80 hover:bg-white/10 focus:outline-none focus:border-white/30">
                          {(statusList as any[]).map((raw) => { const s = typeof raw === 'string' ? raw : raw.key; return (<option key={s} value={s}>{String(s).replace(/-/g, ' ')}</option>); })}
                        </select>
                        <button type="button" onClick={() => openDetail(it.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs text-white"><Eye className="w-4 h-4" /> Detail</button>
                      </div>

                      <div className="text-xs text-white/70 bg-white/5 border border-white/10 rounded-lg px-3 py-2" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
                        {it.description || '-'}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[11px] text-white/40">Dibuat: {formatDateTimeWIBFromISO(it.createdAt)}</div>
                        <button type="button" onClick={() => setDeleteTarget(it.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-900/50 bg-rose-900/30 hover:bg-rose-900/40 px-3 py-1.5 text-xs text-white"><Trash2 className="w-4 h-4" /> Hapus</button>
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
      {addOpen && (
        <AddMachineModal visible={addOpen} onClose={() => setAddOpen(false)} onSubmit={onAddSubmit} submitting={adding} />
      )}
      {mounted && detailOpen && (
        <React.Suspense fallback={null}>
          <MachineDetailModal
            key={(detailData && detailData.id) || 'modal'}
            visible={detailOpen}
            data={detailData}
            saving={false}
            onClose={() => { setDetailOpen(false); setDetailData(null); }}
            onSave={saveMachine}
            onSetStatus={setStatus}
            statusList={(statusList as any[]).map((raw) => (typeof raw === 'string' ? raw : raw.key))}
            loading={detailLoading}
          />
        </React.Suspense>
      )}
      <ConfirmDeleteModal
        visible={!!deleteTarget}
        title="Hapus Mesin?"
        description="Tindakan ini akan menghapus mesin dari daftar. Tidak dapat dibatalkan."
        onConfirm={doDelete}
        onClose={() => setDeleteTarget(null)}
        confirmLabel="Hapus Mesin"
      />
      <SelectModal
        visible={statusModalOpen}
        title="Kelola Status Mesin"
        items={statusList as any}
        onClose={() => setStatusModalOpen(false)}
        onAdd={async (raw, color) => {
          try {
            const r = await fetch(ENDPOINTS.machinesStatusList, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: raw, color }) });
            const j = await r.json();
            if (r.ok && j && j.ok && Array.isArray(j.statuses)) {
              setStatusList(j.statuses);
              try { localStorage.setItem('uv_machines_statuslist', JSON.stringify(j.statuses)); } catch {}
              setStatusModalOpen(false);
            } else {
              alert(j?.error || 'Gagal menambah status');
            }
          } catch {
            alert('Gagal menambah status');
          }
        }}
        onDelete={async (key) => {
          const raw = String(key || '').trim();
          const slug = slugifyStatusKey(raw);
          try {
            // Try body-based DELETE first (aligns with Worker behavior)
            console.log('[machines][statuslist][delete] start', { raw, slug });
            let r = await fetch(ENDPOINTS.machinesStatusList, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: raw })
            });
            let j: any = {};
            try { j = await r.json(); } catch {}
            console.log('[machines][statuslist][delete] body-raw resp', { ok: r.ok, status: r.status, json: j });
            if (!(r.ok && j && j.ok && Array.isArray(j.statuses))) {
              // Retry with slug in body
              const r2 = await fetch(ENDPOINTS.machinesStatusList, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: slug })
              });
              let j2: any = {};
              try { j2 = await r2.json(); } catch {}
              console.log('[machines][statuslist][delete] body-slug resp', { ok: r2.ok, status: r2.status, json: j2 });
              if (r2.ok && j2 && j2.ok && Array.isArray(j2.statuses)) {
                j = j2; r = r2;
              }
            }
            if (!(r.ok && j && j.ok && Array.isArray(j.statuses))) {
              // Fallback to query param for environments that drop DELETE bodies
              const url1 = `${ENDPOINTS.machinesStatusList}?value=${encodeURIComponent(raw)}`;
              const r3 = await fetch(url1, { method: 'DELETE' });
              let j3: any = {};
              try { j3 = await r3.json(); } catch {}
              console.log('[machines][statuslist][delete] query-raw resp', { ok: r3.ok, status: r3.status, json: j3 });
              if (r3.ok && j3 && j3.ok && Array.isArray(j3.statuses)) {
                j = j3; r = r3;
              } else {
                const url2 = `${ENDPOINTS.machinesStatusList}?value=${encodeURIComponent(slug)}`;
                const r4 = await fetch(url2, { method: 'DELETE' });
                let j4: any = {};
                try { j4 = await r4.json(); } catch {}
                console.log('[machines][statuslist][delete] query-slug resp', { ok: r4.ok, status: r4.status, json: j4 });
                if (r4.ok && j4 && j4.ok && Array.isArray(j4.statuses)) { j = j4; r = r4; }
              }
            }
            if (j && j.ok && Array.isArray(j.statuses)) {
              setStatusList(j.statuses);
              try { localStorage.setItem('uv_machines_statuslist', JSON.stringify(j.statuses)); } catch {}
              console.log('[machines][statuslist][delete] success, new statuses', j.statuses);
            } else {
              console.warn('[machines][statuslist][delete] fallback GET due to unexpected response', { raw, slug, response: j, rOk: r && r.ok, rStatus: r && r.status });
              try {
                const g = await fetch(ENDPOINTS.machinesStatusList, { cache: 'no-store' });
                const gj = await g.json().catch(() => ({} as any));
                console.log('[machines][statuslist][delete] GET statuses resp', { ok: g.ok, json: gj });
                if (g.ok && gj && gj.ok && Array.isArray(gj.statuses)) {
                  setStatusList(gj.statuses);
                  try { localStorage.setItem('uv_machines_statuslist', JSON.stringify(gj.statuses)); } catch {}
                  return;
                }
              } catch (e) {
                console.error('[machines][statuslist][delete] GET statuses failed');
              }
              console.error('[machines][statuslist][delete] failed', { raw, slug, response: j });
              alert((j && j.error) || 'Gagal menghapus status');
            }
          } catch {
            console.error('[machines][statuslist][delete] exception');
            alert('Gagal menghapus status');
          }
        }}
        onEdit={async (oldKey, newKey, color) => {
          const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9\-\s]/g, '').replace(/\s+/g, '-');
          const oldSlug = slug(oldKey);
          const newSlug = slug(newKey);
          try {
            if (oldSlug === newSlug) {
              const r = await fetch(ENDPOINTS.machinesStatusList, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ value: newSlug, color }) });
              const j = await r.json();
              if (r.ok && j && j.ok && Array.isArray(j.statuses)) { setStatusList(j.statuses); return; }
            }
            const r2 = await fetch(ENDPOINTS.machinesStatusList, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldValue: oldSlug, newValue: newSlug, color }) });
            const j2 = await r2.json();
            if (r2.ok && j2 && j2.ok && Array.isArray(j2.statuses)) { setStatusList(j2.statuses); } else { alert(j2?.error || 'Gagal mengubah status'); }
            try { localStorage.setItem('uv_machines_statuslist', JSON.stringify((j2 && j2.statuses) || [])); } catch {}
          } catch { alert('Gagal mengubah status'); }
        }}
      />
    </section>
  );
}
