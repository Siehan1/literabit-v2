import { BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home(): React.JSX.Element {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-8 px-6 py-16"
    >
      <header className="space-y-4">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
          <Sparkles className="size-4" aria-hidden="true" />
          Milestone 0 Foundation Aktif
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Literabit — Belajar Memahami Bacaan dengan Teliti
        </h1>
        <p className="reading-prose text-muted-foreground">
          Platform pembelajaran pemahaman bacaan berjenjang untuk anak usia 6–12 tahun, dilengkapi
          evaluasi berbasis kategori kognitif, gamifikasi XP percobaan pertama, dan dasbor
          pemantauan orang tua.
        </p>
      </header>

      <section aria-labelledby="platform-pillars" className="grid gap-4 sm:grid-cols-3">
        <h2 id="platform-pillars" className="sr-only">
          Pilar Utama Platform
        </h2>
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <BookOpen className="mb-3 size-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Ruang Belajar Anak</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Bacaan bertingkat per halaman dengan tipografi nyaman dan kuis pemahaman.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <ShieldCheck className="mb-3 size-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Pemantauan Orang Tua</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Profil anak terisolasi, proteksi Parent PIN, dan ringkasan hasil evaluasi.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-card-foreground">
          <Sparkles className="mb-3 size-5 text-primary" aria-hidden="true" />
          <h3 className="font-semibold">Lean Admin CMS</h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Pengelolaan kategori, materi berurutan, dan bank soal tervalidasi.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button render={<a href="/api/v1/health" />} nativeButton={false} variant="outline">
          Cek Status API (`/api/v1/health`)
        </Button>
      </div>
    </main>
  );
}
