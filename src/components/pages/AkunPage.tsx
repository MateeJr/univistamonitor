"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, LogOut, User, Users, Shield, Clock, Search, RefreshCw, Loader2, Trash2, UserCheck } from "lucide-react";
import { ENDPOINTS, SERVER_BASE } from "@/components/config/server";
import WrongPassModal from "@/components/modals/WrongPassModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";

type Profile = {
  loginId: string;
  adminName: string;
  signedInAt: string;
};

type AdminAcc = {
  name: string;
  adminName?: string;
  clientId?: string;
  signedInAt?: string;
  status?: string;
  online?: boolean;
  lastSeenAt?: string;
};

type UserAcc = {
  name: string;
  signedInAt?: string;
  status?: string;
  online?: boolean;
  lastSeenAt?: string;
};

function formatDate(s?: string) {
  if (!s) return "-";
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return s;
  const [, y, mo, d, hh, mm] = m;
  const MON = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthAbbr = MON[Math.max(0, Math.min(11, parseInt(mo, 10) - 1))];
  const h24 = parseInt(hh, 10);
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 % 12) || 12).toString().padStart(2, "0");
  const day = d.padStart(2, "0");
  const minute = mm.padStart(2, "0");
  return `${day}/${monthAbbr}/${y} - ${h12}:${minute} ${ampm}`;
}

function formatTime(d?: Date | null) {
  if (!d) return "-";
  try {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "-";
  }
}

