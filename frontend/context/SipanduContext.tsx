"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, PaymentDocument, AuditTrail, MonitoringStats } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { ToastContainer, ToastItem, ToastType } from "@/components/ui/Toast";
import { VerifyModal } from "@/features/verification/VerifyModal";
import { RevisiModal } from "@/features/documents/RevisiModal";
import { DocumentDetailModal } from "@/features/documents/DocumentDetailModal";
import { useRouter } from "next/navigation";

interface SipanduContextType {
  currentUser: User | null;
  authToken: string | null;
  isInitializing: boolean;
  userList: User[];
  documents: PaymentDocument[];
  stats: MonitoringStats | null;
  auditLogs: AuditTrail[];
  loading: boolean;
  selectedDoc: PaymentDocument | null;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  fetchAllData: () => Promise<void>;
  addToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
  
  // Modals
  openVerifyModal: (doc: PaymentDocument) => void;
  openRevisiModal: (doc: PaymentDocument) => void;
  openDetailModal: (doc: PaymentDocument) => void;
  closeModals: () => void;
  
  // Document Operations
  createDocument: (formData: FormData) => Promise<boolean>;
  updateDocument: (docId: number, formData: FormData) => Promise<boolean>;
  deleteDocument: (doc: PaymentDocument) => Promise<boolean>;
  verifyDocument: (action: "approve" | "reject", message: string) => Promise<boolean>;
  submitRevisi: (formData: FormData) => Promise<boolean>;
  advanceStage: (nextStage: string, stageLabel: string) => Promise<boolean>;
}

const SipanduContext = createContext<SipanduContextType | undefined>(undefined);

