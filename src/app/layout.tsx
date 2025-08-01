import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Multiplayer Connect 4 - Play with Friends Online",
  description:
    "Play Connect 4 online with friends! Customize your name, color, and grid size, then share the link to challenge others in real-time multiplayer games.",
  keywords: [
    "Connect 4",
    "multiplayer game",
    "online board games",
    "real-time gaming",
    "play with friends",
    "customizable grid",
    "browser games",
  ],
  authors: [{ name: "Zach Bush" }],
  openGraph: {
    title: "Multiplayer Connect 4 - Play Online with Friends",
    description:
      "Challenge your friends to Connect 4 online! Set your name, choose your color, and play on customizable grids in real-time multiplayer mode.",
    url: "https://connect4online.repl.it",
    siteName: "Connect 4 Games",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multiplayer Connect 4 - Play Online with Friends",
    description:
      "Challenge friends to a real-time Connect 4 match online. Customize your color, name, and grid size for fun, competitive games!",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
