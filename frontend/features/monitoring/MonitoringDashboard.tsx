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
        return "bg-emerald-50 text-emerald-800 border-emerald-300";
      case "red":
        return "bg-rose-50 text-rose-800 border-rose-300";
      case "amber":
        return "bg-amber-50 text-amber-800 border-amber-300";
      case "orange":
        return "bg-orange-50 text-orange-800 border-orange-300";
      case "indigo":
        return "bg-indigo-50 text-indigo-800 border-indigo-300";
      default:
        return "bg-blue-50 text-blue-800 border-blue-300";
    }
  };

  const urgentDocs = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl shadow-blue-950/20 border border-slate-800">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute right-32 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Sistem Monitoring Real-Time</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Selamat Datang, {currentUser?.full_name || "Petugas"}!
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pantau status verifikasi kelengkapan berkas permohonan pembayaran dan siklus pencairan dana secara akurat dan transparan.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-3 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-300">Total Nilai Pembayaran</div>
              <div className="text-lg font-black text-white mt-0.5">
                Rp {(stats?.totalNilai || 0).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid KPI Cards - 4 Kolom x 2 Baris (Total 8 Cards) dengan Desain & Animasi Modern */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Dokumen */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-blue-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/15 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Dokumen</span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition-colors">
              {stats?.total || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">berkas</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 relative z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            <span>Semua permohonan masuk</span>
          </div>
        </div>

        {/* 2. Menunggu Verifikasi */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/70 to-white p-5 border border-amber-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Menunggu Verifikasi</span>
            <div className="h-9 w-9 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs">
              <Clock className="h-4 w-4 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-amber-600 tracking-tight">
              {stats?.menunggu || 0}
            </span>
            <span className="text-[11px] font-semibold text-amber-700/60">antrean</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-amber-800/80 relative z-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Perlu verifikasi Biro 01</span>
          </div>
        </div>

        {/* 3. Dikembalikan / Revisi */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50/70 to-white p-5 border border-rose-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-rose-400 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Dikembalikan</span>
            <div className="h-9 w-9 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-rose-600 tracking-tight">
              {stats?.dikembalikan || 0}
            </span>
            <span className="text-[11px] font-semibold text-rose-700/60">dokumen</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-rose-700/80 relative z-10">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>Perlu perbaikan petugas PPK</span>
          </div>
        </div>

        {/* 4. Lengkap / Valid */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50/70 to-white p-5 border border-emerald-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-emerald-400 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Lengkap / Valid</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <CheckCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {stats?.lengkapValid || 0}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700/60">valid</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700/80 relative z-10">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Lolos verifikasi Biro 01</span>
          </div>
        </div>

        {/* 5. Sedang Diproses */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-sky-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl group-hover:bg-sky-500/15 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sedang Diproses</span>
            <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <RefreshCw className="h-4 w-4 group-hover:animate-spin" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-sky-600 tracking-tight">
              {stats?.sedangDiproses || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">tahap</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 relative z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
            <span>Penerbitan SPP / SPM</span>
          </div>
        </div>

        {/* 6. Pengajuan KPPN */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pengajuan KPPN</span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-xs">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-indigo-600 tracking-tight">
              {stats?.pengajuanKPPN || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">proses</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 relative z-10">
            <Send className="h-3.5 w-3.5 text-indigo-500" />
            <span>Penerbitan SP2D KPPN</span>
          </div>
        </div>

        {/* 7. Menunggu Pencairan */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-5 border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-300 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/15 transition-all"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Menunggu Pencairan</span>
            <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 shadow-xs">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black text-amber-600 tracking-tight">
              {stats?.menungguPencairan || 0}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">dokumen</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500 relative z-10">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            <span>Kliring transfer bank</span>
          </div>
        </div>

        {/* 8. Dana Cair */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20 hover:shadow-2xl hover:shadow-emerald-500/35 hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500"></div>
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Dana Cair Selesai</span>
            <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-emerald-600 transition-all duration-300 shadow-xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <span className="text-3xl font-black tracking-tight text-white drop-shadow-xs">
              {stats?.danaCair || 0}
            </span>
            <span className="text-[11px] font-medium text-emerald-100">selesai</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-50 relative z-10 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-emerald-200 animate-spin" />
            <span>Pembayaran sukses terkirim</span>
          </div>
        </div>
      </div>

      {/* Breakdown Status & Aging Dokumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Distribusi Status Dokumen</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Total Permohonan: {stats?.total || 0}
            </span>
          </div>
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>Menunggu Verifikasi Biro 01</span>
                <span className="font-bold text-amber-700">{stats?.menunggu || 0}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.menunggu || 0) / Math.max(1, stats?.total || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>Dikembalikan (Revisi)</span>
                <span className="font-bold text-rose-600">{stats?.dikembalikan || 0}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.dikembalikan || 0) / Math.max(1, stats?.total || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>Lengkap / Valid (Disetujui)</span>
                <span className="font-bold text-emerald-600">{stats?.lengkapValid || 0}</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, ((stats?.lengkapValid || 0) / Math.max(1, stats?.total || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>Proses Lanjutan (KPPN / Cair)</span>
                <span className="font-bold text-blue-600">
                  {(stats?.sedangDiproses || 0) + (stats?.pengajuanKPPN || 0) + (stats?.danaCair || 0)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (((stats?.sedangDiproses || 0) + (stats?.pengajuanKPPN || 0) + (stats?.danaCair || 0)) /
                        Math.max(1, stats?.total || 1)) *
                        100
                    )}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Aging Dokumen (SLA Waktu)</h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Target SLA: Maks 3 Hari</span>
          </div>
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>0 - 3 Hari (Dalam Target SLA)</span>
                <span className="font-bold text-emerald-700">Dalam Batas Wajar</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "75%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>4 - 7 Hari (Perhatian Khusus)</span>
                <span className="font-bold text-blue-700">Perlu Tindak Lanjut</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1.5 text-slate-700">
                <span>&gt; 7 Hari (Melewati Batas SLA)</span>
                <span className="font-bold text-rose-600">Prioritas Tinggi</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dokumen Menunggu Aksi Segera */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70">
          <h2 className="text-sm font-extrabold text-slate-900">Dokumen Menunggu Aksi Segera</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar permohonan terkini yang sedang berjalan dan membutuhkan perhatian
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-black text-[11px]">
                <th className="px-4 py-3.5 text-center w-12">Nomor</th>
                <th className="px-5 py-3.5">Nomor Surat</th>
                <th className="px-5 py-3.5">Petugas / PPK</th>
                <th className="px-5 py-3.5">Nilai Pembayaran</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Lampiran File</th>
                <th className="px-5 py-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {urgentDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400">
                    Tidak ada dokumen yang sedang menunggu aksi segera
                  </td>
                </tr>
              ) : (
                urgentDocs.map((doc, idx) => (
                  <tr key={doc.id} className="hover:bg-blue-50/40 transition">
                    {/* Nomor Urut */}
                    <td className="px-4 py-3.5 text-center font-extrabold text-slate-800 whitespace-nowrap">
                      {idx + 1}
                    </td>

                    {/* Nomor Surat */}
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-blue-700">{doc.nomor_surat}</div>
                      <div className="text-slate-600 truncate max-w-xs">{doc.nama_kegiatan || doc.perihal || "-"}</div>
                      {doc.catatan_revisi && (
                        <div className="mt-1 text-[11px] text-red-600 bg-red-50 p-1.5 rounded-lg border border-red-200 font-medium">
                          <strong>Catatan Revisi:</strong> {doc.catatan_revisi}
                        </div>
                      )}
                    </td>

                    {/* PPK & Unit Kerja */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900">{doc.ppk_name}</div>
                      <div className="text-slate-500 text-[11px]">{doc.unit_kerja}</div>
                    </td>

                    {/* Nilai Pembayaran */}
                    <td className="px-5 py-3.5 font-black text-slate-900 whitespace-nowrap">
                      Rp {Number(doc.nilai_pembayaran).toLocaleString("id-ID")}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold border ${getBadgeClass(doc.legend_color)}`}>
                        {(doc.status === "dana_cair" || doc.status === "selesai") && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        )}
                        {doc.legend_status}
                      </span>
                    </td>

                    {/* Lampiran File */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        <FileText className="h-3.5 w-3.5 text-blue-600" /> {doc.attachments?.length || 0} file
                      </span>
                    </td>

                    {/* Aksi (Hanya tombol detail & perbaiki jika dikembalikan) */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {(currentUser?.role === "ppk" || currentUser?.role === "superadmin") && doc.status === "dikembalikan" && (
                          <button
                            onClick={() => onOpenRevisi(doc)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1 cursor-pointer transition"
                            title="Perbaiki Dokumen"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Perbaiki
                          </button>
                        )}

                        <button
                          onClick={() => onOpenDetail(doc)}
                          className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-2xs cursor-pointer"
                          title="Lihat Berkas Lengkap"
                        >
                          <Eye className="h-4 w-4" />
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

