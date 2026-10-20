"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { MonitoringProcessView } from "@/features/monitoring/MonitoringProcessView";
import { useSipandu } from "@/context/SipanduContext";

export default function MonitoringPage() {
  const { documents, currentUser } = useSipandu();

  return (
    <DashboardLayout>
      <MonitoringProcessView
        documents={documents}
        currentUser={currentUser}
      />
    </DashboardLayout>
  );
}
