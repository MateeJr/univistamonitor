"use client";

import { Server } from "lucide-react";

export default function StatusMesinPage() {
  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-6 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/30 flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
            Status Mesin
          </h1>
        </div>
      </div>
    </section>
  );
}
