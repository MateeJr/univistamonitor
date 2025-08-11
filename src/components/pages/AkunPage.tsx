"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, LogOut, User, RefreshCw } from "lucide-react";
import { ENDPOINTS, SERVER_BASE } from "@/components/config/server";
import WrongPassModal from "@/components/modals/WrongPassModal";

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
          <h2 className="text-[16px] font-semibold text-[#fafafa]">{title}</h2>
          {typeof count === "number" && (
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-zinc-400">{count}</span>
          )}
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-md border border-[#27272a] bg-[#0f0f10] px-2 py-1 text-xs text-zinc-300 hover:bg-white/5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${listsLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        )}
      </div>
    );

const AdminList: React.FC = () => (
  <div className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 ring-1 ring-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.25),0_8px_24px_rgba(0,0,0,0.45)] md:h-full md:min-h-0 flex flex-col">
    <PanelHeader title="List Akun Admin" onRefresh={loadLists} count={adminAccounts.length} />
    <div className="mt-3 h-px w-full bg-[#1f1f1f]" />
    <div className="mt-3 md:flex-1 md:overflow-auto">
      {listsError ? (
        <p className="text-sm text-rose-400">{listsError}</p>
      ) : (
        <>
          {listsLoading && adminAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Memuat...</p>
          ) : adminAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Tidak ada data.</p>
          ) : (
            <ul className="space-y-2">
              {adminAccounts.map((it, idx) => (
                <li
                  key={`${it.clientId || it.name || "admin"}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-[#27272a] bg-[#0f0f10] px-3 py-2 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#e5e7eb]">{it.adminName || "-"}</span>
                      <span className="truncate text-xs text-zinc-400">({it.name || ""})</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-400">
                      <span>Status: </span>
                      <span className={`font-medium ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>{it.status || "-"}</span>
                      <span className="mx-2">•</span>
                      <span>Masuk: {formatDate(it.signedInAt)}</span>
                      {it.lastSeenAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Aktif: {formatDate(it.lastSeenAt)}</span>
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
  <div className="rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 ring-1 ring-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.25),0_8px_24px_rgba(0,0,0,0.45)] md:h-full md:min-h-0 flex flex-col">
    <PanelHeader title="List Akun User" onRefresh={loadLists} count={userAccounts.length} />
    <div className="mt-3 h-px w-full bg-[#1f1f1f]" />
    <div className="mt-3 md:flex-1 md:overflow-auto">
      {listsError ? (
        <p className="text-sm text-rose-400">{listsError}</p>
      ) : (
        <>
          {listsLoading && userAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Memuat...</p>
          ) : userAccounts.length === 0 ? (
            <p className="text-sm text-zinc-400">Tidak ada data.</p>
          ) : (
            <ul className="space-y-2">
              {userAccounts.map((it, idx) => (
                <li
                  key={`${it.name || "user"}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-[#27272a] bg-[#0f0f10] px-3 py-2 hover:bg-white/5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[#e5e7eb]">{it.name || "-"}</span>
                    </div>
                    <div className="mt-0.5 text-[12px] text-zinc-400">
                      <span>Status: </span>
                      <span className={`font-medium ${it.status === "logged-in" ? "text-emerald-400" : "text-zinc-300"}`}>{it.status || "-"}</span>
                      <span className="mx-2">•</span>
                      <span>Masuk: {formatDate(it.signedInAt)}</span>
                      {it.lastSeenAt && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Aktif: {formatDate(it.lastSeenAt)}</span>
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

return (
  <section className="w-full min-h-[calc(100dvh-80px)] md:h-[100dvh] px-4 py-6 overflow-y-auto md:overflow-hidden">
    <div className="mx-auto w-full max-w-6xl md:h-full md:min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      <div className="md:col-span-1 flex items-start justify-center md:h-full md:min-h-0">
        {!profile ? (
          <div className="w-full max-w-[420px] rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 ring-1 ring-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.25),0_8px_24px_rgba(0,0,0,0.45)]">
            <h1 className="text-[22px] font-bold text-[#fafafa]">Masuk</h1>
            <p className="mt-1.5 text-[13px] text-[#a1a1aa]">
              Univista Monitoring ~ Masuk untuk melanjutkan.
            </p>

            <div className="relative mt-4">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="ID Login"
                className="h-11 w-full rounded-lg border border-[#27272a] bg-[#0f0f10] pl-10 pr-3 text-sm text-[#e5e7eb] placeholder-[#71717a] outline-none ring-0 focus:border-[#3f3f46]"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                autoComplete="off"
              />
            </div>

            <div className="relative mt-4">
              <User className="absolute left-3 top-3.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Nama Admin"
                className="h-11 w-full rounded-lg border border-[#27272a] bg-[#0f0f10] pl-10 pr-3 text-sm text-[#e5e7eb] placeholder-[#71717a] outline-none ring-0 focus:border-[#3f3f46]"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="relative mt-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Kata Sandi khusus Admin"
                className="h-11 w-full rounded-lg border border-[#27272a] bg-[#0f0f10] px-3 pr-10 text-sm text-[#e5e7eb] placeholder-[#71717a] outline-none ring-0 focus:border-[#3f3f46]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleLogin}
              className={`mt-5 flex h-11 w-full items-center justify-center rounded-lg border text-white transition ${
                canSubmit
                  ? "border-[#1f2937] bg-[#111827] hover:bg-[#0f172a]/90"
                  : "cursor-not-allowed opacity-50 border-[#1f2937] bg-[#111827]"
              }`}
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span className="text-[15px] font-semibold">{loading ? "Sedang masuk..." : "Masuk"}</span>
            </button>
          </div>
        ) : (
          <div className="w-full max-w-[420px] rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 ring-1 ring-red-500/30 shadow-[0_0_24px_rgba(239,68,68,0.25),0_8px_24px_rgba(0,0,0,0.45)]">
            <h1 className="text-[22px] font-bold text-[#fafafa]">Profil</h1>
            <div className="my-3 h-px w-full bg-[#1f1f1f]" />
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#a1a1aa]">Nama Admin</span>
              <span className="text-sm font-semibold text-[#e5e7eb]">{profile.adminName}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#a1a1aa]">ID Login</span>
              <span className="text-sm font-semibold text-[#e5e7eb]">{profile.loginId}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[#a1a1aa]">Terakhir Masuk</span>
              <span className="text-sm font-semibold text-[#e5e7eb]">{formatDate(profile.signedInAt)}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 flex h-11 w-full items-center justify-center rounded-lg border border-[#991b1b] bg-[#7f1d1d] text-white transition hover:bg-[#7f1d1d]/90"
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
  </section>
);
}
