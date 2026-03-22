import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <div className="spot spot-a" />
      <div className="spot spot-b" />

      <section className="mx-auto max-w-6xl space-y-6">
        <header className="panel p-6 md:p-9">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <span className="chip">Autoclipper MVP</span>
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-soft">
                Login
              </Link>
              <Link href="/register" className="btn btn-soft">
                Register
              </Link>
              <Link href="/dashboard" className="btn btn-primary">
                Open Dashboard
              </Link>
            </div>
          </div>

          <h1 className="text-4xl font-semibold text-slate-950 md:text-5xl">
            Build Short-Form Clips with 2 Working Modes
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            Discover mode untuk menyimpan intent pencarian video dari topik
            awal. Auto detect mode untuk memproses link YouTube menjadi top
            candidate clips, render output vertikal, dan jadwalkan metadata
            upload.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Discover Videos
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Input topic, niche, dan goal. Job tersimpan sebagai
              placeholder-ready pipeline untuk integrasi source di fase
              berikutnya.
            </p>
          </article>
          <article className="panel p-6">
            <h2 className="text-xl font-semibold text-slate-900">
              Use YouTube Link
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Analyze transcript, generate candidate segments, rerank semantik
              via OpenRouter, lalu render dan schedule.
            </p>
          </article>
        </section>

        <footer className="panel flex flex-wrap items-center justify-between gap-4 p-5 text-sm text-slate-600">
          <p>
            Production-oriented MVP with FastAPI backend and Next.js App Router
            frontend.
          </p>
          <div className="flex gap-3">
            <Link href="/terms" className="underline">
              Terms
            </Link>
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
}
