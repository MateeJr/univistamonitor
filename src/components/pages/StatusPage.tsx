"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { ENDPOINTS } from "@/components/config/server";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Server, 
  RefreshCw, 
  Cpu, 
  MemoryStick, 
  Network, 
  HardDrive,
  Clock,
  Wifi,
  MonitorSpeaker,
  Activity,
  Zap,
  Globe,
  Signal,
  AlertTriangle,
  TrendingUp
} from "lucide-react";

// Types for system monitoring data
interface SystemData {
  cpu: {
    count: number;
    model: string;
    usage: {
      user: number;
      system: number;
      idle: number;
      total: number;
    };
  };
  memory: {
    total: number;
    used: number;
    free: number;
    percentage: number;
  };
  network: {
    interfaces: Array<{
      name: string;
      ipv4: string | null;
      ipv6: string | null;
      mac: string | null;
    }>;
    speed: {
      ping: {
        average: number | null;
        results: Array<{
          host: string;
          success: boolean;
          time: number;
        }>;
      };
    } | null;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    release: string;
    uptime: number;
    loadavg: number[];
  };
  process?: {
    pid: number;
    version: string;
    platform: string;
    arch: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

interface HealthStatus {
  status: "ok" | "fail" | "unknown";
  serverTime: string | null;
  latency: number | null;
  lastCheckedAt: Date | null;
  httpCode: number | null;
  payloadSize: number | null;
  skewMs: number | null;
  history: Array<{ at: string; ok: boolean; ms: number }>;
  successCount: number;
  failureCount: number;
}

export default function StatusPage() {
  // Health monitoring state
  const [health, setHealth] = useState<HealthStatus>({
    status: "unknown",
    serverTime: null,
    latency: null,
    lastCheckedAt: null,
    httpCode: null,
    payloadSize: null,
    skewMs: null,
    history: [],
    successCount: 0,
    failureCount: 0,
  });

  // System monitoring state
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [networkSpeed, setNetworkSpeed] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLL_INTERVAL_MS = 15000;

  // Page visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const fetchHealthData = async () => {
    const start = performance.now();
    try {
      const res = await fetch(ENDPOINTS.health, { method: "GET", cache: "no-store" });
      const end = performance.now();
      const ms = Math.round(end - start);

      const text = await res.text();
      const sizeBytes = new TextEncoder().encode(text).length;
      let json: any = null;
      try { 
        json = text ? JSON.parse(text) : null; 
      } catch {}

      const isOk = res.ok && json && json.status === "ok";
      const ts = typeof json?.timestamp === "string" ? json.timestamp : null;
      let skew = null;
      
      if (ts) {
        try {
          const sMs = new Date(ts).getTime();
          const nowMs = Date.now();
          skew = Math.abs(nowMs - sMs);
        } catch {}
      }

      return {
        status: isOk ? "ok" : "fail" as const,
        serverTime: ts,
        latency: ms,
        httpCode: res.status,
        payloadSize: sizeBytes,
        skewMs: skew,
        success: isOk
      };
    } catch {
      const end = performance.now();
      const ms = Math.round(end - start);
      return {
        status: "fail" as const,
        serverTime: null,
        latency: ms,
        httpCode: null,
        payloadSize: null,
        skewMs: null,
        success: false
      };
    }
  };

  const fetchSystemData = async () => {
    try {
      const response = await fetch(ENDPOINTS.systemStatus, { 
        method: "GET", 
        cache: "no-store" 
      });
      
      if (!response.ok) throw new Error('Failed to fetch system data');
      
      const result = await response.json();
      return result.ok ? result.data : null;
    } catch (error) {
      console.error('Error fetching system data:', error);
      return null;
    }
  };

  const fetchNetworkSpeed = async () => {
    try {
      const response = await fetch(ENDPOINTS.networkSpeed, { 
        method: "GET", 
        cache: "no-store" 
      });
      
      if (!response.ok) throw new Error('Failed to fetch network speed');
      
      const result = await response.json();
      return result.ok ? result.data : null;
    } catch (error) {
      console.error('Error fetching network speed:', error);
      return null;
    }
  };

  const fetchAllData = useCallback(async () => {
    if (!isPageVisible) return; // Don't fetch when page is not visible
    
    setLoading(true);
    
    try {
      const [healthData, sysData, speedData] = await Promise.all([
        fetchHealthData(),
        fetchSystemData(),
        fetchNetworkSpeed()
      ]);

      // Update health state
      setHealth(prev => ({
        ...prev,
        status: healthData.status as "ok" | "fail" | "unknown",
        serverTime: healthData.serverTime,
        latency: healthData.latency,
        lastCheckedAt: new Date(),
        httpCode: healthData.httpCode,
        payloadSize: healthData.payloadSize,
        skewMs: healthData.skewMs,
        history: [
          { 
            at: new Date().toISOString(), 
            ok: healthData.success, 
            ms: healthData.latency || 0 
          },
          ...prev.history
        ].slice(0, 20),
        successCount: healthData.success ? prev.successCount + 1 : prev.successCount,
        failureCount: !healthData.success ? prev.failureCount + 1 : prev.failureCount,
      }));

      setSystemData(sysData);
      setNetworkSpeed(speedData);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  }, [isPageVisible]);

  useEffect(() => {
    // Initial fetch
    fetchAllData();

    // Set up interval only when page is visible
    if (isPageVisible) {
      intervalRef.current = setInterval(fetchAllData, POLL_INTERVAL_MS);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllData, isPageVisible]);

  const handleManualRefresh = () => {
    if (!loading) fetchAllData();
  };

  // Helper functions
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDateTime = (iso?: string | null) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("id-ID", { hour12: false });
    } catch {
      return iso;
    }
  };

  // Calculated values
  const totalChecks = health.successCount + health.failureCount;
  const successRate = totalChecks > 0 ? Math.round((health.successCount / totalChecks) * 100) : null;
  const bars = health.history.slice(0, 12).reverse();
  const maxBarMs = bars.length ? Math.max(1, ...bars.map(b => b.ms)) : 1;
  const avgLatency = bars.length ? Math.round(bars.reduce((sum, b) => sum + b.ms, 0) / bars.length) : null;

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
              Comprehensive real-time system monitoring with performance metrics, network status, and health indicators.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20">
              <div className={`w-2 h-2 rounded-full ${isPageVisible ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className={`text-sm font-medium ${isPageVisible ? 'text-emerald-400' : 'text-gray-500'}`}>
                {isPageVisible ? 'Live' : 'Paused'}
              </span>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white/90 hover:bg-white/10 transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : "group-hover:rotate-180"} transition-transform duration-500`} />
              <span className="font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Server Status */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Server</div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${
                      health.status === "ok" ? "bg-emerald-400 shadow-emerald-500/50" :
                      health.status === "fail" ? "bg-red-400 shadow-red-500/50" :
                      "bg-gray-500"
                    } shadow-lg`} />
                    <div className="text-lg font-bold text-white/90">
                      {health.status === "ok" ? "Online" : health.status === "fail" ? "Offline" : "Unknown"}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30 flex items-center justify-center">
                  <Server className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-white/60">
                  Uptime: {systemData ? formatUptime(systemData.system.uptime) : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* CPU Usage */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">CPU Usage</div>
                  <div className="text-2xl font-bold text-white/90">
                    {systemData ? `${Math.round(systemData.cpu.usage.total)}%` : "-"}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center">
                  <Cpu className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-white/60">
                  {systemData ? `${systemData.cpu.count} cores` : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Memory</div>
                  <div className="text-2xl font-bold text-white/90">
                    {systemData ? `${Math.round(systemData.memory.percentage)}%` : "-"}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30 flex items-center justify-center">
                  <MemoryStick className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-white/60">
                  {systemData ? `${formatBytes(systemData.memory.used)} / ${formatBytes(systemData.memory.total)}` : "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Network Speed */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="relative p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="text-xs font-semibold uppercase tracking-wider text-white/60">Download</div>
                  <div className="text-2xl font-bold text-white/90">
                    {networkSpeed?.download?.speed ? `${Math.round(networkSpeed.download.speed)} Mbps` : "-"}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-xs text-white/60">
                  {networkSpeed?.download?.quality && networkSpeed.download.quality !== 'unknown' 
                    ? `${networkSpeed.download.quality} quality`
                    : networkSpeed?.ping.average ? `${Math.round(networkSpeed.ping.average)}ms ping` : "Testing..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* System Performance Chart */}
          <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">Performance Metrics</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-white/60 font-medium">CPU</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs text-white/60 font-medium">Memory</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative flex-1 h-[280px] sm:h-[320px] p-6">
              <div className="grid grid-cols-12 gap-3 h-full items-end">
                {Array.from({ length: 12 }).map((_, idx) => {
                  const cpuHeight = systemData ? (systemData.cpu.usage.total / 100) * 100 : 20 + (idx % 4) * 10;
                  const memHeight = systemData ? (systemData.memory.percentage / 100) * 80 : 15 + (idx % 3) * 8;
                  
                  return (
                    <div key={idx} className="group/bar flex flex-col justify-end gap-1">
                      {/* CPU Bar */}
                      <div className="w-full rounded-t-lg overflow-hidden relative">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-blue-500/60 via-cyan-500/50 to-blue-400/80 relative transition-all duration-500 group-hover/bar:from-blue-400/80 group-hover/bar:to-blue-300/90"
                          style={{ height: `${Math.max(8, cpuHeight)}px` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                      {/* Memory Bar */}
                      <div className="w-full rounded-t-lg overflow-hidden relative">
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-purple-500/60 via-pink-500/50 to-purple-400/80 relative transition-all duration-500 group-hover/bar:from-purple-400/80 group-hover/bar:to-purple-300/90"
                          style={{ height: `${Math.max(6, memHeight)}px` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="font-medium">CPU: </span>
                    <span className="text-blue-400 font-mono">
                      {systemData ? `${Math.round(systemData.cpu.usage.total)}%` : "-"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-white/60">
                    <span className="font-medium">Memory: </span>
                    <span className="text-purple-400 font-mono">
                      {systemData ? `${Math.round(systemData.memory.percentage)}%` : "-"}
                    </span>
                  </div>
                </div>
                <span className="text-white/40 font-mono">
                  Updated: {health.lastCheckedAt ? health.lastCheckedAt.toLocaleTimeString("id-ID") : "-"}
                </span>
              </div>
            </div>
          </div>

          {/* System Information Panel */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">System Info</h3>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <span className="text-xs text-white/60 font-medium">Live</span>
                </div>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4">
              {/* Platform Info */}
              <div className="group/item relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Hostname</span>
                    <MonitorSpeaker className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    {systemData?.system.hostname || "-"}
                  </div>
                  <div className="text-xs text-white/60">
                    {systemData ? `${systemData.system.platform} ${systemData.system.arch}` : "-"}
                  </div>
                </div>
              </div>

              {/* Load Average */}
              <div className="group/item relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Load Average</span>
                    <Activity className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex items-center gap-4">
                    {systemData?.system.loadavg.slice(0, 3).map((load, i) => (
                      <div key={i} className="text-center">
                        <div className="text-lg font-bold text-white/90">
                          {load.toFixed(2)}
                        </div>
                        <div className="text-xs text-white/50">
                          {i === 0 ? '1m' : i === 1 ? '5m' : '15m'}
                        </div>
                      </div>
                    )) || <div className="text-white/60">-</div>}
                  </div>
                </div>
              </div>

              {/* Network Interfaces */}
              <div className="group/item relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Network</span>
                    <Wifi className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="space-y-2">
                    {systemData?.network.interfaces.slice(0, 2).map((iface, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="text-sm font-medium text-white/80">{iface.name}</div>
                        <div className="text-xs text-white/60 font-mono">
                          {iface.ipv4 || iface.ipv6 || "-"}
                        </div>
                      </div>
                    )) || <div className="text-white/60">No interfaces</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Server Health Panel */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-green-400 shadow-lg shadow-emerald-500/50" />
                  <h3 className="text-sm font-semibold text-white/90 tracking-wide">Server Health</h3>
                </div>
              </div>
            </div>
            <div className="relative flex-1 p-6 space-y-4">
              {/* Health Status */}
              <div className="group/health relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/health:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full shadow-lg ${
                      health.status === "ok" ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-500/50" :
                      health.status === "fail" ? "bg-gradient-to-r from-red-400 to-red-600 shadow-red-500/50" :
                      "bg-gradient-to-r from-gray-500 to-gray-600"
                    }`} />
                    <div className="text-base font-semibold text-white/90">
                      {loading ? "Checking..." : health.status === "ok" ? "Online" : health.status === "fail" ? "Offline" : "Unknown"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-white/80">
                      {health.latency !== null ? `${health.latency} ms` : "-"}
                    </div>
                    <div className="text-xs text-white/50">Latency</div>
                  </div>
                </div>
              </div>

              {/* Response Time Chart */}
              <div className="group/chart relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/chart:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-white/50">Response Time</div>
                    <div className="text-xs text-white/60 font-mono">
                      Avg: {avgLatency !== null ? `${avgLatency} ms` : "-"}
                    </div>
                  </div>
                  <div className="relative h-12 flex items-end gap-1">
                    {bars.length === 0 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs text-white/40 font-medium">No data</div>
                      </div>
                    ) : (
                      bars.map((b, i) => (
                        <div
                          key={i}
                          className="group/bar flex-1 rounded-t-sm transition-all duration-300 hover:scale-110 cursor-pointer"
                          title={`${b.ms} ms - ${b.ok ? 'Success' : 'Failed'}`}
                        >
                          <div
                            className={`w-full rounded-t-sm shadow-sm transition-all duration-500 ${
                              b.ok 
                                ? "bg-gradient-to-t from-emerald-500/60 to-emerald-400/80 group-hover/bar:from-emerald-400/80 group-hover/bar:to-emerald-300/90" 
                                : "bg-gradient-to-t from-red-500/60 to-red-400/80 group-hover/bar:from-red-400/80 group-hover/bar:to-red-300/90"
                            }`}
                            style={{ height: `${Math.max(4, Math.round((b.ms / maxBarMs) * 48))}px` }}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 px-4 py-3 text-center">
                  <div className="text-xs text-white/50 font-medium mb-1">Success Rate</div>
                  <div className="text-lg font-bold text-white/80">
                    {successRate !== null ? `${successRate}%` : "-"}
                  </div>
                </div>
                <div className="rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 px-4 py-3 text-center">
                  <div className="text-xs text-white/50 font-medium mb-1">Total Checks</div>
                  <div className="text-lg font-bold text-white/80">
                    {totalChecks.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Internet Speed Test Panel */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-lg shadow-blue-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Internet Speed</h3>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4">
              {/* Download Speed */}
              <div className="group/download relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover/download:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Download</span>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white/90">
                    {networkSpeed?.download?.speed ? `${Math.round(networkSpeed.download.speed)} Mbps` : "-"}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Quality:</span>
                    <span className={`font-medium capitalize ${
                      networkSpeed?.download?.quality === 'excellent' ? 'text-emerald-400' :
                      networkSpeed?.download?.quality === 'good' ? 'text-blue-400' :
                      networkSpeed?.download?.quality === 'fair' ? 'text-yellow-400' :
                      networkSpeed?.download?.quality === 'poor' ? 'text-red-400' :
                      'text-white/60'
                    }`}>
                      {networkSpeed?.download?.quality || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Speed */}
              <div className="group/upload relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Upload</span>
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white/90">
                    {networkSpeed?.upload?.speed ? `${Math.round(networkSpeed.upload.speed)} Mbps` : "-"}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/60">Quality:</span>
                    <span className={`font-medium capitalize ${
                      networkSpeed?.upload?.quality === 'excellent' ? 'text-emerald-400' :
                      networkSpeed?.upload?.quality === 'good' ? 'text-blue-400' :
                      networkSpeed?.upload?.quality === 'fair' ? 'text-yellow-400' :
                      networkSpeed?.upload?.quality === 'poor' ? 'text-red-400' :
                      'text-white/60'
                    }`}>
                      {networkSpeed?.upload?.quality || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ping Results */}
              <div className="group/ping relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover/ping:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Ping Test</span>
                    <Signal className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    {networkSpeed?.ping.average ? `${Math.round(networkSpeed.ping.average)} ms` : "-"}
                  </div>
                  <div className="space-y-1">
                    {networkSpeed?.ping.results?.slice(0, 3).map((result: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-white/60 font-mono">{result.host}</span>
                        <span className={`font-mono ${result.success ? 'text-emerald-400' : 'text-red-400'}`}>
                          {result.success ? `${Math.round(result.time)}ms` : 'Failed'}
                        </span>
                      </div>
                    )) || <div className="text-xs text-white/40">Testing...</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Resources Panel */}
          <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-lg shadow-violet-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">System Resources</h3>
              </div>
            </div>
            <div className="flex-1 p-6 space-y-4">
              {/* CPU Details */}
              <div className="group/cpu relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover/cpu:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">CPU</span>
                    <Cpu className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    {systemData ? `${Math.round(systemData.cpu.usage.total)}%` : "-"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">User</span>
                      <span className="text-white/80 font-mono">
                        {systemData ? `${Math.round(systemData.cpu.usage.user)}%` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">System</span>
                      <span className="text-white/80 font-mono">
                        {systemData ? `${Math.round(systemData.cpu.usage.system)}%` : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Details */}
              <div className="group/mem relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover/mem:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Memory</span>
                    <MemoryStick className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    {systemData ? `${Math.round(systemData.memory.percentage)}%` : "-"}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Used</span>
                      <span className="text-white/80 font-mono">
                        {systemData ? formatBytes(systemData.memory.used) : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/60">Free</span>
                      <span className="text-white/80 font-mono">
                        {systemData ? formatBytes(systemData.memory.free) : "-"}
                      </span>
                    </div>
                  </div>
                  {/* Memory Usage Bar */}
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${systemData ? Math.min(100, systemData.memory.percentage) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="group/info relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 group-hover/info:opacity-100 transition-opacity duration-500" />
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Uptime</span>
                  </div>
                  <div className="text-lg font-bold text-white/90">
                    {systemData ? formatUptime(systemData.system.uptime) : "-"}
                  </div>
                  <div className="text-xs text-white/60">
                    {systemData?.system.platform} {systemData?.system.release}
                  </div>
                </div>
              </div>

              {/* Process Info */}
              {systemData?.process && (
                <div className="group/process relative overflow-hidden rounded-xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 p-4 hover:border-white/20 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5 opacity-0 group-hover/process:opacity-100 transition-opacity duration-500" />
                  <div className="relative space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/50">Node.js Process</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">PID</span>
                        <span className="text-white/80 font-mono">{systemData.process.pid}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Version</span>
                        <span className="text-white/80 font-mono">{systemData.process.version}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Heap Used</span>
                        <span className="text-white/80 font-mono">
                          {formatBytes(systemData.process.memory.heapUsed)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">Process Uptime</span>
                        <span className="text-white/80 font-mono">
                          {formatUptime(systemData.process.uptime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}