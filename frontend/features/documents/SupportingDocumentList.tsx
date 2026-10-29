"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  FileText,
  RefreshCw,
  Eye,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Sparkles,
  MoreVertical,
  Send,
  Lock,
  Layers,
  FileCheck2,
  Clock,
  ArrowUpRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { PaymentDocument, User } from "@/types/sipandu.types";
import { formatDateID } from "@/lib/dateFormat";
import { sipanduApi } from "@/services/api.service";
import { GenerateOfficialDocModal } from "./GenerateOfficialDocModal";
import { GeneratorType, printOfficialDoc } from "@/lib/officialDocPdf";
import { DatePicker } from "@/components/ui/DatePicker";
import { dateRangeFilterSchema, DateRangeFilterErrors } from "@/schemas/document.schema";

interface SupportingDocumentListProps {
  documents?: PaymentDocument[];
  currentUser: User | null;
  onOpenDetail: (doc: PaymentDocument) => void;
  onRefresh?: () => void;
  loading?: boolean;
  onShowToast?: (type: "success" | "error" | "info" | "warning", title: string, message: string) => void;
}

export const SupportingDocumentList: React.FC<SupportingDocumentListProps> = ({
  documents: initialDocuments = [],
  currentUser,
  onOpenDetail,
  onRefresh,
  loading = false,
  onShowToast,
}) => {
  const [documents, setDocuments] = useState<PaymentDocument[]>(initialDocuments);
  const [totalDocuments, setTotalDocuments] = useState(initialDocuments.length);
  const [apiLoading, setApiLoading] = useState(false);

  // Ambil tanggal hari ini dalam format YYYY-MM-DD
  const getTodayIso = () => new Date().toISOString().split("T")[0];

  // Search & Filter (default: hari ini)
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [startDate, setStartDate] = useState(getTodayIso());
  const [endDate, setEndDate] = useState(getTodayIso());
  const [dateErrors, setDateErrors] = useState<DateRangeFilterErrors>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dropdown action position
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // Generator Modal State
  const [selectedDocForGenerate, setSelectedDocForGenerate] = useState<PaymentDocument | null>(null);
  const [generatorType, setGeneratorType] = useState<GeneratorType>("BAPP");
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);

  // Loading kirim ke Biro 01
  const [submittingDocId, setSubmittingDocId] = useState<number | null>(null);

  // Handle filter tanggal dengan skema validasi
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    const result = dateRangeFilterSchema.validate({ startDate: val, endDate });
    setDateErrors(result.errors);
    if (result.isValid) {
      setPage(1);
    }
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    const result = dateRangeFilterSchema.validate({ startDate, endDate: val });
    setDateErrors(result.errors);
    if (result.isValid) {
      setPage(1);
    }
  };

  const handleResetDateFilter = () => {
    const today = getTodayIso();
    setStartDate(today);
    setEndDate(today);
    setDateErrors({});
    setPage(1);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchDocumentsFromApi = async () => {
    if (dateErrors.startDate || dateErrors.endDate) {
      return;
    }

    try {
      setApiLoading(true);
      const res = await sipanduApi.getDocuments({
        search: debouncedSearch,
        status: statusFilter,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        limit,
        user_role: currentUser?.role,
      });

      if (res.success && res.data) {
        if (Array.isArray(res.data.documents)) {
          setDocuments(res.data.documents);
          setTotalDocuments(res.data.total ?? 0);
        } else if (Array.isArray(res.data)) {
          setDocuments(res.data);
          setTotalDocuments(res.data.length);
        }
      }
    } catch (err) {
      console.error("Gagal memuat dokumen dari backend:", err);
    } finally {
      setApiLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentsFromApi();
  }, [debouncedSearch, statusFilter, startDate, endDate, page, limit]);

  const handleOpenGenerator = (doc: PaymentDocument, type: GeneratorType) => {
    setSelectedDocForGenerate(doc);
    setGeneratorType(type);
    setIsGeneratorModalOpen(true);
    setOpenDropdownId(null);
  };

  // Kirim ke Biro 01 (Aktif jika BAST, BAP, BAPP sudah digenerate)
  const handleSubmitToBiro = async (doc: PaymentDocument) => {
    try {
      setSubmittingDocId(doc.id);
      const isResubmit = doc.status === "dikembalikan" || doc.status === "ditolak";
      const res = await sipanduApi.submitToBiro(doc.id, {
        user_name: currentUser?.full_name,
        user_role: currentUser?.role,
      });
      if (res.success) {
        setOpenDropdownId(null);
        await fetchDocumentsFromApi();
        if (onRefresh) onRefresh();
        if (onShowToast) {
          onShowToast(
            "success",
            isResubmit ? "Pengajuan Ulang Berhasil" : "Dokumen Berhasil Dikirim",
            isResubmit
              ? `Dokumen ${doc.nomor_surat} berhasil diajukan ulang ke Biro 01 Keuangan untuk diperiksa kembali.`
              : `Dokumen ${doc.nomor_surat} berhasil disubmit ke Biro 01 Keuangan untuk diverifikasi.`
          );
        }
      } else {
        if (onShowToast) {
          onShowToast("error", "Gagal Mengirim", res.message || "Gagal mengirim dokumen ke Biro 01");
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast("error", "Error", err.message || "Terjadi kesalahan saat mengirim berkas");
      }
    } finally {
      setSubmittingDocId(null);
    }
  };

  // Reset berkas resmi (BAST, BAP, BAPP) agar form isian bisa muncul dan diedit kembali (hanya jika status draft)
  const handleResetDocs = async (doc: PaymentDocument) => {
    if (!confirm(`Reset semua berkas resmi (BAST, BAP, BAPP) untuk dokumen "${doc.nomor_surat}"? Form isian akan dapat diedit kembali.`)) {
      return;
    }
    try {
      const res = await sipanduApi.resetOfficialDocs(doc.id, {
        user_name: currentUser?.full_name,
        user_role: currentUser?.role,
      });
      if (res.success) {
        setOpenDropdownId(null);
        await fetchDocumentsFromApi();
        if (onRefresh) onRefresh();
        if (onShowToast) {
          onShowToast("success", "Dokumen Direset", "Berkas resmi BAST, BAP, dan BAPP berhasil direset. Form generator dapat dibuka kembali.");
        }
      } else {
        if (onShowToast) {
          onShowToast("error", "Gagal Reset", res.message || "Gagal mereset berkas");
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast("error", "Error", err.message || "Terjadi kesalahan");
      }
    }
  };

  // Print berkas resmi (BAST, BAP, BAPP) dan otomatis ubah status ke 'review' jika dibuka oleh Biro 01
  const handlePrintDoc = async (doc: PaymentDocument, type: GeneratorType) => {
    printOfficialDoc(doc, type);
    setOpenDropdownId(null);

    if (
      currentUser?.role === "biro_01" &&
      (doc.status === "submit_dokumen" || doc.status === "menunggu_verifikasi" || doc.status === "menunggu_verifikasi_ulang")
    ) {
      // Optimistic update status lokal di list Dokumen Pendukung
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === doc.id
            ? { ...d, status: "review", legend_status: "Review", legend_color: "blue" }
            : d
        )
      );

      try {
        await sipanduApi.markAsReview(doc.id, {
          user_name: currentUser.full_name,
          user_role: currentUser.role,
        });
        await fetchDocumentsFromApi();
        if (onRefresh) onRefresh();
      } catch (e) {}
    }
  };

  const getBadgeClass = (color: string) => {
    switch (color) {
      case "green":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/80";
      case "blue":
        return "bg-blue-50 text-blue-700 border border-blue-200/80";
      case "amber":
        return "bg-amber-50 text-amber-700 border border-amber-200/80";
      case "purple":
        return "bg-purple-50 text-purple-700 border border-purple-200/80";
      case "cyan":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200/80";
      case "red":
        return "bg-rose-50 text-rose-700 border border-rose-200/80";
      default:
        return "bg-slate-50 text-slate-700 border border-slate-200/80";
    }
  };

  const totalPages = Math.ceil(totalDocuments / limit) || 1;

  return (
    <div className="space-y-4">
      {/* Top Banner Header Card (Sama persis seperti di menu Daftar Dokumen) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xs">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Dokumen Pendukung</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Generate dokumen resmi BAST, BAP, dan BAPP sesuai format standar dan kirim ke Biro 01.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Tombol Refresh Data */}
          <button
            type="button"
            onClick={() => {
              fetchDocumentsFromApi();
              if (onRefresh) onRefresh();
            }}
            disabled={loading || apiLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data Dokumen"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading || apiLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CARD BESAR: MEMBUNGKUS CONTROL BAR (SEARCH, FILTER & LIMIT) BESERTA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Bagian Filter, Pencarian, & Limit Selector */}
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 bg-slate-50/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nomor surat, uraian belanja, atau nama PPK..."
                className="w-full pl-10 pr-9 py-2 text-sm rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-semibold transition shadow-2xs"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-2.5 p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                  title="Hapus pencarian"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filter Status */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 font-bold">Status:</span>
                <select
                  aria-label="Filter Berdasarkan Status Dokumen"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="text-xs border border-slate-300 bg-white hover:bg-slate-50 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none cursor-pointer transition shadow-2xs"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="draft">Draft</option>
                  <option value="submit_dokumen">Submit Dokumen</option>
                  <option value="review">Review</option>
                  <option value="dikembalikan">Ditolak</option>
                  <option value="menunggu_verifikasi_ulang">Pengajuan Ulang</option>
                  <option value="lengkap_valid">Disetujui</option>
                </select>
              </div>

              {/* Limit Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 font-bold">Baris:</span>
                <select
                  aria-label="Jumlah baris per halaman"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-xs border border-slate-300 bg-white hover:bg-slate-50 rounded-xl px-2.5 py-2 font-bold text-slate-800 outline-none cursor-pointer transition shadow-2xs"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sub-baris: Filter Tanggal Mulai dan Tanggal Akhir */}
          <div className="pt-2.5 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-blue-600" />
                <span>Filter Periode:</span>
              </span>

              {/* Input Tanggal Mulai dengan DatePicker Component */}
              <div className="w-48 sm:w-52">
                <DatePicker
                  value={startDate}
                  onChange={handleStartDateChange}
                  placeholder="Tanggal Mulai"
                  maxDate={endDate || undefined}
                  hasError={!!dateErrors.startDate}
                />
              </div>

              <span className="text-slate-400 font-bold hidden sm:inline">-</span>

              {/* Input Tanggal Akhir dengan DatePicker Component */}
              <div className="w-48 sm:w-52">
                <DatePicker
                  value={endDate}
                  onChange={handleEndDateChange}
                  placeholder="Tanggal Akhir"
                  minDate={startDate || undefined}
                  hasError={!!dateErrors.endDate}
                />
              </div>

              {/* Tombol Reset Tanggal ke Hari Ini */}
              {(startDate !== getTodayIso() || endDate !== getTodayIso()) && (
                <button
                  type="button"
                  onClick={handleResetDateFilter}
                  className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition shadow-2xs cursor-pointer"
                  title="Reset Filter Tanggal ke Hari Ini"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Reset ke Hari Ini</span>
                </button>
              )}
            </div>

            {/* Error Message jika validasi skema gagal */}
            {(dateErrors.startDate || dateErrors.endDate) && (
              <div className="flex items-center gap-1.5 text-rose-600 font-bold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{dateErrors.startDate || dateErrors.endDate}</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabel Dokumen Pendukung */}
        <div className="overflow-x-auto min-h-[350px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="px-5 py-3.5 whitespace-nowrap">No.</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Nomor Surat / Tanggal</th>
                <th className="px-5 py-3.5 min-w-[200px]">Jenis Dokumen / Perihal</th>
                <th className="px-5 py-3.5 whitespace-nowrap">PPK / Unit Kerja</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Nilai Pembayaran</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Status Dokumen</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Status Berkas Resmi</th>
                <th className="px-5 py-3.5 text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiLoading || loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-semibold">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
                      <span>Memuat data berkas dokumen...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2 stroke-1" />
                    <p className="font-bold text-slate-600 text-sm">Tidak ada dokumen ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Silakan sesuaikan kata kunci pencarian atau filter status dokumen.
                    </p>
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => {
                  const allThreeGenerated = Boolean(doc.bast_generated && doc.bap_generated && doc.bapp_generated);
                  const isSubmitted = doc.status !== "draft";

                  return (
                    <tr key={doc.id} className="hover:bg-blue-50/50 group transition duration-150">
                      {/* Nomor Urut */}
                      <td className="px-5 py-4 font-bold text-slate-400 group-hover:text-blue-600 transition">
                        {(page - 1) * limit + idx + 1}
                      </td>

                      {/* Nomor Surat & Tanggal */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div
                          className="font-extrabold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1.5"
                          onClick={() => onOpenDetail(doc)}
                        >
                          <span>{doc.nomor_surat}</span>
                          <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-blue-500 transition" />
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {formatDateID(doc.tanggal_dokumen || doc.tanggal_pengajuan)}
                        </div>
                      </td>

                      {/* Jenis Dokumen / Perihal */}
                      <td className="px-5 py-4">
                        <div className="max-w-xs md:max-w-sm">
                          <div className="font-bold text-slate-900 leading-snug">{doc.jenis_dokumen || "Pembayaran LS (Langsung)"}</div>
                          <div className="text-xs text-slate-600 font-medium">{doc.perihal || doc.nama_kegiatan}</div>
                        </div>
                      </td>

                      {/* PPK & Unit Kerja */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{doc.ppk_name}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">{doc.unit_kerja}</div>
                      </td>

                      {/* Nilai Pembayaran */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-black text-slate-900 text-sm tracking-tight font-mono">
                          Rp {Number(doc.nilai_pembayaran).toLocaleString("id-ID")}
                        </div>
                      </td>

                      {/* Status Dokumen */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-xs tracking-tight ${getBadgeClass(
                            doc.legend_color
                          )}`}
                        >
                          {doc.status === "dana_cair" || doc.status === "selesai" || doc.status === "lengkap_valid" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse"></span>
                          )}
                          {doc.legend_status}
                        </span>
                      </td>

                      {/* Status Berkas Resmi (BAST, BAP, BAPP) */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide transition shadow-2xs border ${
                              doc.bast_generated
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400/20"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                          >
                            BAST {doc.bast_generated ? "✓" : "-"}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide transition shadow-2xs border ${
                              doc.bap_generated
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400/20"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                          >
                            BAP {doc.bap_generated ? "✓" : "-"}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-lg font-bold text-[10px] tracking-wide transition shadow-2xs border ${
                              doc.bapp_generated
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400/20"
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}
                          >
                            BAPP {doc.bapp_generated ? "✓" : "-"}
                          </span>
                        </div>
                      </td>

                      {/* Dropdown Aksi */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              if (openDropdownId === doc.id) {
                                setOpenDropdownId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const popoverHeight = 220;
                                const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

                                setDropdownPos({
                                  top: openUpwards ? rect.top - popoverHeight - 6 : rect.bottom + 6,
                                  right: window.innerWidth - rect.right,
                                });
                                setOpenDropdownId(doc.id);
                              }
                            }}
                            className={`p-2 rounded-xl border transition cursor-pointer ${
                              openDropdownId === doc.id
                                ? "bg-blue-50 border-blue-400 text-blue-600 shadow-xs"
                                : "border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                            }`}
                            title="Menu Aksi Dokumen Pendukung"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {/* Popover Dropdown */}
                          {openDropdownId === doc.id && dropdownPos && (
                            <>
                              <div
                                className="fixed inset-0 z-[120]"
                                onClick={() => setOpenDropdownId(null)}
                              />
                              <div
                                style={{
                                  top: `${dropdownPos.top}px`,
                                  right: `${dropdownPos.right}px`,
                                }}
                                className="fixed w-56 rounded-xl bg-white shadow-2xl border border-slate-200 py-1.5 z-[130] text-left animate-in fade-in duration-100"
                              >
                                <div className="px-3.5 py-1 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                  Generate Berkas Resmi
                                </div>

                                {/* Generate / Cetak BAST */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (doc.bast_generated) {
                                      handlePrintDoc(doc, "BAST");
                                    } else {
                                      handleOpenGenerator(doc, "BAST");
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Printer className="h-3.5 w-3.5 text-blue-600" />
                                    <span>{doc.bast_generated ? "Cetak BAST" : "Generate BAST"}</span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (doc.bap_generated) {
                                      handlePrintDoc(doc, "BAP");
                                    } else {
                                      handleOpenGenerator(doc, "BAP");
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Printer className="h-3.5 w-3.5 text-indigo-600" />
                                    <span>{doc.bap_generated ? "Cetak BAP" : "Generate BAP"}</span>
                                  </div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (doc.bapp_generated) {
                                      handlePrintDoc(doc, "BAPP");
                                    } else {
                                      handleOpenGenerator(doc, "BAPP");
                                    }
                                  }}
                                  className="w-full flex items-center justify-between px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Printer className="h-3.5 w-3.5 text-blue-600" />
                                    <span>{doc.bapp_generated ? "Cetak BAPP" : "Generate BAPP"}</span>
                                  </div>
                                </button>

                                <div className="my-1 border-t border-slate-100" />

                                {/* Tombol Reset Berkas: Muncul jika dokumen berstatus draft atau ditolak dan ada berkas resmi yang sudah di-generate */}
                                {(doc.status === "draft" || doc.status === "dikembalikan" || doc.status === "ditolak") &&
                                  (doc.bast_generated || doc.bap_generated || doc.bapp_generated) &&
                                  currentUser?.role === "ppk" && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetDocs(doc)}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-rose-500" />
                                    <span>Reset Berkas</span>
                                  </button>
                                )}

                                {/* Tombol Kirim ke Biro 01: Muncul jika BAST, BAP, BAPP sudah di-generate dan status dokumen draft atau ditolak */}
                                {allThreeGenerated &&
                                  (doc.status === "draft" ||
                                    doc.status === "dikembalikan" ||
                                    doc.status === "ditolak" ||
                                    doc.status === "menunggu_verifikasi" ||
                                    !isSubmitted) &&
                                  currentUser?.role === "ppk" && (
                                    <button
                                      type="button"
                                      disabled={submittingDocId === doc.id}
                                      onClick={() => handleSubmitToBiro(doc)}
                                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer"
                                    >
                                      <Send className="h-3.5 w-3.5 text-emerald-600" />
                                      <span>
                                        {submittingDocId === doc.id
                                          ? "Mengirim..."
                                          : doc.status === "dikembalikan" || doc.status === "ditolak"
                                          ? "Kirim Ulang ke Biro 01"
                                          : "Kirim ke Biro 01"}
                                      </span>
                                    </button>
                                  )}
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 text-xs">
          <div className="font-semibold text-slate-500">
            Menampilkan <span className="font-bold text-slate-800">{documents.length > 0 ? (page - 1) * limit + 1 : 0}</span> sampai{" "}
            <span className="font-bold text-slate-800">{Math.min(page * limit, totalDocuments)}</span> dari{" "}
            <span className="font-bold text-slate-800">{totalDocuments}</span> dokumen pendukung
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(1)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-700">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Generator Form Modal */}
      <GenerateOfficialDocModal
        isOpen={isGeneratorModalOpen}
        onClose={() => setIsGeneratorModalOpen(false)}
        document={selectedDocForGenerate}
        initialType={generatorType}
        onSuccess={() => {
          fetchDocumentsFromApi();
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
