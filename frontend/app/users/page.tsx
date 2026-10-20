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
    if (currentUser && currentUser.role !== "superadmin") {
      addToast("warning", "Akses Dibatasi", "Hanya Superadmin yang memiliki izin mengakses menu Pengguna.");
      router.replace("/dashboard");
    }
  }, [currentUser, router, addToast]);

  if (currentUser && currentUser.role !== "superadmin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Hanya Superadmin yang memiliki izin akses ke modul Pengguna. Mengalihkan Anda kembali...
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
