// Centralized server configuration for web frontend
// Adjust host/port here to point the app to the correct backend

export const SERVER_HOST = "192.168.18.4";
export const SERVER_PORT = 4000;
export const SERVER_BASE = `http://${SERVER_HOST}:${SERVER_PORT}`;

export const ENDPOINTS = {
  // frontend-scoped endpoints
  login: `${SERVER_BASE}/frontend/auth/login`,
  logout: `${SERVER_BASE}/frontend/auth/logout`,
  accounts: `${SERVER_BASE}/frontend/auth/accounts`,
  logininfo: `${SERVER_BASE}/frontend/api/logininfo`,
  // shared endpoints
  health: `${SERVER_BASE}/health`,
  time: `${SERVER_BASE}/api/time`,
  // system monitoring endpoints
  systemCpu: `${SERVER_BASE}/api/system/cpu`,
  systemMemory: `${SERVER_BASE}/api/system/memory`,
  systemNetwork: `${SERVER_BASE}/api/system/network`,
  systemInfo: `${SERVER_BASE}/api/system/info`,
  systemProcess: `${SERVER_BASE}/api/system/process`,
  networkSpeed: `${SERVER_BASE}/api/network/speed`,
  networkPing: `${SERVER_BASE}/api/network/ping`,
  systemStatus: `${SERVER_BASE}/api/system/status`,
  // laporan endpoints
  laporanSubmit: `${SERVER_BASE}/api/laporan/submit`,
  laporanList: `${SERVER_BASE}/api/laporan/list`,
  laporanDetailBase: `${SERVER_BASE}/api/laporan/detail`, // use: `${laporanDetailBase}/${jenis}/${id}`
  laporanDeleteBase: `${SERVER_BASE}/api/laporan`, // use: `${laporanDeleteBase}/${jenis}/${id}` (DELETE)
  filesBase: `${SERVER_BASE}`, // prefix for file URLs returned by server (e.g. /files/laporan/...)
  // workers endpoints
  workersList: `${SERVER_BASE}/api/workers`, // GET
  workersCreate: `${SERVER_BASE}/api/workers`, // POST
  workersDetailBase: `${SERVER_BASE}/api/workers`, // use: `${workersDetailBase}/${id}`
  workersDeleteBase: `${SERVER_BASE}/api/workers`, // use: `${workersDeleteBase}/${id}` (DELETE)
  workersStatusList: `${SERVER_BASE}/api/workers/statuslist`, // GET/POST/DELETE
  // stock sparepart endpoints
  stockList: `${SERVER_BASE}/api/stock`, // GET
  stockCreate: `${SERVER_BASE}/api/stock`, // POST
  stockFilesBase: `${SERVER_BASE}/files/stock`,
};
