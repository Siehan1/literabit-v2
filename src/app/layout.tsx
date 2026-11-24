import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Literabit — Platform Pemahaman Bacaan Anak",
  description:
    "Platform pembelajaran membaca mandiri berjenjang, kuis pemahaman kognitif, dan pemantauan perkembangan anak usia 6–12 tahun.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Lewati ke konten utama
        </a>
        {children}
      </body>
    </html>
  );
}
