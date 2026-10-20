"use client";

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserManagement } from "@/features/users/UserManagement";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function UsersPage() {
  const { currentUser, switchUser, addToast } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    if (currentUser && currentUser.role === "biro_01") {
      addToast("warning", "Akses Dibatasi", "Role Biro 01 tidak diizinkan mengakses menu User Management.");
      router.replace("/documents");
    }
  }, [currentUser, router, addToast]);

  if (currentUser?.role === "biro_01") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Akses Tidak Diizinkan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Role Biro 01 Verifikator tidak memiliki izin akses ke modul User Management. Mengalihkan Anda kembali...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <UserManagement
        currentUser={currentUser}
        onSwitchUser={switchUser}
        onShowToast={addToast}
      />
    </DashboardLayout>
  );
}
