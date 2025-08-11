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
    <nav className="fixed z-50 top-0 left-0 right-0 w-full md:right-auto md:h-screen md:w-20 md:top-0">
      {/* Mobile Navigation - Top Bar */}
      <div className="md:hidden">
        <div className="bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800/50 px-4 py-2">
          <div className="flex items-center justify-between max-w-screen-xl mx-auto">
            {TABS.map(({ key, label, Icon, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`group relative flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-zinc-800/60 text-white" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
                  }`}
                >
                  <div className={`relative ${isActive ? "text-blue-400" : ""}`}>
                    <Icon 
                      size={20} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className="transition-all duration-300"
                    />
                    {isActive && (
                      <div className="absolute inset-0 bg-blue-400/20 blur-lg rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide ${
                    isActive ? "text-white" : "text-zinc-500"
                  }`}>
                    {label}
                  </span>
                  {isActive && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Sidebar */}
      <div className="hidden md:flex h-full">
        <div className="flex flex-col w-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-800/50">
          {/* Navigation Links */}
          <div className="flex flex-col flex-1 gap-2 p-3 pt-6">
            {TABS.map(({ key, label, Icon, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  title={label}
                  className={`group relative flex items-center justify-center w-full h-12 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-zinc-800/80 text-white shadow-lg" 
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                  }`}
                >
                  <div className="relative">
                    <Icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`transition-all duration-300 ${
                        isActive ? "text-blue-400" : ""
                      }`}
                    />
                    {isActive && (
                      <>
                        <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full" />
                        <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-full" />
                      </>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-zinc-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl border border-zinc-700">
                    {label}
                    <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-2 h-2 bg-zinc-800 border-l border-b border-zinc-700 rotate-45" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bottom Decoration */}
          <div className="p-4 border-t border-zinc-800/50">
            <div className="w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto" />
          </div>
        </div>
      </div>
    </nav>
  );
}
