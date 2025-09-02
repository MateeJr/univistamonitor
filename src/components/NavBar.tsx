"use client";

import { Home, Activity, User, Cpu, Package, Users, Server, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export type TabKey = "Home" | "Status" | "Mesin" | "StatusMesin" | "Stock" | "WorkerStatus" | "Akun";

type TabItem = { key: TabKey; label: string; Icon: LucideIcon; href: string };

const TABS: Array<TabItem> = [
  { key: "Home", label: "Home", Icon: Home, href: "/" },
  { key: "Status", label: "Status", Icon: Activity, href: "/status" },
  { key: "Mesin", label: "Mesin", Icon: Cpu, href: "/mesin" },
  { key: "StatusMesin", label: "Status Mesin", Icon: Server, href: "/statusmesin" },
  { key: "Stock", label: "Stock", Icon: Package, href: "/stock" },
  { key: "WorkerStatus", label: "Anggota", Icon: Users, href: "/worker-status" },
  { key: "Akun", label: "Akun", Icon: User, href: "/akun" },
];

const DESKTOP_TOP_TABS: Array<TabItem> = TABS.filter((t) => t.key !== "Akun");
const DESKTOP_BOTTOM_TABS: Array<TabItem> = TABS.filter((t) => t.key === "Akun");

export default function NavBar() {
  const pathname = usePathname() || "/";

  return (
    <nav className="fixed z-50 top-0 left-0 right-0 w-full md:right-auto md:h-screen md:w-24 md:top-0 overflow-x-hidden">
      {/* Mobile Navigation - Elevated Glass Top Bar */}
      <div className="md:hidden">
        <div className="px-3 pt-2 pb-2">
          <div className="max-w-screen-xl mx-auto rounded-2xl border border-white/10 bg-zinc-950/65 backdrop-blur-xl shadow-[0_10px_30px_-15px_rgba(0,0,0,0.7)] overflow-hidden">
            <div className="flex items-center justify-between px-2">
              {TABS.map(({ key, label, Icon, href }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={key}
                    href={href}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                    className="group relative flex-1 min-w-0 flex flex-col items-center justify-center gap-1 py-2 text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <motion.div
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.96 }}
                      className={`relative grid place-items-center h-9 w-9 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-blue-500/25 to-cyan-500/15 text-blue-300 ring-1 ring-blue-400/30 shadow-[0_6px_18px_-8px_rgba(56,189,248,0.55)]"
                          : "bg-zinc-900/40 group-hover:bg-zinc-800/60 ring-1 ring-white/5"
                      }`}
                    >
                      <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                      {isActive && (
                        <motion.span
                          layoutId="mobile-active-glow"
                          className="absolute -inset-1 -z-10 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
                          aria-hidden
                        />
                      )}
                    </motion.div>
                    <span
                      className={`text-[11px] font-medium tracking-tight transition-colors ${
                        isActive ? "text-zinc-100" : "text-zinc-500"
                      }`}
                    >
                      {label}
                    </span>
                    {isActive && (
                      <motion.div
                        layoutId="active-pill-mobile"
                        className="absolute -bottom-0.5 h-0.5 w-6 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400"
                        aria-hidden
                      />)
                    }
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Refined Sidebar */}
      <div className="hidden md:flex h-full">
        <div className="flex flex-col w-full bg-zinc-950/70 backdrop-blur-xl border-r border-white/10 min-h-0 overflow-x-hidden">
          {/* Brand */}
          <div className="flex items-center justify-center py-6 shrink-0">
            <Link href="/" title="Home" aria-label="Univista Monitor Home" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 rounded-full">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -4 }}
                whileTap={{ scale: 0.95 }}
                className="relative w-11 h-11 rounded-full grid place-items-center text-white shadow-[0_8px_24px_-12px_rgba(59,130,246,0.6)]"
                style={{
                  background: "radial-gradient(120px 120px at 30% 20%, rgba(59,130,246,.35), transparent 60%), radial-gradient(120px 120px at 80% 80%, rgba(168,85,247,.35), transparent 60%), linear-gradient(135deg, rgba(37,99,235,.35), rgba(59,130,246,.3))",
                }}
              >
                <span className="font-bold text-lg">U</span>
              </motion.div>
            </Link>
          </div>

          {/* Navigation groups */}
          <div className="flex flex-col flex-1 min-h-0">
            {/* Top group (scrollable) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden uv-scrollbar px-3 pb-4">
              <div className="flex flex-col items-center gap-3">
                {DESKTOP_TOP_TABS.map(({ key, label, Icon, href }) => {
                  const isActive = pathname === href;
                  return (
                    <motion.div key={key} className="relative w-full">
                      <Link
                        href={href}
                        title={label}
                        aria-label={label}
                        aria-current={isActive ? "page" : undefined}
                        className="group relative grid place-items-center w-full h-14 rounded-2xl text-zinc-400 hover:text-zinc-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      >
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="active-pill-desktop"
                              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/12 via-cyan-500/10 to-transparent ring-1 ring-blue-400/20 shadow-[0_12px_30px_-12px_rgba(56,189,248,0.4)]"
                              initial={{ opacity: 0.6, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              aria-hidden
                            />
                          )}
                        </AnimatePresence>

                        {/* Left accent bar when active */}
                        {isActive && (
                          <motion.div
                            layoutId="active-accent"
                            className="absolute left-1 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-blue-400 to-cyan-400"
                            aria-hidden
                          />
                        )}

                        <motion.div whileHover={{ scale: 1.08, rotate: isActive ? 0 : -6 }} whileTap={{ scale: 0.96 }} className="relative z-10">
                          <Icon size={24} strokeWidth={isActive ? 2.6 : 2} className={isActive ? "text-blue-300" : undefined} />
                        </motion.div>

                        {/* Tooltip */}
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-xl border border-white/10 transition-all duration-200 translate-x-2.5 group-hover:translate-x-0">
                          {label}
                          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900/95 border-l border-b border-white/10 rotate-45" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Bottom group (account) */}
            {DESKTOP_BOTTOM_TABS.length > 0 && (
              <div className="px-3 pt-2 pb-4 border-t border-white/10 bg-gradient-to-b from-transparent to-black/20 overflow-x-hidden">
                {DESKTOP_BOTTOM_TABS.map(({ key, label, Icon, href }) => {
                  const isActive = pathname === href;
                  return (
                    <motion.div key={key} className="relative w-full">
                      <Link
                        href={href}
                        title={label}
                        aria-label={label}
                        aria-current={isActive ? "page" : undefined}
                        className="group relative grid place-items-center w-full h-14 rounded-2xl text-zinc-400 hover:text-zinc-100 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      >
                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              layoutId="active-pill-desktop"
                              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/12 via-cyan-500/10 to-transparent ring-1 ring-blue-400/20"
                              initial={{ opacity: 0.6, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.96 }}
                              aria-hidden
                            />
                          )}
                        </AnimatePresence>
                        {isActive && (
                          <motion.div layoutId="active-accent" className="absolute left-1 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-blue-400 to-cyan-400" aria-hidden />
                        )}
                        <motion.div whileHover={{ scale: 1.08, rotate: isActive ? 0 : -6 }} whileTap={{ scale: 0.96 }} className="relative z-10">
                          <Icon size={24} strokeWidth={isActive ? 2.6 : 2} className={isActive ? "text-blue-300" : undefined} />
                        </motion.div>
                        <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-900/95 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-xl border border-white/10 transition-all duration-200 translate-x-2.5 group-hover:translate-x-0">
                          {label}
                          <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-900/95 border-l border-b border-white/10 rotate-45" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
