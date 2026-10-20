"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  FileCheck2,
  Plus,
  Search,
  Trash2,
  Edit3,
  RefreshCw,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  MoreVertical,
  Database,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { MasterItem } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import {
  masterValidationSchema,
  MasterFormErrors,
} from "@/schemas/master.schema";
import { AlertDialog } from "@/components/ui/AlertDialog";

type MasterTab = "units" | "jenis_dokumen";

export const MasterDataView: React.FC = () => {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "jenis_dokumen" ? "jenis_dokumen" : "units";
  const [activeTab, setActiveTab] = useState<MasterTab>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "jenis_dokumen") {
      setActiveTab("jenis_dokumen");
    } else if (tabParam === "units") {
      setActiveTab("units");
    }
  }, [searchParams]);

  // Data States
  const [units, setUnits] = useState<MasterItem[]>([]);
  const [jenisDokumen, setJenisDokumen] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Search, Page, & Limit State (Mirip Menu Pengguna)
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Dropdown Action Menu (titik 3)
  const [openActionDropdownId, setOpenActionDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // Modal CRUD State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedItem, setSelectedItem] = useState<MasterItem | null>(null);

  // Form State
  const [nama, setNama] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState<MasterFormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Toast / Alert Notification State
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    variant: "warning" | "danger" | "info";
  }>({
    isOpen: false,
    title: "",
    description: "",
    variant: "info",
  });

  // AlertDialog Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    nama: string;
    type: MasterTab;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch data master
  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === "units") {
        const res = await sipanduApi.getMasterUnits({ search });
        if (res.success && res.data) {
          setUnits(res.data);
        }
      } else {
        const res = await sipanduApi.getMasterJenisDokumen({ search });
        if (res.success && res.data) {
          setJenisDokumen(res.data);
        }
      }
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: "Gagal Mengambil Data",
        description: err.message || "Terjadi kesalahan saat memuat data master.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setPage(1);
    setOpenActionDropdownId(null);
  }, [activeTab, search]);

  const currentRawList = activeTab === "units" ? units : jenisDokumen;
  const entityLabel = activeTab === "units" ? "Unit" : "Jenis Dokumen";
  const entityTitle = activeTab === "units" ? "Nama Unit" : "Nama Jenis Dokumen";

  // Filter & Pagination Client Side
  const filteredList = useMemo(() => {
    if (!search.trim()) return currentRawList;
    const q = search.toLowerCase();
    return currentRawList.filter(
      (item) =>
        item.nama.toLowerCase().includes(q) ||
        (item.keterangan && item.keterangan.toLowerCase().includes(q))
    );
  }, [currentRawList, search]);

  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;
  const paginatedList = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredList.slice(start, start + limit);
  }, [filteredList, page, limit]);

  // Open Modal Tambah
  const handleOpenCreate = () => {
    setModalMode("create");
    setSelectedItem(null);
    setNama("");
    setKeterangan("");
    setIsActive(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Open Modal Edit
  const handleOpenEdit = (item: MasterItem) => {
    setModalMode("edit");
    setSelectedItem(item);
    setNama(item.nama);
    setKeterangan(item.keterangan || "");
    setIsActive(item.is_active !== false);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Quick Toggle Status Aktif / Tidak Aktif langsung dari tabel atau menu
  const handleToggleStatus = async (item: MasterItem) => {
    const newStatus = !(item.is_active !== false);
    try {
      if (activeTab === "units") {
        await sipanduApi.updateMasterUnit(item.id, { is_active: newStatus });
      } else {
        await sipanduApi.updateMasterJenisDokumen(item.id, { is_active: newStatus });
      }
      fetchData();
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: "Gagal Mengubah Status",
        description: err.message || "Terjadi kesalahan saat memperbarui status.",
        variant: "danger",
      });
    }
  };

  // Submit Simpan (Create / Edit) dengan Validasi Skema
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = masterValidationSchema.validate(
      { nama, keterangan },
      entityTitle,
      currentRawList,
      selectedItem?.id
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setSubmitting(true);
      setFormErrors({});

      if (modalMode === "create") {
        if (activeTab === "units") {
          const res = await sipanduApi.createMasterUnit({ nama, keterangan, is_active: isActive });
          if (!res.success) throw new Error(res.message);
        } else {
          const res = await sipanduApi.createMasterJenisDokumen({ nama, keterangan, is_active: isActive });
          if (!res.success) throw new Error(res.message);
        }
      } else if (selectedItem) {
        if (activeTab === "units") {
          const res = await sipanduApi.updateMasterUnit(selectedItem.id, { nama, keterangan, is_active: isActive });
          if (!res.success) throw new Error(res.message);
        } else {
          const res = await sipanduApi.updateMasterJenisDokumen(selectedItem.id, { nama, keterangan, is_active: isActive });
          if (!res.success) throw new Error(res.message);
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormErrors({ nama: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Eksekusi Hapus Data
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setIsDeleting(true);
      if (itemToDelete.type === "units") {
        const res = await sipanduApi.deleteMasterUnit(itemToDelete.id);
        if (!res.success) throw new Error(res.message);
      } else {
        const res = await sipanduApi.deleteMasterJenisDokumen(itemToDelete.id);
        if (!res.success) throw new Error(res.message);
      }
      setItemToDelete(null);
      fetchData();
    } catch (err: any) {
      setAlertDialog({
        isOpen: true,
        title: "Gagal Menghapus Data",
        description: err.message || "Data ini tidak dapat dihapus karena masih digunakan.",
        variant: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        description={alertDialog.description}
        variant={alertDialog.variant}
        confirmText="Mengerti"
        showCancel={false}
        onConfirm={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      <div className="bg-white px-4 py-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xs shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight leading-tight">Master Data</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Kelola data referensi Unit Kerja dan Jenis Dokumen Pembayaran (Khusus Superadmin).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Tombol Refresh Data */}
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data Master"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Tombol Tambah */}
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* CARD UTAMA: MENYATUKAN TABS, SEARCH BAR, TABEL, DAN PAGINATION */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Navigasi Tabs di Bagian Atas Card */}
        <div className="px-3 pt-2.5 pb-0 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("units");
                setSearch("");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all border-b-2 cursor-pointer ${
                activeTab === "units"
                  ? "border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <Building2 className={`h-3.5 w-3.5 ${activeTab === "units" ? "text-blue-600" : "text-slate-400"}`} />
              <span>Master Unit</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("jenis_dokumen");
                setSearch("");
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-extrabold transition-all border-b-2 cursor-pointer ${
                activeTab === "jenis_dokumen"
                  ? "border-indigo-600 text-indigo-600 bg-white rounded-t-lg shadow-2xs"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 rounded-t-lg"
              }`}
            >
              <FileCheck2 className={`h-3.5 w-3.5 ${activeTab === "jenis_dokumen" ? "text-indigo-600" : "text-slate-400"}`} />
              <span>Master Jenis Dokumen</span>
            </button>
          </div>
        </div>

        {/* Bagian Filter Pencarian & Limit Baris */}
        <div className="p-3 border-b border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={`Cari nama ${entityLabel.toLowerCase()} atau keterangan...`}
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 font-medium transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span className="hidden sm:inline text-slate-500 font-semibold text-[11px]">Tampilkan:</span>
            <select
              aria-label={`Jumlah Data ${entityLabel} Per Halaman`}
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-slate-700 text-xs outline-none cursor-pointer hover:bg-slate-50 transition shadow-2xs"
            >
              <option value={5}>5 baris</option>
              <option value={10}>10 baris</option>
              <option value={20}>20 baris</option>
              <option value={50}>50 baris</option>
            </select>
          </div>
        </div>

        {/* Tabel Data Kompak & Rapi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-extrabold text-[11px]">
                <th className="px-3 py-2.5 text-center w-12">No.</th>
                <th className="px-4 py-2.5">{entityTitle}</th>
                <th className="px-4 py-2.5">Keterangan</th>
                <th className="px-4 py-2.5 text-center w-28">Status</th>
                <th className="px-4 py-2.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-xs text-slate-600">Memuat data {entityLabel}...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Database className="h-8 w-8 text-slate-300 mb-1.5 stroke-[1.5]" />
                      <span className="font-bold text-slate-800 text-xs">
                        {search ? "Tidak ada data yang cocok" : `Belum ada data ${entityLabel}`}
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        {search
                          ? `Tidak ditemukan hasil dengan kata kunci "${search}"`
                          : `Klik tombol "Tambah ${entityLabel}" di atas untuk menambahkan data.`}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/30 transition-colors ${
                      openActionDropdownId === item.id ? "relative z-30" : ""
                    }`}
                  >
                    {/* Nomor Urut */}
                    <td className="px-3 py-2.5 text-center text-slate-500 font-bold whitespace-nowrap">
                      {(page - 1) * limit + idx + 1}
                    </td>

                    {/* Nama Item */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs tracking-tight flex items-center gap-2">
                        <span>{item.nama}</span>
                      </div>
                    </td>

                    {/* Keterangan */}
                    <td className="px-4 py-2.5 text-slate-600 font-medium text-xs">
                      {item.keterangan || <span className="text-slate-400 italic">-</span>}
                    </td>

                    {/* Status Badge (Klik untuk cepat ubah status) */}
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition cursor-pointer hover:opacity-85 ${
                          item.is_active !== false
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                        title={`Klik untuk ubah menjadi ${item.is_active !== false ? "Tidak Aktif" : "Aktif"}`}
                      >
                        {item.is_active !== false ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 text-rose-600" />
                            <span>Tidak Aktif</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2.5 text-center whitespace-nowrap">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openActionDropdownId === item.id) {
                              setOpenActionDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const popoverHeight = 115;
                              const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;

                              setDropdownPos({
                                top: openUpwards ? rect.top - popoverHeight - 4 : rect.bottom + 4,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenActionDropdownId(item.id);
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            openActionDropdownId === item.id
                              ? "bg-blue-50 border-blue-400 text-blue-600 shadow-2xs"
                              : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                          }`}
                          title="Menu Aksi"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>

                        {openActionDropdownId === item.id && dropdownPos && (
                          <>
                            <div
                              className="fixed inset-0 z-[120]"
                              onClick={() => setOpenActionDropdownId(null)}
                            />

                            <div
                              style={{
                                top: `${dropdownPos.top}px`,
                                right: `${dropdownPos.right}px`,
                              }}
                              className="fixed w-36 rounded-xl bg-white shadow-xl border border-slate-200 py-1 z-[130] text-left animate-in fade-in duration-75"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  handleOpenEdit(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                                <span>Edit</span>
                              </button>

                              {/* Toggle Status di Dropdown */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  handleToggleStatus(item);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                              >
                                {item.is_active !== false ? (
                                  <>
                                    <ToggleLeft className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Nonaktifkan</span>
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Aktifkan</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  setItemToDelete({
                                    id: item.id,
                                    nama: item.nama,
                                    type: activeTab,
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer border-t border-slate-100"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                <span>Hapus</span>
                              </button>
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

        {/* Pagination Bar Kompak */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 px-4 py-2.5 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600 font-medium">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-900">
              {totalItems === 0 ? 0 : (page - 1) * limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-900">
              {Math.min(page * limit, totalItems)}
            </span>{" "}
            dari <span className="font-black text-slate-900">{totalItems}</span> {entityLabel.toLowerCase()} terdaftar
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>

            <span className="px-2.5 py-0.5 text-xs font-bold text-slate-800">
              {page} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH / UBAH MASTER DATA DENGAN SCHEMA VALIDATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-150 text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  {activeTab === "units" ? (
                    <Building2 className="h-4.5 w-4.5" />
                  ) : (
                    <FileCheck2 className="h-4.5 w-4.5" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {modalMode === "create" ? `Tambah ${entityLabel} Baru` : `Ubah Data ${entityLabel}`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Nama {entityLabel.toLowerCase()} tidak boleh sama dengan data yang sudah ada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="mt-3.5 space-y-3.5">
              {/* Field Nama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {entityTitle} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => {
                    setNama(e.target.value);
                    if (formErrors.nama) {
                      setFormErrors((prev) => ({ ...prev, nama: undefined }));
                    }
                  }}
                  placeholder={`Contoh: ${activeTab === "units" ? "Bagian Keuangan" : "SPM LS Gaji"}`}
                  className={`w-full px-3 py-1.5 text-xs rounded-lg border bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white transition ${
                    formErrors.nama
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-300 focus:border-blue-600"
                  }`}
                  autoFocus
                />
                {formErrors.nama && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-rose-600 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{formErrors.nama}</span>
                  </div>
                )}
              </div>

              {/* Field Keterangan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keterangan <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan atau fungsi penggunaan..."
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50/50 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-600 transition resize-none"
                />
              </div>

              {/* Field Status Keaktifan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Data
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active_radio"
                      checked={isActive === true}
                      onChange={() => setIsActive(true)}
                      className="text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      Aktif
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="is_active_radio"
                      checked={isActive === false}
                      onChange={() => setIsActive(false)}
                      className="text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      <XCircle className="h-3 w-3 text-rose-600" />
                      Tidak Aktif
                    </span>
                  </label>
                </div>
              </div>

              {/* Tombol Aksi Form */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{modalMode === "create" ? "Simpan Data" : "Perbarui Data"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-800">
            <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
              <Trash2 className="h-5 w-5" />
            </div>
            <h4 className="text-center font-black text-slate-900 text-sm">
              Hapus {entityLabel}?
            </h4>
            <p className="text-center text-xs text-slate-500 mt-1 mb-4">
              Apakah Anda yakin ingin menghapus <strong>"{itemToDelete.nama}"</strong>?
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={isDeleting}
                className="flex-1 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
