"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DocumentList } from "@/features/documents/DocumentList";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";

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
  } = useSipandu();
  const router = useRouter();

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
