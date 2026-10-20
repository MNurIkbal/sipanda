"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ReportView } from "@/features/reports/ReportView";
import { useSipandu } from "@/context/SipanduContext";

export default function ReportsPage() {
  const { currentUser, openDetailModal } = useSipandu();

  return (
    <DashboardLayout>
      <ReportView
        currentUser={currentUser}
        onOpenDetail={openDetailModal}
      />
    </DashboardLayout>
  );
}
