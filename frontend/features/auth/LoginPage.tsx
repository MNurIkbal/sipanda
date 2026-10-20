import React, { useState, useEffect } from "react";
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { User as UserType } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { loginValidationSchema, LoginFormErrors } from "@/schemas/auth.schema";

interface LoginPageProps {
  onLoginSuccess: (user: UserType, token: string) => void;
}

const LIGHT_SLIDES = [
  {
    image: "/slide-light-1.jpg",
    badge: "Enterprise Security",
    title: "Sistem Terpadu Verifikasi Dokumen",
    description:
      "Monitoring real-time alur berkas pembayaran, rekonsiliasi SP2D, dan sinkronisasi data antar PPK  secara akurat.",
  },
  {
    image: "/slide-light-2.jpg",
    badge: "Digital Invoicing & Approval",
    title: "Validasi Digital & Integritas Berkas",
    description:
      "Pemeriksaan kelengkapan dokumen pengadaan barang dan jasa secara sistematis dengan audit trail aktivitas terenkripsi penuh.",
  },
  {
    image: "/slide-light-3.jpg",
    badge: "Treasury Disbursement",
    title: "Pelacakan Pencairan Dana KPPN",
    description:
      "Pantau tahapan realisasi pembayaran mulai dari pengujian dokumen, pengajuan ke KPPN, hingga dana cair ke rekening tujuan.",
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  // State Lupa Password Flow (Tautan Link Reset via SMTP)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"input_email" | "email_sent">("input_email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");

  // Auto-play slider setiap 5 detik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % LIGHT_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % LIGHT_SLIDES.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + LIGHT_SLIDES.length) % LIGHT_SLIDES.length);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginValidationSchema.validate({ email, password });
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      setErrorMsg(validation.firstError || "Harap lengkapi formulir login sesuai format yang benar.");
      return;
    }

    setFormErrors({});
    setErrorMsg("");

    try {
      setLoading(true);
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

  // Submit Kirim Tautan Link Reset Password ke Email via SMTP
  const handleRequestResetLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError("Harap masukkan alamat email akun Anda!");
      return;
    }

    try {
      setForgotLoading(true);
      setForgotError("");
      const res = await sipanduApi.forgotPassword(forgotEmail);

      if (res.success) {
        setForgotStep("email_sent");
        setForgotSuccessMsg(
          res.message || "Tautan untuk membuat password baru telah dikirim ke alamat email Anda!"
        );
      } else {
        setForgotError(res.message || "Gagal memproses permintaan reset password.");
      }
    } catch (err: any) {
      setForgotError("Koneksi gagal: " + err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleOpenForgotModal = () => {
    setForgotEmail(email || "");
    setForgotError("");
    setForgotSuccessMsg("");
    setForgotStep("input_email");
    setIsForgotModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/60 to-indigo-100/50 text-slate-800 flex items-center justify-center p-3 sm:p-5 md:p-8 lg:p-10 relative overflow-hidden font-sans select-none">
      {/* Modern Vibrant Light Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Dynamic Mesh Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-[650px] h-[650px] bg-gradient-to-br from-blue-300/40 via-sky-200/50 to-transparent rounded-full blur-[130px] animate-pulse" style={{ animationDuration: "7s" }}></div>
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-indigo-300/40 via-purple-200/30 to-transparent rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "9s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[850px] bg-blue-100/40 rounded-full blur-[150px]"></div>

        {/* Clean Tech Dots Matrix Pattern */}
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: "radial-gradient(#94a3b8 1.2px, transparent 1.2px)",
            backgroundSize: "28px 28px",
          }}
        ></div>

        {/* Diagonal Soft Accent Lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #1e40af 0, #1e40af 1px, transparent 0, transparent 50px)",
          }}
        ></div>
      </div>

      {/* Main Container: Slider Gambar Full di KIRI (7 Cols), Form di KANAN (5 Cols) */}
      <div className="w-full max-w-7xl relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-[0_25px_70px_-15px_rgba(15,23,42,0.12),0_0_35px_rgba(59,130,246,0.08)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[700px]">
        
        {/* LEFT COLUMN: Full Background Image Slider Showcase (Lg: 7 cols) */}
        <div className="relative hidden lg:flex lg:col-span-7 flex-col justify-between p-8 xl:p-12 overflow-hidden order-2 lg:order-1 border-r border-slate-200">
          {/* Full Background Slider Images */}
          {LIGHT_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                idx === currentSlide ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
              }`}
              style={{
                transitionProperty: "opacity, transform",
                transitionDuration: "1000ms",
              }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
              {/* Premium Gradient Overlay agar teks terbaca jelas */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/40 to-slate-900/20" />
            </div>
          ))}

          {/* Header Title inside Showcase */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/90 backdrop-blur-md border border-white/40 shadow-sm text-xs font-bold text-slate-800">
              <span>Portal Verifikasi & Monitoring Pembayaran</span>
            </div>
          </div>

          {/* Bottom Slider Info & Controls Over Full Background */}
          <div className="relative z-10 space-y-5">
            {/* Slider Info Description */}
            <div className="space-y-2 text-left max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                <span>{LIGHT_SLIDES[currentSlide].badge}</span>
              </div>
              <h2 className="text-2xl xl:text-3xl font-black text-white tracking-tight drop-shadow-sm">
                {LIGHT_SLIDES[currentSlide].title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed font-medium drop-shadow-sm">
                {LIGHT_SLIDES[currentSlide].description}
              </p>
            </div>

            {/* Bottom Slider Controls & Indicators */}
            <div className="pt-4 border-t border-white/20 flex items-center justify-between">
              {/* Dot Indicators */}
              <div className="flex items-center gap-2">
                {LIGHT_SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                      i === currentSlide
                        ? "w-8 bg-white shadow-md"
                        : "w-2.5 bg-white/40 hover:bg-white/70"
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Navigation Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 shadow-sm transition cursor-pointer active:scale-95"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 shadow-sm transition cursor-pointer active:scale-95"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Clean Login Form (Lg: 5 cols) */}
        <div className="col-span-1 lg:col-span-5 p-8 sm:p-12 xl:p-14 flex flex-col justify-between bg-white order-1 lg:order-2">
          
          <div className="w-full max-w-md mx-auto my-auto">
            {/* Header Brand Logo & Name */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                  SIPANDA
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Sistem Informasi Pengelolaan Dokumen Pembayaran
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Selamat Datang
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                Silakan masuk dengan akun email terdaftar untuk mengakses portal monitoring dan verifikasi.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-2xs">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 text-xs sm:text-sm" noValidate>
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail className={`h-4 w-4 ${formErrors.email ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) {
                        setFormErrors((prev) => ({ ...prev, email: undefined }));
                      }
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="nama@example.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white font-semibold transition shadow-2xs ${
                      formErrors.email
                        ? "border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10 bg-rose-50/20"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.email}</span>
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-bold text-slate-800">
                    Password Akun
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock className={`h-4 w-4 ${formErrors.password ? "text-rose-500" : "text-slate-400"}`} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (formErrors.password) {
                        setFormErrors((prev) => ({ ...prev, password: undefined }));
                      }
                      if (errorMsg) setErrorMsg("");
                    }}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white font-semibold transition shadow-2xs ${
                      formErrors.password
                        ? "border-rose-400 focus:border-rose-600 focus:ring-2 focus:ring-rose-500/10 bg-rose-50/20"
                        : "border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? "Sembunyikan Password" : "Lihat Password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Memverifikasi Autentikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center pt-6 text-xs text-slate-400">
            &copy; {new Date().getFullYear()} SIPANDA 
          </div>

        </div>

      </div>

      {/* MODAL LUPA PASSWORD / RESET VIA GMAIL (LIGHT THEME) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Lupa Password Akun</h3>
                  <p className="text-[11px] text-slate-500">Kirim tautan buat password baru ke email</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {forgotError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span className="font-semibold">{forgotError}</span>
              </div>
            )}

            {forgotStep === "input_email" && (
              <form onSubmit={handleRequestResetLinkSubmit} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Alamat Email Terdaftar <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="nama@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-semibold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                    Sistem akan mengirimkan pesan email SMTP yang memuat tautan aman untuk membuat kata sandi baru.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition font-bold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {forgotLoading ? (
                      <>
                        <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Mengirim Tautan...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Tautan Reset</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Email Tautan Terkirim */}
            {forgotStep === "email_sent" && (
              <div className="py-4 text-center space-y-4 animate-in fade-in duration-150">
                <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto text-blue-600">
                  <Mail className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-base">Tautan Reset Telah Dikirim!</h4>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
                    Kami telah mengirimkan tautan pembuatan password baru ke alamat email:
                  </p>
                  <p className="text-xs font-bold text-blue-700 mt-1">{forgotEmail}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] text-left space-y-1">
                  <p>• Periksa kotak masuk (Inbox) atau folder Spam pada email Anda.</p>
                  <p>• Buka email dan klik tautan untuk melanjutkan pembuatan kata sandi baru.</p>
                  <p>• Tautan berlaku selama <strong>15 menit</strong> sejak dikirimkan.</p>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setForgotStep("input_email")}
                    className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                  >
                    ← Kirim ke email lain
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition font-bold text-xs cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
