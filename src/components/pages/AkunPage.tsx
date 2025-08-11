"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, LogOut, User, Users, Shield, Clock, Search, RefreshCw, Loader2, Trash2 } from "lucide-react";
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
    return adminAccounts.filter((it) => (!onlineOnly || it.online) && (!q || it.adminName?.toLowerCase().includes(q) || it.name?.toLowerCase().includes(q)));
  }, [adminAccounts, onlineOnly, search]);
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
        body: JSON.stringify({ name: profile.loginId, status: "logout", clientId: clientIdRef.current || getClientId() }),
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
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] md:text-[16px] font-semibold tracking-tight text-white/95">{title}</h2>
          {typeof count === "number" && (
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-zinc-300">
              {count}
            </span>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            aria-label="Refresh daftar"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${listsLoading ? "animate-spin" : ""}`} />
            <span className="hidden md:inline">Refresh</span>
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
        ? "bg-emerald-500/15 border-emerald-500/20 text-emerald-300"
        : tone === "cyan"
        ? "bg-cyan-500/15 border-cyan-500/20 text-cyan-300"
        : "bg-white/5 border-white/10 text-zinc-300";
    return (
      <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#0b0b0c,#0a0a0a)]">
        <div className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(200px_100px_at_0%_0%,black,transparent)]" />
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-zinc-400">{title}</div>
              <div className="mt-1 text-[22px] font-semibold text-white">{value}</div>
              {hint ? <div className="mt-1 text-xs text-zinc-500">{hint}</div> : null}
            </div>
            <div className={`grid h-9 w-9 place-items-center rounded-full border ${toneClass}`}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    );
  };

const AdminList: React.FC = () => (
  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#0b0b0c,#0a0a0a)] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:h-full md:min-h-0 flex flex-col">
    <PanelHeader title="List Akun Admin" onRefresh={loadLists} count={filteredAdminAccounts.length} />
    <div className="mt-3 h-px w-full bg-white/10" />
    <div className="mt-3 md:flex-1 md:overflow-auto" aria-live="polite" aria-busy={listsLoading}>
      {listsError ? (
        <p className="text-sm text-rose-400">{listsError}</p>
      ) : (
        <>
          {listsLoading && filteredAdminAccounts.length === 0 ? (
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={`s-a-${i}`} className="animate-pulse rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-16 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filteredAdminAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Tidak ada data yang cocok.</p>
          ) : (
            <ul className="space-y-2">
              {filteredAdminAccounts.map((it, idx) => (
                <li
                  key={`${it.clientId || it.name || "admin"}-${idx}`}
                  className={`group flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06] ${it.online ? "ring-1 ring-inset ring-emerald-500/20" : "ring-1 ring-inset ring-rose-500/20"}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white/95">{it.adminName || "-"}</span>
                      <span className="truncate text-xs text-zinc-400">({it.name || ""})</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-400">
                      <span className="text-zinc-500">Status:</span>
                      <span className={`ml-1 font-medium ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>{it.status || "-"}</span>
                      <span className="mx-2">•</span>
                      <span className="text-zinc-500">Masuk:</span> <span>{formatDate(it.signedInAt)}</span>
                      {it.lastSeenAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-zinc-500">Aktif:</span> <span>{formatDate(it.lastSeenAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <StatusDot online={!!it.online} />
                    <span className="text-xs text-zinc-400">{it.online ? "Online" : "Offline"}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  </div>
);

const UserList: React.FC = () => (
  <div className="rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#0b0b0c,#0a0a0a)] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] md:h-full md:min-h-0 flex flex-col">
    <PanelHeader title="List Akun User" onRefresh={loadLists} count={filteredUserAccounts.length} />
    <div className="mt-3 h-px w-full bg-white/10" />
    <div className="mt-3 md:flex-1 md:overflow-auto" aria-live="polite" aria-busy={listsLoading}>
      {listsError ? (
        <p className="text-sm text-rose-400">{listsError}</p>
      ) : (
        <>
          {listsLoading && filteredUserAccounts.length === 0 ? (
            <ul className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={`s-u-${i}`} className="animate-pulse rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                  <div className="h-4 w-32 rounded bg-white/10" />
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-3 w-16 rounded bg-white/10" />
                    <div className="h-3 w-24 rounded bg-white/10" />
                    <div className="h-3 w-20 rounded bg-white/10" />
                  </div>
                </li>
              ))}
            </ul>
          ) : filteredUserAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Tidak ada data yang cocok.</p>
          ) : (
            <ul className="space-y-2">
              {filteredUserAccounts.map((it, idx) => (
                <li
                  key={`${it.name || "user"}-${idx}`}
                  className={`group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-colors hover:bg-white/[0.06] ${it.online ? "ring-1 ring-inset ring-emerald-500/20" : "ring-1 ring-inset ring-rose-500/20"}`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white/95">{it.name || "-"}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-400">
                      <span className="text-zinc-500">Status:</span>
                      <span className={`ml-1 font-medium ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>{it.status || "-"}</span>
                      <span className="mx-2">•</span>
                      <span className="text-zinc-500">Masuk:</span> <span>{formatDate(it.signedInAt)}</span>
                      {it.lastSeenAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-zinc-500">Aktif:</span> <span>{formatDate(it.lastSeenAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    <StatusDot online={!!it.online} />
                    <span className="text-xs text-zinc-400">{it.online ? "Online" : "Offline"}</span>
                    <button
                      type="button"
                      onClick={() => setDeleteCandidate(it.name || "")}
                      disabled={deleting}
                      aria-disabled={deleting}
                      className="ml-2 inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-200 transition-colors hover:bg-white/[0.1] disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Hapus ${it.name}`}
                      title="Hapus akun"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  </div>
);

return (
  <section aria-labelledby="akun-heading" className="relative w-full px-4 py-6 overflow-hidden">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 translate-x-1/3 translate-y-1/3 rounded-full bg-emerald-500/10 blur-3xl" />
    </div>
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 id="akun-heading" className="text-xl md:text-2xl font-semibold tracking-tight text-white">Akun</h1>
          <p className="text-sm text-zinc-400">Kelola sesi admin dan pantau akun aktif.</p>
        </div>
        {profile && (
          <span className="inline-flex items-center gap-2 self-start rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 md:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {adminOnline + userOnline} online
          </span>
        )}
      </div>

      {profile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard title="Admin Online" value={adminOnline} icon={<Shield className="h-4 w-4" />} tone="cyan" />
          <StatCard title="User Online" value={userOnline} icon={<Users className="h-4 w-4" />} tone="emerald" />
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
          <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              aria-label="Cari akun"
              className="w-full md:w-64 bg-transparent text-sm text-zinc-200 placeholder-zinc-500 outline-none"
              placeholder="Cari nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              role="switch"
              aria-checked={onlineOnly}
              onClick={() => setOnlineOnly((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${onlineOnly ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.07]"}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${onlineOnly ? "bg-emerald-400" : "bg-zinc-500"}`} />
              Online saja
            </button>
            <button
              type="button"
              onClick={loadLists}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-200 transition-colors hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            >
              <RefreshCw className={`h-4 w-4 ${listsLoading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div className="md:col-span-1 flex items-start justify-center">
          {!profile ? (
            <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#0b0b0c,#0a0a0a)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (canSubmit) handleLogin();
                }}
              >
                <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight text-white/95">Masuk</h2>
                <p className="mt-1.5 text-[13px] text-zinc-400">Univista Monitoring ~ Masuk untuk melanjutkan.</p>

                <div className="mt-4">
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-400">ID Login</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="ID Login"
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                      onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-400">Nama Admin</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Nama Admin"
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] pl-10 pr-3 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-[11px] uppercase tracking-wide text-zinc-400">Kata Sandi</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Kata Sandi khusus Admin"
                      className="h-11 w-full rounded-md border border-white/10 bg-white/[0.03] px-3 pr-10 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/20 focus:ring-2 focus:ring-white/10 transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && canSubmit) handleLogin(); }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-2.5 rounded-md p-1.5 text-zinc-400 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`mt-5 flex h-11 w-full items-center justify-center rounded-lg border transition ${
                    canSubmit
                      ? "border-white/10 bg-white text-black hover:bg-white/90"
                      : "cursor-not-allowed opacity-60 border-white/10 bg-white/60 text-black"
                  }`}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
                  <span className="text-[15px] font-semibold">{loading ? "Sedang masuk..." : "Masuk"}</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(to_bottom,#0b0b0c,#0a0a0a)] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
              <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              <h2 className="text-[20px] md:text-[22px] font-semibold tracking-tight text-white/95">Profil</h2>
              <div className="my-3 h-px w-full bg-white/10" />
              <div className="flex items-center gap-3 py-1.5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-rose-500/30 to-amber-500/30 text-white text-sm font-semibold">
                  {(profile.adminName?.[0] || "A").toUpperCase()}
                </div>
                <div className="text-xs text-zinc-400">Administrator</div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-400">Nama Admin</span>
                <span className="text-sm font-semibold text-white/95">{profile.adminName}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-400">ID Login</span>
                <span className="text-sm font-semibold text-white/95">{profile.loginId}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-400">Terakhir Masuk</span>
                <span className="text-sm font-semibold text-white/95">{formatDate(profile.signedInAt)}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-rose-900/60 bg-rose-900/40 text-white transition hover:bg-rose-900/60"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="text-[15px] font-semibold">{loading ? "Sedang keluar..." : "Keluar"}</span>
              </button>
            </div>
          )}
        </div>

        {profile && (
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 md:h-full md:min-h-0">
            <AdminList />
            <UserList />
          </div>
        )}
      </div>

      <WrongPassModal
        visible={wrongVisible}
        message={wrongMessage}
        onClose={() => setWrongVisible(false)}
      />
      <ConfirmDeleteModal
        visible={!!deleteCandidate}
        title="Hapus Akun User?"
        description={`Apakah Anda yakin ingin menghapus \"${deleteCandidate || ""}\" dari daftar?`}
        confirmLabel={deleting ? "Menghapus..." : "Hapus"}
        onConfirm={() => deleteCandidate && deleteUser(deleteCandidate)}
        onClose={() => !deleting && setDeleteCandidate(null)}
      />
    </div>
  </section>
);
}
