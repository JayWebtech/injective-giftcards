import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/NavBar";
import { Instrument_Serif, DM_Sans } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "GiftINJ – Crypto Gift Cards on Injective",
  description:
    "GiftINJ lets you send INJ or USDT as beautiful crypto gift cards on Injective. Create, share, and claim with a simple link.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen text-white antialiased font-sans">
        <div className="relative z-10 flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 bg-black">
            <NavBar />
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 bg-black">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-muted md:flex-row md:px-6 lg:px-8">
              <span>Built for Injective Africa Builderthon</span>
              <span className="space-x-3">
                <a
                  href="https://injective.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white"
                >
                  injective.com
                </a>
                <span>•</span>
                <span>#InjectiveAfrica #GiftINJ #Web3Africa</span>
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
