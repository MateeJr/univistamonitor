// Centralized server configuration for web frontend
// Adjust host/port here to point the app to the correct backend

// Keep absolute base for server-side internal use (Next API routes, etc.)
export const SERVER_HOST = process.env.NEXT_PUBLIC_SERVER_HOST || "192.168.18.4";
export const SERVER_PORT = process.env.NEXT_PUBLIC_SERVER_PORT || "4000";
export const SERVER_BASE = `http://${SERVER_HOST}:${SERVER_PORT}`;

// When deployed on Vercel (HTTPS) browsers cannot call http:// targets directly.
// Enable a proxy mode so the frontend uses relative URLs that are rewritten by Next.js.
// Heuristics: opt-in via NEXT_PUBLIC_USE_PROXY=1, or when on Vercel, or when window is https:
const USE_PROXY =
  (typeof window !== "undefined" && typeof window.location !== "undefined" && window.location.protocol === "https:") ||
  process.env.NEXT_PUBLIC_USE_PROXY === "1" ||
  process.env.VERCEL === "1";

// Base for public endpoints used by the browser
const PUBLIC_BASE = USE_PROXY ? "" : SERVER_BASE;

export const ENDPOINTS = {
  // frontend-scoped endpoints
  login: `${PUBLIC_BASE}/frontend/auth/login`,
  logout: `${PUBLIC_BASE}/frontend/auth/logout`,
  accounts: `${PUBLIC_BASE}/frontend/auth/accounts`,
  logininfo: `${PUBLIC_BASE}/frontend/api/logininfo`,
  // shared endpoints
  health: `${PUBLIC_BASE}/health`,
  time: `${PUBLIC_BASE}/api/time`,
  // system monitoring endpoints
  systemCpu: `${PUBLIC_BASE}/api/system/cpu`,
  systemMemory: `${PUBLIC_BASE}/api/system/memory`,
  systemNetwork: `${PUBLIC_BASE}/api/system/network`,
  systemInfo: `${PUBLIC_BASE}/api/system/info`,
  systemProcess: `${PUBLIC_BASE}/api/system/process`,
  networkSpeed: `${PUBLIC_BASE}/api/network/speed`,
  networkPing: `${PUBLIC_BASE}/api/network/ping`,
  systemStatus: `${PUBLIC_BASE}/api/system/status`,
  // laporan endpoints
  laporanSubmit: `${PUBLIC_BASE}/api/laporan/submit`,
  laporanList: `${PUBLIC_BASE}/api/laporan/list`,
  laporanDetailBase: `${PUBLIC_BASE}/api/laporan/detail`, // use: `${laporanDetailBase}/${jenis}/${id}`
  laporanDeleteBase: `${PUBLIC_BASE}/api/laporan`, // use: `${laporanDeleteBase}/${jenis}/${id}` (DELETE)
  filesBase: `${PUBLIC_BASE}`, // prefix for file URLs returned by server (e.g. /files/laporan/...)
  // workers endpoints
  workersList: `${PUBLIC_BASE}/api/workers`, // GET
  workersCreate: `${PUBLIC_BASE}/api/workers`, // POST
  workersDetailBase: `${PUBLIC_BASE}/api/workers`, // use: `${workersDetailBase}/${id}`
  workersDeleteBase: `${PUBLIC_BASE}/api/workers`, // use: `${workersDeleteBase}/${id}` (DELETE)
  workersStatusList: `${PUBLIC_BASE}/api/workers/statuslist`, // GET/POST/DELETE
  // stock sparepart endpoints
  stockList: `${PUBLIC_BASE}/api/stock`, // GET
  stockCreate: `${PUBLIC_BASE}/api/stock`, // POST
  stockFilesBase: `${PUBLIC_BASE}/files/stock`,
};
