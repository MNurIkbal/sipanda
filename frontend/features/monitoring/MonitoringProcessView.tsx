import React, { useState, useMemo, useEffect } from "react";
import {
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Inbox,
  Activity,
} from "lucide-react";
import { PaymentDocument, User, AuditTrail } from "@/types/sipandu.types";
import { formatDateTimeID } from "@/lib/dateFormat";
import { sipanduApi } from "@/services/api.service";

interface MonitoringProcessViewProps {
  documents: PaymentDocument[];
  currentUser?: User | null;
}

// 4 Tahapan standar kartu monitoring proses pembayaran (selaras dengan Timeline Proses di Detail Dokumen)
export const TIMELINE_STEPS = [
  { key: "draft", label: "Draft Dokumen" },
  { key: "submit_dokumen", label: "Submit Dokumen" },
  { key: "review_awal", label: "Review (Biro 01)" },
  { key: "disetujui", label: "Disetujui" },
];

export const getActiveStepIndex = (status: string): number => {
  switch (status) {
    case "draft":
      return 0;
    case "submit_dokumen":
    case "menunggu_verifikasi":
      return 1;
    case "review":
    case "diverifikasi":
    case "sedang_diverifikasi":
    case "dikembalikan":
    case "ditolak":
    case "menunggu_verifikasi_ulang":
    case "pengajuan_ulang":
      return 2;
    case "lengkap":
    case "valid":
    case "lengkap_valid":
    case "disetujui":
    case "proses":
    case "sedang_diproses":
    case "kppn":
    case "pengajuan_kppn":
    case "menunggu_pencairan":
    case "dana_cair":
    case "selesai":
    case "siap_digunakan":
      return 3;
    default:
      return 1;
  }
};

// Helper menghasilkan tahapan timeline dinamis untuk dokumen yang dipilih (identik dengan DocumentDetailModal)
export const getDocumentTimelineSteps = (doc: PaymentDocument, docAuditLogs: AuditTrail[] = []) => {
  const submitLog = [...docAuditLogs].reverse().find((l) => l.action === "SUBMIT_DOKUMEN" || l.new_status === "submit_dokumen");
  const reviewLog = [...docAuditLogs].reverse().find((l) => l.action === "REVIEW_DOCUMENT" || l.new_status === "review");
  const rejectLog = [...docAuditLogs].reverse().find((l) => l.action === "VERIFY_REJECT" || l.new_status === "dikembalikan" || l.new_status === "ditolak");
  const reviseLog = [...docAuditLogs].reverse().find((l) => l.action === "RESUBMIT_DOKUMEN" || l.action === "REVISE_DOCUMENT" || l.new_status === "menunggu_verifikasi_ulang" || l.new_status === "pengajuan_ulang");
  const approveLog = [...docAuditLogs].reverse().find((l) => l.action === "VERIFY_APPROVE" || l.new_status === "lengkap_valid" || l.new_status === "disetujui");

  const isRejected = doc.status === "dikembalikan" || doc.status === "ditolak";
  const isPengajuanUlang = doc.status === "menunggu_verifikasi_ulang" || doc.status === "pengajuan_ulang";
  const hasEverBeenRejected = Boolean(rejectLog || isRejected || isPengajuanUlang);
  const hasEverBeenResubmitted = Boolean(reviseLog || isPengajuanUlang);
  const isReviewingResubmission =
    hasEverBeenResubmitted &&
    (doc.status === "review" || doc.status === "lengkap_valid" || doc.status === "disetujui");

  return [
    {
      key: "draft",
      label: "Draft Dokumen",
      date: formatDateTimeID(doc.created_at),
    },
    {
      key: "submit_dokumen",
      label: "Submit Dokumen",
      date: submitLog?.created_at
        ? formatDateTimeID(submitLog.created_at)
        : doc.status !== "draft"
        ? formatDateTimeID(doc.updated_at || doc.created_at)
        : null,
    },
    {
      key: "review_awal",
      label: "Review (Biro 01)",
      date: reviewLog?.created_at
        ? formatDateTimeID(reviewLog.created_at)
        : doc.status !== "draft" && doc.status !== "submit_dokumen"
        ? formatDateTimeID(doc.updated_at || doc.created_at)
        : null,
    },
    ...(hasEverBeenRejected
      ? [
          {
            key: "ditolak",
            label: "Ditolak (Perlu Revisi)",
            date: rejectLog?.created_at
              ? formatDateTimeID(rejectLog.created_at)
              : isRejected
              ? doc.tanggal_verifikasi
                ? formatDateTimeID(doc.tanggal_verifikasi)
                : formatDateTimeID(doc.updated_at || doc.created_at)
              : null,
            isDanger: true,
          },
        ]
      : []),
    ...(hasEverBeenResubmitted
      ? [
          {
            key: "pengajuan_ulang",
            label: "Pengajuan Ulang PPK",
            date: reviseLog?.created_at
              ? formatDateTimeID(reviseLog.created_at)
              : isPengajuanUlang
              ? formatDateTimeID(doc.updated_at || doc.created_at)
              : null,
            isWarning: true,
          },
        ]
      : []),
    ...(isReviewingResubmission
      ? [
          {
            key: "review_ulang",
            label: "Review Pengajuan Ulang",
            date:
              doc.status === "review"
                ? formatDateTimeID(doc.updated_at || new Date().toISOString())
                : reviewLog?.created_at
                ? formatDateTimeID(reviewLog.created_at)
                : null,
          },
        ]
      : []),
    {
      key: "disetujui",
      label: "Disetujui",
      date: approveLog?.created_at
        ? formatDateTimeID(approveLog.created_at)
        : doc.status === "lengkap_valid" || doc.status === "disetujui" || doc.status === "dana_cair" || doc.status === "selesai"
        ? doc.tanggal_verifikasi
          ? formatDateTimeID(doc.tanggal_verifikasi)
          : formatDateTimeID(doc.updated_at || doc.created_at)
        : null,
    },
  ];
};

