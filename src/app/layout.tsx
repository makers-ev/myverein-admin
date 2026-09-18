import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { siteConfig } from "@/config/site";
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
  title: `${siteConfig.appName} — Admin`,
  description: siteConfig.tagline,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // next-themes injects a raw inline <script> (FOUC prevention) and,
  // mid-session, an inline <style> (disableTransitionOnChange) -- both need
  // this request's CSP nonce explicitly passed through, or this app's
  // nonce-based CSP (proxy.ts) silently blocks both on every single page,
  // not just ones using next-themes directly.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: next-themes sets `dark` on <html> via a
          pre-hydration inline script, intentionally differing from the
          server-rendered class list. Scoped to this one element only. */}
      <body className="min-h-full bg-background">
        <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
