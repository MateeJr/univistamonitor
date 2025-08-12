export default function WorkerStatusPage() {
  return (
    <section className="w-full box-border flex flex-col flex-1">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="mb-4 md:mb-6 flex items-start justify-between gap-4 flex-wrap shrink-0">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-24 rounded-full bg-white/10" />
              <div className="h-6 w-24 rounded-full bg-white/10" />
              <div className="h-6 w-24 rounded-full bg-white/10" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-32 rounded-xl bg-white/5 border border-white/10" />
            <div className="h-9 w-24 rounded-xl bg-white/5 border border-white/10" />
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-3 flex-wrap shrink-0">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="Cari anggota..."
              className="w-full h-10 pl-4 pr-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-all duration-300 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-28 rounded-xl border border-white/10 bg-white/5" />
            <div className="h-10 w-28 rounded-xl border border-white/10 bg-white/5" />
            <div className="h-10 w-28 rounded-xl border border-white/10 bg-white/5" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="h-9 w-28 rounded-xl border border-white/10 bg-white/5" />
            <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5" />
            <div className="h-9 w-9 rounded-xl border border-white/10 bg-white/5" />
          </div>
        </div>

        {/* Table Container */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col">
          {/* Table Header */}
          <div className="px-4 md:px-6 py-3 border-b border-white/10">
            <div className="grid grid-cols-12 gap-3 text-xs text-white/50">
              <div className="col-span-3 h-4 rounded bg-white/10" />
              <div className="col-span-2 h-4 rounded bg-white/10" />
              <div className="col-span-2 h-4 rounded bg-white/10" />
              <div className="col-span-2 h-4 rounded bg-white/10" />
              <div className="col-span-2 h-4 rounded bg-white/10" />
              <div className="col-span-1 h-4 rounded bg-white/10" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="px-4 md:px-6 py-2">
            <div className="divide-y divide-white/5">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="py-3">
                  <div className="grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-3 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-white/10" />
                        <div className="h-3 w-1/3 rounded bg-white/10" />
                      </div>
                    </div>
                    <div className="col-span-2 h-3 rounded bg-white/10" />
                    <div className="col-span-2 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-white/30" />
                      <div className="h-3 w-2/3 rounded bg-white/10" />
                    </div>
                    <div className="col-span-2 h-3 rounded bg-white/10" />
                    <div className="col-span-2 h-3 rounded bg-white/10" />
                    <div className="col-span-1 h-8 rounded-lg border border-white/10 bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer placeholder */}
          <div className="px-4 md:px-6 py-3 border-t border-white/10 flex items-center justify-between">
            <div className="h-4 w-32 rounded bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
              <div className="w-8 h-8 rounded-lg border border-white/10 bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
