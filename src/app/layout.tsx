import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Inter, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { CommandPalette } from "@/components/global/CommandPalette";
import { ShortcutCheatSheet } from "@/components/global/ShortcutCheatSheet";
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-serif", style: ['normal', 'italic'] });

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Redline Platform",
  description: "AI-powered contract analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, newsreader.variable)}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <CommandPalette />
          <ShortcutCheatSheet />
        </ThemeProvider>
      </body>
    </html>
  );
}
