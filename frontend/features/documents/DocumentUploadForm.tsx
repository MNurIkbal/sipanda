import React, { useState } from "react";
import {
  Plus,
  Trash2,
  Upload,
  Calendar,
  Send,
  Save,
  ArrowLeft,
  FileText,
  CheckCircle2,
  FilePlus,
  ShieldCheck,
  Building,
  HelpCircle,
  ChevronDown,
  Search
} from "lucide-react";
import { User, PaymentDocument } from "@/types/sipandu.types";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { sipanduApi } from "@/services/api.service";
import {
  documentValidationSchema,
  DocumentValidationError,
  SupportingDocumentInput,
} from "@/schemas/document.schema";

type SupportingDocumentItem = SupportingDocumentInput;

interface DocumentUploadFormProps {
  currentUser: User | null;
  initialData?: PaymentDocument | null;
  onSubmit: (formData: FormData) => Promise<boolean>;
  onCancel: () => void;
  loading: boolean;
}

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  currentUser,
  initialData,
  onSubmit,
  onCancel,
  loading,
}) => {
  // 1. Data Dokumen Form (Sesuai Gambar 1)
  const [nomorSurat, setNomorSurat] = useState(initialData?.nomor_surat || "");
  const [jenisDokumen, setJenisDokumen] = useState(
    initialData?.jenis_dokumen || initialData?.kategori || ""
  );
  const [isJenisDokumenOpen, setIsJenisDokumenOpen] = useState(false);
  const [jenisDokumenSearch, setJenisDokumenSearch] = useState("");
  const [perihal, setPerihal] = useState(
    initialData?.perihal || initialData?.nama_kegiatan || ""
  );

  const jenisDokumenOptions = [
    "Pembayaran LS (Langsung)",
    "Pembayaran UP (Uang Persediaan)",
    "Pembayaran TUP (Tambah Uang Persediaan)",
    "Pembayaran GUP (Ganti Uang Persediaan)",
    "Pembayaran Termin",
    "Surat Perintah Pembayaran (SPP)",
    "Surat Perintah Membayar (SPM)",
    "Kuitansi / Bukti Pembelian",
    "Berita Acara Pembayaran (BAP)",
    "Berita Acara Serah Terima (BAST)",
    "Surat Perjanjian / Kontrak",
    "Surat Pesanan (SP)",
    "Faktur Pajak & SSP",
    "Honorarium / Uang Saku",
    "Perjalanan Dinas (SPD)",
  ];

  const unitKerjaOptions = [
    "PPK Kegiatan Operasional",
    "PPK Infrastruktur & Pengadaan",
    "PPK Pelayanan Publik & TI",
    "PPK Belanja Modal",
    "PPK Gaji & Tunjangan",
    "Biro Umum & Pengadaan",
    "Biro Perencanaan & Keuangan",
    "Biro Hukum & Organisasi",
    "Biro Sumber Daya Manusia",
    "Inspektorat Utama",
  ];

  const [isUnitPpkOpen, setIsUnitPpkOpen] = useState(false);
  const [unitPpkSearch, setUnitPpkSearch] = useState("");

  const filteredUnitKerjaOptions = unitKerjaOptions.filter((opt) =>
    opt.toLowerCase().includes(unitPpkSearch.toLowerCase())
  );

  const filteredJenisDokumenOptions = jenisDokumenOptions.filter((opt) =>
    opt.toLowerCase().includes(jenisDokumenSearch.toLowerCase())
  );
  const [tanggalDokumen, setTanggalDokumen] = useState(
    initialData?.tanggal_dokumen
      ? new Date(initialData.tanggal_dokumen).toISOString().split("T")[0]
      : ""
  );
  const [tanggalDiterima, setTanggalDiterima] = useState(
    initialData?.tanggal_diterima
      ? new Date(initialData.tanggal_diterima).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [pihakEksternal, setPihakEksternal] = useState(
    initialData?.pihak_eksternal || ""
  );
  const [unitPpk, setUnitPpk] = useState(
    initialData?.unit_kerja || currentUser?.unit_kerja || "PPK Kegiatan Operasional"
  );
  const [ppkName, setPpkName] = useState(
    initialData?.ppk_name || currentUser?.full_name || "Andi Pratama"
  );
  const [nilaiPembayaran, setNilaiPembayaran] = useState(
    initialData?.nilai_pembayaran
      ? new Intl.NumberFormat("id-ID").format(Number(initialData.nilai_pembayaran))
      : ""
  );
  const [keterangan, setKeterangan] = useState(initialData?.keterangan || "");

  // 2. Dokumen Pendukung (Minimal 1, bisa tambah lebih dari 1)
  const [supportingDocs, setSupportingDocs] = useState<SupportingDocumentItem[]>(() => {
    if (initialData?.attachments && initialData.attachments.length > 0) {
      return initialData.attachments.map((att) => ({
        id: `doc-${att.id}`,
        jenis_dokumen: att.document_type || "Dokumen Pendukung",
        nomor_dokumen: att.nomor_dokumen || "-",
        tanggal: att.tanggal_dokumen
          ? new Date(att.tanggal_dokumen).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        file: null,
        existing_file_name: att.file_name,
        existing_file_path: att.file_path,
        existing_attachment_id: att.id,
      }));
    }
    return [
      {
        id: "doc-1",
        jenis_dokumen: "",
        nomor_dokumen: "",
        tanggal: new Date().toISOString().split("T")[0],
        file: null,
      },
    ];
  });

  // Form validation errors state
  const [formErrors, setFormErrors] = useState<DocumentValidationError>({});

  // Dialog State untuk Konfirmasi Hapus Dokumen Pendukung
  const [docToDeleteItem, setDocToDeleteItem] = useState<SupportingDocumentItem | null>(null);
  const [isDeletingFromDb, setIsDeletingFromDb] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  // Tambah Dokumen Pendukung
  const handleAddSupportingDoc = () => {
    setSupportingDocs((prev) => [
      ...prev,
      {
        id: `doc-${Date.now()}`,
        jenis_dokumen: "",
        nomor_dokumen: "",
        tanggal: new Date().toISOString().split("T")[0],
        file: null,
      },
    ]);
  };

  // Hapus Dokumen Pendukung:
  // - Jika baru ditambah di form: langsung hapus baris komponennya saja tanpa modal pilihan.
  // - Jika berasal dari database: konfirmasi hapus langsung dari database.
  const requestRemoveSupportingDoc = (item: SupportingDocumentItem) => {
    if (supportingDocs.length <= 1) {
      setValidationAlert({
        isOpen: true,
        title: "Perhatian: Dokumen Wajib",
        description:
          "Pengajuan minimal harus memiliki 1 baris dokumen pendukung. Anda tidak dapat menghapus seluruh dokumen pendukung.",
      });
      return;
    }

    // Jika bukan dari database (baru ditambah user), langsung hapus komponennya
    if (!item.existing_attachment_id) {
      setSupportingDocs((prev) => prev.filter((d) => d.id !== item.id));
      return;
    }

    // Jika dari database, set item untuk konfirmasi hapus dari database
    setDocToDeleteItem(item);
  };

  // Konfirmasi Hapus Dokumen Pendukung dari Database Backend
  const confirmDeleteSupportingDoc = async () => {
    if (!docToDeleteItem) return;

    if (docToDeleteItem.existing_attachment_id) {
      try {
        setIsDeletingFromDb(true);
        await sipanduApi.deleteAttachment(docToDeleteItem.existing_attachment_id, {
          user_name: currentUser?.full_name,
          user_role: currentUser?.role,
        });
      } catch (err) {
        console.error("Gagal menghapus lampiran dari database:", err);
      } finally {
        setIsDeletingFromDb(false);
      }
    }

    setSupportingDocs((prev) => prev.filter((d) => d.id !== docToDeleteItem.id));
    setDocToDeleteItem(null);
  };

  const formatRupiahInput = (value: string) => {
    const rawDigits = value.replace(/[^0-9]/g, "");
    if (!rawDigits) return "";
    return new Intl.NumberFormat("id-ID").format(Number(rawDigits));
  };

  const getCleanNumber = (val: string) => {
    const digits = val.replace(/[^0-9]/g, "");
    return digits ? parseInt(digits, 10).toString() : "0";
  };

  // Update Field Dokumen Pendukung
  const handleUpdateDocField = (
    id: string,
    field: keyof SupportingDocumentItem,
    value: any
  ) => {
    setSupportingDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
    if (formErrors.supporting_docs || formErrors.supporting_doc_items?.[id]) {
      setFormErrors((prev) => {
        const nextDocItems = { ...prev.supporting_doc_items };
        if (nextDocItems[id]) {
          const nextRow = { ...nextDocItems[id] };
          delete (nextRow as any)[field];
          if (Object.keys(nextRow).length === 0) {
            delete nextDocItems[id];
          } else {
            nextDocItems[id] = nextRow;
          }
        }
        return {
          ...prev,
          supporting_docs: undefined,
          supporting_doc_items: Object.keys(nextDocItems).length > 0 ? nextDocItems : undefined,
        };
      });
    }
  };

  // Submit Handler (Simpan Draft atau Kirim Verifikasi) menggunakan documentValidationSchema
  const handleSubmitForm = async (status: "draft" | "menunggu_verifikasi") => {
    // Jalankan validasi schema dengan opsi is_edit_mode jika sedang mengedit dokumen
    const validation = documentValidationSchema.validate(
      {
        nomor_surat: nomorSurat,
        jenis_dokumen: jenisDokumen,
        perihal,
        tanggal_dokumen: tanggalDokumen,
        tanggal_diterima: tanggalDiterima,
        pihak_eksternal: pihakEksternal,
        unit_kerja: unitPpk,
        ppk_name: ppkName,
        nilai_pembayaran: nilaiPembayaran,
        keterangan,
        supporting_docs: supportingDocs,
        is_edit_mode: Boolean(initialData),
      },
      status
    );

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      
      // Auto-focus atau scroll ke error pertama
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setFormErrors({});

    const formData = new FormData();
    formData.append("nomor_surat", nomorSurat.trim());
    formData.append("jenis_dokumen", jenisDokumen.trim());
    formData.append("perihal", perihal.trim());
    formData.append("tanggal_dokumen", tanggalDokumen || "");
    formData.append("tanggal_diterima", tanggalDiterima);
    formData.append("pihak_eksternal", pihakEksternal.trim());
    formData.append("unit_kerja", unitPpk.trim());
    formData.append("ppk_name", ppkName.trim());
    formData.append("nilai_pembayaran", getCleanNumber(nilaiPembayaran));
    formData.append("keterangan", keterangan.trim());
    formData.append("status", status);

    // Kirim data update untuk dokumen pendukung yang sudah ada di database (sesuai id attachment)
    const existingAttachments = supportingDocs
      .filter((d) => Boolean(d.existing_attachment_id))
      .map((d) => ({
        id: d.existing_attachment_id,
        document_type: d.jenis_dokumen.trim() || "Dokumen Pendukung",
        nomor_dokumen: d.nomor_dokumen.trim() || "-",
        tanggal_dokumen: d.tanggal || null,
      }));
    formData.append("existing_attachments", JSON.stringify(existingAttachments));

    // Kirim berkas baru jika user memilih/mengupload file baru
    const attachmentMeta: any[] = [];
    supportingDocs.forEach((doc) => {
      if (doc.file) {
        formData.append("files", doc.file);
        attachmentMeta.push({
          document_type: doc.jenis_dokumen.trim() || "Dokumen Pendukung",
          nomor_dokumen: doc.nomor_dokumen.trim() || "-",
          tanggal_dokumen: doc.tanggal || null,
        });
      }
    });

    formData.append("attachment_meta", JSON.stringify(attachmentMeta));

    await onSubmit(formData);
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      
      {/* HEADER FORM UTAMA (Title & Tombol Aksi) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">
              {initialData ? "Edit Data Dokumen Pembayaran" : "Pendaftaran & Input Dokumen Pembayaran"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {initialData
              ? `Perbarui informasi dan dokumen pendukung untuk nomor surat ${initialData.nomor_surat}.`
              : "Lengkapi data berkas pembayaran dan lampirkan dokumen pendukung untuk diverifikasi oleh Biro 01 Keuangan."}
          </p>
        </div>

      </div>

      {/* 1. CARD SECTION DATA DOKUMEN (Sesuai Gambar 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8">
        <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight">
              Data Dokumen
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Informasi primer surat pengajuan transaksi pembayaran SPP/SPM.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Baris 1 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nomor Surat / Nomor Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="SP/001/KEU/2027"
              value={nomorSurat}
              onChange={(e) => {
                setNomorSurat(e.target.value);
                if (formErrors.nomor_surat) setFormErrors((prev) => ({ ...prev, nomor_surat: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 font-medium transition ${
                formErrors.nomor_surat
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.nomor_surat && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.nomor_surat}
              </p>
            )}
          </div>

          {/* Jenis Dokumen: Searchable Select */}
          <div className="relative">
            <label className="block font-bold text-slate-700 mb-1.5">
              Jenis Dokumen <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => setIsJenisDokumenOpen(!isJenisDokumenOpen)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white cursor-pointer flex items-center justify-between font-medium transition hover:border-slate-300 ${
                formErrors.jenis_dokumen
                  ? "border-red-400 bg-red-50/20"
                  : "border-slate-200/90"
              }`}
            >
              <span className={jenisDokumen ? "text-slate-900 font-semibold" : "text-slate-400"}>
                {jenisDokumen || "Pilih atau cari jenis dokumen..."}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isJenisDokumenOpen ? "rotate-180" : ""}`} />
            </div>
            {formErrors.jenis_dokumen && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.jenis_dokumen}
              </p>
            )}

            {/* Popover Dropdown Searchable Select */}
            {isJenisDokumenOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsJenisDokumenOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white shadow-xl border border-slate-200/90 z-50 p-2 text-xs animate-in fade-in duration-100">
                  <div className="relative mb-2">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ketik untuk mencari jenis dokumen..."
                      value={jenisDokumenSearch}
                      onChange={(e) => setJenisDokumenSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredJenisDokumenOptions.length === 0 ? (
                      <div className="py-3 text-center text-slate-400 text-[11px]">
                        Tidak ada opsi yang cocok.
                        <button
                          type="button"
                          onClick={() => {
                            setJenisDokumen(jenisDokumenSearch.trim());
                            if (formErrors.jenis_dokumen) setFormErrors((prev) => ({ ...prev, jenis_dokumen: undefined }));
                            setIsJenisDokumenOpen(false);
                            setJenisDokumenSearch("");
                          }}
                          className="block mx-auto mt-1 font-bold text-blue-600 hover:underline"
                        >
                          Gunakan "{jenisDokumenSearch.trim()}"
                        </button>
                      </div>
                    ) : (
                      filteredJenisDokumenOptions.map((opt) => (
                        <div
                          key={opt}
                          onClick={() => {
                            setJenisDokumen(opt);
                            if (formErrors.jenis_dokumen) setFormErrors((prev) => ({ ...prev, jenis_dokumen: undefined }));
                            setIsJenisDokumenOpen(false);
                            setJenisDokumenSearch("");
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer transition flex items-center justify-between font-semibold ${
                            jenisDokumen === opt
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{opt}</span>
                          {jenisDokumen === opt && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Perihal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: Pengadaan Perangkat IT Biro Keuangan TA 2027"
              value={perihal}
              onChange={(e) => {
                setPerihal(e.target.value);
                if (formErrors.perihal) setFormErrors((prev) => ({ ...prev, perihal: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 font-medium transition ${
                formErrors.perihal
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.perihal && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.perihal}
              </p>
            )}
          </div>

          {/* Baris 2 */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Tanggal Dokumen <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              placeholder="Pilih tanggal dokumen..."
              value={tanggalDokumen}
              onChange={(e) => {
                setTanggalDokumen(e.target.value);
                if (formErrors.tanggal_dokumen) setFormErrors((prev) => ({ ...prev, tanggal_dokumen: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-1 font-medium transition ${
                formErrors.tanggal_dokumen
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.tanggal_dokumen && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.tanggal_dokumen}
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Tanggal Diterima <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              placeholder="Pilih tanggal diterima..."
              value={tanggalDiterima}
              onChange={(e) => {
                setTanggalDiterima(e.target.value);
                if (formErrors.tanggal_diterima) setFormErrors((prev) => ({ ...prev, tanggal_diterima: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-1 font-medium transition ${
                formErrors.tanggal_diterima
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.tanggal_diterima && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.tanggal_diterima}
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Pihak Eksternal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: PT Sumber Makmur Abadi"
              value={pihakEksternal}
              onChange={(e) => {
                setPihakEksternal(e.target.value);
                if (formErrors.pihak_eksternal) setFormErrors((prev) => ({ ...prev, pihak_eksternal: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 font-medium transition ${
                formErrors.pihak_eksternal
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.pihak_eksternal && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.pihak_eksternal}
              </p>
            )}
          </div>

          {/* Baris 3 */}
          <div className="relative">
            <label className="block font-bold text-slate-700 mb-1.5">
              Unit / PPK <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => setIsUnitPpkOpen(!isUnitPpkOpen)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white cursor-pointer flex items-center justify-between font-medium transition hover:border-slate-300 ${
                formErrors.unit_kerja
                  ? "border-red-400 bg-red-50/20"
                  : "border-slate-200/90"
              }`}
            >
              <span className={unitPpk ? "text-slate-900 font-semibold" : "text-slate-400"}>
                {unitPpk || "Pilih atau cari Unit / PPK..."}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isUnitPpkOpen ? "rotate-180" : ""}`} />
            </div>
            {formErrors.unit_kerja && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.unit_kerja}
              </p>
            )}

            {/* Popover Dropdown Searchable Select Unit / PPK */}
            {isUnitPpkOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUnitPpkOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white shadow-xl border border-slate-200/90 z-50 p-2 text-xs animate-in fade-in duration-100">
                  <div className="relative mb-2">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Ketik untuk mencari Unit / PPK..."
                      value={unitPpkSearch}
                      onChange={(e) => setUnitPpkSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredUnitKerjaOptions.length === 0 ? (
                      <div className="py-3 text-center text-slate-400 text-[11px]">
                        Tidak ada unit yang cocok.
                        {unitPpkSearch.trim() && (
                          <button
                            type="button"
                            onClick={() => {
                              setUnitPpk(unitPpkSearch.trim());
                              if (formErrors.unit_kerja) setFormErrors((prev) => ({ ...prev, unit_kerja: undefined }));
                              setIsUnitPpkOpen(false);
                              setUnitPpkSearch("");
                            }}
                            className="block mx-auto mt-1 font-bold text-blue-600 hover:underline"
                          >
                            Gunakan "{unitPpkSearch.trim()}"
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredUnitKerjaOptions.map((unit) => (
                        <div
                          key={unit}
                          onClick={() => {
                            setUnitPpk(unit);
                            if (formErrors.unit_kerja) setFormErrors((prev) => ({ ...prev, unit_kerja: undefined }));
                            setIsUnitPpkOpen(false);
                            setUnitPpkSearch("");
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer transition flex items-center justify-between font-semibold ${
                            unitPpk === unit
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{unit}</span>
                          {unitPpk === unit && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Nilai Pembayaran (Rp) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                Rp
              </span>
              <input
                type="text"
                placeholder="0"
                value={nilaiPembayaran}
                onChange={(e) => {
                  const formatted = formatRupiahInput(e.target.value);
                  setNilaiPembayaran(formatted);
                  if (formErrors.nilai_pembayaran) setFormErrors((prev) => ({ ...prev, nilai_pembayaran: undefined }));
                }}
                className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border bg-white font-bold transition focus:outline-none ${
                  formErrors.nilai_pembayaran
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400 bg-red-50/20 text-slate-900"
                    : "border-slate-200/90 focus:border-blue-500 text-slate-900"
                }`}
              />
            </div>
            {formErrors.nilai_pembayaran && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.nilai_pembayaran}
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Keterangan
            </label>
            <textarea
              rows={3}
              placeholder="Contoh: Pembayaran termin 1 pengadaan server biro keuangan..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition font-medium resize-y"
            />
          </div>
        </div>
      </div>

      {/* 2. CARD SECTION DOKUMEN PENDUKUNG (Sesuai Gambar 1) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 md:p-8">
        <div className="flex items-center justify-between mb-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="font-extrabold text-slate-800 text-sm md:text-base tracking-tight">
              Dokumen Pendukung ({supportingDocs.length})
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tambahkan dokumen apa pun sesuai kebutuhan transaksi — tidak ada jenis dokumen yang diwajibkan. Dokumen terakhir diperbarui -.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddSupportingDoc}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tambah Dokumen
          </button>
        </div>

        {formErrors.supporting_docs && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
            <span>{formErrors.supporting_docs}</span>
          </div>
        )}

        <div className="space-y-4 pt-2">
          {supportingDocs.map((item, index) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200/90 p-5 bg-white relative transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-xs text-slate-800">
                  Dokumen {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => requestRemoveSupportingDoc(item)}
                  className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                  title="Hapus baris dokumen ini"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jenis Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BAPP, BAST, Invoice, SPK..."
                    value={item.jenis_dokumen}
                    onChange={(e) =>
                      handleUpdateDocField(item.id, "jenis_dokumen", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 font-medium transition ${
                      formErrors.supporting_doc_items?.[item.id]?.jenis_dokumen
                        ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {formErrors.supporting_doc_items?.[item.id]?.jenis_dokumen && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      {formErrors.supporting_doc_items[item.id].jenis_dokumen}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: BAPP/001/KEU/2027"
                    value={item.nomor_dokumen}
                    onChange={(e) =>
                      handleUpdateDocField(item.id, "nomor_dokumen", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 font-medium transition ${
                      formErrors.supporting_doc_items?.[item.id]?.nomor_dokumen
                        ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {formErrors.supporting_doc_items?.[item.id]?.nomor_dokumen && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      {formErrors.supporting_doc_items[item.id].nomor_dokumen}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Dokumen <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    placeholder="Pilih tanggal..."
                    value={item.tanggal}
                    onChange={(e) =>
                      handleUpdateDocField(item.id, "tanggal", e.target.value)
                    }
                    className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-700 focus:outline-none focus:ring-1 font-medium transition ${
                      formErrors.supporting_doc_items?.[item.id]?.tanggal
                        ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                        : "border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                  />
                  {formErrors.supporting_doc_items?.[item.id]?.tanggal && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      {formErrors.supporting_doc_items[item.id].tanggal}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload File Button & Info Berkas yang sudah ada */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer ${
                    formErrors.supporting_doc_items?.[item.id]?.file
                      ? "border-red-400 bg-red-50/30 text-red-700"
                      : "border-slate-200"
                  }`}>
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span>{item.existing_file_name ? "Ganti File Berkas" : "Upload File *"}</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUpdateDocField(item.id, "file", e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {/* Jika memilih file baru dari komputer */}
                  {item.file ? (
                    <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/70">
                      <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                      <span className="font-semibold truncate max-w-xs">{item.file.name}</span>
                      <span className="text-[10px] text-blue-500">
                        ({(item.file.size / 1024).toFixed(1)} KB - File Baru)
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateDocField(item.id, "file", null)}
                        className="ml-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : item.existing_file_name ? (
                    /* Jika file sudah ada di database dari pengajuan sebelumnya */
                    <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/80">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate max-w-xs">{item.existing_file_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Belum ada file dipilih</span>
                  )}
                </div>
                {formErrors.supporting_doc_items?.[item.id]?.file && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1.5">
                    {formErrors.supporting_doc_items[item.id].file}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. FOOTER ACTION BUTTONS */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
        >
          Batal
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => handleSubmitForm("menunggu_verifikasi")}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>Simpan</span>
        </button>
      </div>

      {/* Dialog Konfirmasi Hapus Dokumen Pendukung dari Database Backend */}
      {Boolean(docToDeleteItem) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Hapus dari Database</h3>
                <p className="text-xs text-slate-500 font-semibold">
                  {docToDeleteItem?.jenis_dokumen || "Dokumen Pendukung"}
                  {docToDeleteItem?.nomor_dokumen ? ` (${docToDeleteItem.nomor_dokumen})` : ""}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Berkas lampiran ini telah tersimpan di database backend. Apakah Anda yakin ingin menghapus data dokumen pendukung ini secara permanen dari database?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDocToDeleteItem(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={isDeletingFromDb}
                onClick={confirmDeleteSupportingDoc}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeletingFromDb ? "Menghapus..." : "Ya"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AlertDialog Validasi Form */}
      <AlertDialog
        isOpen={validationAlert.isOpen}
        title={validationAlert.title}
        description={validationAlert.description}
        confirmText="Saya Mengerti"
        cancelText="Tutup"
        variant="warning"
        onConfirm={() => setValidationAlert((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setValidationAlert((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
