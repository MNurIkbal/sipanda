"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSipandu } from "@/context/SipanduContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isInitializing, userList, switchUser, logout, addToast } = useSipandu();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Memuat SIPANDA...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans relative overflow-x-hidden selection:bg-blue-600 selection:text-white">
      {/* Decorative High-End Background: Aurora Silk Mesh & Floating Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Multi-stop Ambient Mesh Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.12),rgba(255,255,255,0))]"></div>

        {/* Fluid Aurora Top Waves */}
        <div className="absolute -top-40 left-1/4 w-[750px] h-[480px] bg-gradient-to-r from-blue-500/15 via-indigo-400/12 to-cyan-300/15 rounded-full blur-[90px] transform -rotate-12"></div>
        <div className="absolute top-1/4 -right-40 w-[600px] h-[550px] bg-gradient-to-bl from-indigo-500/10 via-purple-400/8 to-blue-400/10 rounded-full blur-[100px]"></div>
        
        {/* Floating Decorative Rings & Geometry */}
        <div className="absolute top-28 right-16 w-80 h-80 border border-blue-500/10 rounded-full pointer-events-none"></div>
        <div className="absolute top-44 right-32 w-52 h-52 border border-indigo-400/10 rounded-full pointer-events-none"></div>
        <div className="absolute top-36 right-24 w-2 h-2 rounded-full bg-blue-400/30"></div>
        <div className="absolute top-72 right-48 w-1.5 h-1.5 rounded-full bg-indigo-400/30"></div>
        <div className="absolute top-52 right-80 w-1 h-1 rounded-full bg-cyan-400/40"></div>

        {/* Bottom Ambient Soft Tint */}
        <div className="absolute -bottom-48 left-1/3 w-[650px] h-[450px] bg-gradient-to-tr from-sky-400/10 via-slate-200/30 to-blue-300/10 rounded-full blur-[110px]"></div>
      </div>

      <Header
        currentUser={currentUser}
        userList={userList}
        onSwitchUser={switchUser}
        onLogout={logout}
        onShowToast={addToast}
        onToggleSidebar={() => setMobileSidebarOpen((prev) => !prev)}
      />

      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex flex-col flex-1 pt-14 md:ml-64 transition-all duration-300 min-h-screen relative z-10">
        <main className="flex-1 px-3 sm:px-5 md:px-6 py-4 w-full animate-in fade-in duration-200">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