// Helper menentukan tahapan aktif berdasarkan status dokumen dan steps dinamis
export const getActiveDocStepIndex = (status: string, steps: any[]): number => {
  switch (status) {
    case "draft":
      return steps.findIndex((s) => s.key === "draft");
    case "submit_dokumen":
    case "menunggu_verifikasi":
      return steps.findIndex((s) => s.key === "submit_dokumen");
    case "review":
    case "sedang_diverifikasi": {
      const idxReviewUlang = steps.findIndex((s) => s.key === "review_ulang");
      return idxReviewUlang !== -1 ? idxReviewUlang : steps.findIndex((s) => s.key === "review_awal");
    }
    case "dikembalikan":
    case "ditolak":
      return steps.findIndex((s) => s.key === "ditolak");
    case "menunggu_verifikasi_ulang":
    case "pengajuan_ulang":
      return steps.findIndex((s) => s.key === "pengajuan_ulang");
    case "lengkap":
    case "valid":
    case "lengkap_valid":
    case "disetujui":
    case "proses":
    case "sedang_diproses":
    case "kppn":
    case "pengajuan_kppn":
    case "menunggu_pencairan":
    case "dana_cair":
    case "selesai":
    case "siap_digunakan":
      return steps.findIndex((s) => s.key === "disetujui");
    default:
      return 0;
  }
};

// Deskripsi sub-status / keterangan ringkas di bawah progress bar
const getSubStatusDescription = (doc: PaymentDocument, stepIndex: number): string => {
  if (doc.status === "dikembalikan" || doc.status === "ditolak") {
    return doc.catatan_revisi ? `Catatan Revisi: ${doc.catatan_revisi}` : "Perlu perbaikan berkas pendukung oleh PPK";
  }
  if (doc.status === "menunggu_verifikasi_ulang" || doc.status === "pengajuan_ulang") {
    return "Dokumen telah diperbaiki PPK & diajukan ulang ke Biro 01";
  }
  switch (stepIndex) {
    case 0:
      return "Dokumen masih berstatus Draft & belum dikirim ke Biro 01";
    case 1:
      return "Dokumen telah disubmit & menunggu proses review Biro 01";
    case 2:
      return "Sedang dalam proses review kelengkapan berkas oleh Biro 01";
    case 3:
      return "Berkas dinyatakan lengkap, valid, dan telah disetujui Biro 01";
    default:
      return "Dalam proses tindak lanjut";
  }
};

// Format tanggal update
const getUpdateDate = (doc: PaymentDocument): string => {
  const dateStr = doc.updated_at || doc.tanggal_verifikasi || doc.created_at || doc.tanggal_diterima;
  return formatDateTimeID(dateStr, { format: "numeric" });
};

// Badge status styling
const getStatusBadgeStyle = (status: string, stepIndex: number) => {
  if (status === "dikembalikan" || status === "ditolak") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (status === "menunggu_verifikasi_ulang" || status === "pengajuan_ulang") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }
  if (stepIndex === 0) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  if (stepIndex >= 3) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  return "bg-blue-50 text-blue-700 border-blue-200";
};

