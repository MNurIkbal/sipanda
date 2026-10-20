import React, { useState, useEffect } from "react";
import {
  Search,
  Database,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  FileText,
  Clock,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { AuditTrail } from "@/types/sipandu.types";
import { formatDateTimeID } from "@/lib/dateFormat";
import { sipanduApi } from "@/services/api.service";

interface AuditTrailListProps {
  logs?: AuditTrail[];
}

export const AuditTrailList: React.FC<AuditTrailListProps> = ({ logs: initialLogs = [] }) => {
  const [logs, setLogs] = useState<AuditTrail[]>(initialLogs);
  const [totalLogs, setTotalLogs] = useState(initialLogs.length);
  const [loading, setLoading] = useState(false);

  // Parameter Search, Page, Size
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce search 350ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Hit API Backend
  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const res = await sipanduApi.getAuditTrail({
        search: debouncedSearch,
        page,
        limit,
      });

      if (res.success && res.data) {
        if (Array.isArray(res.data.logs)) {
          setLogs(res.data.logs);
          setTotalLogs(res.data.total ?? 0);
        } else if (Array.isArray(res.data)) {
          setLogs(res.data);
          setTotalLogs(res.data.length);
        }
      }
    } catch (err) {
      console.error("Gagal memuat audit trail dari backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [debouncedSearch, page, limit]);

  // Formatter Aksi Log ke Bahasa Indonesia tanpa underscore
  const formatActionName = (action: string, newStatus?: string | null) => {
    const act = (action || "").toUpperCase();

    if (act.includes("CREATE") || act === "SAVE_DRAFT" || act === "SUBMIT_DOCUMENT") {
      return "Dokumen Baru";
    }
    if (act.includes("APPROVE")) {
      return "Disetujui";
    }
    if (act.includes("REJECT")) {
      return "Ditolak / Dikembalikan";
    }
    if (act.includes("REVISE") || act.includes("REVISI")) {
      return "Revisi Dokumen";
    }
    if (act.includes("EDIT")) {
      return "Ubah Dokumen";
    }
    if (act.includes("DELETE_DOCUMENT")) {
      return "Hapus Dokumen";
    }
    if (act.includes("DELETE_ATTACHMENT") || act.includes("DELETE")) {
      return "Hapus Lampiran";
    }
    if (act.includes("STAGE_SEDANG_DIPROSES")) {
      return "Proses SPP / SPM";
    }
    if (act.includes("STAGE_PENGAJUAN_KPPN")) {
      return "Pengajuan KPPN";
    }
    if (act.includes("STAGE_MENUNGGU_PENCAIRAN")) {
      return "Menunggu Pencairan";
    }
    if (act.includes("STAGE_DANA_CAIR") || act.includes("STAGE_SELESAI") || act.includes("STAGE_SIAP_DIGUNAKAN")) {
      return "Dana Cair Selesai";
    }
    if (act.includes("PROCESS")) {
      return "Mulai Verifikasi";
    }

    // Default formatting: ganti underscore jadi spasi & ubah ke Title Case
    return (action || "-")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Badge Warna untuk Aksi Log
  const getActionBadgeClass = (action: string) => {
    const act = (action || "").toUpperCase();
    if (act.includes("APPROVE") || act.includes("DANA_CAIR") || act.includes("SELESAI")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    }
    if (act.includes("REJECT") || act.includes("DELETE")) {
      return "bg-rose-50 text-rose-800 border-rose-300";
    }
    if (act.includes("CREATE") || act.includes("DRAFT")) {
      return "bg-blue-50 text-blue-800 border-blue-300";
    }
    if (act.includes("REVISE") || act.includes("REVISI")) {
      return "bg-amber-50 text-amber-800 border-amber-300";
    }
    if (act.includes("EDIT")) {
      return "bg-indigo-50 text-indigo-800 border-indigo-300";
    }
    return "bg-slate-50 text-slate-700 border-slate-300";
  };

  // Formatter Keterangan Aktivitas ke kalimat Indonesia yang rapi & jelas
  const formatDescription = (log: AuditTrail) => {
    if (!log.description) return "-";

    let desc = log.description;

    // Bersihkan penanda internal seperti Ref No jika ada
    desc = desc.replace(/\(Ref No: [^)]+\)/g, "").trim();

    // Ubah format lama '[Tanggal: YYYY-MM-DD] pesan' menjadi format kalimat yang rapi
    const legacyDateMatch = desc.match(/^\[Tanggal:\s*([^\]]+)\]\s*(.*)$/i);
    if (legacyDateMatch) {
      const userText = legacyDateMatch[2]?.trim();
      const actionTitle = formatActionName(log.action, log.new_status);
      if (userText) {
        return `Memperbarui alur ke ${actionTitle} — Catatan: "${userText}"`;
      }
      return `Memperbarui alur tahapan dokumen ke ${actionTitle}`;
    }

    return desc;
  };

  // Perhitungan Pagination
  const totalItems = totalLogs;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;

  return (
    <div className="space-y-4">
      {/* Top Banner Header Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xs">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">
              Audit Trail &amp; Log Aktivitas
            </h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rekam jejak setiap tindakan: pendaftaran dokumen baru, persetujuan, penolakan, perubahan berkas, hingga penghapusan.
            </p>
          </div>
        </div>

        {/* Tombol Refresh */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAuditLogs}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Log Aktivitas"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* CARD UTAMA: Search bar, Limit, dan Tabel Data */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Search Bar & Size Selector Header */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari waktu, nama user, aksi, nomor surat, atau keterangan..."
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

          {/* Size / Limit Selector */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="hidden sm:inline text-slate-600 font-semibold">Tampilkan:</span>
            <select
              aria-label="Jumlah Log Per Halaman"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 outline-none cursor-pointer hover:bg-slate-50 transition shadow-2xs"
            >
              <option value={5}>5 baris</option>
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Audit Trail */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-black text-xs">
                <th className="px-4 py-3.5 text-center w-12">No.</th>
                <th className="px-5 py-3.5">Waktu Kejadian</th>
                <th className="px-5 py-3.5">Pengguna &amp; Role</th>
                <th className="px-5 py-3.5">Aksi Log</th>
                <th className="px-5 py-3.5">Nomor Surat</th>
                <th className="px-5 py-3.5">Keterangan Aktivitas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-sm text-slate-700">Memuat log aktivitas...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-slate-400 mb-2 stroke-1" />
                      <span className="font-bold text-slate-800 text-sm">Tidak ada riwayat log aktivitas</span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        Belum ada tindakan yang tercatat atau coba ubah kata kunci pencarian
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* 1. Nomor */}
                    <td className="px-4 py-3.5 text-center text-slate-800 font-extrabold text-xs whitespace-nowrap">
                      {startIndex + idx + 1}
                    </td>

                    {/* 2. Waktu Kejadian */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 font-medium text-xs">
                        <span>
                          {formatDateTimeID(log.created_at, { format: "short", includeTimezone: true })}
                        </span>
                      </div>
                    </td>

                    {/* 3. Pengguna & Role */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{log.user_name || "Sistem"}</div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border inline-block mt-0.5 ${
                            log.user_role === "biro_01"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : log.user_role === "superadmin"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {log.user_role === "biro_01"
                            ? "Biro 01"
                            : log.user_role === "ppk"
                            ? "PPK"
                            : log.user_role === "superadmin"
                            ? "Superadmin"
                            : log.user_role?.toUpperCase()}
                        </span>
                      </div>
                    </td>

                    {/* 4. Aksi Log (Bahasa Indonesia tanpa underscore) */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${getActionBadgeClass(
                          log.action
                        )}`}
                      >
                        {formatActionName(log.action, log.new_status)}
                      </span>
                    </td>

                    {/* 5. Nomor Surat */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-black text-blue-700 text-xs">
                        {log.nomor_surat && log.nomor_surat !== "-" ? log.nomor_surat : "-"}
                      </span>
                    </td>

                    {/* 6. Keterangan Aktivitas */}
                    <td className="px-5 py-3.5">
                      {(() => {
                        const formatted = formatDescription(log);
                        const parts = formatted.split(" — Catatan: ");
                        if (parts.length > 1) {
                          return (
                            <div className="space-y-1">
                              <p className="text-xs text-slate-800 font-semibold leading-relaxed">
                                {parts[0]}
                              </p>
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] font-medium">
                                <span className="font-bold text-amber-700">Catatan:</span>
                                <span>{parts[1].replace(/^"|"$/g, "")}</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p className="text-xs text-slate-700 leading-relaxed font-medium max-w-lg">
                            {formatted}
                          </p>
                        );
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-700 font-semibold">
          <div>
            Menampilkan{" "}
            <span className="font-extrabold text-slate-900">
              {totalItems === 0 ? 0 : startIndex + 1}
            </span>{" "}
            -{" "}
            <span className="font-extrabold text-slate-900">
              {Math.min(startIndex + limit, totalItems)}
            </span>{" "}
            dari <span className="font-black text-slate-900">{totalItems}</span> log aktivitas
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3.5 py-1 font-bold text-slate-900 bg-white rounded-lg border border-slate-300 shadow-2xs">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

