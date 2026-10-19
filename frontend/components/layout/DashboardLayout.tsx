"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSipandu } from "@/context/SipanduContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isInitializing, userList, switchUser, logout, addToast } = useSipandu();
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
          <span className="text-xs text-slate-400 font-medium">Memuat SIPANDU...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Header
        currentUser={currentUser}
        userList={userList}
        onSwitchUser={switchUser}
        onLogout={logout}
        onShowToast={addToast}
      />

      <div className="flex flex-1 pt-16">
        <Sidebar />

        <main className="flex-1 min-w-0 md:ml-64 px-4 sm:px-6 md:px-8 py-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
