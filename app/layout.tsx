import React from 'react';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polymarket | Prediction Terminal",
  description: "The official $polymarket prediction market on Solana. Bet on the future.",
  icons: {
    icon: "https://img.cryptorank.io/coins/polymarket1671006384460.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{
          __html: `
            tailwind.config = {
              theme: {
                extend: {
                  fontFamily: {
                    sans: ['"Space Grotesk"', 'sans-serif'],
                  },
                }
              }
            }
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              background: #1d4ed8;
              color: #ffffff;
              min-height: 100vh;
              margin: 0;
            }
            .text-outline {
              text-shadow: -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000;
            }
            .custom-scroll::-webkit-scrollbar { width: 8px; }
            .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
            .custom-scroll::-webkit-scrollbar-thumb { background: white; border-radius: 4px; }
          `
        }} />
      </head>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}