"use client";

import React, { useMemo, useState } from "react";
import { Eye, EyeOff, LogIn, LogOut, User } from "lucide-react";
import WrongPassModal from "@/components/modals/WrongPassModal";

type Profile = {
  name: string;
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
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wrongVisible, setWrongVisible] = useState(false);
  const [wrongMessage, setWrongMessage] = useState<string | undefined>(undefined);

  const canSubmit = useMemo(
    () => name.trim().length > 0 && password.length > 0 && !loading,
    [name, password, loading]
  );

  const handleLogin = () => {
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      // Mocked validation: treat as wrong unless password matches demo key
      const isValid = password.trim() === "admin";
      if (!isValid) {
        setWrongMessage("Kata sandi admin tidak sesuai. Silakan coba lagi.");
        setWrongVisible(true);
        setPassword("");
        setLoading(false);
        return;
      }
      const iso = new Date().toISOString();
      setProfile({ name: name.trim(), signedInAt: iso });
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    setLoading(true);
    setTimeout(() => {
      setProfile(null);
      setName("");
      setPassword("");
      setLoading(false);
    }, 300);
  };

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
              placeholder="Nama"
              className="h-11 w-full rounded-lg border border-[#27272a] bg-[#0f0f10] pl-10 pr-3 text-sm text-[#e5e7eb] placeholder-[#71717a] outline-none ring-0 focus:border-[#3f3f46]"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            <span className="text-sm text-[#a1a1aa]">Nama</span>
            <span className="text-sm font-semibold text-[#e5e7eb]">{profile.name}</span>
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
