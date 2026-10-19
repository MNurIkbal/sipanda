"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Users,
  RefreshCw,
  Sparkles,
  Database,
  FileCheck2
} from "lucide-react";
import { useSipandu } from "@/context/SipanduContext";

export const Sidebar: React.FC = () => {
  const { currentUser, documents, loading, fetchAllData } = useSipandu();
  const pathname = usePathname();

  // Navigation Menu Items with their respective routes
  const menuItems = [
    {
      id: "monitoring",
      href: "/monitoring",
      label: "Monitoring & Dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Statistik real-time & progress",
      match: (path: string) => path === "/monitoring" || path === "/",
    },
    {
      id: "documents",
      href: "/documents",
      label: "Daftar Dokumen",
      icon: FileText,
      badge: documents.length,
      description: "Pencarian & tracking berkas",
      match: (path: string) => path.startsWith("/documents"),
    },
    {
      id: "audit",
      href: "/audit",
      label: "Audit Trail",
      icon: ShieldCheck,
      badge: null,
      description: "Log aktivitas & integritas",
      match: (path: string) => path.startsWith("/audit"),
    },
    {
      id: "users",
      href: "/users",
      label: "User Management",
      icon: Users,
      badge: null,
      description: "Hak akses & akun sistem",
      match: (path: string) => path.startsWith("/users"),
    },
  ];

  return (
    <aside className="w-64 fixed inset-y-0 left-0 z-30 border-r border-slate-800/80 bg-gradient-to-b from-[#0b1329] via-[#0f172a] to-[#070d1e] text-slate-300 flex flex-col justify-between hidden md:flex shadow-2xl select-none overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 -left-20 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -right-20 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none"></div>

      {/* Brand Header Inside Full Height Sidebar */}
      <div className="relative z-10 h-16 px-5 border-b border-white/[0.08] flex items-center gap-3 shrink-0 bg-white/[0.02]">
        <Link href="/monitoring" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 p-2 text-white shadow-md border border-white/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-white tracking-tight leading-tight">
              SIPANDU
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate">
              Sistem Dokumen Pembayaran
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="relative z-10 flex flex-col flex-1 p-4 space-y-5 overflow-y-auto">
        
        {/* Active Role Card - Deep Glassmorphism Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-md p-3.5 text-white shadow-xl border border-white/[0.08] group transition hover:border-white/[0.15]">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-amber-400" />
              Sesi Login
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[9px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/20">
              {currentUser?.role === "biro_01" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-xs text-white truncate tracking-tight">
                {currentUser?.role === "biro_01" ? "Biro 01 Verifikator" : "PPK Operasional"}
              </div>
              <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {currentUser?.full_name || "Petugas"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div>
          <div className="px-3 mb-2.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400/80">
            Menu Utama
          </div>

          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.match(pathname);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/30 border border-white/20"
                      : "text-slate-300 hover:bg-white/[0.07] hover:text-white font-semibold"
                  }`}
                >
                  {/* Left Active Glow Indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-white rounded-r-full shadow-sm"></span>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-white/[0.05] text-slate-400 group-hover:bg-white/[0.1] group-hover:text-sky-300 border border-white/[0.04]"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs leading-tight">{item.label}</div>
                    </div>
                  </div>

                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Sidebar Footer with Sync & Database Info */}
      <div className="relative z-10 p-4 border-t border-white/[0.08] bg-[#070d1e]/80 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="absolute h-3 w-3 rounded-full bg-emerald-400/40 animate-ping"></span>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-200 leading-tight flex items-center gap-1.5">
                <Database className="h-3 w-3 text-sky-400" />
                <span>Server Database</span>
              </div>
              <div className="text-[9px] text-slate-400 font-medium">Sistem Terhubung • Aktif</div>
            </div>
          </div>

          <button
            onClick={() => fetchAllData()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.1] bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 font-bold text-[11px] transition shadow-xs cursor-pointer hover:border-white/20 active:scale-95"
            title="Sinkronisasi ulang data terbaru dari server database"
          >
            <RefreshCw className={`h-3 w-3 text-sky-300 ${loading ? "animate-spin text-sky-400" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

    </aside>
  );
};
