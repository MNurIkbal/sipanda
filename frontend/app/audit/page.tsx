"use client";

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuditTrailList } from "@/features/audit/AuditTrailList";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function AuditTrailPage() {
  const { auditLogs, currentUser, addToast } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role === "ppk") {
      addToast("warning", "Akses Dibatasi", "Role PPK tidak diizinkan mengakses menu Audit Trail.");
      router.replace("/dashboard");
    }
  }, [currentUser, router, addToast]);

  if (currentUser?.role === "ppk") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Role PPK tidak memiliki izin akses ke modul Audit Trail. Mengalihkan Anda kembali...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AuditTrailList logs={auditLogs} />
    </DashboardLayout>
  );
}
