"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { sipanduApi } from "@/services/api.service";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setVerifying(false);
      setTokenValid(false);
      setVerifyError("Tautan reset password tidak valid atau parameter tidak lengkap.");
      return;
    }

    const checkToken = async () => {
      try {
        setVerifying(true);
        const res = await sipanduApi.verifyResetToken(token, email);
        if (res.success) {
          setTokenValid(true);
        } else {
          setTokenValid(false);
          setVerifyError(res.message || "Tautan reset password tidak valid atau sudah kedaluwarsa.");
        }
      } catch (err: any) {
        setTokenValid(false);
        setVerifyError("Koneksi gagal saat memverifikasi tautan: " + err.message);
      } finally {
        setVerifying(false);
      }
    };

    checkToken();
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setSubmitError("Password baru dan konfirmasi password wajib diisi!");
      return;
    }

    if (newPassword.length < 8) {
      setSubmitError("Password baru harus minimal 8 karakter!");
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)) {
      setSubmitError("Password baru harus memuat huruf besar (A-Z) dan huruf kecil (a-z)!");
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Konfirmasi password baru tidak cocok!");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError("");
      const res = await sipanduApi.resetPassword({
        token,
        email,
        newPassword,
      });

      if (res.success) {
        setSubmitSuccess(true);
      } else {
        setSubmitError(res.message || "Gagal menyetel password baru.");
      }
    } catch (err: any) {
      setSubmitError("Koneksi gagal: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-100/50 text-slate-800 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-gradient-to-br from-blue-300/40 via-sky-200/50 to-transparent rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "7s" }}></div>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-indigo-300/40 via-purple-200/30 to-transparent rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "9s" }}></div>
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.12),0_0_35px_rgba(59,130,246,0.08)] p-8 sm:p-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 mb-3">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Buat Password Baru
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Akun: <span className="font-bold text-slate-800">{email || "Pengguna SIPANDA"}</span>
          </p>
        </div>

        {/* Loading State Verifikasi Token */}
        {verifying && (
          <div className="py-10 text-center space-y-3">
            <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-slate-500 font-medium">Memverifikasi tautan reset password...</p>
          </div>
        )}

        {/* Token Invalid / Expired State */}
        {!verifying && !tokenValid && (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Tautan Tidak Berlaku</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {verifyError}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shadow-sm"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        )}

        {/* Form Set Password Baru jika Token Valid & Belum Sukses */}
        {!verifying && tokenValid && !submitSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
            {submitError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-2xs">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="font-semibold">{submitError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter (huruf besar & kecil)"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-semibold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showNewPassword ? "Sembunyikan Password" : "Lihat Password"}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Konfirmasi Password Baru <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru..."
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-semibold transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showConfirmPassword ? "Sembunyikan Password" : "Lihat Password"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-blue-600" />
                <span>Ketentuan Keamanan Password:</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Minimal 8 karakter, wajib memuat setidaknya 1 huruf besar (A-Z) dan 1 huruf kecil (a-z).
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Menyimpan Password Baru...</span>
                </>
              ) : (
                <>
                  <span>Simpan & Perbarui Password</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Sukses State */}
        {!verifying && tokenValid && submitSuccess && (
          <div className="py-4 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Password Berhasil Diperbarui!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Kata sandi akun Anda telah diperbarui dengan aman. Silakan masuk kembali dengan password baru Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/25 transition cursor-pointer"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
