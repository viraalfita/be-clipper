export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-6 py-10 md:px-10">
      <section className="glass-panel p-6 md:p-8">
        <h1 className="mb-4 text-3xl font-bold text-slate-900">
          Terms of Service
        </h1>
        <p className="mb-4 text-sm text-slate-600">Last updated: 2026-03-19</p>
        <div className="space-y-4 text-sm leading-7 text-slate-700">
          <p>
            Autoclipper Studio disediakan untuk otomatisasi pembuatan clip video
            dan orkestrasi publish workflow. Kamu bertanggung jawab atas konten,
            hak cipta, dan kepatuhan platform pihak ketiga (YouTube, TikTok, dan
            lainnya).
          </p>
          <p>
            Kamu setuju untuk tidak menggunakan layanan ini untuk aktivitas
            ilegal, pelanggaran hak cipta, atau distribusi konten yang melanggar
            kebijakan platform tujuan.
          </p>
          <p>
            Layanan dapat berubah sewaktu-waktu untuk perbaikan keamanan,
            performa, dan kepatuhan integrasi API.
          </p>
        </div>
      </section>
    </main>
  );
}
