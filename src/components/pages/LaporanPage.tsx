export default function LaporanPage() {
  return (
    <section className="w-full p-4 md:p-6 box-border min-h-full flex flex-col">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="mb-3 flex items-end justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-[#f2f2f2]">Laporan</h1>
            <p className="mt-1 text-sm text-[#9a9a9a]">
              Placeholder panel — daftar laporan akan tampil di sini.
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col flex-none">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
          <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
              <div className="flex-1">Laporan</div>
              <div className="hidden sm:block text-[#6a6a6a]">Placeholder</div>
            </div>
          </div>
          <div className="flex-none h-[480px] sm:h-[560px] overflow-auto uv-scrollbar uv-scrollbar--thin overscroll-contain">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="group overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#0e0e0e] hover:bg-[#141414] transition-colors p-3 sm:p-4 flex flex-col"
                  role="gridcell"
                  aria-label="placeholder-card"
                >
                  <div className="w-full aspect-square rounded-md bg-[#2a2a2a]" />
                  <div className="mt-3 space-y-2">
                    <div className="h-2.5 w-9/12 rounded-full bg-[#2a2a2a]" />
                    <div className="h-2 w-6/12 rounded-full bg-[#2a2a2a]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
            0 laporan
          </div>
        </div>
      </div>
    </section>
  );
}
