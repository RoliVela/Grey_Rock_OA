import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Grey Rock Dallas",
  description: "Local business recommendations for Dallas parents.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-8 py-4">
            <Link href="/" className="font-semibold">
              Grey Rock Dallas
            </Link>
            <div className="flex gap-5 text-sm text-zinc-600 dark:text-zinc-400">
              <Link href="/demo" className="hover:text-foreground">
                Demo
              </Link>
              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </div>
          </nav>
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
