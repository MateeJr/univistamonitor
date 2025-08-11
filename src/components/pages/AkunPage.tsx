"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LogIn, LogOut, User } from "lucide-react";
import { ENDPOINTS } from "@/components/config/server";
import WrongPassModal from "@/components/modals/WrongPassModal";

type Profile = {
  loginId: string;
  adminName: string;
  signedInAt: string;
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
  const hbRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const profileRef = useRef<Profile | null>(null);
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

  // Presence helpers
  const sendPresence = async (status: "online" | "offline") => {
    try {
      if (!profile?.loginId) return;
      const cid = clientIdRef.current || getClientId();
      await fetch(ENDPOINTS.logininfo, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.loginId, status, clientId: cid }),
      });
    } catch {}
  };

  const startHeartbeat = () => {
    if (hbRef.current) return;
    sendPresence("online");
    hbRef.current = setInterval(() => sendPresence("online"), 30_000);
  };
  const stopHeartbeat = (sendOffline?: boolean) => {
    if (hbRef.current) {
      clearInterval(hbRef.current);
      hbRef.current = null;
    }
    if (sendOffline && profile?.loginId) {
      try {
        // Best-effort on unload
        const cid = clientIdRef.current || getClientId();
        const payload = new Blob([JSON.stringify({ name: profile.loginId, status: "offline", clientId: cid })], { type: "application/json" });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINTS.logininfo, payload);
          return;
        }
      } catch {}
      // Fallback
      sendPresence("offline");
    }
  };

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
      startHeartbeat();
      await sendPresence("online");
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
      stopHeartbeat(true);
      await fetch(ENDPOINTS.logout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.loginId, status: "logout", clientId: clientIdRef.current || getClientId() }),
      });
    } catch {}
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    deleteCookie(TOKEN_COOKIE);
    setProfile(null);
    setLoginId("UNIVISTA");
    setAdminName("");
    setPassword("");
    setLoading(false);
  };

  // Restore persisted profile and keep presence online
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
          startHeartbeat();
          sendPresence("online");
        }
      }
    } catch {}
    // visibility events to periodically reaffirm online
    const onVis = () => { if (document.visibilityState === "visible" && profileRef.current) sendPresence("online"); };
    const onHide = () => { if (profileRef.current) stopHeartbeat(true); };
    const onShow = () => { if (profileRef.current) { startHeartbeat(); sendPresence("online"); } };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    window.addEventListener("pageshow", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      window.removeEventListener("pageshow", onShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manage heartbeat lifecycle when profile changes
  useEffect(() => {
    if (profile) {
      startHeartbeat();
      return () => stopHeartbeat(true);
    } else {
      stopHeartbeat();
    }
  }, [profile]);

  // Keep latest profile in a ref to avoid stale closures in event handlers
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  return (
    <section className="flex w-full min-h-[calc(100dvh-80px)] md:min-h-[100dvh] items-center justify-center px-4">
      {!profile ? (
        <div className="w-full max-w-[420px] rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
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
        <div className="w-full max-w-[420px] rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.45)]">
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
      <WrongPassModal
        visible={wrongVisible}
        message={wrongMessage}
        onClose={() => setWrongVisible(false)}
      />
    </section>
  );
}
