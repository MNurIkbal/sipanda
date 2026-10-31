import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIPANDA - Platoform Monitoring, Pengendalian, Kepatuhan dan Tata Kelola Pembayaran",
  description: "Platoform Monitoring, Pengendalian, Kepatuhan dan Tata Kelola Pembayaran",
};

import { SipanduProvider } from "@/context/SipanduContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        /> 
      </head>
      <body className="antialiased min-h-screen">
        <SipanduProvider>
          {children}
        </SipanduProvider>
      </body>
    </html>
  );
}
