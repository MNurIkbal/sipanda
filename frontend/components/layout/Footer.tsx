import React from "react";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white/80 backdrop-blur-md text-slate-500 py-4 transition-colors">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-xs text-slate-500 font-medium tracking-wide">
          Copyright © {currentYear}{" "}
          <span className="font-bold text-slate-700">SIPANDA</span> • Sistem Monitoring & Verifikasi Pembayaran. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};
