import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  LogOut,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
  Bell,
  Inbox,
  FilePlus2,
  RotateCw,
  AlertCircle,
  FileText,
  Menu,
} from "lucide-react";
import { User as UserType } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { useSipandu } from "@/context/SipanduContext";
import { formatDateTimeID } from "@/lib/dateFormat";

interface HeaderProps {
  currentUser: UserType | null;
  userList: UserType[];
  onSwitchUser: (userId: string) => void;
  onLogout: () => void;
  onShowToast?: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  userList,
  onSwitchUser,
  onLogout,
  onShowToast,
  onToggleSidebar,
}) => {
  const {
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    documents,
    openVerifyModal,
    openRevisiModal,
    openDetailModal,
  } = useSipandu();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Form Ganti Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const validatePasswordRules = (pwd: string) => {
    if (pwd.length < 8) return "Password minimal 8 karakter!";
    if (!/[A-Z]/.test(pwd)) return "Password harus mengandung minimal 1 huruf besar (A-Z)!";
    if (!/[a-z]/.test(pwd)) return "Password harus mengandung minimal 1 huruf kecil (a-z)!";
    return null;
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (newPassword !== confirmPassword) {
      if (onShowToast) {
        onShowToast("error", "Validasi Gagal", "Konfirmasi password baru tidak cocok!");
      }
      return;
    }

    const ruleError = validatePasswordRules(newPassword);
    if (ruleError) {
      if (onShowToast) {
        onShowToast("error", "Keamanan Password Kurang", ruleError);
      }
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await sipanduApi.changePassword(currentUser.id, {
        currentPassword,
        newPassword,
      });

      if (res.success) {
        if (onShowToast) {
          onShowToast("success", "Password Diperbarui", "Password akun berhasil dienkripsi dan diperbarui!");
        }
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        if (onShowToast) {
          onShowToast("error", "Gagal Ubah Password", res.message || "Terjadi kesalahan.");
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast("error", "Error Server", err.message);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 md:left-64 z-50 h-16 transition-all duration-300 ${
          isScrolled
            ? "bg-white backdrop-blur-md border-b border-slate-200/80 shadow-md"
            : "bg-white border-b border-slate-200/90 shadow-xs"
        }`}
      >
        {/* Subtle Background Pattern Layer */}
        <div
          className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-[0.06] mix-blend-multiply"
          style={{
            backgroundImage: "url('/sidebar-pattern.jpg')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        ></div>

        <div className="relative z-10 flex h-full items-center justify-between gap-4 px-4 md:px-7">
          
          {/* Left Title / Greeting & Burger Menu */}
          <div className="flex items-center gap-2.5">
            {/* Hamburger button for mobile/tablet */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:bg-slate-100 hover:text-blue-600 transition shadow-2xs cursor-pointer active:scale-95"
              aria-label="Buka Navigasi Menu"
              title="Menu Navigasi"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="md:hidden flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 text-white shadow-xs">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <span className="font-black text-slate-900 text-sm tracking-tight">SIPANDA</span>
            </div>

            <div className="hidden md:block">
              <h2 className="text-sm font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <span>Sistem Informasi Pengelolaan Monitoring Dokumen Pembayaran</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            
            {/* Notification Bell Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  if (showProfileMenu) setShowProfileMenu(false);
                }}
                className={`relative flex items-center justify-center h-10 w-10 rounded-2xl border transition shadow-2xs cursor-pointer ${
                  showNotificationMenu
                    ? "bg-blue-50 border-blue-300 text-blue-600"
                    : "bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
                }`}
                title="Notifikasi SIPANDA"
                aria-label="Notifikasi SIPANDA"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xs animate-pulse">
                    {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotificationMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Header Popover */}
                    <div className="p-3.5 bg-gradient-to-r from-slate-50 via-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-blue-100/80 text-blue-700">
                          <Bell className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-tight">
                            Notifikasi Dokumen
                          </h4>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            {unreadNotificationCount > 0
                              ? `${unreadNotificationCount} belum dibaca`
                              : "Semua sudah dibaca"}
                          </span>
                        </div>
                      </div>

                      {notifications.length > 0 && (
                        <div className="flex items-center gap-2">
                          {unreadNotificationCount > 0 && (
                            <button
                              type="button"
                              onClick={() => markAllNotificationsAsRead()}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition cursor-pointer"
                            >
                              Tandai Dibaca
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => clearNotifications()}
                            className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Bersihkan Semua Notifikasi"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Notification List Container */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-10 px-4 text-center">
                          <div className="mx-auto w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                            <Inbox className="h-5 w-5" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">Belum ada notifikasi</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {currentUser?.role === "biro_01"
                              ? "Notifikasi dokumen baru dari PPK dan revisi akan muncul di sini."
                              : "Notifikasi dokumen disetujui atau dikembalikan akan muncul di sini."}
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = !notif.read;

                          // Icon & Warna badge
                          let iconNode = <FileText className="h-3.5 w-3.5 text-blue-600" />;
                          let badgeBg = "bg-blue-50 border-blue-200/80 text-blue-700";

                          if (notif.type === "new_submission") {
                            iconNode = <FilePlus2 className="h-3.5 w-3.5 text-blue-600" />;
                            badgeBg = "bg-blue-50 border-blue-200/80 text-blue-700";
                          } else if (notif.type === "resubmission") {
                            iconNode = <RotateCw className="h-3.5 w-3.5 text-amber-600" />;
                            badgeBg = "bg-amber-50 border-amber-200/80 text-amber-700";
                          } else if (notif.type === "approved") {
                            iconNode = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
                            badgeBg = "bg-emerald-50 border-emerald-200/80 text-emerald-700";
                          } else if (notif.type === "rejected") {
                            iconNode = <AlertCircle className="h-3.5 w-3.5 text-rose-600" />;
                            badgeBg = "bg-rose-50 border-rose-200/80 text-rose-700";
                          }

                          return (
                            <div
                              key={notif.id}
                              onClick={() => {
                                markNotificationAsRead(notif.id);
                                const doc = documents.find((d) => d.id === notif.document_id || d.nomor_surat === notif.nomor_surat);
                                if (doc) {
                                  setShowNotificationMenu(false);
                                  if (currentUser?.role === "biro_01" && (notif.type === "new_submission" || notif.type === "resubmission")) {
                                    openVerifyModal(doc);
                                  } else if (currentUser?.role === "ppk" && notif.type === "rejected") {
                                    openRevisiModal(doc);
                                  } else {
                                    openDetailModal(doc);
                                  }
                                }
                              }}
                              className={`p-3.5 hover:bg-slate-50/80 transition cursor-pointer flex items-start gap-3 text-left relative ${
                                isUnread ? "bg-blue-50/20" : "bg-white opacity-85"
                              }`}
                            >
                              {/* Indicator Unread Dot */}
                              {isUnread && (
                                <span className="absolute top-4 right-3 h-2 w-2 rounded-full bg-blue-600"></span>
                              )}

                              {/* Icon */}
                              <div className={`shrink-0 p-2 rounded-xl border ${badgeBg}`}>
                                {iconNode}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <h5 className={`text-xs truncate ${isUnread ? "font-black text-slate-900" : "font-bold text-slate-700"}`}>
                                    {notif.title}
                                  </h5>
                                </div>
                                <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-snug">
                                  {notif.message}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="font-mono text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {notif.nomor_surat}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-medium">
                                    {formatDateTimeID(notif.timestamp, { format: "short" })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {currentUser?.role === "biro_01"
                          ? "Role: Biro 01"
                          : currentUser?.role === "ppk"
                          ? "Role: PPK Pengadaan"
                          : "Role: Superadmin"}
                      </span>
                    </div>

                  </div>
                </>
              )}
            </div>
            
            {/* Profile Avatar Button Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  if (showNotificationMenu) setShowNotificationMenu(false);
                }}
                className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 transition shadow-2xs cursor-pointer group"
              >
                {/* Avatar Initial */}
                <div className="relative">
                  <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white font-black text-xs shadow-md shadow-blue-500/25 ring-2 ring-white">
                    {currentUser?.full_name?.charAt(0) || "U"}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                </div>

                {/* Name & Role Text */}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-blue-600 transition">
                    {currentUser?.full_name || "Pengguna"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold leading-tight">
                    {currentUser?.role === "biro_01"
                      ? "Biro 01 Verifikator"
                      : currentUser?.role === "superadmin"
                      ? "Superadmin"
                      : "PPK Operasional"}
                  </div>
                </div>

                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showProfileMenu ? "rotate-180 text-blue-600" : ""}`} />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-2 shadow-2xl border border-slate-200/90 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Header info in dropdown */}
                    <div className="p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-1">
                      <div className="text-xs font-extrabold text-slate-900 truncate">
                        {currentUser?.full_name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{currentUser?.email}</span>
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-extrabold uppercase border border-blue-200">
                        <ShieldCheck className="h-3 w-3" />
                        {currentUser?.role === "biro_01"
                          ? "Biro 01"
                          : currentUser?.role === "superadmin"
                          ? "Superadmin"
                          : "PPK"}
                      </div>
                    </div>

                    {/* Tombol Ganti Password */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowPasswordModal(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-slate-700 hover:bg-slate-100/80 hover:text-blue-600 transition cursor-pointer"
                    >
                      <KeyRound className="h-4 w-4 text-slate-400" />
                      <span>Ganti Password</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* Tombol Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Modal Ganti Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200/90 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Ganti Password Akun</h3>
                  <p className="text-[10px] text-slate-400">Email: {currentUser?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan password saat ini"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Password Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 8 karakter, huruf besar & kecil"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Minimal 8 karakter, harus memuat huruf besar (A-Z) dan huruf kecil (a-z).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Konfirmasi Password Baru <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi password baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {passwordLoading ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
