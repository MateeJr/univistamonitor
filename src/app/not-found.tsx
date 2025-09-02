import Link from "next/link";

export default function NotFound() {
  return (
    <main className="px-6 overflow-hidden">
      <section className="mx-auto max-w-4xl">
        <div className="relative flex flex-col items-center justify-center text-center overflow-hidden h-[calc(100dvh-80px)] md:h-[calc(100dvh-1px)]">
          {/* Colorful soft glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-20 opacity-25 blur-3xl [mask-image:radial-gradient(60%_60%_at_50%_50%,black,transparent)] bg-[radial-gradient(ellipse_at_center,theme(colors.fuchsia.500),theme(colors.violet.500),theme(colors.indigo.500))]"
          />
          <div
            aria-hidden
            className="absolute -top-24 -left-24 -z-10 h-72 w-72 rounded-full bg-gradient-to-tr from-fuchsia-500/35 to-indigo-500/35 blur-3xl uv-float-slow"
          />
          <div
            aria-hidden
            className="absolute -bottom-28 -right-24 -z-10 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/30 to-violet-500/30 blur-3xl uv-float-slow"
            style={{ animationDelay: "1.5s" }}
          />

          <div className="mx-auto max-w-xl rounded-2xl bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
            <p className="uv-animate-in text-7xl md:text-8xl font-extrabold tracking-tight bg-gradient-to-r from-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
              404
            </p>
            <h1 className="uv-animate-in-2 mt-4 text-2xl md:text-3xl font-semibold text-zinc-100">
              Halaman Tidak Ditemukan
            </h1>
            <p className="uv-animate-in-3 mt-3 text-zinc-400">
              Link yang anda buka tidak tersedia
            </p>

            <div className="uv-animate-in-3 mt-8 flex items-center justify-center">
              <Link
                href="/"
                className="group relative inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60"
              >
                <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-fuchsia-600 to-indigo-600 opacity-90 transition group-hover:opacity-100" />
                <span className="relative">Kembali ke Beranda</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
