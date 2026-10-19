import React from "react";
import { Plus, ArrowRight, Eye, ShieldCheck, RefreshCw, FileText } from "lucide-react";
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
      case "emerald": return "badge-emerald";
      case "red": return "badge-red";
      case "amber": return "badge-amber";
      case "orange": return "badge-orange";
      case "indigo": return "badge-indigo";
      case "green": return "badge-green";
      default: return "badge-blue";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Platform Monitoring Dokumen Pembayaran
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kendali verifikasi kelengkapan berkas Biro 01 Keuangan dan siklus pencairan dana.
          </p>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <div className="card-stat">
          <div className="text-[11px] font-medium text-slate-500 truncate">Total Dokumen</div>
          <div className="mt-2 text-xl font-bold text-slate-900">{stats?.total || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Semua permohonan</div>
        </div>

        <div className="card-stat border-amber-200 bg-amber-50/20">
          <div className="text-[11px] font-medium text-amber-700 truncate">Menunggu Verifikasi</div>
          <div className="mt-2 text-xl font-bold text-amber-600">{stats?.menunggu || 0}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">Perlu diperiksa Biro 01</div>
        </div>

        <div className="card-stat border-red-200 bg-red-50/20">
          <div className="text-[11px] font-medium text-red-700 truncate">Dikembalikan</div>
          <div className="mt-2 text-xl font-bold text-red-600">{stats?.dikembalikan || 0}</div>
          <div className="text-[10px] text-red-500 mt-0.5">Perlu perbaikan petugas</div>
        </div>

        <div className="card-stat border-emerald-200 bg-emerald-50/20">
          <div className="text-[11px] font-medium text-emerald-700 truncate">Lengkap / Valid</div>
          <div className="mt-2 text-xl font-bold text-emerald-600">{stats?.lengkapValid || 0}</div>
          <div className="text-[10px] text-emerald-500 mt-0.5">Disetujui Biro 01</div>
        </div>

        <div className="card-stat">
          <div className="text-[11px] font-medium text-slate-600 truncate">Sedang Diproses</div>
          <div className="mt-2 text-xl font-bold text-blue-600">{stats?.sedangDiproses || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Proses SPP / SPM</div>
        </div>

        <div className="card-stat">
          <div className="text-[11px] font-medium text-slate-600 truncate">Pengajuan KPPN</div>
          <div className="mt-2 text-xl font-bold text-indigo-600">{stats?.pengajuanKPPN || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">SP2D diterbitkan</div>
        </div>

        <div className="card-stat">
          <div className="text-[11px] font-medium text-slate-600 truncate">Menunggu Pencairan</div>
          <div className="mt-2 text-xl font-bold text-amber-600">{stats?.menungguPencairan || 0}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Kliring Bank</div>
        </div>

        <div className="card-stat border-green-200 bg-green-50/20">
          <div className="text-[11px] font-medium text-green-700 truncate">Dana Cair</div>
          <div className="mt-2 text-xl font-bold text-green-600">{stats?.danaCair || 0}</div>
          <div className="text-[10px] text-green-500 mt-0.5">Selesai terbayar</div>
        </div>
      </div>

      {/* Breakdown Status & Aging Dokumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Distribusi Status Dokumen</h3>
            <span className="text-[11px] text-slate-400">Total Nilai: Rp {(stats?.totalNilai || 0).toLocaleString("id-ID")}</span>
          </div>
          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>Menunggu Verifikasi Biro 01</span>
                <span className="font-bold text-slate-900">{stats?.menunggu || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(100, (stats?.menunggu || 0) * 25)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>Dikembalikan (Revisi)</span>
                <span className="font-bold text-slate-900">{stats?.dikembalikan || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (stats?.dikembalikan || 0) * 33)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>Lengkap / Valid (Disetujui)</span>
                <span className="font-bold text-slate-900">{stats?.lengkapValid || 0}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (stats?.lengkapValid || 0) * 40)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>Proses Lanjutan (KPPN / Cair)</span>
                <span className="font-bold text-slate-900">
                  {(stats?.sedangDiproses || 0) + (stats?.pengajuanKPPN || 0) + (stats?.danaCair || 0)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Aging Dokumen (SLA Waktu)</h3>
            <span className="text-[11px] text-slate-400">Target SLA: Max 3 Hari</span>
          </div>
          <div className="mt-4 space-y-3.5 text-xs">
            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>0 - 3 Hari (Dalam SLA)</span>
                <span className="font-bold text-emerald-700">3 Dokumen</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: "70%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>4 - 7 Hari (Perhatian)</span>
                <span className="font-bold text-blue-700">1 Dokumen</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: "25%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium mb-1 text-slate-600">
                <span>&gt; 7 Hari (Melewati SLA)</span>
                <span className="font-bold text-red-600">1 Dokumen</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: "15%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dokumen Menunggu Aksi Segera */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dokumen Menunggu Aksi Segera</h2>
            <p className="text-xs text-slate-500">
              Daftar permohonan yang menunggu verifikasi Biro 01 atau perbaikan oleh Petugas
            </p>
          </div>
          <button
            onClick={onNavigateToDocuments}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            Buka Semua Dokumen <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-4 py-3">Nomor Surat </th>
                <th className="px-4 py-3">Petugas / PPK</th>
                <th className="px-4 py-3">Nilai Pembayaran</th>
                <th className="px-4 py-3">Legend Status</th>
                <th className="px-4 py-3">Lampiran File</th>
                <th className="px-4 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.slice(0, 5).map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-blue-700">{doc.nomor_surat}</div>
                    <div className="text-slate-600 truncate max-w-xs">{doc.nama_kegiatan}</div>
                    {doc.catatan_revisi && (
                      <div className="mt-1 text-[11px] text-red-600 bg-red-50 p-1 rounded border border-red-100">
                        <strong>Catatan Revisi:</strong> {doc.catatan_revisi}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-800">{doc.ppk_name}</div>
                    <div className="text-slate-400 text-[11px]">{doc.unit_kerja}</div>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    Rp {Number(doc.nilai_pembayaran).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`badge ${getBadgeClass(doc.legend_color)}`}>
                      {doc.legend_status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      <FileText className="h-3 w-3" /> {doc.attachments?.length || 0} file
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {currentUser?.role === "biro_01" && (
                        <button
                          onClick={() => onOpenVerify(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Verifikasi
                        </button>
                      )}

                      {currentUser?.role === "petugas" && doc.status === "dikembalikan" && (
                        <button
                          onClick={() => onOpenRevisi(doc)}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Perbaiki
                        </button>
                      )}

                      <button
                        onClick={() => onOpenDetail(doc)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        title="Lihat Berkas Lengkap"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
