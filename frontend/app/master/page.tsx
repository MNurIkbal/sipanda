"use client";

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MasterDataView } from "@/features/master/MasterDataView";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function MasterRoute() {
  const { currentUser, isInitializing, addToast } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    // Validasi otorisasi: Menu Master Data KHUSUS superadmin
    if (!isInitializing && currentUser && currentUser.role !== "superadmin") {
      addToast("warning", "Akses Dibatasi", "Hanya Superadmin yang memiliki izin mengakses Master Data.");
      router.replace("/dashboard");
    }
  }, [currentUser, isInitializing, router, addToast]);

  if (currentUser && currentUser.role !== "superadmin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Hanya Superadmin yang memiliki izin akses ke modul Master Data. Mengalihkan Anda kembali...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <React.Suspense
        fallback={
          <div className="p-8 text-center">
            <div className="h-7 w-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span className="text-xs text-slate-500 font-semibold">Memuat Master Data...</span>
          </div>
        }
      >
        <MasterDataView />
      </React.Suspense>
    </DashboardLayout>
  );
}