export default function AkunPage() {
  const [loginId, setLoginId] = useState("UNIVISTA");
  const [adminName, setAdminName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wrongVisible, setWrongVisible] = useState(false);
  const [wrongMessage, setWrongMessage] = useState<string | undefined>(undefined);

  const STORAGE_KEY = "@akun/profile";
  const TOKEN_COOKIE = "uv_token";
  const clientIdRef = useRef<string | null>(null);

  const CLIENT_ID_KEY = "@akun/client-id";
  const getClientId = (): string => {
    try {
      let id: string = localStorage.getItem(CLIENT_ID_KEY) || "";
      if (!id) {
        // Prefer crypto.randomUUID when available
        const hasCrypto = typeof crypto !== "undefined" && (crypto as any).randomUUID;
        id = hasCrypto ? (crypto as any).randomUUID() : `web-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        localStorage.setItem(CLIENT_ID_KEY, id);
      }
      return id;
    } catch {
      return `web-${Date.now().toString(36)}`;
    }
  };

  const canSubmit = useMemo(
    () => loginId.trim().length > 0 && adminName.trim().length > 0 && password.length > 0 && !loading,
    [loginId, adminName, password, loading]
  );

  // Cookie helpers
  const setCookie = (k: string, v: string, maxAgeSec: number) => {
    try {
      document.cookie = `${k}=${v}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
    } catch {}
  };
  const getCookie = (k: string) => {
    try {
      return document.cookie
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith(`${k}=`))
        ?.split("=")[1];
    } catch {
      return undefined;
    }
  };
  const deleteCookie = (k: string) => {
    try {
      document.cookie = `${k}=; Max-Age=0; Path=/; SameSite=Lax`;
    } catch {}
  };

  // Presence is now handled globally by PresenceManager

  // ----- Accounts list (right-side panels) -----
  const [adminAccounts, setAdminAccounts] = useState<AdminAcc[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAcc[]>([]);
  const [listsLoading, setListsLoading] = useState<boolean>(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const adminOnline = useMemo(() => adminAccounts.filter((a) => !!a.online).length, [adminAccounts]);
  const userOnline = useMemo(() => userAccounts.filter((u) => !!u.online).length, [userAccounts]);

  const filteredAdminAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const currentClientId = clientIdRef.current || getClientId();
    const filtered = adminAccounts.filter((it) => (!onlineOnly || it.online) && (!q || it.adminName?.toLowerCase().includes(q) || it.name?.toLowerCase().includes(q)));
    
    // Sort to put current user's account at the top, then by online status, then by recent activity
    return filtered.sort((a, b) => {
      const aIsCurrent = a.clientId === currentClientId && a.name === profile?.loginId && a.adminName === profile?.adminName;
      const bIsCurrent = b.clientId === currentClientId && b.name === profile?.loginId && b.adminName === profile?.adminName;
      
      // Priority 1: Current user's account always at top
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      
      // Priority 2: Online accounts before offline
      if (a.online !== b.online) return b.online ? 1 : -1;
      
      // Priority 3: Most recently signed in
      const aTime = new Date(a.signedInAt || 0).getTime();
      const bTime = new Date(b.signedInAt || 0).getTime();
      return bTime - aTime;
    });
  }, [adminAccounts, onlineOnly, search, profile]);
  const filteredUserAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return userAccounts.filter((it) => (!onlineOnly || it.online) && (!q || it.name?.toLowerCase().includes(q)));
  }, [userAccounts, onlineOnly, search]);

  // Use same-origin API routes to avoid CORS and allow local fallback
  const ADMIN_URL = `/api/accounts/admin`;
  const USER_URL = `/api/accounts/user`;

  // One-time URL log for quick diagnosis
  useEffect(() => {
    try {
      console.log("[AkunPage] SERVER_BASE:", SERVER_BASE);
      console.log("[AkunPage] ADMIN_URL:", ADMIN_URL);
      console.log("[AkunPage] USER_URL:", USER_URL);
    } catch {}
  }, []);

  const loadLists = async () => {
    setListsError(null);
    setListsLoading(true);
    console.groupCollapsed(`[AkunPage] loadLists @ ${new Date().toISOString()}`);
    console.time("[AkunPage] loadLists");
    try {
      console.log("[AkunPage] fetching...", { ADMIN_URL, USER_URL });
      const [aRes, uRes] = await Promise.all([
        fetch(ADMIN_URL, { cache: "no-store" }).catch((err) => {
          console.error("[AkunPage] admin fetch failed", err);
          throw err;
        }),
        fetch(USER_URL, { cache: "no-store" }).catch((err) => {
          console.error("[AkunPage] user fetch failed", err);
          throw err;
        }),
      ]);
      console.log("[AkunPage] responses:", {
        admin: { ok: aRes.ok, status: aRes.status, url: aRes.url },
        user: { ok: uRes.ok, status: uRes.status, url: uRes.url },
      });
      if (!aRes.ok || !uRes.ok) {
        const detail = `HTTP admin=${aRes.status} user=${uRes.status}`;
        console.error("[AkunPage] non-OK responses", detail);
        throw new Error(detail);
      }

      const [aJson, uJson] = await Promise.all([
        aRes
          .json()
          .then((j) => j)
          .catch((err) => {
            console.error("[AkunPage] failed parsing admin JSON", err);
            return [] as AdminAcc[];
          }),
        uRes
          .json()
          .then((j) => j)
          .catch((err) => {
            console.error("[AkunPage] failed parsing user JSON", err);
            return [] as UserAcc[];
          }),
      ]);

      const admins: AdminAcc[] = Array.isArray(aJson) ? (aJson as AdminAcc[]) : [];
      const users: UserAcc[] = Array.isArray(uJson) ? (uJson as UserAcc[]) : [];
      console.log("[AkunPage] parsed:", { adminCount: admins.length, userCount: users.length });
      if (!Array.isArray(aJson)) console.warn("[AkunPage] admin JSON is not an array", aJson);
      if (!Array.isArray(uJson)) console.warn("[AkunPage] user JSON is not an array", uJson);

      setAdminAccounts(admins);
      setUserAccounts(users);
      setLastRefreshedAt(new Date());
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.error("[AkunPage] loadLists error:", msg, e);
      setListsError("Gagal memuat daftar akun. Coba refresh kembali.");
    } finally {
      setListsLoading(false);
      console.timeEnd("[AkunPage] loadLists");
      console.groupEnd();
    }
  };

  const deleteUser = async (name: string) => {
    setDeleting(true);
    try {
      const res = await fetch(USER_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Gagal menghapus akun");
      }
      // optimistic refresh
      await loadLists();
    } catch (e) {
      console.error("[AkunPage] deleteUser failed", e);
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
    }
  };

  useEffect(() => {
    if (!profile) return;
    loadLists();
    const id = setInterval(loadLists, 60000); // refresh every 60s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleLogin = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: loginId.trim(), adminName: adminName.trim(), password, status: "login", clientId: clientIdRef.current || getClientId() }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        if (res.status === 401 || data?.error === "Invalid credentials") {
          setWrongMessage("Kata sandi admin tidak sesuai. Silakan coba lagi.");
          setWrongVisible(true);
          setPassword("");
          return;
        }
        throw new Error(data?.error || "Login failed");
      }

      // Get Jakarta time for consistent signed-in timestamp
      const tRes = await fetch(ENDPOINTS.time);
      const tData = await tRes.json();
      const iso = tData?.iso || new Date().toISOString();

      // Persist profile and token
      const token: string | undefined = data?.token;
      if (token) setCookie(TOKEN_COOKIE, token, 7 * 24 * 60 * 60);
      const prof: Profile = { loginId: loginId.trim(), adminName: adminName.trim(), signedInAt: iso };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prof)); } catch {}
      setProfile(prof);
      try {
        window.dispatchEvent(new CustomEvent("uv:profile-changed", { detail: { profile: prof, action: "login" } }));
      } catch {}
    } catch (err: any) {
      setWrongMessage(err?.message || "Tidak dapat masuk. Coba lagi.");
      setWrongVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      await fetch(ENDPOINTS.logout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.loginId, adminName: profile.adminName, status: "logout", clientId: clientIdRef.current || getClientId() }),
      });
    } catch {}
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    deleteCookie(TOKEN_COOKIE);
    setProfile(null);
    setAdminAccounts([]);
    setUserAccounts([]);
    try {
      window.dispatchEvent(new CustomEvent("uv:profile-changed", { detail: { profile: null, action: "logout" } }));
    } catch {}
    setLoginId("UNIVISTA");
    setAdminName("");
    setPassword("");
    setLoading(false);
  };

  // Restore persisted profile for UI only (presence handled globally)
  useEffect(() => {
    try {
      clientIdRef.current = getClientId();
      const raw = localStorage.getItem(STORAGE_KEY);
      const token = getCookie(TOKEN_COOKIE);
      if (raw && token) {
        const parsedAny = JSON.parse(raw) as any;
        let parsed: Profile | null = null;
        if (parsedAny && typeof parsedAny === "object") {
          if (parsedAny.loginId && parsedAny.adminName) {
            parsed = parsedAny as Profile;
          } else if (parsedAny.name) {
            // migrate older schema where 'name' was used
            parsed = { loginId: "UNIVISTA", adminName: String(parsedAny.name), signedInAt: parsedAny.signedInAt || new Date().toISOString() };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
          }
        }
        if (parsed) {
          setProfile(parsed);
        }
      }
    } catch {}
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const StatusDot: React.FC<{ online?: boolean }> = ({ online }) => (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-500" : "bg-rose-500"}`}
      title={online ? "Online" : "Offline"}
    />
  );

  const PanelHeader: React.FC<{ title: string; onRefresh?: () => void; count?: number }>
    = ({ title, onRefresh, count }) => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {typeof count === "number" && (
            <span className="inline-flex items-center rounded-full border border-zinc-700/50 bg-zinc-800/50 px-2.5 py-1 text-xs font-medium text-zinc-300">
              {count}
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700/50"
            aria-label="Refresh daftar"
          >
            <RefreshCw className={`h-4 w-4 ${listsLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}
      </div>
    );

  const StatCard: React.FC<{
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    hint?: string;
    tone?: "emerald" | "cyan" | "zinc";
  }> = ({ title, value, icon, hint, tone = "zinc" }) => {
    const toneClass =
      tone === "emerald"
        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        : tone === "cyan"
        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-300";
    return (
      <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-4 transition-colors hover:bg-zinc-800/30">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-400 font-medium">{title}</div>
            <div className="mt-2 text-2xl font-bold text-white">{value}</div>
            {hint && <div className="mt-1 text-xs text-zinc-500">{hint}</div>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${toneClass}`}>
            {icon}
          </div>
        </div>
      </div>
    );
  };

const AdminList: React.FC = () => {
  const currentClientId = clientIdRef.current || getClientId();
  
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-4 h-full flex flex-col">
      <PanelHeader title="Akun Admin" onRefresh={loadLists} count={filteredAdminAccounts.length} />
      <div className="mt-3 h-px w-full bg-zinc-800/50" />
      <div className="mt-4 overflow-y-auto max-h-80 md:max-h-96 uv-scrollbar uv-scrollbar--thin overscroll-contain" aria-live="polite" aria-busy={listsLoading}>
        {listsError ? (
          <p className="text-sm text-rose-400">{listsError}</p>
        ) : (
          <>
            {listsLoading && filteredAdminAccounts.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`s-a-${i}`} className="animate-pulse rounded-lg border border-zinc-800/50 bg-zinc-800/30 p-3">
                    <div className="h-4 w-32 rounded bg-zinc-700/50" />
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-3 w-16 rounded bg-zinc-700/50" />
                      <div className="h-3 w-24 rounded bg-zinc-700/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAdminAccounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Shield className="h-12 w-12 text-zinc-600 mb-2" />
                <p className="text-sm text-zinc-400">Tidak ada akun admin ditemukan</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAdminAccounts.map((it, idx) => {
                  const isCurrentUser = it.clientId === currentClientId;
                  
                  return (
                    <div
                      key={`${it.clientId || it.name || "admin"}-${idx}`}
                      className={`group rounded-lg border p-3 transition-all duration-200 hover:bg-zinc-800/40 ${
                        it.online 
                          ? "border-emerald-500/30 bg-emerald-500/5" 
                          : "border-zinc-800/50 bg-zinc-800/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-white">{it.adminName || "-"}</span>
                            {isCurrentUser && (
                              <span className="inline-flex items-center rounded-full bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 text-xs font-medium text-yellow-400">
                                Anda
                              </span>
                            )}
                            <span className="truncate text-xs text-zinc-500">({it.name || ""})</span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-400">
                            <span className={`inline-flex items-center gap-1 ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>
                              <StatusDot online={!!it.online} />
                              {it.status || "-"}
                            </span>
                            <span className="mx-2 text-zinc-600">•</span>
                            <span>{formatDate(it.signedInAt)}</span>
                            {it.lastSeenAt && (
                              <>
                                <span className="mx-2 text-zinc-600">•</span>
                                <span>Terakhir: {formatDate(it.lastSeenAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs font-medium ${it.online ? "text-emerald-400" : "text-zinc-400"}`}>
                            {it.online ? "Online" : "Offline"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const UserList: React.FC = () => (
  <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-4 h-full flex flex-col">
    <PanelHeader title="Akun Pengguna" onRefresh={loadLists} count={filteredUserAccounts.length} />
    <div className="mt-3 h-px w-full bg-zinc-800/50" />
    <div className="mt-4 overflow-y-auto max-h-80 md:max-h-96 uv-scrollbar uv-scrollbar--thin overscroll-contain" aria-live="polite" aria-busy={listsLoading}>
      {listsError ? (
        <p className="text-sm text-rose-400">{listsError}</p>
      ) : (
        <>
          {listsLoading && filteredUserAccounts.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`s-u-${i}`} className="animate-pulse rounded-lg border border-zinc-800/50 bg-zinc-800/30 p-3">
                  <div className="h-4 w-32 rounded bg-zinc-700/50" />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-16 rounded bg-zinc-700/50" />
                    <div className="h-3 w-24 rounded bg-zinc-700/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUserAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-zinc-600 mb-2" />
              <p className="text-sm text-zinc-400">Tidak ada akun pengguna ditemukan</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUserAccounts.map((it, idx) => (
                <div
                  key={`${it.name || "user"}-${idx}`}
                  className={`group rounded-lg border p-3 transition-all duration-200 hover:bg-zinc-800/40 ${
                    it.online 
                      ? "border-emerald-500/30 bg-emerald-500/5" 
                      : "border-zinc-800/50 bg-zinc-800/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-white">{it.name || "-"}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-400">
                        <span className={`inline-flex items-center gap-1 ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>
                          <StatusDot online={!!it.online} />
                          {it.status || "-"}
                        </span>
                        <span className="mx-2 text-zinc-600">•</span>
                        <span>{formatDate(it.signedInAt)}</span>
                        {it.lastSeenAt && (
                          <>
                            <span className="mx-2 text-zinc-600">•</span>
                            <span>Terakhir: {formatDate(it.lastSeenAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${it.online ? "text-emerald-400" : "text-zinc-400"}`}>
                        {it.online ? "Online" : "Offline"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteCandidate(it.name || "")}
                        disabled={deleting}
                        aria-disabled={deleting}
                        className="rounded-md border border-zinc-700/50 bg-zinc-800/50 px-2 py-1 text-zinc-300 transition-colors hover:bg-red-900/20 hover:border-red-700/50 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label={`Hapus ${it.name}`}
                        title="Hapus akun"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

return (
  <div className="bg-zinc-950 p-4 md:p-6 min-h-full">
    <div className="mx-auto max-w-7xl space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Akun</h1>
          <p className="text-sm text-zinc-400 mt-1">Kelola sesi admin dan pantau akun aktif</p>
        </div>
        {profile && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">
              {adminOnline + userOnline} pengguna online
            </span>
          </div>
        )}
      </div>

      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard title="Admin Online" value={adminOnline} icon={<Shield className="h-4 w-4" />} tone="cyan" />
          <StatCard title="Pengguna Online" value={userOnline} icon={<Users className="h-4 w-4" />} tone="emerald" />
          <StatCard
            title="Total Online"
            value={adminOnline + userOnline}
            icon={<Clock className="h-4 w-4" />}
            hint={lastRefreshedAt ? `Diperbarui ${formatTime(lastRefreshedAt)}` : undefined}
            tone="zinc"
          />
        </div>
      )}

      {profile && (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              aria-label="Cari akun"
              className="w-full md:w-80 rounded-lg border border-zinc-800/50 bg-zinc-900/50 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 backdrop-blur-sm outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-900/80"
              placeholder="Cari berdasarkan nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={onlineOnly}
              onClick={() => setOnlineOnly((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                onlineOnly 
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" 
                  : "border-zinc-800/50 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${onlineOnly ? "bg-emerald-400" : "bg-zinc-500"}`} />
              Hanya online
            </button>
            <button
              type="button"
              onClick={loadLists}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-colors hover:bg-zinc-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <RefreshCw className={`h-4 w-4 ${listsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      )}

      {!profile ? (
        <div className="flex justify-center">
          <div className="w-full max-w-md rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">Login Admin</h2>
              <p className="text-sm text-zinc-400 mt-1">Akses dashboard monitoring</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (canSubmit) handleLogin();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  ID Login
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Masukkan ID login"
                    className="w-full rounded-lg border border-zinc-800/50 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-900"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  Nama Admin
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Masukkan nama admin"
                    className="w-full rounded-lg border border-zinc-800/50 bg-zinc-900/80 pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-900"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-2">
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi admin"
                    className="w-full rounded-lg border border-zinc-800/50 bg-zinc-900/80 pl-4 pr-12 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-zinc-900"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 px-4 text-sm font-medium transition-all ${
                  canSubmit
                    ? "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    : "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? "Sedang masuk..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <div className="w-full max-w-md mx-auto rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm p-6">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white">Profil Admin</h2>
                <p className="text-sm text-zinc-400 mt-1">Saat ini masuk</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-lg">
                    {(profile.adminName?.[0] || "A").toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{profile.adminName}</div>
                    <div className="text-xs text-zinc-400">Administrator</div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-zinc-400">ID Login</span>
                    <span className="text-sm font-medium text-white">{profile.loginId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-zinc-400">Login Terakhir</span>
                    <span className="text-sm font-medium text-white">{formatDate(profile.signedInAt)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-red-700/50 bg-red-900/20 py-2.5 px-4 text-sm font-medium text-red-300 transition-colors hover:bg-red-900/30 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {loading ? "Sedang keluar..." : "Keluar"}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[400px]">
            <AdminList />
            <UserList />
          </div>
        </div>
      )}

      <WrongPassModal
        visible={wrongVisible}
        message={wrongMessage}
        onClose={() => setWrongVisible(false)}
      />
      <ConfirmDeleteModal
        visible={!!deleteCandidate}
        title="Hapus Akun Pengguna?"
        description={`Apakah Anda yakin ingin menghapus "${deleteCandidate || ""}" dari daftar?`}
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        onConfirm={() => deleteCandidate && deleteUser(deleteCandidate)}
        onClose={() => !deleting && setDeleteCandidate(null)}
      />
    </div>
  </div>
);
}
