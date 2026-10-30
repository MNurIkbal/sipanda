import React, { useState, useEffect, useMemo } from "react";
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
  Check,
  Eye,
  ListFilter,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Landmark,
  UserCheck,
  CircleDollarSign,
  FolderOpen,
  FileSpreadsheet,
  FileImage,
  Maximize2
} from "lucide-react";
import { PaymentDocument, User, AuditTrail, Attachment } from "@/types/sipandu.types";
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

interface GroupedMetadataSection {
  id: string;
  title: string;
  icon: "info" | "nilai" | "pihak" | "rekening" | "other";
  entries: Array<{ key: string; value: string }>;
}

/**
 * Mengelompokkan parameter metadata dinamis (JSON `params` dari VeriText OCR)
 * ke dalam kategori accordion terstruktur seperti Document Intelligence (Gambar 1):
 * 1. Informasi Dokumen
 * 2. Nilai Transaksi
 * 3. Pihak Eksternal
 * 4. Rekening Pembayaran
 * 5. Metadata Tambahan (jika ada field di luar kategori di atas)
 */
function groupAttachmentParams(att: Attachment): {
  totalFields: number;
  sections: GroupedMetadataSection[];
  summaryNumber: string;
  summaryDate: string;
  summaryTotal: string;
} {
  const rawParams: Record<string, any> = {
    ...(att.metadata && typeof att.metadata === "object" ? att.metadata : {}),
    ...(att.params && typeof att.params === "object" ? att.params : {}),
  };

  // Bersihkan key internal jika ada
  const cleanEntries: Array<{ key: string; value: string }> = [];
  Object.entries(rawParams).forEach(([k, v]) => {
    if (
      v !== undefined &&
      v !== null &&
      String(v).trim() !== "" &&
      typeof v !== "object" &&
      k !== "raw_text_snippet" &&
      k !== "file_name"
    ) {
      cleanEntries.push({ key: k.trim(), value: String(v).trim() });
    }
  });

  // Fallback jika `params` kosong namun ada kolom atribut di tabel document_attachments
  if (cleanEntries.length === 0) {
    if (att.document_type) cleanEntries.push({ key: "Jenis Dokumen", value: att.document_type });
    if (att.nomor_dokumen && att.nomor_dokumen !== "-") cleanEntries.push({ key: "Nomor Dokumen", value: att.nomor_dokumen });
    if (att.tanggal_dokumen) cleanEntries.push({ key: "Tanggal", value: formatDateID(att.tanggal_dokumen) });
    if (att.uraian) cleanEntries.push({ key: "Description / Perihal", value: att.uraian });
    if (att.nama_perusahaan) cleanEntries.push({ key: "Perusahaan / Pihak Eksternal", value: att.nama_perusahaan });
    if (att.nilai_pembayaran && Number(att.nilai_pembayaran) > 0) {
      cleanEntries.push({
        key: "Total Nilai Pembayaran",
        value: `Rp${Number(att.nilai_pembayaran).toLocaleString("id-ID")}`,
      });
    }
  }

  const infoEntries: Array<{ key: string; value: string }> = [];
  const nilaiEntries: Array<{ key: string; value: string }> = [];
  const pihakEntries: Array<{ key: string; value: string }> = [];
  const rekeningEntries: Array<{ key: string; value: string }> = [];

  cleanEntries.forEach((item) => {
    const k = item.key.toLowerCase();

    // 4. Rekening Pembayaran
    if (
      k.includes("bank") ||
      k.includes("rekening") ||
      k.includes("acc ") ||
      k.includes("account") ||
      k.includes("branch") ||
      k.includes("cabang") ||
      k.includes("swift") ||
      k.includes("remit")
    ) {
      rekeningEntries.push(item);
    }
    // 2. Nilai Transaksi
    else if (
      k.includes("total") ||
      k.includes("banyaknya uang") ||
      k.includes("uang") ||
      k.includes("harga") ||
      k.includes("price") ||
      k.includes("nilai") ||
      k.includes("jumlah") ||
      k.includes("nominal") ||
      k.includes("terbilang") ||
      k.includes("qty") ||
      k.includes("kuantitas") ||
      k.includes("unit") ||
      k.includes("ppn") ||
      k.includes("pph") ||
      k.includes("pajak") ||
      k.includes("dpp") ||
      k.includes("termin")
    ) {
      nilaiEntries.push(item);
    }
    // 3. Pihak Eksternal
    else if (
      k.includes("perusahaan") ||
      k.includes("pihak") ||
      k.includes("vendor") ||
      k.includes("penyedia") ||
      k.includes("alamat") ||
      k.includes("telp") ||
      k.includes("phone") ||
      k.includes("approved") ||
      k.includes("jabatan") ||
      k.includes("direktur") ||
      k.includes("npwp") ||
      k.includes("penandatangan")
    ) {
      pihakEntries.push(item);
    }
    // 1. Informasi Dokumen (Default untuk No, Kwitansi No., Sudah terima dari, Untuk Pembayaran, Tanggal, Perihal, Project Title, Bill To, PO/SPK, Description, Lamp, dll)
    else {
      infoEntries.push(item);
    }
  });

  const sections: GroupedMetadataSection[] = [
    {
      id: "info",
      title: "1. Informasi Dokumen",
      icon: "info",
      entries: infoEntries,
    },
    {
      id: "nilai",
      title: "2. Nilai Transaksi",
      icon: "nilai",
      entries: nilaiEntries,
    },
    {
      id: "pihak",
      title: "3. Pihak Eksternal",
      icon: "pihak",
      entries: pihakEntries,
    },
    {
      id: "rekening",
      title: "4. Rekening Pembayaran",
      icon: "rekening",
      entries: rekeningEntries,
    },
  ];

  // Cari ringkasan No, Tanggal, dan Total untuk kartu di panel kiri
  const findByKeys = (keywords: string[]) => {
    for (const kw of keywords) {
      const found = cleanEntries.find((e) => e.key.toLowerCase().includes(kw));
      if (found && found.value) return found.value;
    }
    return "";
  };

  const summaryNumber =
    (att.nomor_dokumen && att.nomor_dokumen !== "-" ? att.nomor_dokumen : "") ||
    findByKeys(["kwitansi no", "no. kwitansi", "invoice number", "no. invoice", "nomor dokumen", "nomor surat", "po/spk", "no"]) ||
    "-";

  const rawDate =
    findByKeys(["tanggal", "date"]) ||
    (att.tanggal_dokumen ? formatDateID(att.tanggal_dokumen) : "");
  const summaryDate = rawDate || "-";

  const rawTotal =
    findByKeys(["banyaknya uang", "grand total", "total price", "nominal pembayaran", "nilai pembayaran", "jumlah", "total"]) ||
    (att.nilai_pembayaran && Number(att.nilai_pembayaran) > 0
      ? `Rp${Number(att.nilai_pembayaran).toLocaleString("id-ID")}`
      : "");
  const summaryTotal = rawTotal || "-";

  return {
    totalFields: cleanEntries.length,
    sections,
    summaryNumber,
    summaryDate,
    summaryTotal,
  };
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  currentUser,
  auditLogs: propAuditLogs,
  onClose,
}) => {
  const [docAuditLogs, setDocAuditLogs] = useState<AuditTrail[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // State interaktif untuk Dokumen Pendukung (Gambar 1: Split View + Tab + Accordion Metadata)
  const [selectedAttachmentIdx, setSelectedAttachmentIdx] = useState<number>(0);
  const [activeDocTab, setActiveDocTab] = useState<"preview" | "identified">("preview");
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    info: true,
    nilai: false,
    pihak: false,
    rekening: false,
  });

  const toggleAccordion = (sectionId: string) => {
    setOpenAccordions((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const attachmentsList = document.attachments || [];
  const activeAttachment = attachmentsList[selectedAttachmentIdx] || attachmentsList[0] || null;

  const activeGroupedMeta = useMemo(() => {
    if (!activeAttachment) return null;
    return groupAttachmentParams(activeAttachment);
  }, [activeAttachment]);

  // Reset pilihan ketika ganti dokumen utama
  useEffect(() => {
    setSelectedAttachmentIdx(0);
    setActiveDocTab("preview");
    setOpenAccordions({ info: true, nilai: false, pihak: false, rekening: false });
  }, [document.id]);

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

  // Log teranyar tiap tahap
  const submitLog = [...docAuditLogs].reverse().find((l) => l.action === "SUBMIT_DOKUMEN" || l.new_status === "submit_dokumen");
  const reviewLog = [...docAuditLogs].reverse().find((l) => l.action === "REVIEW_DOCUMENT" || l.new_status === "review");
  const rejectLog = [...docAuditLogs].reverse().find((l) => l.action === "VERIFY_REJECT" || l.new_status === "dikembalikan" || l.new_status === "ditolak");
  const reviseLog = [...docAuditLogs].reverse().find((l) => l.action === "RESUBMIT_DOKUMEN" || l.action === "REVISE_DOCUMENT" || l.new_status === "menunggu_verifikasi_ulang" || l.new_status === "pengajuan_ulang");
  const approveLog = [...docAuditLogs].reverse().find((l) => l.action === "VERIFY_APPROVE" || l.new_status === "lengkap_valid" || l.new_status === "disetujui");

  // Status flags
  const isRejected = document.status === "dikembalikan" || document.status === "ditolak";
  const isPengajuanUlang = document.status === "menunggu_verifikasi_ulang" || document.status === "pengajuan_ulang";
  const hasEverBeenRejected = Boolean(rejectLog || isRejected || isPengajuanUlang);
  const hasEverBeenResubmitted = Boolean(reviseLog || isPengajuanUlang);

  // Jika dokumen ini diajukan ulang dan sedang dalam review ulang oleh Biro 01:
  // Alur siklus: Draft -> Submit -> Review -> Ditolak -> Pengajuan Ulang -> Review (Ulang) -> Disetujui
  const isReviewingResubmission =
    hasEverBeenResubmitted &&
    (document.status === "review" || document.status === "lengkap_valid" || document.status === "disetujui");

  // Timeline tahapan proses komprehensif:
  const timelineSteps = [
    {
      key: "draft",
      label: "Draft Dokumen",
      date: formatDateTimeID(document.created_at),
    },
    {
      key: "submit_dokumen",
      label: "Submit Dokumen",
      date: submitLog?.created_at
        ? formatDateTimeID(submitLog.created_at)
        : document.status !== "draft"
        ? formatDateTimeID(document.updated_at || document.created_at)
        : null,
    },
    {
      key: "review_awal",
      label: "Review (Biro 01)",
      date: reviewLog?.created_at
        ? formatDateTimeID(reviewLog.created_at)
        : document.status !== "draft" && document.status !== "submit_dokumen"
        ? formatDateTimeID(document.updated_at || document.created_at)
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
              ? document.tanggal_verifikasi
                ? formatDateTimeID(document.tanggal_verifikasi)
                : formatDateTimeID(document.updated_at || document.created_at)
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
              ? formatDateTimeID(document.updated_at || document.created_at)
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
              document.status === "review"
                ? formatDateTimeID(document.updated_at || new Date().toISOString())
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
        : document.status === "lengkap_valid" || document.status === "disetujui"
        ? document.tanggal_verifikasi
          ? formatDateTimeID(document.tanggal_verifikasi)
          : formatDateTimeID(document.updated_at || document.created_at)
        : null,
    },
  ];

  // Determine current active step index dynamically
  const getActiveStepIndex = () => {
    switch (document.status) {
      case "draft":
        return timelineSteps.findIndex((s) => s.key === "draft");
      case "submit_dokumen":
      case "menunggu_verifikasi":
        return timelineSteps.findIndex((s) => s.key === "submit_dokumen");
      case "review":
      case "sedang_diverifikasi":
        return isReviewingResubmission
          ? timelineSteps.findIndex((s) => s.key === "review_ulang")
          : timelineSteps.findIndex((s) => s.key === "review_awal");
      case "dikembalikan":
      case "ditolak":
        return timelineSteps.findIndex((s) => s.key === "ditolak");
      case "menunggu_verifikasi_ulang":
      case "pengajuan_ulang":
        return timelineSteps.findIndex((s) => s.key === "pengajuan_ulang");
      case "lengkap_valid":
      case "disetujui":
      case "dana_cair":
      case "selesai":
        return timelineSteps.findIndex((s) => s.key === "disetujui");
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
                      KATEGORI PENGADAAN
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {document.kategori || (document as any).kategori_pengadaan || "Pengadaan Barang / Jasa"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      NILAI PEMBAYARAN
                    </span>
                    <span className="font-bold text-slate-900 text-base text-blue-700">
                      Rp {Number(document.nilai_pembayaran || 0).toLocaleString("id-ID")}
                    </span>
                  </div>

                  {/* Row 5 */}
                  <div className="md:col-span-2">
                    <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase block mb-1">
                      KETERANGAN
                    </span>
                    <span className="font-medium text-slate-800 text-sm">
                      {document.keterangan || "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Dokumen Pendukung — Desain Document Intelligence (Gambar 1) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                {attachmentsList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    <FolderOpen className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                    <span>Tidak ada dokumen pendukung yang dilampirkan.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-200/80">
                    
                    {/* ======================================================== */}
                    {/* PANEL KIRI (4 Cols): Daftar Kartu Dokumen Pendukung       */}
                    {/* ======================================================== */}
                    <div className="xl:col-span-4 p-5 bg-slate-50/40 flex flex-col">
                      <div className="mb-4">
                        <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">
                          Dokumen Pendukung ({attachmentsList.length})
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Dokumen pembayaran yang telah diproses oleh Veritext.
                        </p>
                      </div>

                      <div className="space-y-3 overflow-y-auto max-h-[680px] pr-0.5">
                        {attachmentsList.map((file, idx) => {
                          const metaSummary = groupAttachmentParams(file);
                          const isSelected = idx === selectedAttachmentIdx;
                          const ext = (file.file_name?.split(".").pop() || "PDF").toUpperCase();
                          const isPdf = ext === "PDF";
                          const isDocx = ext === "DOCX" || ext === "DOC";

                          // Label nomor singkat sesuai jenis dokumen
                          const docTypeLower = (file.document_type || "").toLowerCase();
                          const numLabel = docTypeLower.includes("invoice")
                            ? "No. Invoice"
                            : docTypeLower.includes("kuitansi") || docTypeLower.includes("kwitansi")
                            ? "No. Kwitansi"
                            : docTypeLower.includes("faktur")
                            ? "No. Faktur"
                            : "No. Dokumen";

                          return (
                            <div
                              key={file.id || idx}
                              onClick={() => setSelectedAttachmentIdx(idx)}
                              className={`rounded-xl border p-3.5 transition-all cursor-pointer relative ${
                                isSelected
                                  ? "bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/30"
                                  : "bg-white border-slate-200/90 hover:border-blue-300 hover:bg-slate-50/60"
                              }`}
                            >
                              {/* Header Kartu: Icon File + Judul + Badge Jumlah Data */}
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-9 h-10 rounded-lg flex flex-col items-center justify-center shrink-0 border text-[9px] font-black tracking-tighter ${
                                    isPdf
                                      ? "bg-rose-50 border-rose-200 text-rose-600"
                                      : isDocx
                                      ? "bg-blue-50 border-blue-200 text-blue-600"
                                      : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  }`}
                                >
                                  <FileText className="h-3.5 w-3.5 mb-0.5" />
                                  <span>{ext.slice(0, 4)}</span>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="font-bold text-slate-800 text-xs truncate">
                                      {file.document_type && file.document_type !== "Dokumen Pendukung"
                                        ? file.document_type
                                        : file.file_name || `Dokumen ${idx + 1}`}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white shrink-0">
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </span>
                                    <span className="text-[11px] font-semibold text-emerald-600">
                                      {metaSummary.totalFields} data terdeteksi otomatis
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Ringkasan Singkat Metadata (No, Tanggal, Total) */}
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] space-y-1 text-slate-600">
                                <div className="grid grid-cols-12 gap-1">
                                  <span className="col-span-4 text-slate-400 font-medium">{numLabel}</span>
                                  <span className="col-span-8 font-semibold text-slate-700 truncate">
                                    : {metaSummary.summaryNumber}
                                  </span>
                                </div>
                                <div className="grid grid-cols-12 gap-1">
                                  <span className="col-span-4 text-slate-400 font-medium">Tanggal</span>
                                  <span className="col-span-8 font-medium text-slate-700 truncate">
                                    : {metaSummary.summaryDate}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2 pt-0.5">
                                  <div className="grid grid-cols-12 gap-1 flex-1 min-w-0">
                                    <span className="col-span-4 text-slate-400 font-medium">Total</span>
                                    <span className="col-span-8 font-bold text-slate-800 truncate">
                                      : {metaSummary.summaryTotal}
                                    </span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedAttachmentIdx(idx);
                                    }}
                                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                                      isSelected
                                        ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                                        : "bg-slate-50 hover:bg-blue-50 text-blue-600 border-slate-200"
                                    }`}
                                  >
                                    <span>Lihat Detail</span>
                                    <ArrowRight className="h-2.5 w-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* ======================================================== */}
                    {/* PANEL KANAN (8 Cols): Preview & Data Teridentifikasi     */}
                    {/* ======================================================== */}
                    <div className="xl:col-span-8 flex flex-col bg-white">
                      {activeAttachment && activeGroupedMeta && (
                        <>
                          {/* Top Bar: Tabs (Preview Dokumen | Data Teridentifikasi) + Unduh Dokumen */}
                          <div className="px-5 pt-3.5 pb-0 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-white">
                            <div className="flex items-center gap-6">
                              <button
                                type="button"
                                onClick={() => setActiveDocTab("preview")}
                                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                                  activeDocTab === "preview"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Preview Dokumen</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setActiveDocTab("identified")}
                                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                                  activeDocTab === "identified"
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                <ListFilter className="h-3.5 w-3.5" />
                                <span>Data Teridentifikasi</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                  {activeGroupedMeta.totalFields}
                                </span>
                              </button>
                            </div>

                            <div className="pb-2.5">
                              <a
                                href={`${BACKEND_URL}${activeAttachment.file_path}`}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition"
                              >
                                <FileDown className="h-3.5 w-3.5 text-slate-600" />
                                <span>Unduh Dokumen</span>
                              </a>
                            </div>
                          </div>

                          {/* Body Konten Panel Kanan */}
                          {activeDocTab === "preview" ? (
                            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                              
                              {/* KIRI DALAM (6 Cols): Visual Preview Dokumen (Paper Style / PDF Viewer) */}
                              <div className="lg:col-span-6 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shadow-inner flex flex-col">
                                {/* Toolbar Gelap ala PDF Viewer */}
                                <div className="px-3.5 py-2.5 bg-slate-900 text-slate-200 text-[11px] flex items-center justify-between border-b border-slate-700/80">
                                  <span className="font-semibold truncate max-w-[180px]" title={activeAttachment.file_name}>
                                    {activeAttachment.file_name}
                                  </span>
                                  <div className="flex items-center gap-2.5 text-slate-400">
                                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                                      1 / 1
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-300">100%</span>
                                    <a
                                      href={`${BACKEND_URL}${activeAttachment.file_path}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-white transition"
                                      title="Buka di tab baru"
                                    >
                                      <Maximize2 className="h-3.5 w-3.5" />
                                    </a>
                                  </div>
                                </div>

                                {/* Isi Preview: Jika PDF/Gambar tampilkan atau simulasikan lembar dokumen dari metadata */}
                                <div className="p-3.5 bg-slate-800/95 max-h-[560px] overflow-y-auto">
                                  {/\.(pdf)$/i.test(activeAttachment.file_name || "") ? (
                                    <iframe
                                      src={`${BACKEND_URL}${activeAttachment.file_path}`}
                                      className="w-full h-[480px] rounded-lg bg-white border-0"
                                      title={activeAttachment.file_name}
                                    />
                                  ) : /\.(png|jpg|jpeg|webp)$/i.test(activeAttachment.file_name || "") ? (
                                    <img
                                      src={`${BACKEND_URL}${activeAttachment.file_path}`}
                                      alt={activeAttachment.file_name}
                                      className="w-full h-auto rounded-lg bg-white object-contain max-h-[480px]"
                                    />
                                  ) : (
                                    /* Lembar Dokumen Digital Otomatis (Untuk DOCX / XLSX / Berkas lainnya) */
                                    <div className="bg-white rounded-lg shadow-lg p-5 text-[11px] text-slate-800 space-y-4 border border-slate-200 min-h-[440px] flex flex-col justify-between">
                                      <div className="space-y-3.5">
                                        {/* Kop Dokumen */}
                                        <div className="flex items-start justify-between gap-2 pb-3 border-b-2 border-slate-800">
                                          <div>
                                            <div className="font-black text-xs text-slate-900 uppercase tracking-tight">
                                              {activeAttachment.nama_perusahaan ||
                                                document.pihak_eksternal ||
                                                activeGroupedMeta.sections
                                                  .flatMap((s) => s.entries)
                                                  .find((e) => e.key.toLowerCase().includes("perusahaan"))?.value ||
                                                "DOKUMEN PENDUKUNG TRANSAKSI"}
                                            </div>
                                            <p className="text-[10px] text-slate-500 mt-0.5">
                                              {activeGroupedMeta.sections
                                                .flatMap((s) => s.entries)
                                                .find((e) => e.key.toLowerCase().includes("alamat"))?.value ||
                                                activeAttachment.file_name}
                                            </p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="inline-block px-2 py-0.5 rounded bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider">
                                              {activeAttachment.document_type || "DOKUMEN"}
                                            </span>
                                            <div className="text-[10px] text-slate-500 mt-1 font-semibold">
                                              {activeGroupedMeta.summaryNumber !== "-"
                                                ? activeGroupedMeta.summaryNumber
                                                : ""}
                                            </div>
                                          </div>
                                        </div>

                                        {/* Daftar Key-Value di atas lembar dokumen */}
                                        <div className="space-y-1.5 pt-1">
                                          {activeGroupedMeta.sections
                                            .flatMap((s) => s.entries)
                                            .slice(0, 10)
                                            .map((entry, idx) => (
                                              <div
                                                key={idx}
                                                className="grid grid-cols-12 gap-2 py-1 border-b border-slate-100 last:border-0"
                                              >
                                                <span className="col-span-5 text-[10px] font-bold text-slate-500 truncate">
                                                  {entry.key}
                                                </span>
                                                <span className="col-span-7 text-[10px] font-semibold text-slate-800 break-words">
                                                  : {entry.value}
                                                </span>
                                              </div>
                                            ))}
                                        </div>
                                      </div>

                                      {/* Footer Total & Tanda Tangan */}
                                      <div className="pt-3 border-t border-slate-200 flex items-end justify-between gap-2">
                                        <div className="text-[10px] text-slate-500">
                                          <span className="block font-bold text-slate-700">Tanggal Dokumen:</span>
                                          <span>{activeGroupedMeta.summaryDate}</span>
                                        </div>
                                        {activeGroupedMeta.summaryTotal !== "-" && (
                                          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5 text-right">
                                            <span className="text-[9px] font-bold text-blue-600 uppercase block">
                                              Total Nilai
                                            </span>
                                            <span className="font-black text-xs text-blue-900">
                                              {activeGroupedMeta.summaryTotal}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* KANAN DALAM (6 Cols): Banner Document Intelligence & Accordion Kategori Metadata */}
                              <div className="lg:col-span-6 space-y-3.5">
                                {/* Banner Info Document Intelligence */}
                                <div className="rounded-xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/40 p-3.5 flex items-start gap-3">
                                  <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-200/60 shrink-0 mt-0.5">
                                    <Sparkles className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-blue-700">
                                      Data terisi otomatis oleh Document Intelligence
                                    </h4>
                                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                                      Menampilkan <strong>{activeGroupedMeta.totalFields} metadata</strong> yang diekstrak dari berkas dan tersimpan di database.
                                    </p>
                                  </div>
                                </div>

                                {/* Daftar Accordion Kategori Metadata (1. Informasi Dokumen, 2. Nilai Transaksi, 3. Pihak Eksternal, 4. Rekening Pembayaran) */}
                                <div className="space-y-2.5">
                                  {activeGroupedMeta.sections.map((sec) => {
                                    const isOpen = Boolean(openAccordions[sec.id]);
                                    const count = sec.entries.length;

                                    return (
                                      <div
                                        key={sec.id}
                                        className="rounded-xl border border-slate-200/90 bg-white overflow-hidden transition shadow-2xs"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => toggleAccordion(sec.id)}
                                          className="w-full px-4 py-3 flex items-center justify-between gap-2 bg-white hover:bg-slate-50/80 transition cursor-pointer text-left"
                                        >
                                          <div className="flex items-center gap-2.5">
                                            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                                              {sec.icon === "info" && <FileText className="h-3.5 w-3.5" />}
                                              {sec.icon === "nilai" && <CircleDollarSign className="h-3.5 w-3.5" />}
                                              {sec.icon === "pihak" && <UserCheck className="h-3.5 w-3.5" />}
                                              {sec.icon === "rekening" && <Landmark className="h-3.5 w-3.5" />}
                                            </div>
                                            <span className="font-extrabold text-xs text-slate-800">
                                              {sec.title}
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                                              {count} data
                                            </span>
                                            {isOpen ? (
                                              <ChevronUp className="h-4 w-4 text-slate-400" />
                                            ) : (
                                              <ChevronDown className="h-4 w-4 text-slate-400" />
                                            )}
                                          </div>
                                        </button>

                                        {isOpen && (
                                          <div className="px-4 pb-4 pt-2 border-t border-slate-100">
                                            {count === 0 ? (
                                              <p className="text-[11px] text-slate-400 italic py-2">
                                                Tidak ada atribut pada kategori ini.
                                              </p>
                                            ) : (
                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 pt-1">
                                                {sec.entries.map((item, idx) => {
                                                  const isLong =
                                                    item.value.length > 45 ||
                                                    item.key.toLowerCase().includes("description") ||
                                                    item.key.toLowerCase().includes("uraian") ||
                                                    item.key.toLowerCase().includes("berdasarkan") ||
                                                    item.key.toLowerCase().includes("terbilang") ||
                                                    item.key.toLowerCase().includes("alamat");

                                                  return (
                                                    <div
                                                      key={idx}
                                                      className={`${
                                                        isLong
                                                          ? "sm:col-span-2 pt-1 border-t border-slate-100 first:border-0 first:pt-0"
                                                          : "border-r border-slate-100 pr-2 last:border-0"
                                                      }`}
                                                    >
                                                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                                                        {item.key}
                                                      </span>
                                                      <span className="text-xs font-bold text-slate-800 break-words leading-snug block">
                                                        {item.value}
                                                      </span>
                                                    </div>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                            </div>
                          ) : (
                            /* ======================================================== */
                            /* TAB 2: DATA TERIDENTIFIKASI (Full Grid Semua Field)      */
                            /* ======================================================== */
                            <div className="p-5 space-y-4">
                              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-2 rounded-lg bg-emerald-600 text-white">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-emerald-950">
                                      Seluruh Parameter Metadata Dokumen ({activeGroupedMeta.totalFields} Field)
                                    </h4>
                                    <p className="text-[11px] text-emerald-800">
                                      Berkas: <strong>{activeAttachment.file_name}</strong> ({(activeAttachment.file_size / 1024).toFixed(1)} KB)
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activeGroupedMeta.sections.map((sec) => (
                                  <div
                                    key={sec.id}
                                    className="rounded-xl border border-slate-200 p-4 bg-slate-50/40 space-y-3"
                                  >
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                                      <span className="font-extrabold text-xs text-slate-800">
                                        {sec.title}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                        {sec.entries.length} data
                                      </span>
                                    </div>

                                    {sec.entries.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">
                                        Tidak ada data pada bagian ini.
                                      </p>
                                    ) : (
                                      <div className="space-y-2.5">
                                        {sec.entries.map((item, i) => (
                                          <div
                                            key={i}
                                            className="bg-white p-2.5 rounded-lg border border-slate-200/70 shadow-2xs"
                                          >
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                              {item.key}
                                            </span>
                                            <span className="text-xs font-bold text-slate-800 mt-0.5 block break-words">
                                              {item.value}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

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
                    const isDisetujuiFinal =
                      step.key === "disetujui" &&
                      (document.status === "lengkap_valid" ||
                        document.status === "disetujui" ||
                        document.status === "dana_cair" ||
                        document.status === "selesai");
                    const isPassed = idx < activeIndex || isDisetujuiFinal;
                    const isCurrent = idx === activeIndex && !isDisetujuiFinal;

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
                    // Filter log agar tidak menampilkan aktivitas generate dokumen resmi internal (BAST/BAP/BAPP)
                    docAuditLogs
                      .filter((log) => !log.action?.startsWith("GENERATE_") && !log.action?.startsWith("RESET_OFFICIAL"))
                      .map((log) => {
                      // Tentukan warna badge dan label status berdasarkan new_status / action
                      const statusLabel =
                        log.new_status === "dikembalikan" || log.new_status === "ditolak"
                          ? "Ditolak"
                          : log.new_status === "lengkap_valid" || log.new_status === "disetujui"
                          ? "Disetujui"
                          : log.new_status === "menunggu_verifikasi_ulang" || log.new_status === "pengajuan_ulang"
                          ? "Pengajuan Ulang"
                          : log.new_status === "submit_dokumen" || log.new_status === "menunggu_verifikasi"
                          ? "Submit Dokumen"
                          : log.new_status === "review" || log.new_status === "sedang_diverifikasi"
                          ? "Review"
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
