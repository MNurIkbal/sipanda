"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserManagement } from "@/features/users/UserManagement";
import { useSipandu } from "@/context/SipanduContext";

export default function UsersPage() {
  const { currentUser, switchUser, addToast } = useSipandu();

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
