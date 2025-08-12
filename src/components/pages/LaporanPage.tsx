export default function LaporanPage() {
  return (
    <section className="w-full p-4 md:p-8 box-border min-h-full flex flex-col bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#1a1a1a]">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-8 flex items-end justify-between shrink-0">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent tracking-tight">
              Reports & Analytics
            </h1>
            <p className="text-base text-gray-400/80 font-light max-w-md">
              Comprehensive reporting dashboard with detailed analytics and performance insights.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-sm text-blue-400 font-medium">Archive</span>
          </div>
        </div>
        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-700 hover:border-white/20 flex flex-col flex-none">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="relative border-b border-white/10 bg-gradient-to-r from-gray-900/80 to-black/80 backdrop-blur-sm px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-500/50" />
                <h3 className="text-sm font-semibold text-white/90 tracking-wide">Report Gallery</h3>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-white/60 font-medium">24 items</span>
              </div>
            </div>
          </div>
          <div className="flex-none h-[480px] sm:h-[560px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5 p-6">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="group/card relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:border-white/20 p-4 flex flex-col"
                  role="gridcell"
                  aria-label="placeholder-card"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-gray-700/60 to-gray-800/60 border border-white/10 flex items-center justify-center group-hover/card:from-blue-600/40 group-hover/card:to-purple-600/40 transition-all duration-500">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400/60 to-purple-500/60 opacity-60 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all duration-500" />
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="h-3 w-3/4 rounded-full bg-gradient-to-r from-gray-600/60 to-gray-700/60 group-hover/card:from-gray-500/60 group-hover/card:to-gray-600/60 transition-all duration-500" />
                      <div className="h-2.5 w-1/2 rounded-full bg-gradient-to-r from-gray-700/60 to-gray-800/60 group-hover/card:from-gray-600/60 group-hover/card:to-gray-700/60 transition-all duration-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-white/10 bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-sm px-6 py-3 text-right">
            <span className="text-xs text-white/50 font-medium">No reports available • Placeholder content</span>
          </div>
        </div>
      </div>
    </section>
  );
}
