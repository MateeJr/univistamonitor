"use client";

import { Home, Activity, FileText, Bell, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type TabKey = "Home" | "Status" | "Laporan" | "Notifikasi" | "Akun";

const TABS: Array<{ key: TabKey; label: string; Icon: any; href: string }> = [
  { key: "Home", label: "Home", Icon: Home, href: "/" },
  { key: "Status", label: "Status", Icon: Activity, href: "/status" },
  { key: "Laporan", label: "Laporan", Icon: FileText, href: "/laporan" },
  { key: "Notifikasi", label: "Notifikasi", Icon: Bell, href: "/notifikasi" },
  { key: "Akun", label: "Akun", Icon: User, href: "/akun" },
];

export default function NavBar() {
  const pathname = usePathname() || "/";
  return (
    <div className="fixed z-50 top-0 left-0 right-0 w-full md:top-0 md:left-0 md:h-screen md:w-[80px]">
      <div
        className="relative flex w-full h-[72px] md:h-full md:w-full flex-row md:flex-col items-center md:items-center justify-around md:justify-start border-b md:border-b-0 md:border-r border-[#1a1a1a] bg-black/90 backdrop-blur-md shadow-[0_6px_24px_rgba(0,0,0,0.45)] md:shadow-[6px_0_24px_rgba(0,0,0,0.45)]"
      >
        {/* subtle glow lines */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:hidden" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block" />
        {TABS.map(({ key, label, Icon, href }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              className="group relative flex flex-1 md:flex-none w-auto md:w-full flex-col items-center py-2 outline-none transition-all duration-200 ease-out hover:bg-white/[0.03] focus-visible:ring-2 focus-visible:ring-white/20"
            >
              {/* active indicator bar */}
              {isActive && (
                <span className="pointer-events-none absolute bottom-0 left-1/2 h-1 w-9 -translate-x-1/2 rounded-t bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)] md:hidden" />
              )}
              {isActive && (
                <span className="pointer-events-none absolute right-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-l bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.6)] hidden md:block" />
              )}
              {/* hover/active radial glow behind icon */}
              <span
                aria-hidden
                className={`pointer-events-none absolute top-2 left-1/2 -z-0 h-14 w-14 -translate-x-1/2 rounded-full blur-xl opacity-0 transition duration-300 ${
                  isActive ? "opacity-60 bg-white/20" : "group-hover:opacity-40 bg-white/10"
                }`}
              />
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full border transition-transform duration-200 will-change-transform ${
                  isActive
                    ? "border-[#262626] bg-[rgba(255,255,255,0.06)] shadow-[0_6px_12px_rgba(255,255,255,0.35)]"
                    : "border-[#1a1a1a] group-hover:scale-105 active:scale-95"
                }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  color={isActive ? "#ffffff" : "#888888"}
                />
              </span>
              <span
                className={`mt-1.5 text-[11px] font-semibold tracking-[0.02em] transition-colors duration-200 ${
                  isActive ? "text-[#f2f2f2]" : "text-[#9a9a9a] group-hover:text-[#d6d6d6]"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
