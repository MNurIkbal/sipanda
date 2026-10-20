import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  UserCheck,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  X,
  Mail,
  Building2,
  Phone,
  FileBadge,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  MoreVertical,
  RefreshCw
} from "lucide-react";
import { User } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { userValidationSchema, UserValidationError } from "@/schemas/user.schema";

interface UserManagementProps {
  currentUser: User | null;
  onSwitchUser: (userId: string) => void;
  onShowToast: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onSwitchUser,
  onShowToast,
}) => {
  // State data user hasil hit API
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);

  // Parameter Query Hit API: search, role, page, limit (size)
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);

  // Modal Fullscreen State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Dropdown Action Menu (titik 3)
  const [openActionDropdownId, setOpenActionDropdownId] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);

  // Schema Validation Errors State
  const [fieldErrors, setFieldErrors] = useState<UserValidationError>({});

  // Form State: email, full_name, role (wajib), nip, unit_kerja, phone (opsional), password
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    nip: "",
    role: "ppk",
    unit_kerja: "",
    phone: "",
  });

  // AlertDialog Delete User
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch data users langsung ke API
  const fetchUsersFromApi = async () => {
    try {
      setLoading(true);
      const res = await sipanduApi.getUsers({
        search,
        role: roleFilter,
        page,
        limit,
      });

      if (res.success && res.data) {
        if (Array.isArray(res.data.users)) {
          setUsers(res.data.users);
          setTotalUsers(res.data.total);
        } else if (Array.isArray(res.data)) {
          setUsers(res.data);
          setTotalUsers(res.data.length);
        }
      } else {
        onShowToast("error", "Gagal Memuat User", res.message || "Gagal mengambil data user.");
      }
    } catch (err: any) {
      onShowToast("error", "Error API", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersFromApi();
  }, [search, roleFilter, page, limit]);

  // Validasi Password Security dari schema
  const validatePasswordRules = (pwd: string) => {
    return userValidationSchema.validatePassword(pwd, true);
  };

  // Real-time Password Checklist Helper
  const passwordCriteria = {
    minLen: form.password.length >= 8,
    hasUpper: /[A-Z]/.test(form.password),
    hasLower: /[a-z]/.test(form.password),
    hasNumber: /[0-9]/.test(form.password),
  };

  // Open Modal Tambah Baru
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingUserId(null);
    setShowPasswordText(false);
    setFieldErrors({});
    setForm({
      email: "",
      password: "",
      full_name: "",
      nip: "",
      role: "ppk",
      unit_kerja: "",
      phone: "",
    });
    setIsModalOpen(true);
  };

  // Open Modal Edit User
  const handleOpenEditModal = (user: User) => {
    setModalMode("edit");
    setEditingUserId(user.id);
    setShowPasswordText(false);
    setFieldErrors({});
    setForm({
      email: user.email || "",
      password: "", // Kosong jika tidak ingin ganti password
      full_name: user.full_name || "",
      nip: user.nip || "",
      role: user.role || "ppk",
      unit_kerja: user.unit_kerja || "",
      phone: user.phone || "",
    });
    setIsModalOpen(true);
  };

  // Submit Form Menggunakan Schema Validation
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Jalankan validasi berdasarkan User Schema
    const isCreate = modalMode === "create";
    const validation = userValidationSchema.validate(form, isCreate);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      onShowToast("warning", "Validasi Form Gagal", validation.firstError || "Harap periksa kembali input form Anda!");
      return;
    }

    // Reset error jika validasi skema lolos
    setFieldErrors({});

    try {
      setSubmitLoading(true);
      if (modalMode === "create") {
        const res = await sipanduApi.createUser(form);
        if (res.success) {
          onShowToast("success", "Pengguna Ditambahkan", `Akun ${form.full_name} (${form.email}) berhasil dibuat!`);
          setIsModalOpen(false);
          fetchUsersFromApi();
        } else {
          onShowToast("error", "Gagal Menambah Pengguna", res.message);
        }
      } else if (modalMode === "edit" && editingUserId) {
        const payload: any = {
          email: form.email,
          full_name: form.full_name,
          role: form.role,
          nip: form.nip,
          unit_kerja: form.unit_kerja,
          phone: form.phone,
        };
        if (form.password.trim() !== "") {
          payload.password = form.password;
        }

        const res = await sipanduApi.updateUser(editingUserId, payload);
        if (res.success) {
          onShowToast("success", "Data Diperbarui", `Perubahan data pengguna ${form.full_name} berhasil disimpan!`);
          setIsModalOpen(false);
          fetchUsersFromApi();
        } else {
          onShowToast("error", "Gagal Memperbarui", res.message);
        }
      }
    } catch (err: any) {
      onShowToast("error", "Error Server", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Hapus User
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await sipanduApi.deleteUser(userToDelete.id);
      if (res.success) {
        onShowToast("success", "Pengguna Dihapus", `Akun pengguna ${userToDelete.full_name} berhasil dihapus!`);
        setUserToDelete(null);
        fetchUsersFromApi();
      } else {
        onShowToast("error", "Gagal Menghapus", res.message);
      }
    } catch (err: any) {
      onShowToast("error", "Error Server", err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(totalUsers / limit) || 1;

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Manajemen Pengguna</h1>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Tombol Refresh Data */}
          <button
            type="button"
            onClick={() => fetchUsersFromApi()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 shadow-2xs transition cursor-pointer disabled:opacity-50"
            title="Muat Ulang Data Pengguna"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>

          {/* Tombol Tambah */}
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* CARD BESAR: MEMBUNGKUS CONTROL BAR (SEARCH & LIMIT) BESERTA TABEL */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Bagian Filter, Pencarian, & Limit Selector */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Cari email, nama lengkap, NIP, atau unit kerja..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 font-semibold transition shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-700 font-bold">Role:</span>
              <select
                aria-label="Filter Berdasarkan Role Pengguna"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs border border-slate-300 bg-white hover:bg-slate-50 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none cursor-pointer transition shadow-2xs"
              >
                <option value="ALL">Semua Role</option>
                <option value="biro_01">Biro 01 (Verifikator)</option>
                <option value="ppk">PPK (Pengaju)</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>

            {/* Size (Limit) Selector */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="hidden sm:inline text-slate-600 font-semibold">Tampilkan:</span>
              <select
                aria-label="Jumlah User Per Halaman"
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

        {/* Tabel Data Pengguna */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-black text-xs">
                <th className="px-4 py-3.5 text-center w-12">No.</th>
                <th className="px-5 py-3.5">Nama</th>
                <th className="px-5 py-3.5">Email Akun (Login)</th>
                <th className="px-5 py-3.5">Role Level</th>
                <th className="px-5 py-3.5">NIP</th>
                <th className="px-5 py-3.5">Unit Kerja</th>
                <th className="px-5 py-3.5">No. Telepon</th>
                <th className="px-5 py-3.5 text-center w-20">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-600">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-bold text-sm text-slate-700">Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="h-10 w-10 text-slate-400 mb-2 stroke-1" />
                      <span className="font-bold text-slate-800 text-sm">Tidak ada pengguna yang cocok</span>
                      <span className="text-xs text-slate-500 mt-0.5">Coba gunakan kata kunci pencarian lain</span>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-blue-50/40 transition-colors ${
                      openActionDropdownId === user.id ? "relative z-30" : ""
                    }`}
                  >
                    {/* Nomor Urut */}
                    <td className="px-4 py-3.5 text-center text-slate-800 font-extrabold text-sm whitespace-nowrap">
                      {(page - 1) * limit + idx + 1}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm tracking-tight">{user.full_name}</div>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-800 text-sm">
                      {user.email}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold shadow-2xs ${
                          user.role === "biro_01"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                            : user.role === "superadmin"
                            ? "bg-purple-50 text-purple-800 border border-purple-300"
                            : "bg-blue-50 text-blue-800 border border-blue-300"
                        }`}
                      >
                        {user.role === "biro_01" || user.role === "superadmin" ? (
                          <ShieldCheck className="h-3.5 w-3.5" />
                        ) : (
                          <UserCheck className="h-3.5 w-3.5" />
                        )}
                        {user.role === "biro_01"
                          ? "Biro 01"
                          : user.role === "superadmin"
                          ? "Superadmin"
                          : "PPK"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-800 text-sm">
                      {user.nip || "-"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-800 text-sm">
                      {user.unit_kerja || "-"}
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-slate-800 text-sm">
                      {user.phone || "-"}
                    </td>

                    {/* Aksi Dropdown Titik 3 */}
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <div className="relative inline-block text-left">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openActionDropdownId === user.id) {
                              setOpenActionDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const popoverHeight = 90;
                              const openUpwards = spaceBelow < popoverHeight && rect.top > popoverHeight;
                              
                              setDropdownPos({
                                top: openUpwards ? rect.top - popoverHeight - 6 : rect.bottom + 6,
                                right: window.innerWidth - rect.right,
                              });
                              setOpenActionDropdownId(user.id);
                            }
                          }}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            openActionDropdownId === user.id
                              ? "bg-blue-50 border-blue-400 text-blue-600 shadow-xs"
                              : "border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-100 hover:border-slate-400"
                          }`}
                          title="Menu Aksi"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu Popover dengan Fixed Position (bebas dari overflow tabel) */}
                        {openActionDropdownId === user.id && dropdownPos && (
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
                              className="fixed w-36 rounded-xl bg-white shadow-2xl border border-slate-200 py-1.5 z-[130] text-left animate-in fade-in duration-100"
                            >
                              {/* Tombol Edit */}
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  handleOpenEditModal(user);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition cursor-pointer"
                              >
                                <Edit3 className="h-4 w-4 text-blue-600" />
                                <span>Edit</span>
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                type="button"
                                disabled={currentUser?.id === user.id}
                                onClick={() => {
                                  setOpenActionDropdownId(null);
                                  setUserToDelete(user);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                title={currentUser?.id === user.id ? "Tidak dapat menghapus akun aktif sendiri" : undefined}
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
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

        {/* Pagination Bar (Hit API Page) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 text-xs text-slate-700 font-semibold">
          <div>
            Menampilkan{" "}
            <span className="font-extrabold text-slate-900">
              {totalUsers === 0 ? 0 : (page - 1) * limit + 1}
            </span>{" "}
            -{" "}
            <span className="font-extrabold text-slate-900">
              {Math.min(page * limit, totalUsers)}
            </span>{" "}
            dari <span className="font-black text-slate-900">{totalUsers}</span> pengguna terdaftar
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page === 1 || loading}
              className="p-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
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
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL FULLSCREEN: TAMBAH & EDIT PENGGUNA (LAYAR PENUH 100vw x 100vh) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/70 backdrop-blur-md animate-fade-in overflow-hidden">
          <div className="bg-[#f8fafc] w-full h-full flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 shadow-2xs">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base md:text-lg tracking-tight">
                    {modalMode === "create" ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modalMode === "create"
                      ? "Formulir pendaftaran akun pengguna baru dengan autentikasi email dan verifikasi keamanan."
                      : `Memperbarui profil, data kepegawaian`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer border border-slate-200/80"
                title="Tutup Form (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body: Full Width Scrollable Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 w-full">
              
              {/* Card Section 1: Informasi Autentikasi (Wajib) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 md:p-5 space-y-4">
                <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>Akun & Keamanan Login</span>
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    Wajib Diisi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Alamat Email (Digunakan untuk Login) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="nama@kemenkeu.go.id"
                      value={form.email}
                      onChange={(e) => {
                        setForm({ ...form, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                        fieldErrors.email
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    />
                    {fieldErrors.email ? (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Email ini akan menjadi identitas login resmi pada halaman autentikasi.
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block font-bold text-slate-700">
                        {modalMode === "create" ? "Password Akun *" : "Password Baru (Kosongkan jika tidak diubah)"}
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        {showPasswordText ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" /> Sembunyikan
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" /> Lihat Password
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showPasswordText ? "text" : "password"}
                        placeholder={modalMode === "create" ? "Masukkan minimal 8 karakter..." : "Masukkan password baru jika ingin mengubah..."}
                        value={form.password}
                        onChange={(e) => {
                          setForm({ ...form, password: e.target.value });
                          if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: undefined });
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                          fieldErrors.password
                            ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                            : "border-slate-200 focus:outline-none focus:border-blue-500"
                        }`}
                      />
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.password}
                      </p>
                    )}

                    {/* REVIEW REAL-TIME PASSWORD SECURITY DI BAWAH INPUT */}
                    {(modalMode === "create" || form.password.length > 0) && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                        <div className="text-[11px] font-extrabold text-slate-700 flex items-center justify-between">
                          <span>Evaluasi Kekuatan Password (Real-time):</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black ${
                              passwordCriteria.minLen && passwordCriteria.hasUpper && passwordCriteria.hasLower
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {passwordCriteria.minLen && passwordCriteria.hasUpper && passwordCriteria.hasLower
                              ? "Kuat & Memenuhi Syarat"
                              : "Belum Memenuhi Syarat"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className={`flex items-center gap-1.5 ${passwordCriteria.minLen ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${passwordCriteria.minLen ? "text-emerald-600" : "text-slate-300"}`} />
                            <span>Minimal 8 Karakter ({form.password.length}/8)</span>
                          </div>

                          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${passwordCriteria.hasUpper ? "text-emerald-600" : "text-slate-300"}`} />
                            <span>Memuat Huruf Besar (A-Z)</span>
                          </div>

                          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${passwordCriteria.hasLower ? "text-emerald-600" : "text-slate-300"}`} />
                            <span>Memuat Huruf Kecil (a-z)</span>
                          </div>

                          <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? "text-emerald-700 font-bold" : "text-slate-400"}`}>
                            <CheckCircle2 className={`h-3.5 w-3.5 ${passwordCriteria.hasNumber ? "text-emerald-600" : "text-slate-300"}`} />
                            <span>Angka Numerik (0-9) - Direkomendasikan</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/60 flex items-center gap-1">
                          <Lock className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>Password disimpan secara terenkripsi (SHA-256 salted hash) ke database.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Section 2: Profil & Hak Akses */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 md:p-5 space-y-4">
                <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>Profil & Peran Pengguna</span>
                  </h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    Wajib Diisi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nama Lengkap & Gelar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rian Hidayat, S.E., M.Ak."
                      value={form.full_name}
                      onChange={(e) => {
                        setForm({ ...form, full_name: e.target.value });
                        if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                        fieldErrors.full_name
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    />
                    {fieldErrors.full_name && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Role Level Akses <span className="text-red-500">*</span>
                    </label>
                    <select
                      aria-label="Pilih Role Pengguna"
                      value={form.role}
                      onChange={(e) => {
                        setForm({ ...form, role: e.target.value });
                        if (fieldErrors.role) setFieldErrors({ ...fieldErrors, role: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-white font-bold text-slate-700 transition cursor-pointer ${
                        fieldErrors.role
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    >
                      <option value="ppk">PPK</option>
                      <option value="biro_01">Biro 01</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    {fieldErrors.role && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.role}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Section 3: Data Tambahan (NIP, Unit Kerja, No. Telp - Opsional) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 md:p-5 space-y-4">
                <div className="pb-2.5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-600" />
                    <span>Data Kepegawaian & Kontak</span>
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                    Opsional (Tidak Wajib)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      NIP (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 198908122014021003 (opsional)"
                      value={form.nip}
                      onChange={(e) => {
                        setForm({ ...form, nip: e.target.value });
                        if (fieldErrors.nip) setFieldErrors({ ...fieldErrors, nip: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                        fieldErrors.nip
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    />
                    {fieldErrors.nip && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.nip}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Unit Kerja
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PPK Pengadaan Barang/Jasa (opsional)"
                      value={form.unit_kerja}
                      onChange={(e) => {
                        setForm({ ...form, unit_kerja: e.target.value });
                        if (fieldErrors.unit_kerja) setFieldErrors({ ...fieldErrors, unit_kerja: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                        fieldErrors.unit_kerja
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    />
                    {fieldErrors.unit_kerja && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.unit_kerja}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1.5">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 08123456789 (opsional)"
                      value={form.phone}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: undefined });
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-xl border font-medium transition ${
                        fieldErrors.phone
                          ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                          : "border-slate-200 focus:outline-none focus:border-blue-500"
                      }`}
                    />
                    {fieldErrors.phone && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="pt-2 flex items-center justify-end gap-3 pb-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{modalMode === "create" ? "Simpan Pengguna Baru" : "Perbarui Data Pengguna"}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* AlertDialog Konfirmasi Hapus User */}
      <AlertDialog
        isOpen={Boolean(userToDelete)}
        title="Konfirmasi Hapus Pengguna"
        description={`Apakah Anda yakin ingin menghapus akun pengguna "${userToDelete?.full_name}" (${userToDelete?.email})? Akun ini tidak akan dapat login lagi ke SIPANDA.`}
        confirmText="Ya, Hapus Pengguna"
        cancelText="Batal"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
