"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { AuditTrailList } from "@/features/audit/AuditTrailList";
import { useSipandu } from "@/context/SipanduContext";

export default function AuditTrailPage() {
  const { auditLogs } = useSipandu();

  return (
    <DashboardLayout>
      <AuditTrailList logs={auditLogs} />
    </DashboardLayout>
  );
}
