import React from "react";
import { ShieldAlert, Lock, AlertOctagon } from "lucide-react";

export const metadata = {
  title: "Akses Diblokir",
  description: "Akses ke situs ini telah diblokir.",
};

export default function AccessBlockedPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100 antialiased selection:bg-rose-500 selection:text-white">
      {/* Background radial effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        {/* Icon Header */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 ring-4 ring-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Situs Ini Diblokir
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Akses ke halaman ini tidak diizinkan. Sambungan Anda telah dibatasi oleh kebijakan keamanan server.
          </p>
        </div>

        {/* Kotak Pemberitahuan Blokir */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-rose-400">
            <AlertOctagon className="w-4 h-4" />
            <span>Pemberitahuan Keamanan</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Jika Anda merasa ini adalah sebuah kesalahan atau memerlukan akses resmi ke layanan ini, silakan hubungi administrator sistem untuk verifikasi lebih lanjut.
          </p>
        </div>

      </div>
    </div>
  );
}
