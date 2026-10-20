import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  FileText,
  ShieldCheck,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  MoreVertical,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  CheckCircle2,
} from "lucide-react";
import { PaymentDocument, User } from "@/types/sipandu.types";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { formatDateID } from "@/lib/dateFormat";
import { sipanduApi } from "@/services/api.service";

interface DocumentListProps {
  documents?: PaymentDocument[];
  currentUser: User | null;
  onNavigateToUpload: () => void;
  onOpenVerify: (doc: PaymentDocument) => void;
  onOpenRevisi: (doc: PaymentDocument) => void;
  onOpenDetail: (doc: PaymentDocument) => void;
  onOpenEdit?: (doc: PaymentDocument) => void;
  onDeleteDocument: (doc: PaymentDocument) => Promise<void>;
  onRefresh?: () => void;
  loading?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents: initialDocuments = [],
  currentUser,
  onNavigateToUpload,
  onOpenVerify,
  onOpenRevisi,
  onOpenDetail,
  onOpenEdit,
  onDeleteDocument,
  onRefresh,
  loading = false,
}) => {
  // State data dokumen hasil hit API langsung
  const [documents, setDocuments] = useState<PaymentDocument[]>(initialDocuments);
  const [totalDocuments, setTotalDocuments] = useState(initialDocuments.length);
  const [apiLoading, setApiLoading] = useState(false);

  // Filter & Search states yang hit ke backend
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dropdown Action Menu (titik 3)
  const [openActionDropdownId, setOpenActionDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // AlertDialog Delete State
  const [docToDelete, setDocToDelete] = useState<PaymentDocument | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search input (350ms) agar tidak memborbardir API pada setiap ketukan keyboard
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset ke halaman 1 setiap kali query pencarian berubah
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Hit Backend API untuk Search, Status, Page, dan Size (Limit)
  const fetchDocumentsFromApi = async () => {
    try {
      setApiLoading(true);
      console.log("[DocumentList] Fetching API documents:", {
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit,
      });
      const res = await sipanduApi.getDocuments({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit,
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
  }, [debouncedSearch, statusFilter, page, limit]);

  const getBadgeClass = (color: string) => {
    switch (color) {
      case "emerald":
        return "bg-emerald-50 text-emerald-800 border border-emerald-300";
      case "red":
        return "bg-rose-50 text-rose-800 border border-rose-300";
      case "amber":
        return "bg-amber-50 text-amber-800 border border-amber-300";
      case "orange":
        return "bg-orange-50 text-orange-800 border border-orange-300";
      case "indigo":
        return "bg-indigo-50 text-indigo-800 border border-indigo-300";
      case "green":
        return "bg-green-50 text-green-800 border border-green-300";
      default:
        return "bg-blue-50 text-blue-800 border border-blue-300";
    }
  };

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

  // Pagination calculation dari backend
  const totalItems = totalDocuments;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const startIndex = (page - 1) * limit;

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return;
    try {
      setDeleteLoading(true);
      await onDeleteDocument(docToDelete);
      setDocToDelete(null);
      fetchDocumentsFromApi();
      if (onRefresh) onRefresh();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Daftar Dokumen Pembayaran</h1>
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

          {/* Tombol Input Dokumen Baru (Hanya PPK & Superadmin, Biro 01 hanya verifikasi) */}
          {currentUser?.role !== "biro_01" && (
            <button
              type="button"
              onClick={onNavigateToUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          )}
        </div>
      </div>

      {/* CARD BESAR: MEMBUNGKUS CONTROL BAR (SEARCH, FILTER & LIMIT) BESERTA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Bagian Filter, Pencarian, & Limit Selector */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
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
                <option value="ALL">Semua Status ({totalDocuments})</option>
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

            {/* Limit Selector */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="hidden sm:inline text-slate-600 font-semibold">Tampilkan:</span>
              <select
                aria-label="Jumlah Dokumen Per Halaman"
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
        </div>

        {/* Tabel Data Dokumen */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-black text-xs">
                <th className="px-4 py-3.5 text-center w-12">No.</th>
                <th className="px-5 py-3.5">Nomor Surat / Tanggal</th>
                <th className="px-5 py-3.5">Jenis Dokumen / Perihal</th>
                <th className="px-5 py-3.5">PPK / Unit Kerja</th>
                <th className="px-5 py-3.5">Nilai Pembayaran</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Lampiran Berkas</th>
                <th className="px-5 py-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apiLoading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-sm text-slate-700">Memuat data dokumen...</span>
                    </div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-slate-400 mb-2 stroke-1" />
                      <span className="font-bold text-slate-800 text-sm">Tidak ada dokumen yang ditemukan</span>
                      <span className="text-xs text-slate-500 mt-0.5">Coba ubah kata kunci pencarian atau filter status</span>
                    </div>
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => (
                  <tr
                    key={doc.id}
                    className={`hover:bg-blue-50/40 transition-colors ${openActionDropdownId === doc.id ? "relative z-30" : ""
                      }`}
                  >
                    {/* Nomor Urut */}
                    <td className="px-4 py-3.5 text-center text-slate-800 font-extrabold text-sm whitespace-nowrap">
                      {startIndex + idx + 1}
                    </td>

                    {/* Nomor Surat */}
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

                    <td className="px-5 py-3.5">
                      <div className="max-w-xs md:max-w-sm">
                        <div className="font-bold text-slate-900 leading-snug">{doc.jenis_dokumen}</div>
                        <div className="text-xs text-slate-600 font-medium">{doc.perihal}</div>
                        {doc.status === "dikembalikan" && doc.catatan_revisi && (
                          <div className="mt-2 text-xs text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                            <strong className="block text-[10px] uppercase font-bold tracking-wider text-rose-800 mb-0.5">
                              Catatan Revisi Biro 01:
                            </strong>
                            {doc.catatan_revisi}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* PPK & Unit Kerja */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{doc.ppk_name}</div>
                      <div className="text-xs text-slate-600 font-medium">{doc.unit_kerja}</div>
                    </td>

                    {/* Nilai Pembayaran */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-black text-slate-900 text-sm">
                        Rp {Number(doc.nilai_pembayaran).toLocaleString("id-ID")}
                      </div>
                    </td>

                    {/* Status & Legenda */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${getBadgeClass(
                          doc.legend_color
                        )}`}
                      >
                        {doc.status === "dana_cair" || doc.status === "selesai" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        )}
                        {doc.legend_status}
                      </span>
                    </td>

                    {/* Lampiran Berkas */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onOpenDetail(doc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer border border-slate-200"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span>{doc.attachments?.length || 0} File</span>
                      </button>
                    </td>

                    {/* Aksi Dropdown Titik 3 */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openActionDropdownId === doc.id) {
                              setOpenActionDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const popoverHeight = 175; // estimasi tinggi menu dokumen
                              const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

                              setDropdownPos({
                                top: openUpwards ? rect.top - popoverHeight - 6 : rect.bottom + 6,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenActionDropdownId(doc.id);
                            }
                          }}
                          className={`p-2 rounded-xl border transition cursor-pointer ${openActionDropdownId === doc.id
                            ? "bg-blue-50 border-blue-400 text-blue-600 shadow-xs"
                            : "border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400"
                            }`}
                          title="Menu Aksi"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu Popover dengan Fixed Position (bebas dari overflow tabel) */}
                        {openActionDropdownId === doc.id && dropdownPos && (
                          <>
                            {/* Backdrop transparan untuk menutup dropdown saat klik luar */}
                            <div
                              className="fixed inset-0 z-[120]"
                              onClick={() => setOpenActionDropdownId(null)}
                            />

                            <div
                              style={{
                                top: `${dropdownPos.top}px`,
                                right: `${dropdownPos.right}px`,
                              }}
                              className="fixed w-44 rounded-xl bg-white shadow-2xl border border-slate-200 py-1.5 z-[130] text-left animate-in fade-in duration-100"
                            >
                              {/* Lihat Detail */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  onOpenDetail(doc);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                                <span>Lihat Detail</span>
                              </button>

                              {/* Edit Data Dokumen (Hanya PPK & Superadmin) */}
                              {currentUser?.role !== "biro_01" && onOpenEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionDropdownId(null);
                                    onOpenEdit(doc);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                                >
                                  <Edit3 className="h-4 w-4 text-blue-600" />
                                  <span>Edit Dokumen</span>
                                </button>
                              )}

                              {/* Verifikasi / Proses Alur Pembayaran (Biro 01 - Hanya jika dokumen tidak sedang dikembalikan untuk perbaikan) */}
                              {currentUser?.role === "biro_01" && doc.status !== "dikembalikan" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionDropdownId(null);
                                    onOpenVerify(doc);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                >
                                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                  <span>
                                    {[
                                      "lengkap_valid",
                                      "sedang_diproses",
                                      "pengajuan_kppn",
                                      "menunggu_pencairan",
                                    ].includes(doc.status)
                                      ? "Proses Alur"
                                      : doc.status === "dana_cair" || doc.status === "siap_digunakan"
                                        ? "Alur Selesai"
                                        : "Verifikasi"}
                                  </span>
                                </button>
                              )}

                              {/* Revisi (PPK / Superadmin jika dikembalikan) */}
                              {(currentUser?.role === "ppk" || currentUser?.role === "superadmin") &&
                                doc.status === "dikembalikan" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOpenActionDropdownId(null);
                                      onOpenRevisi(doc);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                                  >
                                    <RefreshCw className="h-4 w-4 text-amber-600" />
                                    <span>Revisi Dokumen</span>
                                  </button>
                                )}

                              {/* Hapus Dokumen (Hanya PPK & Superadmin, Biro 01 tidak boleh CRUD) */}
                              {currentUser?.role !== "biro_01" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenActionDropdownId(null);
                                    setDocToDelete(doc);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4 text-rose-600" />
                                  <span>Hapus</span>
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
            dari <span className="font-black text-slate-900">{totalItems}</span> dokumen terdaftar
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
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
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AlertDialog Konfirmasi Hapus Dokumen */}
      <AlertDialog
        isOpen={Boolean(docToDelete)}
        title="Konfirmasi Hapus Dokumen"
        description={`Apakah Anda yakin ingin menghapus dokumen "${docToDelete?.nomor_surat} - ${docToDelete?.nama_kegiatan}"? Seluruh berkas lampiran fisik dan data transaksi dari sistem akan ikut dihapus permanen.`}
        confirmText="Ya, Hapus Dokumen"
        cancelText="Batal"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};
