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
  const [httpCode, setHttpCode] = useState<number | null>(null);
  const [payloadSize, setPayloadSize] = useState<number | null>(null);
  const [skewMs, setSkewMs] = useState<number | null>(null);
  const [history, setHistory] = useState<Array<{ at: string; ok: boolean; ms: number }>>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);
  const POLL_INTERVAL_MS = 15000;

  const fetchHealth = async () => {
    setLoading(true);
    const start = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
    try {
      const res = await fetch(ENDPOINTS.health, { method: "GET", cache: "no-store" });
      const end = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const ms = Math.max(0, Math.round(end - start));
      setLatency(ms);
      setHttpCode(res.status);

      // Read as text to both compute payload size and parse JSON safely
      const text = await res.text();
      const sizeBytes = typeof TextEncoder !== "undefined" ? new TextEncoder().encode(text).length : text.length;
      setPayloadSize(sizeBytes);

      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      const isOk = res.ok && json && json.status === "ok";
      setHealth(isOk ? "ok" : "fail");
      const ts = typeof json?.timestamp === "string" ? json.timestamp : null;
      setServerTime(ts);
      if (ts) {
        try {
          const sMs = new Date(ts).getTime();
          const nowMs = Date.now();
          setSkewMs(Math.abs(nowMs - sMs));
        } catch {
          setSkewMs(null);
        }
      } else {
        setSkewMs(null);
      }

      // Update stats and history (keep last 20)
      setHistory((prev) => [{ at: new Date().toISOString(), ok: isOk, ms }, ...prev].slice(0, 20));
      if (isOk) setSuccessCount((c) => c + 1); else setFailureCount((c) => c + 1);
    } catch {
      // Measure duration even on failure
      const endErr = (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
      const msErr = Math.max(0, Math.round(endErr - start));
      setLatency(msErr);
      setHealth("fail");
      setHttpCode(null);
      setPayloadSize(null);
      setSkewMs(null);
      setHistory((prev) => [{ at: new Date().toISOString(), ok: false, ms: msErr }, ...prev].slice(0, 20));
      setFailureCount((c) => c + 1);
    } finally {
      setLastCheckedAt(new Date());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, POLL_INTERVAL_MS);
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

  const formatBytes = (n?: number | null) => {
    if (n === null || n === undefined) return "-";
    if (n < 1024) return `${n} B`;
    const kb = n / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const formatDuration = (ms?: number | null) => {
    if (ms === null || ms === undefined) return "-";
    const abs = Math.abs(ms);
    if (abs < 1000) return `${abs} ms`;
    const s = abs / 1000;
    if (s < 60) return `${s.toFixed(1)} dtk`;
    const m = s / 60;
    return `${m.toFixed(1)} mnt`;
  };

  // Derived stats
  const totalChecks = successCount + failureCount;
  const successRate = totalChecks > 0 ? Math.round((successCount / totalChecks) * 100) : null;
  const bars = history.slice(0, 12).reverse();
  const maxBarMs = bars.length ? Math.max(1, ...bars.map((b) => b.ms)) : 1;
  const msVals = history.map((h) => h.ms);
  const minMs = msVals.length ? Math.min(...msVals) : null;
  const maxMs = msVals.length ? Math.max(...msVals) : null;
  const avgMs = msVals.length ? Math.round(msVals.reduce((a, b) => a + b, 0) / msVals.length) : null;

  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between shrink-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              System Status
            </h1>
            <p className="text-base text-gray-400/80 font-light max-w-md">
              Real-time monitoring dashboard with comprehensive system metrics and health indicators.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="h-2.5 w-20 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60" />
                    <div className="h-5 w-28 rounded-full bg-gradient-to-r from-gray-500/60 to-gray-600/60" />
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-blue-500/30 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500" />
                  </div>
                </div>
                <div className="mt-6">
                  <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-gray-400/60 to-gray-500/60" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart / Overview Panel (placeholder) */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">Analytics Overview</h3>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <span className="text-xs text-white/60 font-medium">Real-time</span>
                </div>
              </div>
            </div>
            <div className="relative flex-1 h-[280px] sm:h-[320px] p-6">
              {/* Premium chart-like visualization */}
              <div className="grid grid-cols-12 gap-3 h-full items-end">
                {Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="group/bar flex flex-col justify-end">
                    <div className="w-full rounded-t-lg bg-gradient-to-t from-gray-800/60 to-gray-700/60 border-t border-white/10 overflow-hidden relative">
                      <div
                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500/60 via-cyan-500/50 to-purple-500/60 relative transition-all duration-500 group-hover/bar:from-blue-400/80 group-hover/bar:to-purple-400/80"
                        style={{ height: `${12 + ((idx % 6) + 1) * 16}px` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3 text-right">
              <span className="text-xs text-white/50 font-medium">No data available • Placeholder visualization</span>
            </div>
          </div>

          {/* System Status / Indicators Panel */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">System Indicators</h3>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60 font-medium">8 metrics</span>
                </div>
              </div>
            </div>
            <div className="flex-none h-[280px] sm:h-[320px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className={`group/row ${i % 2 === 0 ? "bg-white/[0.02]" : "bg-black/20"} flex items-center justify-between h-14 w-full px-6 hover:bg-white/[0.08] transition-colors duration-300 relative overflow-hidden`}
                  role="row"
                  aria-label="status-row"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 shadow-sm" />
                    <div className="h-3 w-32 sm:w-40 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60" />
                  </div>
                  <div className="relative h-2.5 w-16 rounded-full bg-gradient-to-r from-gray-500/60 to-gray-600/60" />
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3 text-right">
              <span className="text-xs text-white/50 font-medium">0 active indicators</span>
            </div>
          </div>
        </div>

        {/* Lower Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Server Health */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">Server Health</h3>
                </div>
                <button
                  onClick={handleManualRefresh}
                  className="group/btn inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 hover:text-white/90 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  aria-label="refresh-health"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : "group-hover/btn:rotate-180"} transition-transform duration-500`} />
                  <span className="font-medium">Refresh</span>
                </button>
              </div>
            </div>
            <div className="relative flex-1 p-6 space-y-6">
              {/* Primary status row */}
              <div className="group/status relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-5 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/status:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-white/10">
                      <Server className="h-5 w-5 text-white/70" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full shadow-lg ${health === "ok" ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-500/50" : health === "fail" ? "bg-gradient-to-r from-red-400 to-red-600 shadow-red-500/50" : "bg-gradient-to-r from-gray-500 to-gray-600"}`} />
                      <div className="text-base font-semibold text-white/90">
                        {loading ? "Checking..." : health === "ok" ? "Online" : health === "fail" ? "Offline" : "Unknown"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="hidden sm:flex items-center gap-2">
                      <span className="text-white/50 font-medium">HTTP</span>
                      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-white/80 font-mono text-sm">{httpCode ?? "-"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/50 font-medium">Latency</span>
                      <div className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 text-white/80 font-mono text-sm">
                        {latency !== null ? `${latency} ms` : "-"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Latency sparkline and quick stats */}
              <div className="group/chart relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-5 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-500/50" />
                      <h4 className="text-sm font-semibold text-white/90 tracking-wide">
                        Latency Trend (Last 12 checks)
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                      <span className="text-xs text-white/60 font-medium">Avg</span>
                      <span className="text-xs text-white/80 font-mono">
                        {avgMs !== null ? `${avgMs} ms` : "-"}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-16 mb-4 flex items-end gap-1.5 px-2">
                    {bars.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-sm text-white/40 font-medium">No data available</div>
                      </div>
                    ) : (
                      bars.map((b, i) => (
                        <div
                          key={i}
                          className="group/bar flex-1 rounded-t-lg transition-all duration-300 hover:scale-110 relative cursor-pointer"
                          title={`${b.ms} ms - ${b.ok ? 'Success' : 'Failed'}`}
                        >
                          <div
                            className={`w-full rounded-t-lg shadow-lg transition-all duration-500 ${
                              b.ok 
                                ? "bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 shadow-emerald-500/30 group-hover/bar:from-emerald-400/80 group-hover/bar:to-emerald-300/90" 
                                : "bg-gradient-to-t from-red-500/60 to-red-400/80 shadow-red-500/30 group-hover/bar:from-red-400/80 group-hover/bar:to-red-300/90"
                            }`}
                            style={{ height: `${Math.max(8, Math.round((b.ms / maxBarMs) * 64))}px` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 px-4 py-3 text-center">
                      <div className="text-xs text-white/50 font-medium mb-1">Min</div>
                      <div className="text-sm text-white/80 font-mono">{minMs ?? "-"} ms</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 px-4 py-3 text-center">
                      <div className="text-xs text-white/50 font-medium mb-1">Avg</div>
                      <div className="text-sm text-white/80 font-mono">{avgMs ?? "-"} ms</div>
                    </div>
                    <div className="rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 px-4 py-3 text-center">
                      <div className="text-xs text-white/50 font-medium mb-1">Max</div>
                      <div className="text-sm text-white/80 font-mono">{maxMs ?? "-"} ms</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Status</div>
                    <div className="flex items-center gap-3">
                      {health === "ok" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      ) : health === "fail" ? (
                        <XCircle className="h-5 w-5 text-red-400" />
                      ) : (
                        <Loader2 className="h-5 w-5 text-white/40 animate-spin" />
                      )}
                      <span className="text-sm font-medium text-white/90">
                        {health === "ok" ? "Healthy" : health === "fail" ? "Issues Detected" : "Checking"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Server Time</div>
                    <div className="text-sm font-mono text-white/80">{serverTime ? formatDateTime(serverTime) : "-"}</div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Local Time</div>
                    <div className="text-sm font-mono text-white/80">{formatDateTime(new Date().toISOString())}</div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Time Skew</div>
                    <div className="text-sm font-mono text-white/80">{formatDuration(skewMs)}</div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-teal-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">HTTP Status</div>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-lg text-xs font-mono border ${
                        httpCode === 200 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                        httpCode && httpCode >= 400 ? "bg-red-500/20 border-red-500/30 text-red-300" :
                        "bg-white/10 border-white/20 text-white/70"
                      }`}>
                        {httpCode ?? "-"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Response Size</div>
                    <div className="text-sm font-mono text-white/80">{formatBytes(payloadSize)}</div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Total Checks</div>
                    <div className="text-lg font-bold text-white/90">{totalChecks.toLocaleString()}</div>
                  </div>
                </div>
                <div className="group/detail relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 group-hover/detail:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2">Success Rate</div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-bold text-white/90">{successRate !== null ? `${successRate}%` : "-"}</div>
                      {successRate !== null && (
                        <div className={`w-2 h-2 rounded-full ${
                          successRate >= 95 ? "bg-emerald-400 shadow-emerald-500/50" :
                          successRate >= 80 ? "bg-yellow-400 shadow-yellow-500/50" :
                          "bg-red-400 shadow-red-500/50"
                        } shadow-lg`} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-white/50">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium">Auto-refresh every {Math.round(POLL_INTERVAL_MS / 1000)}s</span>
                </div>
                <span className="text-white/40 font-mono">
                  Last check: {lastCheckedAt ? formatLocalTime(lastCheckedAt) : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity / Incidents */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Recent Activity</h3>
                <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60 font-medium">Live feed</span>
                </div>
              </div>
            </div>
            <div className="flex-1 h-[220px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`group/activity ${i % 2 === 0 ? "bg-white/[0.02]" : "bg-black/20"} flex h-16 w-full items-center px-6 hover:bg-white/[0.08] transition-colors duration-300 relative overflow-hidden`}
                  role="row"
                  aria-label="incident-row"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/activity:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex-1 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-gray-500 to-gray-600 shadow-sm" />
                    <div className="h-3 w-3/5 sm:w-2/3 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60" />
                  </div>
                  <div className="relative hidden md:flex w-28 justify-end">
                    <div className="h-2.5 w-20 rounded-full bg-gradient-to-r from-gray-500/60 to-gray-600/60" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3 text-right">
              <span className="text-xs text-white/50 font-medium">No recent activity</span>
            </div>
          </div>

          {/* Secondary KPI / Notes */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-lg shadow-violet-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Performance Metrics</h3>
                <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60 font-medium">4 KPIs</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="group/kpi relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className={`absolute inset-0 opacity-0 group-hover/kpi:opacity-100 transition-opacity duration-500 ${
                    i === 0 ? "bg-gradient-to-br from-blue-500/5 to-cyan-500/5" :
                    i === 1 ? "bg-gradient-to-br from-emerald-500/5 to-green-500/5" :
                    i === 2 ? "bg-gradient-to-br from-purple-500/5 to-pink-500/5" :
                    "bg-gradient-to-br from-amber-500/5 to-orange-500/5"
                  }`} />
                  <div className="relative space-y-3">
                    <div className="h-2.5 w-18 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60" />
                    <div className="h-4 w-3/4 rounded-full bg-gradient-to-r from-gray-500/60 to-gray-600/60" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3 text-right">
              <span className="text-xs text-white/50 font-medium">Metrics placeholder</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
