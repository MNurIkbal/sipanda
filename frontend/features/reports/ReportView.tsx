import React, { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Calendar,
  RefreshCw,
  X,
  FileCheck2,
  Building2,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DownloadCloud,
  AlertCircle,
} from "lucide-react";
import { PaymentDocument, User } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { validateReportExportFilter, ReportFilterErrors } from "@/schemas/report.schema";
import { AlertDialog } from "@/components/ui/AlertDialog";

interface ReportViewProps {
  currentUser: User | null;
  onOpenDetail: (doc: PaymentDocument) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({
  currentUser,
  onOpenDetail,
}) => {
  const [documents, setDocuments] = useState<PaymentDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [exportingType, setExportingType] = useState<"excel" | "pdf" | null>(null);

  // Modal Alert Dialog State (menggantikan alert JS biasa)
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "warning" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "warning",
  });

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [filterErrors, setFilterErrors] = useState<ReportFilterErrors>({});

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Ambil data dokumen dari backend
  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      // Ambil dokumen dengan limit besar untuk keperluan laporan & filter
      const res = await sipanduApi.getDocuments({ limit: 1000, page: 1 });
      if (res.success && res.data) {
        const docs = Array.isArray(res.data) ? res.data : res.data.documents || [];
        setDocuments(docs);
      }
    } catch (err) {
      console.error("Gagal mengambil data laporan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  // Format Tanggal Indonesia
  const formatDateIndonesia = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper Badge Status
  const getBadgeClass = (color: string) => {
    switch (color) {
      case "emerald":
      case "green":
        return "bg-emerald-50 text-emerald-800 border border-emerald-300";
      case "red":
        return "bg-rose-50 text-rose-800 border border-rose-300";
      case "amber":
        return "bg-amber-50 text-amber-800 border border-amber-300";
      case "orange":
        return "bg-orange-50 text-orange-800 border border-orange-300";
      case "indigo":
        return "bg-indigo-50 text-indigo-800 border border-indigo-300";
      default:
        return "bg-blue-50 text-blue-800 border border-blue-300";
    }
  };

  // Filter data berdasarkan Tanggal Awal, Tanggal Akhir, dan Status Dokumen
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Filter Status
      if (statusFilter !== "ALL" && doc.status !== statusFilter) {
        return false;
      }

      // 2. Filter Tanggal Pengajuan
      const docDate = doc.tanggal_pengajuan ? doc.tanggal_pengajuan.split("T")[0] : "";
      if (startDate && docDate && docDate < startDate) {
        return false;
      }
      if (endDate && docDate && docDate > endDate) {
        return false;
      }

      return true;
    });
  }, [documents, statusFilter, startDate, endDate]);

  // Statistik Ringkasan Hasil Filter
  const summaryStats = useMemo(() => {
    const totalCount = filteredDocuments.length;
    const totalNominal = filteredDocuments.reduce(
      (sum, item) => sum + (Number(item.nilai_pembayaran) || 0),
      0
    );
    const validCount = filteredDocuments.filter(
      (d) => d.status === "lengkap_valid" || d.status === "dana_cair"
    ).length;
    const pendingCount = filteredDocuments.filter(
      (d) => d.status === "menunggu_verifikasi" || d.status === "sedang_diverifikasi"
    ).length;

    return { totalCount, totalNominal, validCount, pendingCount };
  }, [filteredDocuments]);

  // Perhitungan Pagination
  const totalItems = filteredDocuments.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedDocs = filteredDocuments.slice(startIndex, startIndex + limit);

  // Reset Semua Filter
  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    setFilterErrors({});
    setPage(1);
  };

  // Handler Perubahan Tanggal Awal (Validasi otomatis dua arah)
  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setPage(1);

    setFilterErrors((prev) => {
      const updated = { ...prev };
      delete updated.startDate;
      if (val && endDate && val > endDate) {
        updated.startDate = "Tanggal awal tidak boleh lebih besar dari tanggal akhir!";
        updated.endDate = "Tanggal akhir tidak boleh lebih kecil dari tanggal awal!";
      } else if (val && endDate && val <= endDate) {
        delete updated.startDate;
        delete updated.endDate;
      }
      return updated;
    });
  };

  // Handler Perubahan Tanggal Akhir (Validasi otomatis dua arah)
  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setPage(1);

    setFilterErrors((prev) => {
      const updated = { ...prev };
      delete updated.endDate;
      if (startDate && val && val < startDate) {
        updated.startDate = "Tanggal awal tidak boleh lebih besar dari tanggal akhir!";
        updated.endDate = "Tanggal akhir tidak boleh lebih kecil dari tanggal awal!";
      } else if (startDate && val && val >= startDate) {
        delete updated.startDate;
        delete updated.endDate;
      }
      return updated;
    });
  };

  // Tombol Refresh: muat ulang data sekaligus reset filter tanggal & status
  const handleRefresh = async () => {
    handleResetFilter();
    await fetchAllDocuments();
  };

  // ===================== FITUR EXPORT EXCEL (.XLS / HTML TABLE BASED) =====================
  const handleExportExcel = () => {
    const { isValid, errors } = validateReportExportFilter({
      startDate,
      endDate,
      statusFilter,
    });

    if (!isValid) {
      setFilterErrors(errors);
      return;
    }
    setFilterErrors({});

    if (filteredDocuments.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: "Data Laporan Kosong",
        description: "Tidak ada data dokumen yang dapat diexport dengan rentang tanggal dan status yang dipilih.",
        variant: "warning",
      });
      return;
    }

    setExportingType("excel");
    try {
      const filterLabel =
        statusFilter === "ALL" ? "Semua Status" : statusFilter.toUpperCase();
      const periodeLabel =
        startDate || endDate
          ? `${startDate || "Awal"} s/d ${endDate || "Sekarang"}`
          : "Semua Periode";

      const tableRows = filteredDocuments
        .map((doc, idx) => {
          return `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td style="mso-number-format:'\\@';">${doc.nomor_surat || "-"}</td>
              <td>${formatDateIndonesia(doc.tanggal_pengajuan)}</td>
              <td>${doc.jenis_dokumen || "-"}</td>
              <td>${doc.perihal || "-"}</td>
              <td>${doc.ppk_name || "-"}</td>
              <td>${doc.unit_kerja || "-"}</td>
              <td style="mso-number-format:'#,##0'; text-align: right;">${doc.nilai_pembayaran || 0}</td>
              <td style="text-align: center;">${doc.legend_status || doc.status}</td>
            </tr>
          `;
        })
        .join("");

      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
          <!--[if gte mso 9]>
          <xml>
            <x:ExcelWorkbook>
              <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                  <x:Name>Laporan Dokumen SIPANDA</x:Name>
                  <x:WorksheetOptions>
                    <x:DisplayGridlines/>
                  </x:WorksheetOptions>
                </x:ExcelWorksheet>
              </x:ExcelWorksheets>
            </x:ExcelWorkbook>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th { background-color: #1e3a8a; color: #ffffff; border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 11px; }
            td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11px; vertical-align: top; }
            .header-title { font-size: 16px; font-weight: bold; color: #0f172a; text-align: center; }
            .header-subtitle { font-size: 11px; color: #475569; text-align: center; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="9" class="header-title">LAPORAN MONITORING DOKUMEN PEMBAYARAN</td></tr>
            <tr><td colspan="9" class="header-subtitle">SIPANDA • Kementerian Keuangan Republik Indonesia</td></tr>
            <tr><td colspan="9" class="header-subtitle">Filter Periode: ${periodeLabel} | Filter Status: ${filterLabel} | Total Data: ${filteredDocuments.length}</td></tr>
            <tr><td colspan="9"></td></tr>
            <thead>
              <tr>
                <th style="width: 40px;">No.</th>
                <th>Nomor Surat</th>
                <th>Tanggal Pengajuan</th>
                <th>Jenis Dokumen</th>
                <th>Uraian / Perihal Belanja</th>
                <th>Nama PPK</th>
                <th>Unit Kerja</th>
                <th>Nilai Pembayaran (Rp)</th>
                <th>Status Berkas</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="font-weight: bold; background-color: #f1f5f9;">
                <td colspan="7" style="text-align: right; font-weight: bold;">TOTAL NILAI PEMBAYARAN:</td>
                <td style="mso-number-format:'#,##0'; text-align: right; font-weight: bold;">${summaryStats.totalNominal}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([excelTemplate], {
        type: "application/vnd.ms-excel;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `Laporan_Dokumen_SIPANDA_${timestamp}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Gagal export excel:", err);
      setAlertDialog({
        isOpen: true,
        title: "Gagal Ekspor Excel",
        description: "Terjadi kesalahan sistem saat membuat file Excel. Silakan coba kembali.",
        variant: "danger",
      });
    } finally {
      setExportingType(null);
    }
  };

  // ===================== FITUR EXPORT PDF (PRINT TO PDF KEMENKEU TEMPLATE) =====================
  const handleExportPdf = () => {
    const { isValid, errors } = validateReportExportFilter({
      startDate,
      endDate,
      statusFilter,
    });

    if (!isValid) {
      setFilterErrors(errors);
      return;
    }
    setFilterErrors({});

    if (filteredDocuments.length === 0) {
      setAlertDialog({
        isOpen: true,
        title: "Data Laporan Kosong",
        description: "Tidak ada data dokumen yang dapat dicetak dengan rentang tanggal dan status yang dipilih.",
        variant: "warning",
      });
      return;
    }

    setExportingType("pdf");
    try {
      const filterLabel =
        statusFilter === "ALL" ? "Semua Status" : statusFilter.toUpperCase();
      const periodeLabel =
        startDate || endDate
          ? `${formatDateIndonesia(startDate) || "Awal"} s/d ${formatDateIndonesia(endDate) || "Sekarang"}`
          : "Semua Periode";

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        setAlertDialog({
          isOpen: true,
          title: "Pop-up Diblokir",
          description: "Browser Anda memblokir jendela cetak. Mohon izinkan pop-up pada peramban untuk mencetak laporan PDF.",
          variant: "warning",
        });
        setExportingType(null);
        return;
      }

      const tableRows = filteredDocuments
        .map((doc, idx) => {
          return `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td style="font-weight: bold; color: #1e40af;">${doc.nomor_surat || "-"}</td>
              <td>${formatDateIndonesia(doc.tanggal_pengajuan)}</td>
              <td>
                <div style="font-weight: bold;">${doc.jenis_dokumen || "-"}</div>
                <div style="color: #64748b; font-size: 10px;">${doc.perihal || "-"}</div>
              </td>
              <td>
                <div style="font-weight: 600;">${doc.ppk_name || "-"}</div>
                <div style="color: #64748b; font-size: 10px;">${doc.unit_kerja || "-"}</div>
              </td>
              <td style="text-align: right; font-weight: bold;">Rp ${(Number(doc.nilai_pembayaran) || 0).toLocaleString("id-ID")}</td>
              <td style="text-align: center;">
                <span class="status-badge">${doc.legend_status || doc.status}</span>
              </td>
            </tr>
          `;
        })
        .join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <title>Laporan Dokumen SIPANDA</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 15mm 12mm 15mm 12mm;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 10px;
              font-size: 11px;
            }
            .kop {
              border-bottom: 2.5px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .kop-title {
              font-size: 16px;
              font-weight: 900;
              color: #0f172a;
              letter-spacing: 0.5px;
            }
            .kop-subtitle {
              font-size: 12px;
              color: #475569;
              font-weight: 600;
              margin-top: 2px;
            }
            .meta-box {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px 14px;
              margin-bottom: 16px;
              display: flex;
              justify-content: space-between;
              font-size: 10.5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              border: 1px solid #cbd5e1;
              padding: 7px 8px;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 800;
            }
            td {
              border: 1px solid #e2e8f0;
              padding: 6px 8px;
              font-size: 10.5px;
              vertical-align: middle;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .status-badge {
              display: inline-block;
              padding: 2px 7px;
              border-radius: 9999px;
              background-color: #f1f5f9;
              border: 1px solid #cbd5e1;
              font-size: 9.5px;
              font-weight: bold;
              color: #334155;
            }
            .footer-sign {
              margin-top: 30px;
              display: flex;
              justify-content: flex-end;
              font-size: 11px;
            }
            .sign-box {
              text-align: center;
              width: 220px;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="kop">
            <div>
              <div class="kop-title">SIPANDA • LAPORAN STATUS DOKUMEN PEMBAYARAN</div>
              <div class="kop-subtitle">Biro Keuangan — Kementerian Keuangan Republik Indonesia</div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #64748b;">
              <div>Dicetak: ${new Date().toLocaleString("id-ID")}</div>
              <div>Oleh: ${currentUser?.full_name || "Petugas SIPANDA"}</div>
            </div>
          </div>

          <div class="meta-box">
            <div>
              <strong>Periode Tanggal:</strong> ${periodeLabel}<br/>
              <strong>Status Berkas:</strong> ${filterLabel}
            </div>
            <div style="text-align: right;">
              <strong>Total Dokumen:</strong> ${filteredDocuments.length} berkas<br/>
              <strong>Total Nilai:</strong> Rp ${summaryStats.totalNominal.toLocaleString("id-ID")}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">No.</th>
                <th>Nomor Surat</th>
                <th>Tanggal Pengajuan</th>
                <th>Jenis Dokumen / Perihal</th>
                <th>PPK / Unit Kerja</th>
                <th style="text-align: right;">Nilai Pembayaran</th>
                <th style="text-align: center;">Status Berkas</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="font-weight: bold; background-color: #f1f5f9;">
                <td colspan="5" style="text-align: right; padding: 8px;">TOTAL KESELURUHAN:</td>
                <td style="text-align: right; padding: 8px; color: #1e40af;">Rp ${summaryStats.totalNominal.toLocaleString("id-ID")}</td>
                <td style="text-align: center; padding: 8px;">${filteredDocuments.length} Dokumen</td>
              </tr>
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (err) {
      console.error("Gagal export PDF:", err);
      setAlertDialog({
        isOpen: true,
        title: "Gagal Ekspor PDF",
        description: "Terjadi kesalahan saat memproses cetak dokumen PDF. Silakan coba kembali.",
        variant: "danger",
      });
    } finally {
      setExportingType(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Banner & Action Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Laporan Dokumen Pembayaran
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Rekapitulasi, filter periode tanggal, status berkas, serta ekspor format Excel & PDF resmi.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Export Excel & PDF */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Data */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data Dokumen & Reset Filter"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`}
            />
            <span>Refresh</span>
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={loading || exportingType !== null || filteredDocuments.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{exportingType === "excel" ? "Mengekspor..." : "Export Excel"}</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={loading || exportingType !== null || filteredDocuments.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            <span>{exportingType === "pdf" ? "Mencetak..." : "Export PDF"}</span>
          </button>
        </div>
      </div>

      {/* 3. Panel Filter: Tanggal Awal, Tanggal Akhir, dan Status */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <Filter className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-extrabold text-slate-900">
            Filter Parameter Laporan
          </h2>
          {(startDate || endDate || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="ml-auto text-xs font-bold text-rose-600 hover:text-rose-700 transition flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Filter Tanggal Awal */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Tanggal Awal</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl font-semibold text-slate-800 focus:outline-none transition shadow-2xs ${
                filterErrors.startDate
                  ? "bg-rose-50/60 border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-900"
                  : "bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              }`}
            />
            {filterErrors.startDate && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{filterErrors.startDate}</span>
              </div>
            )}
          </div>

          {/* Filter Tanggal Akhir */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>Tanggal Akhir</span>
              <span className="text-rose-500 font-bold">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl font-semibold text-slate-800 focus:outline-none transition shadow-2xs ${
                filterErrors.endDate
                  ? "bg-rose-50/60 border border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-rose-900"
                  : "bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              }`}
            />
            {filterErrors.endDate && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-rose-600 animate-in fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{filterErrors.endDate}</span>
              </div>
            )}
          </div>

          {/* Filter Status Dokumen */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Status Proses Dokumen
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-300 font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition shadow-2xs cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="menunggu_verifikasi">Menunggu Verifikasi</option>
              <option value="sedang_diverifikasi">Sedang Diverifikasi</option>
              <option value="dikembalikan">Dikembalikan (Revisi)</option>
              <option value="menunggu_verifikasi_ulang">Menunggu Verifikasi Ulang</option>
              <option value="lengkap_valid">Lengkap / Valid (Disetujui)</option>
              <option value="sedang_diproses">Sedang Diproses</option>
              <option value="pengajuan_kppn">Pengajuan ke KPPN</option>
              <option value="menunggu_pencairan">Menunggu Pencairan</option>
              <option value="dana_cair">Dana Cair</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Tabel Hasil Laporan Dokumen */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="text-xs font-extrabold text-slate-800">
            Ditemukan <span className="text-blue-600">{filteredDocuments.length}</span> dokumen
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="hidden sm:inline text-slate-600 font-semibold">Tampilkan:</span>
            <select
              aria-label="Jumlah Data Dokumen Per Halaman"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-50 transition shadow-2xs"
            >
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-black text-xs">
                <th className="px-4 py-3.5 text-center w-12">No.</th>
                <th className="px-5 py-3.5">Nomor Surat / Tanggal</th>
                <th className="px-5 py-3.5">Jenis Dokumen / Perihal</th>
                <th className="px-5 py-3.5">PPK / Unit Kerja</th>
                <th className="px-5 py-3.5 text-right">Nilai Pembayaran</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-sm text-slate-700">
                        Memuat data laporan dokumen...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : paginatedDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-500">
                    <div className="max-w-xs mx-auto">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        Tidak Ada Dokumen
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Tidak ada berkas yang sesuai dengan kombinasi filter tanggal dan status saat ini.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs transition cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedDocs.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* No */}
                    <td className="px-4 py-3.5 text-center text-xs font-bold text-slate-500">
                      {startIndex + idx + 1}
                    </td>

                    {/* Nomor Surat & Tanggal */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(doc)}
                        className="text-left group cursor-pointer"
                      >
                        <div className="font-extrabold text-blue-700 tracking-tight group-hover:underline">
                          {doc.nomor_surat}
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {formatDateIndonesia(doc.tanggal_pengajuan)}
                        </div>
                      </button>
                    </td>

                    {/* Jenis Dokumen & Perihal */}
                    <td className="px-5 py-3.5">
                      <div className="max-w-xs md:max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug">
                          {doc.jenis_dokumen}
                        </div>
                        <div className="text-xs text-slate-600 font-medium line-clamp-2">
                          {doc.perihal}
                        </div>
                      </div>
                    </td>

                    {/* PPK & Unit Kerja */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{doc.ppk_name}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {doc.unit_kerja}
                      </div>
                    </td>

                    {/* Nilai Pembayaran */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right font-black text-slate-900">
                      Rp {(Number(doc.nilai_pembayaran) || 0).toLocaleString("id-ID")}
                    </td>

                    {/* Status Legend Badge */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black border shadow-2xs ${getBadgeClass(
                          doc.badge_color
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        {doc.legend_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              {totalItems > 0 ? startIndex + 1 : 0}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-800">
              {Math.min(startIndex + limit, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-slate-800">{totalItems}</span> dokumen
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-black text-slate-800 shadow-2xs">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        variant={alertDialog.variant}
        confirmText="Mengerti"
        showCancel={false}
        onConfirm={() =>
          setAlertDialog((prev) => ({ ...prev, isOpen: false }))
        }
      />
    </div>
  );
};
