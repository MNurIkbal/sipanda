"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSipandu } from "@/context/SipanduContext";

export default function RootPage() {
  const { currentUser, isInitializing } = useSipandu();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing) {
      if (currentUser) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    }
  }, [currentUser, isInitializing, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-400 font-medium">Mengarahkan ke SIPANDA...</span>
      </div>
    </div>
  );
}
