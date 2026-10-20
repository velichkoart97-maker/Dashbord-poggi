import type { Metadata } from "next";
import { Manrope, Montserrat } from "next/font/google";
import "@/ui/theme.css";

const ui = Manrope({ subsets: ["latin", "cyrillic"], variable: "--font-ui", weight: ["400", "500", "600", "700", "800"] });
const logo = Montserrat({ subsets: ["latin"], variable: "--font-logo", weight: ["800"] });

export const metadata: Metadata = {
  title: "WWMAAI × PoggiPlay — UGC дашборд",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${ui.variable} ${logo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
