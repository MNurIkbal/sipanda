"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
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
  const allMenuItems = [
    {
      id: "dashboard",
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
      description: "Statistik real-time & KPI",
      match: (path: string) => path === "/dashboard" || path === "/",
    },
    {
      id: "monitoring",
      href: "/monitoring",
      label: "Monitoring",
      icon: Activity,
      badge: null,
      description: "Timeline proses pembayaran",
      match: (path: string) => path === "/monitoring",
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

  const menuItems = allMenuItems.filter((item) => {
    // Biro 01 tidak boleh akses User Management
    if (item.id === "users" && currentUser?.role === "biro_01") {
      return false;
    }
    return true;
  });

  return (
    <aside className="w-64 fixed top-0 bottom-0 left-0 h-screen z-30 border-r border-slate-800/80 bg-[#070d1e] text-slate-300 flex flex-col justify-between hidden md:flex shadow-2xl select-none overflow-hidden">
      
      {/* Background Image Layer (Pattern Clearly Visible) */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-65"
        style={{
          backgroundImage: "url('/sidebar-pattern.jpg')",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      ></div>

      {/* Lightened Tint Gradient Overlay to Reveal the Image */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1329]/50 via-[#0f172a]/45 to-[#070d1e]/60 pointer-events-none"></div>
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 -left-20 w-48 h-48 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-20 -right-20 w-48 h-48 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Brand Header Inside Full Height Sidebar */}
      <div className="relative z-10 h-16 px-5 border-b border-white/[0.08] flex items-center gap-3 shrink-0 bg-slate-950/20 backdrop-blur-xs">
        <Link href="/dashboard" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-500 rounded-xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 p-2 text-white shadow-md border border-white/20">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-base font-black text-white tracking-tight leading-tight">
              SIPANDA
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate">
              Sistem Dokumen Pembayaran
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Section */}
      <div className="relative z-10 flex flex-col flex-1 p-4 space-y-5 overflow-y-auto">
        
        {/* User Role Card */}
        <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] backdrop-blur-md p-3.5 text-white shadow-lg border border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/20 shrink-0">
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

    </aside>
  );
};
