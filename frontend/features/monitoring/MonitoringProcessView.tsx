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
import { PaymentDocument, User } from "@/types/sipandu.types";
import { formatDateID, formatDateTimeID } from "@/lib/dateFormat";

interface MonitoringProcessViewProps {
  documents: PaymentDocument[];
  currentUser?: User | null;
}

// 8 Tahapan standar timeline proses pembayaran
export const TIMELINE_STEPS = [
  { key: "diterima", label: "Dokumen Diterima" },
  { key: "terdaftar", label: "Terdaftar" },
  { key: "diverifikasi", label: "Diverifikasi" },
  { key: "lengkap_valid", label: "Lengkap / Valid" },
  { key: "sedang_diproses", label: "Sedang Diproses" },
  { key: "pengajuan_kppn", label: "Pengajuan ke KPPN" },
  { key: "menunggu_pencairan", label: "Menunggu Pencairan" },
  { key: "dana_cair", label: "Dana Cair" },
];

// Helper menentukan tahapan aktif (0 sampai 7) berdasarkan status dokumen
export const getActiveStepIndex = (status: string): number => {
  switch (status) {
    case "draft":
      return 0; // Dokumen Diterima
    case "menunggu_verifikasi":
      return 1; // Terdaftar
    case "diverifikasi":
    case "sedang_diverifikasi":
    case "dikembalikan":
    case "menunggu_verifikasi_ulang":
      return 2; // Diverifikasi
    case "lengkap":
    case "valid":
    case "lengkap_valid":
      return 3; // Lengkap / Valid
    case "proses":
    case "sedang_diproses":
      return 4; // Sedang Diproses
    case "kppn":
    case "pengajuan_kppn":
      return 5; // Pengajuan ke KPPN
    case "menunggu_pencairan":
      return 6; // Menunggu Pencairan
    case "dana_cair":
    case "selesai":
    case "siap_digunakan":
      return 7; // Dana Cair
    default:
      return 1;
  }
};

// Deskripsi sub-status / keterangan ringkas di bawah progress bar
const getSubStatusDescription = (doc: PaymentDocument, stepIndex: number): string => {
  if (doc.status === "dikembalikan") {
    return doc.catatan_revisi ? `Catatan Revisi: ${doc.catatan_revisi}` : "Perlu perbaikan berkas pendukung oleh PPK";
  }
  switch (stepIndex) {
    case 0:
      return "Berkas fisik diterima oleh loket administrasi";
    case 1:
      return "Dokumen berhasil diregistrasi & menunggu verifikasi Biro 01";
    case 2:
      return "Sedang dalam proses verifikasi berkas oleh Biro 01";
    case 3:
      return "Berkas dinyatakan lengkap, valid, dan disetujui Biro 01";
    case 4:
      return "Sedang diproses pembuatan SPP / SPM";
    case 5:
      return "Menunggu konfirmasi pengajuan";
    case 6:
      return "Menunggu informasi pencairan";
    case 7:
      return "Dana telah berhasil dicairkan ke rekening tujuan";
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
  if (status === "dikembalikan") {
    return "bg-rose-50 text-rose-700 border-rose-200";
  }
  if (stepIndex === 5) {
    // Pengajuan ke KPPN (Indigo / Ungu muda seperti gambar)
    return "bg-indigo-50/70 text-indigo-700 border-indigo-200";
  }
  if (stepIndex === 6) {
    // Menunggu Pencairan (Kuning / Amber seperti gambar)
    return "bg-amber-50/80 text-amber-700 border-amber-200";
  }
  if (stepIndex >= 7 || stepIndex === 3) {
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

  const activeDocStepIndex = activeDoc ? getActiveStepIndex(activeDoc.status) : 0;

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
                        {stepIndex >= 7 && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                        {labelStatus}
                      </span>
                    </div>
                  </div>

                  {/* Segmented Progress Bar 5 Segmen */}
                  <div className="mt-4 grid grid-cols-5 gap-1.5 items-center">
                    {[0, 1, 2, 3, 4].map((segIdx) => {
                      let segCompleted = false;
                      let segActive = false;

                      if (segIdx === 0) {
                        segCompleted = stepIndex > 1;
                        segActive = stepIndex <= 1;
                      } else if (segIdx === 1) {
                        segCompleted = stepIndex > 2;
                        segActive = stepIndex === 2;
                      } else if (segIdx === 2) {
                        segCompleted = stepIndex > 4;
                        segActive = stepIndex === 3 || stepIndex === 4;
                      } else if (segIdx === 3) {
                        segCompleted = stepIndex > 6;
                        segActive = stepIndex === 5 || stepIndex === 6;
                      } else if (segIdx === 4) {
                        segCompleted = stepIndex >= 7; // Dana Cair = Alur Selesai (Rampung)
                        segActive = false;
                      }

                      let barColor = "bg-slate-100"; // Segmen belum tercapai
                      if (doc.status === "dikembalikan") {
                        if (segIdx <= 1) barColor = "bg-rose-500";
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
                  <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                    {activeDoc.nomor_surat}
                  </h2>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {activeDoc.unit_kerja || "Unit Kerja"}
                  </span>
                </div>

                {/* Vertical Stepper Timeline Steps */}
                <div className="relative mt-6 pl-8 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-3 before:w-[2px] before:bg-slate-100">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isPassed = idx < activeDocStepIndex;
                    const isCurrent = idx === activeDocStepIndex;
                    
                    let stepDate: string | null = null;
                    if (idx === 0) {
                      stepDate = formatDateID(activeDoc.tanggal_diterima || activeDoc.created_at, { format: "numeric" });
                    } else if (idx === 1) {
                      stepDate = formatDateTimeID(activeDoc.created_at, { format: "numeric" });
                    } else if (idx === 2 && activeDoc.tanggal_verifikasi) {
                      stepDate = formatDateTimeID(activeDoc.tanggal_verifikasi, { format: "numeric" });
                    } else if (idx <= activeDocStepIndex && activeDoc.updated_at) {
                      stepDate = formatDateTimeID(activeDoc.updated_at, { format: "numeric" });
                    }

                    return (
                      <div key={step.key} className="relative flex items-start">
                        {/* Bullet Icon */}
                        <div className="absolute -left-8 mt-0.5 flex items-center justify-center bg-white">
                          {isPassed ? (
                            <div className="w-5 h-5 rounded-full bg-white text-emerald-600 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 fill-emerald-50 text-emerald-600" />
                            </div>
                          ) : isCurrent ? (
                            <div className="w-5 h-5 rounded-full border-2 border-blue-600 bg-white flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-200 bg-white" />
                          )}
                        </div>

                        {/* Text Label & Waktu */}
                        <div className="min-w-0 flex-1 ml-1">
                          <p
                            className={`text-xs ${
                              isCurrent
                                ? "text-slate-900 font-bold"
                                : isPassed
                                ? "text-slate-800 font-semibold"
                                : "text-slate-400 font-normal"
                            }`}
                          >
                            {step.label}
                          </p>
                          {stepDate && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                              {stepDate}
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
