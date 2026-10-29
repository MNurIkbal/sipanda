"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { User, PaymentDocument, AuditTrail, MonitoringStats, AppNotification } from "@/types/sipandu.types";
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
  notifications: AppNotification[];
  unreadNotificationCount: number;
  loading: boolean;
  selectedDoc: PaymentDocument | null;
  
  // Actions
  login: (user: User, token: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  fetchAllData: () => Promise<void>;
  addToast: (type: ToastType, title: string, message: string) => void;
  removeToast: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  
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
  advanceStage: (nextStage: string, stageLabel: string, customNote?: string) => Promise<boolean>;
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

  // Notifications state (Notifikasi untuk Biro 01 & PPK)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

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

  // Handler Notifikasi (Role-scoped)
  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (currentUser) {
        try {
          localStorage.setItem(`sipandu_notifications_${currentUser.role}`, JSON.stringify(updated));
          // Simpan juga ID notifikasi yang sudah dibaca secara permanen
          const readIds: string[] = JSON.parse(localStorage.getItem(`sipandu_notifs_read_${currentUser.role}`) || "[]");
          if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem(`sipandu_notifs_read_${currentUser.role}`, JSON.stringify(readIds));
          }
        } catch (e) {}
      }
      return updated;
    });
  }, [currentUser]);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (currentUser) {
        try {
          localStorage.setItem(`sipandu_notifications_${currentUser.role}`, JSON.stringify(updated));
          const allIds = updated.map((n) => n.id);
          localStorage.setItem(`sipandu_notifs_read_${currentUser.role}`, JSON.stringify(allIds));
        } catch (e) {}
      }
      return updated;
    });
  }, [currentUser]);

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => {
      if (currentUser) {
        try {
          localStorage.removeItem(`sipandu_notifications_${currentUser.role}`);
          // Catat semua id yang dihapus/dibersihkan agar tidak di-generate ulang setelah refresh
          const dismissed: string[] = JSON.parse(localStorage.getItem(`sipandu_notifs_dismissed_${currentUser.role}`) || "[]");
          const currentIds = prev.map((n) => n.id);
          const newDismissed = Array.from(new Set([...dismissed, ...currentIds]));
          localStorage.setItem(`sipandu_notifs_dismissed_${currentUser.role}`, JSON.stringify(newDismissed));
        } catch (e) {}
      }
      return [];
    });
  }, [currentUser]);

  // Check LocalStorage Session on Mount
  useEffect(() => {
    const savedUser = localStorage.getItem("sipandu_user");
    const savedToken = localStorage.getItem("sipandu_token");
    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser(parsedUser);
        setAuthToken(savedToken);

        const savedNotifs = localStorage.getItem(`sipandu_notifications_${parsedUser.role}`);
        if (savedNotifs) {
          try {
            setNotifications(JSON.parse(savedNotifs));
          } catch (e) {}
        }
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
        sipanduApi.getDocuments({ user_role: currentUser?.role }),
        sipanduApi.getStats(),
        sipanduApi.getAuditTrail(),
        sipanduApi.getUsers(),
      ]);

      if (resDocs.success) {
        if (Array.isArray(resDocs.data)) {
          setDocuments(resDocs.data);
        } else if (resDocs.data && Array.isArray(resDocs.data.documents)) {
          setDocuments(resDocs.data.documents);
        }
      }
      if (resStats.success) setStats(resStats.data);
      if (resAudit.success) {
        setAuditLogs(Array.isArray(resAudit.data) ? resAudit.data : resAudit.data.logs || []);
      }
      if (resUsers.success) setUserList(resUsers.data);
    } catch (err: any) {
      addToast("error", "Koneksi Error", "Gagal memuat data dari server: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [addToast, currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser, fetchAllData]);

  // Sinkronisasi otomatis notifikasi berdasarkan role pengguna yang sedang login:
  // - biro_01: HANYA menerima notifikasi ketika PPK baru kirim daftar dokumen & kirim ulang revisi.
  // - ppk: HANYA menerima notifikasi ketika dokumen dikembalikan (revisi) atau disetujui oleh biro_01.
  useEffect(() => {
    if (!documents || documents.length === 0 || !currentUser) return;

    setNotifications((prev) => {
      // Ambil daftar status read dari state saat ini DAN localStorage
      const readMap = new Map<string, boolean>();
      try {
        const storedReadIds: string[] = JSON.parse(
          localStorage.getItem(`sipandu_notifs_read_${currentUser.role}`) || "[]"
        );
        storedReadIds.forEach((id) => readMap.set(id, true));
      } catch (e) {}

      prev.forEach((n) => {
        if (n.read) readMap.set(n.id, true);
        else if (!readMap.has(n.id)) readMap.set(n.id, false);
      });

      // Ambil daftar notifikasi yang sudah dihapus/dibersihkan oleh user
      const dismissedSet = new Set<string>();
      try {
        const dismissedIds: string[] = JSON.parse(
          localStorage.getItem(`sipandu_notifs_dismissed_${currentUser.role}`) || "[]"
        );
        dismissedIds.forEach((id) => dismissedSet.add(id));
      } catch (e) {}

      const roleNotifList: AppNotification[] = [];

      // A. Jika yang login adalah BIRO 01:
      // Hanya tampilkan dokumen yang baru dikirim PPK (menunggu_verifikasi) atau dikirim ulang revisi (menunggu_verifikasi_ulang)
      if (currentUser.role === "biro_01") {
        if (auditLogs && auditLogs.length > 0) {
          auditLogs.forEach((log) => {
            const action = (log.action || "").toUpperCase();
            const docId = log.document_id || 0;
            const noSurat = log.nomor_surat || "-";

            // 1. PPK baru kirim dokumen
            if (action.includes("CREATE") || action === "CREATE_DOCUMENT") {
              const id = `biro-notif-create-${log.id}`;
              roleNotifList.push({
                id,
                document_id: docId,
                nomor_surat: noSurat,
                title: "Daftar Dokumen Baru Masuk",
                message: `PPK (${log.user_name || "Petugas"}) baru saja mengirimkan berkas pembayaran ${noSurat} untuk diverifikasi.`,
                type: "new_submission",
                timestamp: log.created_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "biro_01",
              });
            }

            // 2. PPK kirim ulang berkas revisi
            if (action.includes("REVISE") || action === "REVISE_DOCUMENT") {
              const id = `biro-notif-revise-${log.id}`;
              roleNotifList.push({
                id,
                document_id: docId,
                nomor_surat: noSurat,
                title: "Dokumen Dikirim Ulang (Revisi)",
                message: `PPK (${log.user_name || "Petugas"}) telah mengirimkan ulang berkas revisi ${noSurat} untuk diverifikasi kembali.`,
                type: "resubmission",
                timestamp: log.created_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "biro_01",
              });
            }
          });
        }

        // Fallback dari daftar status dokumen yang aktif menunggu tindakan verifikasi
        documents.forEach((doc) => {
          if (doc.status === "submit_dokumen" || doc.status === "menunggu_verifikasi") {
            const id = `biro-doc-submit-${doc.id}`;
            if (!roleNotifList.some((n) => n.id === id || (n.document_id === doc.id && n.type === "new_submission"))) {
              roleNotifList.push({
                id,
                document_id: doc.id,
                nomor_surat: doc.nomor_surat,
                perihal: doc.perihal || doc.nama_kegiatan,
                title: "Daftar Dokumen Baru Masuk",
                message: `Dokumen ${doc.nomor_surat} (${doc.jenis_dokumen || doc.kategori || "SPP/SPM"}) baru saja disubmit dan menunggu verifikasi.`,
                type: "new_submission",
                timestamp: doc.updated_at || doc.created_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "biro_01",
              });
            }
          } else if (doc.status === "menunggu_verifikasi_ulang") {
            const id = `biro-doc-mvu-${doc.id}`;
            if (!roleNotifList.some((n) => n.id === id || (n.document_id === doc.id && n.type === "resubmission"))) {
              roleNotifList.push({
                id,
                document_id: doc.id,
                nomor_surat: doc.nomor_surat,
                perihal: doc.perihal || doc.nama_kegiatan,
                title: "Dokumen Dikirim Ulang (Revisi)",
                message: `Dokumen ${doc.nomor_surat} telah diperbaiki oleh PPK dan siap diverifikasi ulang.`,
                type: "resubmission",
                timestamp: doc.updated_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "biro_01",
              });
            }
          }
        });
      }

      // B. Jika yang login adalah PPK:
      // Hanya tampilkan notifikasi saat dokumen dikembalikan (revisi) atau disetujui (lengkap_valid)
      else if (currentUser.role === "ppk") {
        if (auditLogs && auditLogs.length > 0) {
          auditLogs.forEach((log) => {
            const action = (log.action || "").toUpperCase();
            const docId = log.document_id || 0;
            const noSurat = log.nomor_surat || "-";

            // 1. Dokumen disetujui oleh Biro 01
            if (action.includes("APPROVE") || action === "VERIFY_APPROVE") {
              const id = `ppk-notif-approve-${log.id}`;
              roleNotifList.push({
                id,
                document_id: docId,
                nomor_surat: noSurat,
                title: "Dokumen Disetujui",
                message: `Dokumen ${noSurat} telah disetujui (Lengkap & Valid) oleh ${log.user_name || "Biro 01"}.`,
                type: "approved",
                timestamp: log.created_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "ppk",
              });
            }

            // 2. Dokumen dikembalikan (revisi) oleh Biro 01
            if (action.includes("REJECT") || action === "VERIFY_REJECT") {
              const id = `ppk-notif-reject-${log.id}`;
              roleNotifList.push({
                id,
                document_id: docId,
                nomor_surat: noSurat,
                title: "Dokumen Dikembalikan (Perlu Revisi)",
                message: `Dokumen ${noSurat} dikembalikan oleh ${log.user_name || "Biro 01"}. Silakan periksa catatan revisi.`,
                type: "rejected",
                timestamp: log.created_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "ppk",
              });
            }
          });
        }

        // Fallback dari status dokumen aktif
        documents.forEach((doc) => {
          if (doc.status === "dikembalikan") {
            const id = `ppk-doc-dikembalikan-${doc.id}`;
            if (!roleNotifList.some((n) => n.id === id || (n.document_id === doc.id && n.type === "rejected"))) {
              roleNotifList.push({
                id,
                document_id: doc.id,
                nomor_surat: doc.nomor_surat,
                perihal: doc.perihal || doc.nama_kegiatan,
                title: "Dokumen Dikembalikan (Perlu Revisi)",
                message: `Dokumen ${doc.nomor_surat} dikembalikan oleh Biro 01: "${doc.catatan_revisi || "Mohon perbaiki berkas pendukung"}"`,
                type: "rejected",
                timestamp: doc.tanggal_verifikasi || doc.updated_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "ppk",
              });
            }
          } else if (doc.status === "lengkap_valid" || doc.status === "sedang_diproses" || doc.status === "dana_cair") {
            const id = `ppk-doc-valid-${doc.id}`;
            if (!roleNotifList.some((n) => n.id === id || (n.document_id === doc.id && n.type === "approved"))) {
              roleNotifList.push({
                id,
                document_id: doc.id,
                nomor_surat: doc.nomor_surat,
                perihal: doc.perihal || doc.nama_kegiatan,
                title: "Dokumen Disetujui",
                message: `Dokumen ${doc.nomor_surat} telah diverifikasi dan disetujui (Lengkap/Valid).`,
                type: "approved",
                timestamp: doc.tanggal_verifikasi || doc.updated_at || new Date().toISOString(),
                read: readMap.get(id) ?? false,
                target_role: "ppk",
              });
            }
          }
        });
      }

      // C. Role Superadmin (melihat kedua tipe)
      else {
        documents.forEach((doc) => {
          if (doc.status === "menunggu_verifikasi" || doc.status === "menunggu_verifikasi_ulang") {
            const id = `admin-doc-${doc.status === "menunggu_verifikasi" ? "mv" : "mvu"}-${doc.id}`;
            roleNotifList.push({
              id,
              document_id: doc.id,
              nomor_surat: doc.nomor_surat,
              perihal: doc.perihal || doc.nama_kegiatan,
              title: doc.status === "menunggu_verifikasi" ? "Dokumen Baru Masuk" : "Dokumen Dikirim Ulang",
              message: `Dokumen ${doc.nomor_surat} menunggu verifikasi.`,
              type: doc.status === "menunggu_verifikasi" ? "new_submission" : "resubmission",
              timestamp: doc.updated_at || doc.created_at || new Date().toISOString(),
              read: readMap.get(id) ?? false,
              target_role: "all",
            });
          }
        });
      }

      // Saring notifikasi yang sudah pernah dibersihkan/dihapus oleh user
      const finalNotifList = roleNotifList.filter((n) => !dismissedSet.has(n.id));

      // Urutkan dari notifikasi terbaru ke terlama
      finalNotifList.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      try {
        localStorage.setItem(`sipandu_notifications_${currentUser.role}`, JSON.stringify(finalNotifList));
      } catch (e) {}

      return finalNotifList;
    });
  }, [documents, auditLogs, currentUser]);

  const login = (user: User, token: string) => {
    setCurrentUser(user);
    setAuthToken(token);
    localStorage.setItem("sipandu_user", JSON.stringify(user));
    localStorage.setItem("sipandu_token", token);

    const savedNotifs = localStorage.getItem(`sipandu_notifications_${user.role}`);
    if (savedNotifs) {
      try {
        setNotifications(JSON.parse(savedNotifs));
      } catch (e) {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }

    addToast("success", "Login Berhasil", `Selamat datang kembali, ${user.full_name}!`);
    router.push("/dashboard");
  };

  const logout = () => {
    setCurrentUser(null);
    setAuthToken(null);
    setNotifications([]);
    localStorage.removeItem("sipandu_user");
    localStorage.removeItem("sipandu_token");
    addToast("info", "Sesi Berakhir", "Anda telah keluar dari aplikasi SIPANDA.");
    router.push("/login");
  };

  const switchUser = (userId: string) => {
    const found = userList.find((u) => u.id === parseInt(userId));
    if (found) {
      setCurrentUser(found);
      localStorage.setItem("sipandu_user", JSON.stringify(found));

      const savedNotifs = localStorage.getItem(`sipandu_notifications_${found.role}`);
      if (savedNotifs) {
        try {
          setNotifications(JSON.parse(savedNotifs));
        } catch (e) {
          setNotifications([]);
        }
      } else {
        setNotifications([]);
      }

      addToast(
        "info",
        "Beralih Pengguna",
        `Sekarang masuk sebagai ${found.full_name} (${found.role === "biro_01" ? "Biro 01" : "PPK"})`
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

    // Jika yang membuka adalah Biro 01 dan statusnya masih 'submit_dokumen', 'menunggu_verifikasi', atau 'menunggu_verifikasi_ulang', otomatis update ke 'review'
    if (
      currentUser?.role === "biro_01" &&
      (doc.status === "submit_dokumen" || doc.status === "menunggu_verifikasi" || doc.status === "menunggu_verifikasi_ulang")
    ) {
      // Optimistic update status ke 'review' langsung di state
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: "review", legend_status: "Review", legend_color: "blue" }
            : d
        )
      );
      setSelectedDoc((prev) =>
        prev && prev.id === doc.id
          ? { ...prev, status: "review", legend_status: "Review", legend_color: "blue" }
          : prev
      );

      sipanduApi.markAsReview(doc.id, {
        user_name: currentUser.full_name,
        user_role: currentUser.role,
      }).then((res) => {
        if (res.success && res.data) {
          const updated = res.data;
          setDocuments((prev) =>
            prev.map((d) => (d.id === doc.id ? { ...d, ...updated } : d))
          );
          setSelectedDoc((prev) => (prev && prev.id === doc.id ? { ...prev, ...updated } : prev));
        }
      }).catch(() => {});
    }
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
        formData.append("user_name", currentUser.full_name);
        formData.append("user_role", currentUser.role);
      }
      const res = await sipanduApi.createDocument(formData);
      if (res.success) {
        addToast("success", "Dokumen Berhasil Dibuat", "Dokumen berhasil disimpan sebagai draft. Silakan lengkapi berkas di menu Dokumen Pendukung.");
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
          addToast("success", "Dokumen Disetujui", "Dokumen telah diverifikasi dan berstatus Disetujui!");
        } else {
          addToast("warning", "Dokumen Ditolak", "Dokumen telah ditolak dan dikembalikan ke PPK untuk diperbaiki.");
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
        addToast("success", "Pengajuan Ulang Berhasil", "Dokumen telah diajukan ulang ke Biro 01 Keuangan!");
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

  const advanceStage = async (nextStage: string, stageLabel: string, customNote?: string): Promise<boolean> => {
    if (!selectedDoc) return false;
    try {
      setLoading(true);
      const res = await sipanduApi.updateStage(selectedDoc.id, {
        next_stage: nextStage,
        user_name: currentUser?.full_name,
        user_role: currentUser?.role,
        note: customNote || `Tahapan pembayaran dimajukan ke ${stageLabel}`,
      });
      if (res.success) {
        addToast("success", "Tahapan Berubah", `Status dokumen diperbarui ke ${stageLabel}`);
        
        // Update selectedDoc dan list documents langsung di state agar tidak perlu tutup & buka modal
        const updatedDoc = res.data || {
          ...selectedDoc,
          status: nextStage,
          legend_status: stageLabel,
        };
        setSelectedDoc(updatedDoc);
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => (doc.id === selectedDoc.id ? { ...doc, ...updatedDoc } : doc))
        );

        // Jika alur selesai (dana_cair), modal bisa ditutup otomatis setelah delay atau dibiarkan selesai
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

  // Hitung notifikasi unread sesuai role pengguna aktif
  const filteredNotifications = notifications.filter((notif) => {
    if (!currentUser) return false;
    if (currentUser.role === "biro_01") {
      return notif.target_role === "biro_01" || notif.target_role === "all";
    }
    if (currentUser.role === "ppk") {
      return notif.target_role === "ppk" || notif.target_role === "all";
    }
    // Superadmin dapat melihat semua notifikasi
    return true;
  });

  const unreadNotificationCount = filteredNotifications.filter((n) => !n.read).length;

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
        notifications: filteredNotifications,
        unreadNotificationCount,
        loading,
        selectedDoc,
        login,
        logout,
        switchUser,
        fetchAllData,
        addToast,
        removeToast,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearNotifications,
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
          currentUser={currentUser}
          auditLogs={auditLogs}
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
