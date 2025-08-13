"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import {
  Server,
  Users,
  Boxes,
  FileText,
  Activity,
  Cpu,
  MemoryStick,
  RefreshCw,
  Zap,
  TrendingUp,
  Signal,
} from "lucide-react";

type WorkerItem = {
  id: string;
  fullName: string;
  role: string;
  bidang?: string;
  status?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type StockItem = {
  id: string;
  name: string;
  stock: number;
  createdAt?: string | null;
};

type LaporanItem = {
  id: string;
  jenis: "harian" | "kerusakan" | string;
  namaMesin: string;
  jenisMesin: string;
  createdAt: string | null;
};

type SystemStatus = {
  cpu: { usage: { total: number; user: number; system: number }; count: number; model: string };
  memory: { total: number; used: number; free: number; percentage: number };
  network: { interfaces: Array<{ name: string; ipv4: string | null }>; speed: any };
  system: { uptime: number; hostname: string; platform: string; arch: string; release: string };
  process?: { pid: number; version: string; uptime: number } | null;
  timestamp?: string;
};

type HealthInfo = {
  status: "ok" | "fail" | "unknown";
  latency: number | null;
  httpCode: number | null;
  serverTime: string | null;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / (24 * 3600));
  const hours = Math.floor((seconds % (24 * 3600)) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}h ${hours}j ${mins}m`;
  if (hours > 0) return `${hours}j ${mins}m`;
  return `${mins}m`;
}

function formatDateTime(idIso?: string | null) {
  if (!idIso) return "-";
  try {
    return new Date(idIso).toLocaleString("id-ID", { hour12: false });
  } catch {
    return idIso;
  }
}

export default function HomeDashboard() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<HealthInfo>({ status: "unknown", latency: null, httpCode: null, serverTime: null });
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [workers, setWorkers] = useState<WorkerItem[]>([]);
  const [statusList, setStatusList] = useState<Array<{ key: string; color: string }>>([
    { key: "tersedia", color: "#22c55e" },
    { key: "sibuk", color: "#eab308" },
    { key: "sedang-bekerja", color: "#ef4444" },
    { key: "tidak-hadir", color: "#9ca3af" },
  ]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockLastUpdatedIso, setStockLastUpdatedIso] = useState<string | null>(null);
  const [laporanItems, setLaporanItems] = useState<LaporanItem[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [todayDate, setTodayDate] = useState<string>("");

  const fetchHealth = async (): Promise<HealthInfo> => {
    const start = performance.now();
    try {
      const res = await fetch(ENDPOINTS.health, { method: "GET", cache: "no-store" });
      const end = performance.now();
      let json: any = null;
      try { json = await res.json(); } catch {}
      const ok = res.ok && json && json.status === "ok";
      return { status: ok ? "ok" : "fail", latency: Math.round(end - start), httpCode: res.status, serverTime: json?.timestamp || null };
    } catch {
      const end = performance.now();
      return { status: "fail", latency: Math.round(end - start), httpCode: null, serverTime: null };
    }
  };

  const fetchSystem = async () => {
    try {
      const res = await fetch(ENDPOINTS.systemStatus, { cache: "no-store" });
      const j = await res.json();
      if (!res.ok || !j?.ok) return null;
      return j.data as SystemStatus;
    } catch {
      return null;
    }
  };

  const fetchWorkers = async () => {
    try {
      const [res, statusRes] = await Promise.all([
        fetch(ENDPOINTS.workersList, { cache: "no-store" }),
        fetch(ENDPOINTS.workersStatusList, { cache: "no-store" }).catch(() => null as any),
      ]);
      const j = await res.json();
      if (res.ok && j?.ok) setWorkers(Array.isArray(j.items) ? j.items : []);
      if (statusRes && (statusRes as Response).ok) {
        try {
          const sj = await (statusRes as Response).json();
          if (sj && sj.ok && Array.isArray(sj.statuses)) setStatusList(sj.statuses);
        } catch {}
      }
    } catch {}
  };

  const fetchStock = async () => {
    try {
      const res = await fetch(ENDPOINTS.stockList, { cache: "no-store" });
      const j = await res.json();
      if (res.ok && j?.ok) {
        setStockItems(Array.isArray(j.items) ? j.items : []);
        setStockLastUpdatedIso(j.lastUpdatedIso || null);
      }
    } catch {}
  };

  const fetchLaporan = async (dateOverride?: string) => {
    try {
      const d = (dateOverride || todayDate || "").trim();
      const url = d ? `${ENDPOINTS.laporanList}?date=${encodeURIComponent(d)}` : ENDPOINTS.laporanList;
      const res = await fetch(url, { cache: "no-store" });
      const j = await res.json();
      if (res.ok && j?.ok) setLaporanItems(Array.isArray(j.items) ? j.items : []);
    } catch {}
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [h, s] = await Promise.all([fetchHealth(), fetchSystem()]);
      setHealth(h);
      setSystem(s);
      const ops: Array<Promise<any>> = [fetchWorkers(), fetchStock()];
      if (todayDate) ops.push(fetchLaporan(todayDate));
      await Promise.all(ops);
    } finally {
      setLoading(false);
    }
  }, [todayDate]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  // Load server time to determine today's date (WIB) so we only load today's laporan
  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(ENDPOINTS.time, { cache: "no-store" });
        const j = await res.json();
        if (!canceled && res.ok && j?.ok && typeof j.date === "string") {
          setTodayDate(j.date);
        }
      } catch {}
    })();
    return () => { canceled = true; };
  }, []);

  const workersSummary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const it of workers) {
      const k = String(it.status || "tersedia").toLowerCase();
      counts.set(k, (counts.get(k) || 0) + 1);
    }
    const colorMap = new Map<string, string>();
    statusList.forEach((s) => colorMap.set(String(s.key).toLowerCase(), s.color));
    const entries = Array.from(counts.entries()).map(([key, count]) => ({ key, count, color: colorMap.get(key) || "#818cf8" }));
    entries.sort((a, b) => b.count - a.count);
    const total = workers.length;
    return { total, entries };
  }, [workers, statusList]);

  const stockSummary = useMemo(() => {
    let totalProducts = stockItems.length;
    let totalUnits = 0;
    const ranges = [
      { label: "0 - 100", min: 0, max: 100, includeMin: true, includeMax: true, products: 0 },
      { label: "100 - 1000", min: 100, max: 1000, includeMin: false, includeMax: true, products: 0 },
      { label: "1000 - 10000", min: 1000, max: 10000, includeMin: false, includeMax: true, products: 0 },
    ];
    const inRange = (s: number, r: typeof ranges[number]) => {
      const ge = r.includeMin ? s >= r.min : s > r.min;
      const le = r.includeMax ? s <= r.max : s < r.max;
      return ge && le;
    };
    for (const it of stockItems) {
      const s = Number(it.stock || 0);
      totalUnits += isFinite(s) ? s : 0;
      for (const r of ranges) {
        if (inRange(s, r)) { r.products += 1; break; }
      }
    }
    return { totalProducts, totalUnits, ranges };
  }, [stockItems]);

  const laporanSummary = useMemo(() => {
    let total = laporanItems.length;
    let harian = 0;
    let kerusakan = 0;
    for (const it of laporanItems) {
      if (String(it.jenis).toLowerCase() === "harian") harian++;
      else if (String(it.jenis).toLowerCase() === "kerusakan") kerusakan++;
    }
    const recent = [...laporanItems].slice(0, 2);
    return { total, harian, kerusakan, recent };
  }, [laporanItems]);

  const net = system?.network?.speed;
  const pingAvg = net?.ping?.average ? Math.round(net.ping.average) : null;
  const dl = net?.download?.speed ? Math.round(net.download.speed) : null;
  const ul = net?.upload?.speed ? Math.round(net.upload.speed) : null;

  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-6 flex items-end justify-between shrink-0">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              Ringkasan Univista Monitor
            </h1>
            <p className="text-sm text-gray-400/80 font-light">Gambaran singkat kondisi sistem, stok, laporan, dan anggota.</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : "group-hover:rotate-180"} transition-transform duration-500`} />
            <span className="font-medium">Refresh</span>
          </button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          {/* Server */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Server</div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${health.status === "ok" ? "bg-emerald-400" : health.status === "fail" ? "bg-red-400" : "bg-gray-500"}`} />
                    <div className="text-lg font-bold text-white/90">
                      {health.status === "ok" ? "Online" : health.status === "fail" ? "Offline" : "Gak Tau"}
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
                    Uptime: {system ? formatUptime(system.system.uptime) : "-"}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <Server className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-white/70">
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <div className="text-white/50">Latensi</div>
                  <div className="font-mono">{health.latency !== null ? `${health.latency} ms` : "-"}</div>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
                  <div className="text-white/50">Hostname</div>
                  <div className="font-mono truncate">{system?.system.hostname || "-"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Workers */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Anggota</div>
                  <div className="text-2xl font-bold text-white/90">{workersSummary.total}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {workersSummary.entries.slice(0, 4).map((e) => (
                      <span key={e.key} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] text-white/80" style={{ borderColor: e.color }}>
                        <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
                        {e.key.replace(/-/g, " ")}: {e.count}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Stok Sparepart</div>
                  <div className="text-2xl font-bold text-white/90">{stockSummary.totalProducts} produk</div>
                  <div className="text-xs text-white/60">Total unit: <span className="text-white/90 font-mono">{stockSummary.totalUnits}</span></div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-600/20 border border-violet-500/30 flex items-center justify-center">
                  <Boxes className="w-6 h-6 text-violet-400" />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-white/70">
                {stockSummary.ranges.map((r) => (
                  <div key={r.label} className="rounded-md bg-white/5 border border-white/10 px-2 py-1 text-center">
                    <div className="text-white/50">{r.label}</div>
                    <div className="font-mono text-white/90">{r.products}</div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-[11px] text-white/40">Terakhir diupdate: {formatDateTime(stockLastUpdatedIso)}</div>
            </div>
          </div>

          {/* Laporan */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Laporan</div>
                  <div className="text-2xl font-bold text-white/90">{laporanSummary.total}</div>
                  <div className="text-xs text-white/60 flex items-center gap-3">
                    <span>Harian: <span className="text-white/90 font-mono">{laporanSummary.harian}</span></span>
                    <span>Kerusakan: <span className="text-white/90 font-mono">{laporanSummary.kerusakan}</span></span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sistem */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">Kinerja Sistem</h3>
                </div>
                <div className="text-xs text-white/50 font-mono">{health.serverTime ? formatDateTime(health.serverTime) : ""}</div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs text-white/60"><span>CPU</span><Cpu className="w-4 h-4 text-blue-400" /></div>
                <div className="mt-2 text-2xl font-bold text-white/90">{system ? Math.round(system.cpu.usage.total) : "-"}%</div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${system ? Math.min(100, Math.max(0, Math.round(system.cpu.usage.total))) : 0}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs text-white/60"><span>Memori</span><MemoryStick className="w-4 h-4 text-purple-400" /></div>
                <div className="mt-2 text-2xl font-bold text-white/90">{system ? Math.round(system.memory.percentage) : "-"}%</div>
                <div className="text-[11px] text-white/50">{system ? `${formatBytes(system.memory.used)} / ${formatBytes(system.memory.total)}` : "-"}</div>
                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${system ? Math.min(100, Math.max(0, Math.round(system.memory.percentage))) : 0}%` }} />
                </div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs text-white/60"><span>Download</span><TrendingUp className="w-4 h-4 text-green-400" /></div>
                <div className="mt-2 text-2xl font-bold text-white/90">{dl !== null ? `${dl} Mbps` : "-"}</div>
                <div className="text-[11px] text-white/50">Kualitas: {net?.download?.quality || "-"}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="flex items-center justify-between text-xs text-white/60"><span>Upload</span><Zap className="w-4 h-4 text-blue-400" /></div>
                <div className="mt-2 text-2xl font-bold text-white/90">{ul !== null ? `${ul} Mbps` : "-"}</div>
                <div className="text-[11px] text-white/50">Kualitas: {net?.upload?.quality || "-"}</div>
              </div>
            </div>
            <div className="px-6 pb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-white/70">
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2"><Signal className="w-4 h-4 text-amber-400" /><span>Ping rata-rata:</span><span className="font-mono text-white/90">{pingAvg !== null ? `${pingAvg} ms` : "-"}</span></div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-400" /><span>Platform:</span><span className="font-mono text-white/90 truncate">{system?.system.platform || "-"}</span></div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-white/60" /><span>Versi:</span><span className="font-mono text-white/90 truncate">{system?.system.release || "-"}</span></div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-3 flex items-center gap-2"><span className="inline-block w-2 h-2 rounded-full bg-white/60" /><span>CPU:</span><span className="font-mono text-white/90 truncate">{system?.cpu?.model || "-"}</span></div>
            </div>
          </div>

          {/* Laporan terbaru */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Laporan Terbaru</h3>
              </div>
            </div>
            <div className="p-6 space-y-3">
              {laporanSummary.recent.length === 0 ? (
                <div className="text-sm text-white/50">Belum ada laporan</div>
              ) : (
                laporanSummary.recent.map((it) => (
                  <div key={it.id} className="rounded-xl bg-white/5 border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/90 truncate">{it.namaMesin || "-"}</div>
                        <div className="text-xs text-white/60 truncate">{String(it.jenis).toLowerCase() === "harian" ? "Laporan Harian" : "Laporan Kerusakan"} • {it.jenisMesin || "-"}</div>
                      </div>
                      <div className="text-[11px] text-white/40 shrink-0">{formatDateTime(it.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


