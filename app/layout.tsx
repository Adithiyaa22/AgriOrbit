import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import AgriAmbient from "@/components/layout/AgriAmbient";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriOrbit",
  description: "Farmer & Field Data Collection Platform",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2e7d32",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <AgriAmbient />
          <div className="relative z-10 min-h-screen">{children}</div>
        </LanguageProvider>
      </body>
    </html>
  );
}
