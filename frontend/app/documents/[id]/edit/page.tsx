"use client";

import React, { useEffect, useState, Suspense } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DocumentUploadForm } from "@/features/documents/DocumentUploadForm";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter, useParams } from "next/navigation";
import { PaymentDocument } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";

function EditDocumentContent() {
  const routeParams = useParams();
  const rawId = routeParams?.id;
  const docId = rawId ? parseInt(Array.isArray(rawId) ? rawId[0] : rawId, 10) : NaN;
  const { currentUser, documents, updateDocument, addToast, loading } = useSipandu();
  const router = useRouter();

  const [documentData, setDocumentData] = useState<PaymentDocument | null>(null);
  const [fetchingDoc, setFetchingDoc] = useState(true);

  useEffect(() => {
    if (isNaN(docId)) return;

    // Cari dari cache context terlebih dahulu
    const found = documents.find((d) => d.id === docId);
    if (found) {
      if (found.status !== "draft" && found.status !== "dikembalikan" && found.status !== "ditolak") {
        addToast("warning", "Dokumen Terkunci", `Dokumen ${found.nomor_surat} berstatus "${found.legend_status || found.status}" dan tidak dapat diedit.`);
        router.push("/documents");
        return;
      }
      setDocumentData(found);
      setFetchingDoc(false);
    } else {
      // Ambil langsung jika refresh di halaman edit
      sipanduApi
        .getDocuments()
        .then((res) => {
          if (res.success) {
            const doc = res.data.find((d: PaymentDocument) => d.id === docId);
            if (doc) {
              if (doc.status !== "draft" && doc.status !== "dikembalikan" && doc.status !== "ditolak") {
                addToast("warning", "Dokumen Terkunci", `Dokumen ${doc.nomor_surat} berstatus "${doc.legend_status || doc.status}" dan tidak dapat diedit.`);
                router.push("/documents");
                return;
              }
              setDocumentData(doc);
            } else {
              addToast("error", "Dokumen Tidak Ditemukan", `ID #${docId} tidak ada di database.`);
              router.push("/documents");
            }
          }
        })
        .catch((err) => {
          addToast("error", "Error", err.message);
          router.push("/documents");
        })
        .finally(() => {
          setFetchingDoc(false);
        });
    }
  }, [docId, documents, addToast, router]);

  const handleUpdate = async (formData: FormData): Promise<boolean> => {
    const success = await updateDocument(docId, formData);
    if (success) {
      router.push("/documents");
      return true;
    }
    return false;
  };

  if (fetchingDoc) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12">
          <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium mt-3">
            {isNaN(docId) ? "Memuat berkas dokumen..." : `Memuat berkas dokumen #${docId}...`}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (!documentData) {
    return null;
  }

  return (
    <DashboardLayout>
      <DocumentUploadForm
        key={`edit-${documentData.id}`}
        currentUser={currentUser}
        initialData={documentData}
        onSubmit={handleUpdate}
        onCancel={() => router.push("/documents")}
        loading={loading}
      />
    </DashboardLayout>
  );
}

export default function EditDocumentPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center p-12">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-slate-500 font-medium mt-3">Memuat halaman edit...</span>
          </div>
        </DashboardLayout>
      }
    >
      <EditDocumentContent />
    </Suspense>
  );
}
