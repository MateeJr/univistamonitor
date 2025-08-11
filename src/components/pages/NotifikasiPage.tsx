export default function NotifikasiPage() {
  return (
    <section className="min-h-full w-full px-4 py-6 sm:px-6 md:py-10">
      <div className="mx-auto w-full max-w-5xl min-h-[calc(100dvh-80px)] md:min-h-[100dvh] flex flex-col">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#f2f2f2]">Notifikasi</h1>
            <p className="mt-1 text-sm text-[#9a9a9a]">
              Placeholder panel — daftar notifikasi akan tampil di sini.
            </p>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#0b0b0b] shadow-2xl flex flex-col h-full">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3a3a3a] to-transparent" />
          <div className="border-b border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 sm:px-5">
            <div className="flex items-center text-[11px] font-medium uppercase tracking-wider text-[#9a9a9a]">
              <div className="hidden w-10 shrink-0 sm:block">#</div>
              <div className="flex-1">Notifikasi</div>
              <div className="hidden w-28 shrink-0 md:block">Kategori</div>
              <div className="hidden w-40 shrink-0 lg:block">Waktu</div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                key={i}
                className={`${i % 2 === 0 ? "bg-[#0e0e0e]" : "bg-[#181818]"} group flex h-12 w-full items-center px-3 transition-colors sm:h-14 sm:px-4`}
                role="row"
                aria-label="placeholder-row"
              >
                <div className="hidden w-10 shrink-0 sm:block text-xs text-[#6a6a6a]">{i + 1}</div>
                <div className="flex-1">
                  <div className="h-2.5 w-8/12 rounded-full bg-[#2a2a2a] sm:w-7/12 md:w-5/12" />
                </div>
                <div className="hidden w-28 shrink-0 md:flex justify-end">
                  <div className="h-2 w-14 rounded-full bg-[#2a2a2a]" />
                </div>
                <div className="hidden w-40 shrink-0 lg:flex justify-end">
                  <div className="h-2 w-24 rounded-full bg-[#2a2a2a]" />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[#1e1e1e] bg-[#0f0f0f]/60 px-4 py-2.5 text-right text-xs text-[#7a7a7a] sm:px-5">
            0 notifikasi
          </div>
        </div>
      </div>
    </section>
  );
}
