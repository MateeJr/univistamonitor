import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "@/components/NavBar";
import PresenceManager from "@/components/presence/PresenceManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Univista Monitor",
  description: "Univista Monitor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-[#ededed] min-h-[100dvh] overflow-x-hidden`}>
        <NavBar />
        <PresenceManager />
        <div className="pt-[80px] md:pt-0 md:pl-[96px] box-border overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
