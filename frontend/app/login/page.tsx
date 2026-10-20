"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSipandu } from "@/context/SipanduContext";
import { LoginPage } from "@/features/auth/LoginPage";

export default function LoginRoute() {
  const { currentUser, isInitializing, login } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && currentUser) {
      router.push("/dashboard");
    }
  }, [currentUser, isInitializing, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Memuat SIPANDA...</span>
        </div>
      </div>
    );
  }

  if (currentUser) {
    return null;
  }

  return <LoginPage onLoginSuccess={login} />;
}
