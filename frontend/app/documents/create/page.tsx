"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DocumentUploadForm } from "@/features/documents/DocumentUploadForm";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";

export default function CreateDocumentPage() {
  const { currentUser, createDocument, loading } = useSipandu();
  const router = useRouter();

  const handleFormSubmit = async (formData: FormData): Promise<boolean> => {
    const success = await createDocument(formData);
    if (success) {
      router.push("/documents");
      return true;
    }
    return false;
  };

  return (
    <DashboardLayout>
      <DocumentUploadForm
        currentUser={currentUser}
        initialData={null}
        onSubmit={handleFormSubmit}
        onCancel={() => router.push("/documents")}
        loading={loading}
      />
    </DashboardLayout>
  );
}
