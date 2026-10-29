"use client";

import React, { useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DocumentList } from "@/features/documents/DocumentList";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default function DocumentsPage() {
  const {
    documents,
    currentUser,
    openVerifyModal,
    openRevisiModal,
    openDetailModal,
    deleteDocument,
    fetchAllData,
    loading,
    addToast,
  } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    if (currentUser?.role === "superadmin") {
      addToast("warning", "Akses Dibatasi", "Role Superadmin tidak diizinkan mengakses menu Daftar Dokumen.");
      router.replace("/dashboard");
    }
  }, [currentUser, router, addToast]);

  if (currentUser?.role === "superadmin") {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-slate-200">
          <ShieldAlert className="h-12 w-12 text-rose-500 mb-3" />
          <h2 className="text-base font-bold text-slate-800">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md">
            Role Super Administrator tidak memiliki izin akses ke modul Daftar Dokumen. Mengalihkan Anda kembali...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DocumentList
        documents={documents}
        currentUser={currentUser}
        onNavigateToUpload={() => router.push("/documents/create")}
        onOpenVerify={openVerifyModal}
        onOpenRevisi={openRevisiModal}
        onOpenDetail={openDetailModal}
        onOpenEdit={(doc) => router.push(`/documents/${doc.id}/edit`)}
        onDeleteDocument={async (doc) => {
          await deleteDocument(doc);
        }}
        onRefresh={fetchAllData}
        loading={loading}
      />
    </DashboardLayout>
  );
}
