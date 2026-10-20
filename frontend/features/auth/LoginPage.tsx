import React, { useState } from "react";
import { ShieldCheck, UserCheck, Lock, Mail, AlertCircle, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { User as UserType } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";

interface LoginPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Harap masukkan email dan password!");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");
      const res = await sipanduApi.login({ email, password });

      if (res.success && res.data) {
        onLoginSuccess(res.data.user, res.data.token);
      } else {
        setErrorMsg(res.message || "Email atau password salah!");
      }
    } catch (err: any) {
      setErrorMsg("Gagal terhubung ke server database: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Decorations */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Top Branding Card */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30">
            <ShieldCheck className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            SIPANDA
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Sistem Informasi Monitoring & Verifikasi Dokumen Pembayaran
          </p>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Biro 01 Keuangan • Terkoneksi Live
          </div>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Selamat Datang</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Masuk dengan alamat email terdaftar untuk mengakses sistem
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Alamat Email Akun
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Memverifikasi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 text-center">
              Akses Cepat Demo
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo("biro01@kemenkeu.go.id", "biro123")}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-blue-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                  <span>Biro 01</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  biro01@kemenkeu.go.id
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo("andi.ppk@kemenkeu.go.id", "petugas123")}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 text-left transition group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 group-hover:text-indigo-400">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-500" />
                  <span>PPK</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                  andi.ppk@kemenkeu.go.id
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
