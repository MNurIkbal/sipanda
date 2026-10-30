import React from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Eye,
  RefreshCw,
  Sparkles,
  Send,
  Building,
  RotateCcw,
  CheckCheck,
  Plus,
  FolderOpen,
  ShieldCheck,
  Wallet,
  FileCheck2,
  BarChart3,
} from "lucide-react";
import { PaymentDocument, MonitoringStats, User } from "@/types/sipandu.types";

interface MonitoringDashboardProps {
  stats: MonitoringStats | null;
  documents: PaymentDocument[];
  currentUser: User | null;
  onNavigateToUpload: () => void;
  onNavigateToDocuments: () => void;
  onOpenVerify: (doc: PaymentDocument) => void;
  onOpenRevisi: (doc: PaymentDocument) => void;
  onOpenDetail: (doc: PaymentDocument) => void;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  stats,
  documents,
  currentUser,
  onNavigateToUpload,
  onNavigateToDocuments,
  onOpenVerify,
  onOpenRevisi,
  onOpenDetail,
}) => {
  const getBadgeClass = (color: string) => {
    switch (color) {
      case "emerald":
      case "green":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/10";
      case "red":
        return "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/10";
      case "amber":
        return "bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/10";
      case "orange":
        return "bg-orange-50 text-orange-700 border-orange-200 ring-1 ring-orange-500/10";
      case "indigo":
        return "bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-500/10";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/10";
    }
  };

  // Hitung metrik real-time langsung dari daftar dokumen (selaras 100% dengan Timeline Proses di Detail Dokumen)
  const totalDocs = documents.length || stats?.total || 0;
  const draftCount = documents.filter((d) => d.status === "draft").length;
  const submitCount = documents.filter(
    (d) => d.status === "submit_dokumen" || d.status === "menunggu_verifikasi"
  ).length;
  const reviewCount = documents.filter(
    (d) => d.status === "review" || d.status === "sedang_diverifikasi"
  ).length;
  const resubmittedCount = documents.filter(
    (d) => d.status === "menunggu_verifikasi_ulang" || d.status === "pengajuan_ulang"
  ).length;
  const rejectedCount = documents.filter(
    (d) => d.status === "dikembalikan" || d.status === "ditolak"
  ).length;
  const approvedCount = documents.filter((d) =>
    [
      "lengkap_valid",
      "disetujui",
      "sedang_diproses",
      "pengajuan_kppn",
      "menunggu_pencairan",
      "dana_cair",
      "selesai",
    ].includes(d.status)
  ).length;

  const waitingVerificationTotal = submitCount + reviewCount + resubmittedCount;

  // Hitung rekap nilai nominal berdasarkan kelompok status timeline
  const totalNilaiKeseluruhan =
    documents.reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0) ||
    stats?.totalNilai ||
    0;

  const totalNilaiDraft = documents
    .filter((d) => d.status === "draft")
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  const totalNilaiSubmit = documents
    .filter((d) => ["submit_dokumen", "menunggu_verifikasi"].includes(d.status))
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  const totalNilaiReview = documents
    .filter((d) => ["review", "sedang_diverifikasi"].includes(d.status))
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  const totalNilaiPengajuanUlang = documents
    .filter((d) => ["menunggu_verifikasi_ulang", "pengajuan_ulang"].includes(d.status))
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  const totalNilaiDisetujui = documents
    .filter((d) =>
      [
        "lengkap_valid",
        "disetujui",
        "sedang_diproses",
        "pengajuan_kppn",
        "menunggu_pencairan",
        "dana_cair",
        "selesai",
      ].includes(d.status)
    )
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  const totalNilaiDitolak = documents
    .filter((d) => ["dikembalikan", "ditolak"].includes(d.status))
    .reduce((acc, cur) => acc + (Number(cur.nilai_pembayaran) || 0), 0);

  // Persentase penyelesaian verifikasi
  const approvalRate =
    totalDocs > 0 ? Math.round((approvedCount / totalDocs) * 100) : 0;

  // Ringkasan per Unit Kerja / Kategori teratas dari dokumen yang ada
  const unitMap = new Map<string, { count: number; nilai: number }>();
  documents.forEach((d) => {
    const unit = d.unit_kerja || "Unit Kerja Lainnya";
    const prev = unitMap.get(unit) || { count: 0, nilai: 0 };
    unitMap.set(unit, {
      count: prev.count + 1,
      nilai: prev.nilai + (Number(d.nilai_pembayaran) || 0),
    });
  });
  const topUnits = Array.from(unitMap.entries())
    .map(([name, val]) => ({ name, ...val }))
    .sort((a, b) => b.nilai - a.nilai)
    .slice(0, 4);

  const urgentDocs = documents.slice(0, 6);

  return (
    <div className="space-y-6 pb-8">
      {/* 1. HERO WELCOME BANNER MODERN */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/15 border border-slate-800/80">
        {/* Decorative Mesh & Glow */}
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -bottom-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 top-0 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
              Selamat Datang,{" "}
              <span className="bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                {currentUser?.full_name || "Petugas"}!
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
              Pantau alur verifikasi kelengkapan berkas pengajuan pembayaran, status persetujuan Biro 01, serta realisasi pencairan anggaran secara real-time dan terintegrasi.
            </p>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {currentUser?.role !== "biro_01" && (
                <button
                  type="button"
                  onClick={onNavigateToUpload}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 border border-white/15 transition-all hover:-translate-y-0.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Input Pengajuan Baru</span>
                </button>
              )}
              <button
                type="button"
                onClick={onNavigateToDocuments}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold text-xs border border-white/15 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <FolderOpen className="h-4 w-4 text-cyan-300" />
                <span>Kelola Daftar Dokumen</span>
                <ArrowUpRight className="h-3.5 w-3.5 text-slate-300" />
              </button>
            </div>
          </div>

          {/* Right Highlight Financial & Completion Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 shrink-0 lg:min-w-[290px]">
            <div className="bg-white/10 backdrop-blur-xl border border-white/15 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200/90">
                  Total Nilai Pengajuan
                </span>
                <div className="p-2 rounded-xl bg-blue-500/20 border border-blue-400/20 text-cyan-300">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1.5 tracking-tight">
                Rp {totalNilaiKeseluruhan.toLocaleString("id-ID")}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-300 pt-2 border-t border-white/10">
                <span>Tingkat Persetujuan</span>
                <span className="font-extrabold text-emerald-300">{approvalRate}% Disetujui</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. GRID KPI CARDS UTAMA (Tahapan: Draft -> Submit -> Review -> [Ditolak jika bukan biro_01] -> Pengajuan Ulang -> Disetujui) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${currentUser?.role === "biro_01" ? "xl:grid-cols-5" : "xl:grid-cols-6"} gap-4`}>
        {/* Card 1: Draft Dokumen */}
        <div
          onClick={onNavigateToDocuments}
          className="group relative overflow-hidden rounded-2xl bg-white p-4 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-slate-300 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-slate-500/5 rounded-full blur-2xl group-hover:bg-slate-500/15 transition-all"></div>
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              1. Draft Dokumen
            </span>
            <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-700 group-hover:text-white transition-all duration-300 shadow-2xs">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-slate-700 transition-colors">
              {draftCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">berkas draft</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 relative z-10">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
              Total: <strong className="text-slate-700">{totalDocs}</strong>
            </span>
            <span className="text-blue-600 font-bold inline-flex items-center gap-0.5">
              Detail <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Submit Dokumen */}
        <div
          onClick={onNavigateToDocuments}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-white p-4 border border-amber-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider">
              2. Submit Dokumen
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-2xs">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl font-black text-amber-600 tracking-tight">
              {submitCount}
            </span>
            <span className="text-[11px] font-semibold text-amber-700/70">disubmit</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-amber-100/80 flex items-center justify-between text-[10px] text-amber-800/80 relative z-10">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
              Menunggu Review
            </span>
            <span className="font-bold text-amber-700">PPK → Biro</span>
          </div>
        </div>

        {/* Card 3: Review (Biro 01) */}
        <div
          onClick={onNavigateToDocuments}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50/60 via-white to-white p-4 border border-blue-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-blue-400 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wider">
              3. Review (Biro 01)
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-2xs">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl font-black text-blue-600 tracking-tight">
              {reviewCount}
            </span>
            <span className="text-[11px] font-semibold text-blue-700/70">sedang direview</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-blue-100/80 flex items-center justify-between text-[10px] text-blue-800/80 relative z-10">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              Pemeriksaan Berkas
            </span>
            <span className="font-bold text-blue-600">Biro 01</span>
          </div>
        </div>

        {/* Card 4: Ditolak (Perlu Revisi) - Disembunyikan untuk role biro_01 */}
        {currentUser?.role !== "biro_01" && (
          <div
            onClick={onNavigateToDocuments}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50/60 via-white to-white p-4 border border-rose-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-rose-400 transition-all duration-300 cursor-pointer"
          >
            <div className="absolute -right-6 -top-6 w-20 h-20 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2.5 relative z-10">
              <span className="text-[11px] font-extrabold text-rose-800 uppercase tracking-wider">
                4. Ditolak
              </span>
              <div className="h-9 w-9 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-2xs">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 relative z-10">
              <span className="text-2xl font-black text-rose-600 tracking-tight">
                {rejectedCount}
              </span>
              <span className="text-[11px] font-semibold text-rose-700/70">perlu revisi</span>
            </div>
            <div className="mt-2.5 pt-2 border-t border-rose-100/80 flex items-center justify-between text-[10px] text-rose-800/80 relative z-10">
              <span className="flex items-center gap-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
                Dikembalikan ke PPK
              </span>
              <span className="font-bold text-rose-600">Revisi</span>
            </div>
          </div>
        )}

        {/* Card 5: Pengajuan Ulang */}
        <div
          onClick={onNavigateToDocuments}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50/60 via-white to-white p-4 border border-orange-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-orange-400 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-[11px] font-extrabold text-orange-800 uppercase tracking-wider">
              {currentUser?.role === "biro_01" ? "4. Pengajuan Ulang" : "5. Pengajuan Ulang"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 shadow-2xs">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl font-black text-orange-600 tracking-tight">
              {resubmittedCount}
            </span>
            <span className="text-[11px] font-semibold text-orange-700/70">diajukan ulang</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-orange-100/80 flex items-center justify-between text-[10px] text-orange-800/80 relative z-10">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
              Pasca Perbaikan PPK
            </span>
            <span className="font-bold text-orange-600">Verifikasi Ulang</span>
          </div>
        </div>

        {/* Card 6: Disetujui */}
        <div
          onClick={onNavigateToDocuments}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 text-white shadow-lg shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-2.5 relative z-10">
            <span className="text-[11px] font-extrabold text-emerald-100 uppercase tracking-wider">
              {currentUser?.role === "biro_01" ? "5. Disetujui" : "6. Disetujui"}
            </span>
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-emerald-600 transition-all duration-300 shadow-2xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 relative z-10">
            <span className="text-2xl font-black tracking-tight text-white">
              {approvedCount}
            </span>
            <span className="text-[11px] font-medium text-emerald-100">disetujui</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-white/15 flex items-center justify-between text-[10px] text-emerald-50 relative z-10 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-200" />
              Lolos Verifikasi
            </span>
            <span className="font-bold text-white">{approvalRate}%</span>
          </div>
        </div>
      </div>

      {/* 3. ANALITIK DISTRIBUSI STATUS TIMELINE & RINGKASAN REALISASI ANGGARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Panel Kiri (7 Kolom): Pipeline & Distribusi Status Berkas Sesuai Timeline Proses Lengkap */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Timeline &amp; Distribusi Status Dokumen
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Ringkasan tahapan dokumen mulai dari Draft, Submit, Review, Ditolak, Pengajuan Ulang, hingga Disetujui
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold border border-slate-200">
                Total: {totalDocs} Berkas
              </span>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              {/* Bar 1: Draft Dokumen */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
                    <span>Draft Dokumen</span>
                  </span>
                  <span className="font-black text-slate-700 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                    {draftCount} Berkas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-slate-400 to-slate-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (draftCount / Math.max(1, totalDocs)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar 2: Submit Dokumen */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
                    <span>Submit Dokumen</span>
                  </span>
                  <span className="font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {submitCount} Berkas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (submitCount / Math.max(1, totalDocs)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar 3: Review (Biro 01) */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500"></span>
                    <span>Review (Biro 01)</span>
                  </span>
                  <span className="font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {reviewCount} Berkas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (reviewCount / Math.max(1, totalDocs)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar 4: Ditolak (Perlu Revisi) - Disembunyikan untuk role biro_01 */}
              {currentUser?.role !== "biro_01" && (
                <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                      <span>Ditolak (Perlu Revisi)</span>
                    </span>
                    <span className="font-black text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      {rejectedCount} Berkas
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (rejectedCount / Math.max(1, totalDocs)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Bar 5: Pengajuan Ulang */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-orange-500"></span>
                    <span>Pengajuan Ulang</span>
                  </span>
                  <span className="font-black text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-md border border-orange-200">
                    {resubmittedCount} Berkas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (resubmittedCount / Math.max(1, totalDocs)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>

              {/* Bar 6: Disetujui */}
              <div className="p-2.5 rounded-xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-center justify-between font-bold mb-1.5 text-slate-700">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    <span>Disetujui</span>
                  </span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    {approvedCount} Berkas
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (approvedCount / Math.max(1, totalDocs)) * 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Mini Stepper Tahapan Timeline Proses di Bagian Bawah Panel Kiri */}
          <div className={`mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 ${currentUser?.role === "biro_01" ? "xl:grid-cols-5" : "xl:grid-cols-6"} gap-2 text-center`}>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-[9px] font-bold text-slate-500 uppercase truncate">1. Draft</div>
              <div className="text-sm font-black text-slate-800 mt-0.5">{draftCount}</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <div className="text-[9px] font-bold text-amber-700 uppercase truncate">2. Submit</div>
              <div className="text-sm font-black text-amber-700 mt-0.5">{submitCount}</div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50/60 border border-blue-200/70">
              <div className="text-[9px] font-bold text-blue-600 uppercase truncate">3. Review</div>
              <div className="text-sm font-black text-blue-700 mt-0.5">{reviewCount}</div>
            </div>
            {currentUser?.role !== "biro_01" && (
              <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-200/70">
                <div className="text-[9px] font-bold text-rose-600 uppercase truncate">4. Ditolak</div>
                <div className="text-sm font-black text-rose-700 mt-0.5">{rejectedCount}</div>
              </div>
            )}
            <div className="p-2 rounded-xl bg-orange-50/60 border border-orange-200/70">
              <div className="text-[9px] font-bold text-orange-600 uppercase truncate">
                {currentUser?.role === "biro_01" ? "4. Pengajuan Ulang" : "5. Pengajuan Ulang"}
              </div>
              <div className="text-sm font-black text-orange-700 mt-0.5">{resubmittedCount}</div>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
              <div className="text-[9px] font-bold text-emerald-600 uppercase truncate">
                {currentUser?.role === "biro_01" ? "5. Disetujui" : "6. Disetujui"}
              </div>
              <div className="text-sm font-black text-emerald-700 mt-0.5">{approvedCount}</div>
            </div>
          </div>
        </div>

        {/* Panel Kanan (5 Kolom): Ringkasan Nilai Anggaran Berdasarkan 6 Status Timeline */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Rekapitulasi Nilai Pembayaran
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Akumulasi nominal anggaran untuk setiap tahapan status dokumen
                  </p>
                </div>
              </div>
            </div>

            {/* 6 Kartu Ringkasan Nominal Sesuai Timeline Status */}
            <div className="mt-4 space-y-2">
              {/* 1. Nilai Draft Dokumen */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-slate-600 text-white flex items-center justify-center shadow-xs">
                    <FileText className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Draft Dokumen
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {draftCount} berkas draft
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-slate-800">
                    Rp {totalNilaiDraft.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 2. Nilai Submit Dokumen */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-xs">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-amber-950">
                      Submit Dokumen
                    </div>
                    <div className="text-[10px] text-amber-700 font-medium">
                      {submitCount} berkas disubmit
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-amber-700">
                    Rp {totalNilaiSubmit.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 3. Nilai Review (Biro 01) */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Clock className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-blue-950">
                      Review (Biro 01)
                    </div>
                    <div className="text-[10px] text-blue-700 font-medium">
                      {reviewCount} berkas sedang direview
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-blue-700">
                    Rp {totalNilaiReview.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 4. Nilai Ditolak */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-xs">
                    <AlertTriangle className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-rose-950">
                      Ditolak (Perlu Revisi)
                    </div>
                    <div className="text-[10px] text-rose-700 font-medium">
                      {rejectedCount} berkas ditolak / revisi
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-rose-700">
                    Rp {totalNilaiDitolak.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 5. Nilai Pengajuan Ulang */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-50/60 border border-orange-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-xs">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-orange-950">
                      Pengajuan Ulang
                    </div>
                    <div className="text-[10px] text-orange-700 font-medium">
                      {resubmittedCount} berkas diajukan ulang
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-orange-700">
                    Rp {totalNilaiPengajuanUlang.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              {/* 6. Nilai Disetujui */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                    <CheckCheck className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-emerald-950">
                      Disetujui
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {approvedCount} berkas telah disetujui
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-black text-emerald-700">
                    Rp {totalNilaiDisetujui.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Distribusi Unit Kerja Teratas */}
          {topUnits.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Unit Kerja / PPK Teraktif</span>
                <span>Nominal</span>
              </div>
              <div className="space-y-2">
                {topUnits.slice(0, 3).map((u) => (
                  <div
                    key={u.name}
                    className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2 truncate pr-2">
                      <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-700 truncate">{u.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold">
                        {u.count} dok
                      </span>
                    </div>
                    <span className="font-extrabold text-slate-900 shrink-0">
                      Rp {u.nilai.toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-slate-50/80 via-white to-blue-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Daftar Dokumen Pembayaran Terkini
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantauan berkas pengajuan terbaru beserta kelengkapan lampiran dokumen pendukungnya
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToDocuments}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-blue-600 hover:text-blue-700 shadow-2xs transition cursor-pointer self-start sm:self-auto"
          >
            <span>Buka Menu Daftar Dokumen</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="px-4 py-3.5 text-center w-12">No</th>
                <th className="px-5 py-3.5">Nomor Surat &amp; Perihal</th>
                <th className="px-5 py-3.5">Petugas / Unit Kerja</th>
                <th className="px-5 py-3.5">Nilai Pembayaran</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Dokumen Pendukung</th>
                <th className="px-5 py-3.5 text-center w-24">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Belum ada data dokumen pembayaran yang terdaftar
                  </td>
                </tr>
              ) : (
                urgentDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-blue-50/30 transition">
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-700 whitespace-nowrap">
                      {idx + 1}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-blue-700">{doc.nomor_surat}</div>
                      <div className="text-slate-600 truncate max-w-xs mt-0.5">
                        {doc.nama_kegiatan || doc.perihal || "-"}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{doc.ppk_name}</div>
                      <div className="text-slate-500 text-[11px]">{doc.unit_kerja}</div>
                    </td>

                    <td className="px-5 py-3.5 font-black text-slate-900 whitespace-nowrap">
                      Rp {Number(doc.nilai_pembayaran).toLocaleString("id-ID")}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${getBadgeClass(
                          doc.legend_color
                        )}`}
                      >
                        {doc.status === "dana_cair" ||
                        doc.status === "selesai" ||
                        doc.status === "lengkap_valid" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        )}
                        {doc.legend_status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(doc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold border border-slate-200 hover:border-blue-200 transition cursor-pointer"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>{doc.attachments?.length || 0} Berkas</span>
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(doc)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-600 hover:border-blue-600 text-slate-700 hover:text-white font-bold text-xs transition shadow-2xs cursor-pointer"
                          title="Lihat Detail & Lampiran"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
