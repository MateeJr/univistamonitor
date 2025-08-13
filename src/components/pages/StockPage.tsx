export default function StockPage() {
  return (
    <div className="px-4 md:px-6 pt-2 md:pt-4 pb-6 min-h-[calc(100dvh-80px)] md:h-[100dvh] overflow-visible md:overflow-hidden box-border">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0 h-full">
        {/* Top Bar */}
        <div className="mb-4 md:mb-6 flex items-center gap-3 flex-wrap shrink-0">
          <div className="hidden md:block w-32 h-10 rounded-xl border border-white/10 bg-white/5" />
          <div className="relative w-full sm:flex-1 min-w-0">
            <input
              type="text"
              placeholder="Cari sparepart..."
              className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5" />
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5" />
            <div className="w-10 h-10 rounded-xl border border-white/10 bg-white/5" />
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-4 md:gap-6 flex-1 min-h-0">
          {/* Filter Sidebar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex flex-col gap-4 md:min-h-0 md:overflow-y-auto">
            <div className="h-4 w-24 rounded bg-white/10 shrink-0" />
            <div className="space-y-2 shrink-0">
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
            </div>
            <div className="h-px bg-white/10 shrink-0" />
            <div className="h-4 w-20 rounded bg-white/10 shrink-0" />
            <div className="space-y-2 shrink-0">
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-9 rounded-xl border border-white/10 bg-white/5" />
            </div>
            <div className="mt-auto flex gap-2 shrink-0">
              <div className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5" />
              <div className="h-10 flex-1 rounded-xl border border-white/10 bg-white/5" />
            </div>
          </div>

          {/* Product Area */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col min-h-0">
            {/* Toolbar */}
            <div className="border-b border-white/10 px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-28 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-28 h-9 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-24 h-9 rounded-xl border border-white/10 bg-white/5" />
              </div>
            </div>

            {/* Grid Area (scrollable) */}
            <div className="flex-1 md:min-h-0 overflow-visible md:overflow-y-auto p-4 md:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col">
                    <div className="aspect-square rounded-lg border border-white/10 bg-white/5" />
                    <div className="mt-3 space-y-2">
                      <div className="h-3 w-4/5 rounded bg-white/10" />
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/10" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-6 w-16 rounded-lg bg-white/10 border border-white/10" />
                      <div className="h-6 w-20 rounded-lg bg-white/10 border border-white/10" />
                    </div>
                    <div className="mt-3 h-9 rounded-xl border border-white/10 bg-white/5" />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="border-t border-white/10 px-4 md:px-6 py-3 flex items-center justify-between flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-20 h-9 rounded-xl border border-white/10 bg-white/5" />
                <div className="w-20 h-9 rounded-xl border border-white/10 bg-white/5" />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
                <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
