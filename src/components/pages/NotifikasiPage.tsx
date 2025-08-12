export default function NotifikasiPage() {
  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-8 flex items-end justify-between shrink-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              Notifications Center
            </h1>
            <p className="text-base text-gray-400/80 font-light max-w-md">
              Real-time notification management with categorized alerts and system events.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm text-amber-400 font-medium">Inbox</span>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col flex-none">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 shadow-lg shadow-amber-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Notification Feed</h3>
              </div>
              <div className="flex items-center text-xs font-semibold uppercase tracking-wider text-white/50">
                <div className="hidden w-12 shrink-0 sm:block text-center">#</div>
                <div className="flex-1 ml-4">Message</div>
                <div className="hidden w-32 shrink-0 md:block text-center">Category</div>
                <div className="hidden w-40 shrink-0 lg:block text-center">Timestamp</div>
              </div>
            </div>
          </div>
          <div className="flex-none h-[480px] sm:h-[560px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
            {Array.from({ length: 40 }).map((_, i) => (
              <div
                key={i}
                className={`group/row ${i % 2 === 0 ? "bg-white/[0.02]" : "bg-black/20"} flex h-14 sm:h-16 w-full items-center px-6 hover:bg-white/[0.08] transition-colors duration-300 relative overflow-hidden border-b border-white/5 last:border-b-0`}
                role="row"
                aria-label="placeholder-row"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-300" />
                <div className="relative hidden w-12 shrink-0 sm:flex items-center justify-center">
                  <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-xs text-white/60 font-mono">
                    {i + 1}
                  </div>
                </div>
                <div className="relative flex-1 ml-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shadow-sm ${
                      i % 3 === 0 ? "bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-500/50" :
                      i % 3 === 1 ? "bg-gradient-to-r from-blue-400 to-cyan-500 shadow-blue-500/50" :
                      "bg-gradient-to-r from-amber-400 to-orange-500 shadow-amber-500/50"
                    }`} />
                    <div className="h-3 w-8/12 sm:w-7/12 md:w-5/12 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60 group-hover/row:from-gray-500/60 group-hover/row:to-gray-600/60 transition-all duration-300" />
                  </div>
                </div>
                <div className="relative hidden w-32 shrink-0 md:flex justify-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    i % 4 === 0 ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
                    i % 4 === 1 ? "bg-blue-500/20 border-blue-500/30 text-blue-300" :
                    i % 4 === 2 ? "bg-amber-500/20 border-amber-500/30 text-amber-300" :
                    "bg-purple-500/20 border-purple-500/30 text-purple-300"
                  }`}>
                    <div className="h-2 w-12 rounded-full bg-current opacity-60" />
                  </div>
                </div>
                <div className="relative hidden w-40 shrink-0 lg:flex justify-center">
                  <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10">
                    <div className="h-2 w-20 rounded-full bg-gradient-to-r from-gray-500/60 to-gray-600/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-white/50">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="font-medium">Live notifications feed</span>
              </div>
              <span className="text-white/40 font-mono">
                No notifications available • Placeholder content
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