export const SipanduProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [documents, setDocuments] = useState<PaymentDocument[]>([]);
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditTrail[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modals state
  const [selectedDoc, setSelectedDoc] = useState<PaymentDocument | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showRevisiModal, setShowRevisiModal] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    const newToast: ToastItem = { id, type, title, message };
    setToasts((prev) => [newToast, ...prev]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check LocalStorage Session on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem("sipandu_user");
    const savedToken = localStorage.getItem("sipandu_token");
    if (savedUser && savedToken) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setAuthToken(savedToken);
      } catch (e) {
        localStorage.removeItem("sipandu_user");
        localStorage.removeItem("sipandu_token");
      }
    }
    setIsInitializing(false);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [resDocs, resStats, resAudit, resUsers] = await Promise.all([
        sipanduApi.getDocuments(),
        sipanduApi.getStats(),
        sipanduApi.getAuditTrail(),
        sipanduApi.getUsers(),
      ]);

      if (resDocs.success) setDocuments(resDocs.data);
      if (resStats.success) setStats(resStats.data);
      if (resAudit.success) setAuditLogs(resAudit.data);
      if (resUsers.success) setUserList(resUsers.data);
    } catch (err: any) {
      addToast("error", "Koneksi Error", "Gagal memuat data dari server: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  const login = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("sipandu_user", JSON.stringify(user));
    localStorage.setItem("sipandu_token", token);
    addToast("success", "Login Berhasil", `Selamat datang kembali, ${user.full_name}!`);
    router.push("/monitoring");
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem("sipandu_user");
    localStorage.removeItem("sipandu_token");
    addToast("info", "Sesi Berakhir", "Anda telah keluar dari aplikasi SIPANDU.");
    router.push("/login");
  };

  const switchUser = (userId: string) => {
    const found = userList.find((u) => u.id === parseInt(userId));
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("sipandu_user", JSON.stringify(found));
      addToast(
        "info",
        "Beralih Pengguna",
        `Sekarang masuk sebagai ${found.full_name} (${found.role === "biro_01" ? "Biro 01" : "Petugas"})`
      );
    }
  };

  const openVerifyModal = (doc: PaymentDocument) => {
    setSelectedDoc(doc);
    setShowVerifyModal(true);
  };

  const openRevisiModal = (doc: PaymentDocument) => {
    setSelectedDoc(doc);
    setShowRevisiModal(true);
  };

  const openDetailModal = (doc: PaymentDocument) => {
    setSelectedDoc(doc);
    setShowDetailModal(true);
  };

  const closeModals = () => {
    setShowVerifyModal(false);
    setShowRevisiModal(false);
    setShowDetailModal(false);
  };

  const createDocument = async (formData: FormData): Promise<boolean> => {
    try {
      setLoading(true);
      if (currentUser) {
        formData.append("user_id", currentUser.id.toString());
      }
      const res = await sipanduApi.createDocument(formData);
      if (res.success) {
        addToast("success", "Pengajuan Berhasil", "Dokumen dan berkas berhasil disimpan dan diajukan ke Biro 01!");
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Pengajuan Gagal", res.message || "Terjadi kesalahan.");
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error Server", err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateDocument = async (docId: number, formData: FormData): Promise<boolean> => {
    try {
      setLoading(true);
      if (currentUser) {
        formData.append("user_name", currentUser.full_name);
        formData.append("user_role", currentUser.role);
      }
      const res = await sipanduApi.editDocument(docId, formData);
      if (res.success) {
        addToast("success", "Perubahan Disimpan", "Data dokumen berhasil diperbarui!");
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Gagal Memperbarui", res.message || "Terjadi kesalahan.");
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error Server", err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (doc: PaymentDocument): Promise<boolean> => {
    try {
      const res = await sipanduApi.deleteDocument(doc.id, {
        user_name: currentUser?.full_name,
        user_role: currentUser?.role,
      });

      if (res.success) {
        addToast("success", "Hapus Sukses", `Dokumen "${doc.nomor_surat}" berhasil dihapus dari database!`);
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Hapus Gagal", res.message || "Gagal menghapus dokumen.");
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error Server", err.message);
      return false;
    }
  };

  const verifyDocument = async (action: "approve" | "reject", message: string): Promise<boolean> => {
    if (!selectedDoc) return false;
    try {
      setLoading(true);
      const res = await sipanduApi.verifyDocument(selectedDoc.id, {
        action,
        pesan: message,
        verifier_name: currentUser?.full_name,
        verifier_role: currentUser?.role,
        verifier_id: currentUser?.id.toString(),
      });
      if (res.success) {
        if (action === "approve") {
          addToast("success", "Dokumen Disetujui", "Dokumen telah diverifikasi dan berstatus Lengkap / Valid!");
        } else {
          addToast("warning", "Dokumen Dikembalikan", "Dokumen dikembalikan ke petugas dengan catatan revisi.");
        }
        setShowVerifyModal(false);
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Verifikasi Gagal", res.message);
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error", err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitRevisi = async (formData: FormData): Promise<boolean> => {
    if (!selectedDoc) return false;
    try {
      setLoading(true);
      formData.append("user_name", currentUser?.full_name || "");
      formData.append("user_role", currentUser?.role || "ppk");

      const res = await sipanduApi.reviseDocument(selectedDoc.id, formData);
      if (res.success) {
        addToast("success", "Revisi Terkirim", "Berkas revisi berhasil diunggah dan dikirim ulang ke Biro 01!");
        setShowRevisiModal(false);
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Revisi Gagal", res.message);
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error", err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const advanceStage = async (nextStage: string, stageLabel: string): Promise<boolean> => {
    if (!selectedDoc) return false;
    try {
      setLoading(true);
      const res = await sipanduApi.updateStage(selectedDoc.id, {
        next_stage: nextStage,
        user_name: currentUser?.full_name,
        user_role: currentUser?.role,
        note: `Tahapan pembayaran dimajukan ke ${stageLabel}`,
      });
      if (res.success) {
        addToast("success", "Tahapan Berubah", `Status dokumen diperbarui ke ${stageLabel}`);
        await fetchAllData();
        return true;
      } else {
        addToast("error", "Gagal", res.message);
        return false;
      }
    } catch (err: any) {
      addToast("error", "Error", err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SipanduContext.Provider
      value={{
        currentUser,
        authToken,
        isInitializing,
        userList,
        documents,
        stats,
        auditLogs,
        loading,
        selectedDoc,
        login,
        logout,
        switchUser,
        fetchAllData,
        addToast,
        removeToast,
        openVerifyModal,
        openRevisiModal,
        openDetailModal,
        closeModals,
        createDocument,
        updateDocument,
        deleteDocument,
        verifyDocument,
        submitRevisi,
        advanceStage,
      }}
    >
      <ToastContainer toasts={toasts} onClose={removeToast} />
      {children}

      {showVerifyModal && selectedDoc && (
        <VerifyModal
          document={selectedDoc}
          onClose={() => setShowVerifyModal(false)}
          onVerify={verifyDocument}
          onAdvanceStage={advanceStage}
          loading={loading}
        />
      )}

      {showRevisiModal && selectedDoc && (
        <RevisiModal
          document={selectedDoc}
          onClose={() => setShowRevisiModal(false)}
          onSubmitRevisi={submitRevisi}
          loading={loading}
        />
      )}

      {showDetailModal && selectedDoc && (
        <DocumentDetailModal
          document={selectedDoc}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </SipanduContext.Provider>
  );
};

export const useSipandu = () => {
  const context = useContext(SipanduContext);
  if (!context) {
    throw new Error("useSipandu must be used within a SipanduProvider");
  }
  return context;
};
