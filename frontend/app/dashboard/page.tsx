"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MonitoringDashboard } from "@/features/monitoring/MonitoringDashboard";
import { useSipandu } from "@/context/SipanduContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const {
    stats,
    documents,
    currentUser,
    openVerifyModal,
    openRevisiModal,
    openDetailModal,
  } = useSipandu();
  const router = useRouter();

  return (
    <DashboardLayout>
      <MonitoringDashboard
        stats={stats}
        documents={documents}
        currentUser={currentUser}
        onNavigateToUpload={() => router.push("/documents/create")}
        onNavigateToDocuments={() => router.push("/documents")}
        onOpenVerify={openVerifyModal}
        onOpenRevisi={openRevisiModal}
        onOpenDetail={openDetailModal}
      />
    </DashboardLayout>
  );
}
