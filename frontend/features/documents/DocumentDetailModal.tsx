import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  FileDown,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  Info,
  ExternalLink,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  FileCheck,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Send,
  Check
} from "lucide-react";
import { PaymentDocument, User, AuditTrail } from "@/types/sipandu.types";
import { formatDateID, formatDateTimeID } from "@/lib/dateFormat";
import { sipanduApi, BACKEND_URL } from "@/services/api.service";

interface DocumentDetailModalProps {
  document: PaymentDocument;
  currentUser?: User | null;
  auditLogs?: AuditTrail[];
  onClose: () => void;
  onVerify?: (action: "approve" | "reject", message: string) => Promise<boolean>;
  onAdvanceStage?: (nextStage: string, stageLabel: string) => Promise<boolean>;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  currentUser,
  auditLogs: propAuditLogs,
  onClose,
}) => {
  const [docAuditLogs, setDocAuditLogs] = useState<AuditTrail[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        setLoadingAudit(true);
        const res = await sipanduApi.getAuditTrail({ document_id: document.id });
        if (res.success && res.data && isMounted) {
          const logsData = Array.isArray(res.data) ? res.data : res.data.logs || [];
          setDocAuditLogs(logsData);
        } else if (propAuditLogs && isMounted) {
          const filtered = propAuditLogs.filter(
            (l) => l.document_id === document.id || l.nomor_surat === document.nomor_surat
          );
          setDocAuditLogs(filtered);
        }
      } catch (err) {
        if (propAuditLogs && isMounted) {
          const filtered = propAuditLogs.filter(
            (l) => l.document_id === document.id || l.nomor_surat === document.nomor_surat
          );
          setDocAuditLogs(filtered);
        }
      } finally {
        if (isMounted) setLoadingAudit(false);
      }
    };

    fetchLogs();
    return () => {
      isMounted = false;
    };
  }, [document.id, propAuditLogs]);

  // Calculate Aging (days elapsed since tanggal_diterima or created_at)
  const calculateAging = () => {
    const baseDateStr = document.tanggal_diterima || document.created_at || document.tanggal_pengajuan;
    if (!baseDateStr) return "0 hari";
    try {
      const start = new Date(baseDateStr).getTime();
      const now = new Date().getTime();
      const diffDays = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
      return `${diffDays} hari`;
    } catch {
      return "0 hari";
    }
  };

  // Timeline process steps matching Screenshot 2
  const timelineSteps = [
    { key: "diterima", label: "Dokumen Diterima", date: formatDateID(document.tanggal_diterima || document.created_at) },
    { key: "terdaftar", label: "Terdaftar", date: formatDateTimeID(document.created_at) },
    { key: "diverifikasi", label: "Diverifikasi", date: document.tanggal_verifikasi ? formatDateTimeID(document.tanggal_verifikasi) : null },
    { key: "lengkap_valid", label: "Lengkap / Valid", date: null },
    { key: "sedang_diproses", label: "Sedang Diproses", date: null },
    { key: "pengajuan_kppn", label: "Pengajuan ke KPPN", date: null },
    { key: "menunggu_pencairan", label: "Menunggu Pencairan", date: null },
    { key: "dana_cair", label: "Dana Cair", date: null },
  ];

  // Determine current step index based on document status
  const getActiveStepIndex = () => {
    switch (document.status) {
      case "draft":
        return 0; // Dokumen Diterima
      case "menunggu_verifikasi":
        return 1; // Terdaftar, next is Diverifikasi
      case "diverifikasi":
        return 2;
      case "lengkap":
      case "valid":
      case "lengkap_valid":
        return 3;
      case "proses":
      case "sedang_diproses":
        return 4;
      case "kppn":
      case "pengajuan_kppn":
        return 5;
      case "menunggu_pencairan":
        return 6;
      case "dana_cair":
      case "selesai":
      case "siap_digunakan":
        return 7;
      default:
        return 1;
    }
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-3 overflow-hidden animate-fade-in">
      {/* Modal Container: Fullscreen (w-full h-full md:h-[96vh] md:max-w-[96vw] rounded-none md:rounded-2xl) */}
      <div className="bg-[#f8fafc] w-full h-full md:h-[96vh] md:max-w-[96vw] rounded-none md:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-slate-800 text-base md:text-lg">
                Detail Dokumen: {document.nomor_surat}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {document.legend_status || document.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Dibuat pada {formatDateTimeID(document.created_at, { format: "long", includeTimezone: true })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns (Matching Screenshot 2) */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN (8 cols): Informasi Dokumen & Dokumen Pendukung */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Informasi Dokumen */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-5 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Informasi Dokumen</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 text-xs">
                  {/* Row 1 */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      JENIS DOKUMEN
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {document.jenis_dokumen || document.kategori || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      PERIHAL
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {document.perihal || document.nama_kegiatan || "-"}
                    </span>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      TANGGAL DOKUMEN
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatDateID(document.tanggal_dokumen)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      TANGGAL DITERIMA
                    </span>
                    <span className="font-medium text-slate-700">
                      {formatDateID(document.tanggal_diterima || document.tanggal_pengajuan)}
                    </span>
                  </div>

                  {/* Row 3 */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      PIHAK EKSTERNAL
                    </span>
                    <span className="font-medium text-slate-700">
                      {document.pihak_eksternal || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      PPK / UNIT
                    </span>
                    <span className="font-semibold text-slate-800">
                      {document.ppk_name} — {document.unit_kerja}
                    </span>
                  </div>

                  {/* Row 4 */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      NILAI PEMBAYARAN
                    </span>
                    <span className="font-bold text-slate-900 text-base text-blue-700">
                      Rp {Number(document.nilai_pembayaran || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      KETERANGAN
                    </span>
                    <span className="font-bold text-slate-900 text-base text-blue-700">
                        {document.keterangan}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      AGING
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white tracking-wider">
                        AGING
                      </span>
                      <span className="font-semibold text-slate-800">
                        {calculateAging()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Dokumen Pendukung */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6">
                <h3 className="font-bold text-slate-800 text-sm mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <span>Dokumen Pendukung ({document.attachments?.length || 0})</span>
                </h3>

                {(!document.attachments || document.attachments.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    Tidak ada dokumen pendukung yang dilampirkan.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {document.attachments.map((file, idx) => (
                      <div
                        key={file.id || idx}
                        className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="font-bold text-slate-800 text-xs flex items-center gap-2">
                              <span>Dokumen {idx + 1}: {file.document_type || "Dokumen Pendukung"} {file.nomor_dokumen ? `(${file.nomor_dokumen})` : ""}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-blue-600 font-medium">{file.file_name}</span>
                              {file.tanggal_dokumen && (
                                <span>• Tanggal {formatDateID(file.tanggal_dokumen)}</span>
                              )}
                              <span>• {(file.file_size / 1024).toFixed(1)} KB</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              Lengkap
                            </span>

                            <a
                              href={`${BACKEND_URL}${file.file_path}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-medium text-xs flex items-center gap-1 transition border border-slate-200"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              Unduh
                            </a>
                          </div>
                        </div>

                        {/* Document Intelligence Simulation Banner */}
                        <div className="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/70 -mx-4 -mb-4 p-3.5 rounded-b-xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              Document Intelligence
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              Data Simulasi / Demo
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                            <span>Terdeteksi: {file.document_type || "Berkas"} (88%)</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Lengkap</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">Konsisten</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN (4 cols): Aksi, Timeline Proses, Riwayat Status */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 1: Timeline Proses */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
                <h4 className="font-bold text-slate-800 text-xs mb-4">Timeline Proses</h4>

                <div className="relative pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                  {timelineSteps.map((step, idx) => {
                    const isPassed = idx < activeIndex;
                    const isCurrent = idx === activeIndex;

                    return (
                      <div key={step.key} className="relative flex items-start gap-3">
                        {/* Dot / Icon */}
                        <div className="absolute -left-6 mt-0.5 flex items-center justify-center bg-white">
                          {isPassed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white" />
                          )}
                        </div>

                        {/* Label & Date */}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-xs font-semibold ${
                              isPassed
                                ? "text-slate-800"
                                : isCurrent
                                ? "text-blue-600 font-bold"
                                : "text-slate-400 font-normal"
                            }`}
                          >
                            {step.label}
                          </p>
                          {step.date && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {step.date}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Card 2: Riwayat Status & Catatan Aktivitas Lengkap */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-slate-800 text-xs">Riwayat Status</h4>
                  {loadingAudit && (
                    <span className="text-[10px] text-slate-400">Memuat log...</span>
                  )}
                </div>

                <div className="space-y-4">
                  {docAuditLogs.length > 0 ? (
                    docAuditLogs.map((log) => {
                      // Tentukan warna badge dan label status berdasarkan new_status / action
                      const statusLabel =
                        log.new_status === "dikembalikan"
                          ? "Dikembalikan untuk Perbaikan"
                          : log.new_status === "lengkap_valid"
                          ? "Lengkap / Valid"
                          : log.new_status === "menunggu_verifikasi_ulang"
                          ? "Menunggu Verifikasi Ulang"
                          : log.new_status === "menunggu_verifikasi"
                          ? "Menunggu Verifikasi"
                          : log.new_status === "sedang_diverifikasi"
                          ? "Sedang Diverifikasi"
                          : log.new_status === "sedang_diproses"
                          ? "Sedang Diproses"
                          : log.new_status === "pengajuan_kppn"
                          ? "Pengajuan ke KPPN"
                          : log.new_status === "dana_cair"
                          ? "Dana Cair"
                          : log.new_status === "draft"
                          ? "Draft"
                          : log.action;

                      const isReturned =
                        log.new_status === "dikembalikan" || log.action?.includes("REJECT");
                      const isApproved =
                        log.new_status === "lengkap_valid" || log.action?.includes("APPROVE");
                      const isRevision =
                        log.new_status === "menunggu_verifikasi_ulang" || log.action?.includes("REVISI");

                      return (
                        <div key={log.id} className="border-b border-slate-100 pb-3.5 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                isReturned
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : isApproved
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : isRevision
                                  ? "bg-orange-50 text-orange-800 border-orange-200"
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {statusLabel}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDateTimeID(log.created_at)}
                            </span>
                          </div>

                          {/* Jika ada pesan/deskripsi aktivitas */}
                          {log.description ? (
                            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                              {log.description}
                              <span className="block text-[10px] text-slate-400 font-semibold mt-1">
                                Oleh: {log.user_name} ({log.user_role === "biro_01" ? "Biro 01" : log.user_role.toUpperCase()})
                              </span>
                            </p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    // Fallback jika belum ada audit log yang termuat dari backend
                    <>
                      {/* Status Terkini jika dikembalikan */}
                      {document.status === "dikembalikan" && (
                        <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              Dikembalikan untuk Perbaikan
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatDateTimeID(document.tanggal_verifikasi || document.updated_at || document.created_at)}
                            </span>
                          </div>
                          {document.catatan_revisi ? (
                            <p className="text-[11px] text-rose-700 mt-1.5 leading-relaxed bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                              {document.catatan_revisi}
                              <span className="block text-[10px] text-rose-500 font-semibold mt-1">
                                Catatan dari Biro 01 Keuangan
                              </span>
                            </p>
                          ) : null}
                        </div>
                      )}

                      {/* Status Menunggu Verifikasi */}
                      <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            Menunggu Verifikasi
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDateTimeID(document.tanggal_pengajuan || document.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                          Dokumen dikirim ke Biro 01 untuk verifikasi. — <span className="font-semibold text-slate-700">{document.ppk_name || "PPK"}</span>
                        </p>
                      </div>

                      {/* Status Terdaftar */}
                      <div className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Terdaftar
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDateTimeID(document.created_at)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                          Dokumen diregistrasi oleh PPK. — <span className="font-semibold text-slate-700">{document.ppk_name || "PPK"}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
