"use client";

import { useEffect, useState } from "react";
import { ENDPOINTS } from "@/components/config/server";
import { CheckCircle2, XCircle, Loader2, Server, RefreshCw } from "lucide-react";

export default function StatusPage() {
  const [health, setHealth] = useState<"ok" | "fail" | "unknown">("unknown");
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    const start = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    try {
      const res = await fetch(ENDPOINTS.health, { method: "GET", cache: "no-store" });
      const end = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      setLatency(Math.max(0, Math.round(end - start)));
      if (res.ok) {
        const json: any = await res.json();
        setHealth(json && json.status === "ok" ? "ok" : "fail");
        setServerTime(typeof json?.timestamp === "string" ? json.timestamp : null);
      } else {
        setHealth("fail");
      }
    } catch {
      setHealth("fail");
    } finally {
      setLastCheckedAt(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, 15000);
    return () => clearInterval(id);
  }, []);

  const handleManualRefresh = () => {
    if (!loading) fetchHealth();
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleString("id-ID", { hour12: false });
    } catch {
      return iso;
    }
  };

  const formatLocalTime = (d?: Date | null) => {
    if (!d) return "-";
    try {
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "-";
    }
  };

  return (
    <section className="w-full p-4 md:p-6 box-border min-h-full flex flex-col">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-3 flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-[#f2f2f2]">Status</h1>
            <p className="mt-1 text-sm text-[#9a9a9a]">
              Dashboard placeholder — ringkasan sistem, indikator, dan area grafik.
            </p>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] p-4 shadow-xl"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-2 w-16 rounded-full bg-[#2a2a2a]" />
                  <div className="h-4 w-24 rounded-full bg-[#2a2a2a]" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-[#141414] border border-[#2a2a2a]" />
              </div>
              <div className="mt-4">
                <div className="h-2.5 w-9/12 rounded-full bg-[#2a2a2a]" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Chart / Overview Panel (placeholder) */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
            <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
                <div className="flex-1">Ringkasan</div>
                <div className="hidden sm:block text-[#6a6a6a]">Grafik (placeholder)</div>
              </div>
            </div>
            <div className="flex-1 h-[280px] sm:h-[320px] p-4 sm:p-5">
              {/* Simple chart-like skeletons */}
              <div className="grid grid-cols-12 gap-2 h-full items-end">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="flex flex-col justify-end">
                    <div className="w-full rounded-md bg-[#151515] border border-[#2a2a2a] p-1">
                      <div
                        className="w-full rounded bg-[#2a2a2a]"
                        style={{ height: `${8 + ((idx % 6) + 1) * 12}px` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
              0 data
            </div>
          </div>

          {/* System Status / Indicators Panel */}
          <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
            <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
                <div className="flex-1">Indikator</div>
                <div className="hidden sm:block text-[#6a6a6a]">Status</div>
              </div>
            </div>
            <div className="flex-none h-[280px] sm:h-[320px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`${i % 2 === 0 ? "bg-[#0e0e0e]" : "bg-[#181818]"} flex items-center justify-between h-12 w-full px-3 sm:px-4`}
                  role="row"
                  aria-label="status-row"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#2a2a2a]" />
                    <div className="h-2.5 w-28 rounded-full bg-[#2a2a2a] sm:w-36" />
                  </div>
                  <div className="h-2 w-14 rounded-full bg-[#2a2a2a]" />
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
              0 indikator
            </div>
          </div>
        </div>

        {/* Lower Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mt-4">
          {/* Server Health */}
          <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
            <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">Kesehatan Server</div>
                <button
                  onClick={handleManualRefresh}
                  className="inline-flex items-center gap-1.5 text-xs text-[#9a9a9a] hover:text-[#f2f2f2] transition-colors"
                  aria-label="refresh-health"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                  Perbarui
                </button>
              </div>
            </div>
            <div className="flex-1 p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                <div className="flex items-center gap-3">
                  <Server className="h-4 w-4 text-[#9a9a9a]" />
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${health === "ok" ? "bg-emerald-500" : health === "fail" ? "bg-red-500" : "bg-[#2a2a2a]"}`} />
                    <div className="text-sm text-[#e5e5e5]">
                      {loading ? "Memeriksa..." : health === "ok" ? "Online" : health === "fail" ? "Tidak Online" : "Tidak Diketahui"}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#9a9a9a]">{latency !== null ? `${latency} ms` : "-"}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#9a9a9a]">Status</div>
                  <div className="mt-1 text-sm text-[#e5e5e5] flex items-center gap-2">
                    {health === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : health === "fail" ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-[#9a9a9a] animate-spin" />
                    )}
                    <span>{health === "ok" ? "Sehat" : health === "fail" ? "Gangguan" : "Memeriksa"}</span>
                  </div>
                </div>
                <div className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3">
                  <div className="text-[10px] font-medium uppercase tracking-wider text-[#9a9a9a]">Waktu Server</div>
                  <div className="mt-1 text-sm text-[#e5e5e5]">{serverTime ? formatDateTime(serverTime) : "-"}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
              Terakhir cek: {lastCheckedAt ? formatLocalTime(lastCheckedAt) : "-"}
            </div>
          </div>

          {/* Recent Activity / Incidents */}
          <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
            <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
                Aktivitas / Insiden Terbaru
              </div>
            </div>
            <div className="flex-1 h-[220px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`${i % 2 === 0 ? "bg-[#0e0e0e]" : "bg-[#181818]"} group flex h-12 w-full items-center px-3 transition-colors sm:h-14 sm:px-4`}
                  role="row"
                  aria-label="incident-row"
                >
                  <div className="flex-1">
                    <div className="h-2.5 w-8/12 rounded-full bg-[#2a2a2a] sm:w-7/12" />
                  </div>
                  <div className="hidden w-32 shrink-0 md:flex justify-end">
                    <div className="h-2 w-20 rounded-full bg-[#2a2a2a]" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
              0 aktivitas
            </div>
          </div>

          {/* Placeholders for Secondary KPI / Notes */}
          <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
            <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
              <div className="text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
                Catatan / KPI Lainnya
              </div>
            </div>
            <div className="flex-1 p-4 grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border border-[#2a2a2a] bg-[#0f0f0f] p-3 space-y-2">
                  <div className="h-2 w-16 rounded-full bg-[#2a2a2a]" />
                  <div className="h-3 w-8/12 rounded-full bg-[#2a2a2a]" />
                </div>
              ))}
            </div>
            <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
              0 catatan
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
