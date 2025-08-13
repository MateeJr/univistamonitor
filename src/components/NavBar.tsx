"use client";

import { Home, Activity, Bell, User, Cpu, Package, Users, LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export type TabKey = "Home" | "Status" | "Mesin" | "Stock" | "WorkerStatus" | "Notifikasi" | "Akun";

const TABS: Array<{ key: TabKey; label: string; Icon: LucideIcon; href: string }> = [
  { key: "Home", label: "Home", Icon: Home, href: "/" },
  { key: "Status", label: "Status", Icon: Activity, href: "/status" },
  { key: "Mesin", label: "Mesin", Icon: Cpu, href: "/mesin" },
  { key: "Stock", label: "Stock", Icon: Package, href: "/stock" },
  { key: "WorkerStatus", label: "Worker", Icon: Users, href: "/worker-status" },
  { key: "Notifikasi", label: "Notifikasi", Icon: Bell, href: "/notifikasi" },
  { key: "Akun", label: "Akun", Icon: User, href: "/akun" },
];

export default function NavBar() {
  const pathname = usePathname() || "/";

  return (
    <nav className="fixed z-50 top-0 left-0 right-0 w-full md:right-auto md:h-screen md:w-24 md:top-0">
      {/* Mobile Navigation - Top Bar */}
      <div className="md:hidden">
        <div className="bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-800/50 px-4">
          <div className="flex items-center justify-around max-w-screen-xl mx-auto">
            {TABS.map(({ key, label, Icon, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className="relative flex flex-col items-center gap-1 py-3 px-2 text-zinc-400 hover:text-white transition-colors"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-all duration-200 ${isActive ? "text-blue-400" : ""}`}
                    />
                  </motion.div>
                  <span className={`text-[11px] font-medium tracking-tight transition-colors ${
                    isActive ? "text-white" : "text-zinc-500"
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-pill-mobile"
                      className="absolute -bottom-px left-0 right-0 h-0.5 bg-blue-400"
                      style={{ borderRadius: "2px" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Sidebar */}
      <div className="hidden md:flex h-full">
        <div className="flex flex-col w-full bg-zinc-950/80 backdrop-blur-2xl border-r border-zinc-800/50 min-h-0">
          <div className="flex items-center justify-center py-6 shrink-0">
            <Link href="/" title="Home">
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
              >
                <p className="text-white font-bold text-lg">U</p>
              </motion.div>
            </Link>
          </div>
          
          <div className="flex flex-col items-center flex-1 gap-4 p-4 min-h-0 overflow-y-auto uv-scrollbar">
            {TABS.map(({ key, label, Icon, href }) => {
              const isActive = pathname === href;
              return (
                <motion.div key={key} className="relative w-full">
                  <Link
                    href={href}
                    title={label}
                    className="group relative flex items-center justify-center w-full h-14 rounded-2xl text-zinc-400 hover:text-white transition-colors duration-200"
                  >
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          layoutId="active-pill-desktop"
                          className="absolute inset-0 bg-gradient-to-br from-zinc-800/70 to-zinc-900/60 border border-zinc-700/80 shadow-lg"
                          style={{ borderRadius: "16px" }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                        />
                      )}
                    </AnimatePresence>
                    
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: isActive ? 0 : -5 }}
                      whileTap={{ scale: 0.9 }}
                      className="relative z-10"
                    >
                      <Icon 
                        size={24} 
                        strokeWidth={isActive ? 2.5 : 2}
                        className={`transition-colors duration-200 ${isActive ? "text-blue-300" : ""}`}
                      />
                    </motion.div>

                    {/* Tooltip */}
                    <div className="absolute left-full ml-4 px-3 py-1.5 bg-zinc-800/90 backdrop-blur-sm text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap shadow-xl border border-zinc-700/50 transition-all duration-200 translate-x-2.5 group-hover:translate-x-0">
                      {label}
                      <div className="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-zinc-800/90 border-l border-b border-zinc-700/50 rotate-45" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
