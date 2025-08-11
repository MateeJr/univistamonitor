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
};