export const MonitoringProcessView: React.FC<MonitoringProcessViewProps> = ({
  documents = [],
}) => {
  // State search, pagination, size
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // State dokumen terpilih untuk timeline kanan
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docAuditLogs, setDocAuditLogs] = useState<AuditTrail[]>([]);

  // Filter dokumen berdasarkan search
  const filteredDocuments = useMemo(() => {
    if (!searchTerm.trim()) return documents;
    const term = searchTerm.toLowerCase();
    return documents.filter((doc) => {
      const noSurat = (doc.nomor_surat || "").toLowerCase();
      const ppk = (doc.ppk_name || "").toLowerCase();
      const perihal = (doc.perihal || doc.nama_kegiatan || "").toLowerCase();
      const unit = (doc.unit_kerja || "").toLowerCase();
      const legend = (doc.legend_status || "").toLowerCase();
      return (
        noSurat.includes(term) ||
        ppk.includes(term) ||
        perihal.includes(term) ||
        unit.includes(term) ||
        legend.includes(term)
      );
    });
  }, [documents, searchTerm]);

  // Pagination calculation
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedDocuments = useMemo(() => {
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, startIndex, pageSize]);

  // Set default selected document
  useEffect(() => {
    if (paginatedDocuments.length > 0) {
      if (!selectedDocId || !filteredDocuments.some((d) => d.id === selectedDocId)) {
        setSelectedDocId(paginatedDocuments[0].id);
      }
    } else {
      setSelectedDocId(null);
    }
  }, [paginatedDocuments, filteredDocuments, selectedDocId]);

  // Reset page ke 1 jika filter search berubah
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  // Dokumen aktif di panel kanan
  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === selectedDocId) || paginatedDocuments[0] || null;
  }, [documents, selectedDocId, paginatedDocuments]);

  // Ambil audit trail dokumen terpilih agar tahapan & waktu di Timeline Proses akurat
  useEffect(() => {
    let isMounted = true;
    if (!activeDoc?.id) {
      setDocAuditLogs([]);
      return;
    }

    sipanduApi
      .getAuditTrail({ document_id: activeDoc.id })
      .then((res) => {
        if (res.success && res.data && isMounted) {
          const logsData = Array.isArray(res.data) ? res.data : res.data.logs || [];
          setDocAuditLogs(logsData);
        } else if (isMounted) {
          setDocAuditLogs([]);
        }
      })
      .catch(() => {
        if (isMounted) setDocAuditLogs([]);
      });

    return () => {
      isMounted = false;
    };
  }, [activeDoc?.id]);

  const activeDocTimelineSteps = useMemo(() => {
    return activeDoc ? getDocumentTimelineSteps(activeDoc, docAuditLogs) : [];
  }, [activeDoc, docAuditLogs]);

  const activeDocStepIndex = activeDoc ? getActiveDocStepIndex(activeDoc.status, activeDocTimelineSteps) : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner Card Page Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xs">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Monitoring Proses Pembayaran
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pantau alur tahapan setiap berkas dokumen pembayaran secara real-time melalui timeline proses.
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nomor surat / PPK..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 font-medium transition shadow-2xs"
          />
        </div>
      </div>

      {/* Main Content Layout: 2 Kolom (List Dokumen Kiri & Timeline Detail Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: List Kartu Dokumen (7 cols) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-3.5">
          {paginatedDocuments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Inbox className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Tidak ada dokumen ditemukan</h3>
              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? `Tidak ada dokumen yang cocok dengan kata kunci "${searchTerm}".`
                  : "Belum ada dokumen pembayaran yang terdaftar dalam sistem."}
              </p>
            </div>
          ) : (
            paginatedDocuments.map((doc) => {
              const isSelected = activeDoc?.id === doc.id;
              const stepIndex = getActiveStepIndex(doc.status);
              const labelStatus = doc.legend_status || TIMELINE_STEPS[stepIndex]?.label || "Sedang Diproses";
              const badgeStyle = getStatusBadgeStyle(doc.status, stepIndex);
              const subDescription = getSubStatusDescription(doc, stepIndex);
              const updateDate = getUpdateDate(doc);

              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`relative p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? "border-blue-500 ring-2 ring-blue-500/15 shadow-md"
                      : "border-slate-200/90 hover:border-slate-300 hover:shadow-sm"
                  }`}
                >
                  {/* Header Kartu: Nomor Surat, PPK, Nominal, dan Badge Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {doc.nomor_surat}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {doc.ppk_name || "Petugas PPK"} &bull; Rp{" "}
                        {Number(doc.nilai_pembayaran || 0).toLocaleString("id-ID")}
                      </p>
                    </div>

                    {/* Status Pill Badge di kanan atas */}
                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle}`}
                      >
                        {stepIndex >= 3 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        {labelStatus}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Progress Bar 4 Segmen (Draft, Submit, Review Biro 01, Disetujui) */}
                  <div className="mt-4 grid grid-cols-4 gap-1.5 items-center">
                    {[0, 1, 2, 3].map((segIdx) => {
                      const isApprovedDoc =
                        doc.status === "lengkap_valid" ||
                        doc.status === "disetujui" ||
                        doc.status === "dana_cair" ||
                        doc.status === "selesai";
                      const segCompleted = segIdx < stepIndex || (segIdx === 3 && isApprovedDoc);
                      const segActive = segIdx === stepIndex && !isApprovedDoc;

                      let barColor = "bg-slate-100"; // Segmen belum tercapai
                      if ((doc.status === "dikembalikan" || doc.status === "ditolak") && segIdx === 2) {
                        barColor = "bg-rose-500";
                      } else if (
                        (doc.status === "menunggu_verifikasi_ulang" || doc.status === "pengajuan_ulang") &&
                        segIdx === 2
                      ) {
                        barColor = "bg-orange-500";
                      } else if (segCompleted) {
                        barColor = "bg-emerald-500"; // Hijau untuk segmen selesai
                      } else if (segActive) {
                        barColor = "bg-blue-600"; // Biru untuk segmen aktif
                      }

                      return (
                        <div
                          key={segIdx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${barColor}`}
                        />
                      );
                    })}
                  </div>

                  {/* Keterangan Sub-Status & Tanggal Update */}
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-normal truncate max-w-[280px] sm:max-w-md">
                      {subDescription}
                    </span>
                    <span className="shrink-0 text-slate-400 font-medium text-[11px]">
                      Update {updateDate}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {/* Pagination & Size Controls Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600">
            {/* Info Jumlah & Selector Size */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <span>
                Menampilkan{" "}
                <span className="font-bold text-slate-900">
                  {totalItems === 0 ? 0 : startIndex + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-900">
                  {Math.min(startIndex + pageSize, totalItems)}
                </span>{" "}
                dari <span className="font-bold text-slate-900">{totalItems}</span> data
              </span>

              {/* Selector Size / Limit */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-[11px]">Size:</span>
                <select
                  aria-label="Pilih jumlah data per halaman"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 outline-none hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>

            {/* Pagination Navigation Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(1)}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Halaman Pertama"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <span className="px-3 py-1 font-bold text-slate-900 bg-slate-50 rounded-lg border border-slate-200 mx-1">
                Hal {safePage} dari {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Halaman Berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages)}
                disabled={safePage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
                title="Halaman Terakhir"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Timeline Vertical Detail (5 cols) */}
        <div className="lg:col-span-5 xl:col-span-5 sticky top-24">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
            {activeDoc ? (
              <>
                {/* Header Timeline: Nomor Surat Dokumen Terpilih */}
                <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                      Timeline Proses
                    </h2>
                    <p className="text-[11px] font-semibold text-blue-600 mt-0.5">
                      {activeDoc.nomor_surat}
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {activeDoc.unit_kerja || "Unit Kerja"}
                  </span>
                </div>

                {/* Vertical Stepper Timeline Steps (Identik dengan Detail Daftar Dokumen) */}
                <div className="relative mt-5 pl-6 space-y-5 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                  {activeDocTimelineSteps.map((step, idx) => {
                    const isDisetujuiFinal =
                      step.key === "disetujui" &&
                      (activeDoc.status === "lengkap_valid" ||
                        activeDoc.status === "disetujui" ||
                        activeDoc.status === "dana_cair" ||
                        activeDoc.status === "selesai");
                    const isPassed = idx < activeDocStepIndex || isDisetujuiFinal;
                    const isCurrent = idx === activeDocStepIndex && !isDisetujuiFinal;

                    return (
                      <div key={step.key} className="relative flex items-start gap-3">
                        {/* Dot / Icon */}
                        <div className="absolute -left-6 mt-0.5 flex items-center justify-center bg-white">
                          {isPassed ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : isCurrent ? (
                            (step as any).isDanger ? (
                              <div className="w-5 h-5 rounded-full border-2 border-rose-600 bg-white flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                              </div>
                            ) : (step as any).isWarning ? (
                              <div className="w-5 h-5 rounded-full border-2 border-orange-500 bg-white flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                              </div>
                            )
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
                                ? (step as any).isDanger
                                  ? "text-rose-600 font-bold"
                                  : (step as any).isWarning
                                  ? "text-orange-600 font-bold"
                                  : "text-blue-600 font-bold"
                                : "text-slate-400 font-normal"
                            }`}
                          >
                            {step.label}
                          </p>
                          {(step as any).date && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {(step as any).date}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Pilih salah satu dokumen untuk melihat detail timeline proses
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
