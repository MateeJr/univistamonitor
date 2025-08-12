export default function MesinPage() {
  return (
    <section className="w-full box-border flex flex-col flex-1">
      <div className="mx-auto w-full max-w-screen-2xl flex flex-col flex-1 min-h-0">
        <div className="grid lg:grid-cols-[30%_1fr] gap-4 flex-1 min-h-0 h-full">
          <div className="border border-white/20 rounded-xl min-h-[200px] lg:min-h-0 lg:h-full flex flex-col">
            <div className="py-3 text-center text-white/70 font-semibold">BUAT LAPORAN</div>
            <div className="flex-1" />
          </div>
          <div className="border border-white/20 rounded-xl min-h-[200px] lg:min-h-0 lg:h-full flex flex-col">
            <div className="py-3 text-center text-white/70 font-semibold">HISTORY</div>
            <div className="flex-1" />
          </div>
        </div>
      </div>
    </section>
  );
}

