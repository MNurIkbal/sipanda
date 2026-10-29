import React, { useEffect, useState } from "react";
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
  Search,
  Sparkles,
  Loader2,
  FileSearch,
  ScanLine,
  Zap,
  RotateCcw,
} from "lucide-react";
import { User, PaymentDocument } from "@/types/sipandu.types";
import { AlertDialog } from "@/components/ui/AlertDialog";
import { DatePicker } from "@/components/ui/DatePicker";
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

  const defaultJenisDokumenOptions = [
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

  const defaultUnitKerjaOptions = [
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

  const [jenisDokumenOptions, setJenisDokumenOptions] = useState<string[]>(defaultJenisDokumenOptions);
  const [unitKerjaOptions, setUnitKerjaOptions] = useState<string[]>(defaultUnitKerjaOptions);

  useEffect(() => {
    // Ambil data master secara dinamis (Hanya yang berstatus Aktif)
    sipanduApi.getMasterUnits().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        const activeUnits = res.data.filter((item: any) => item.is_active !== false);
        setUnitKerjaOptions(activeUnits.map((item: any) => item.nama));
      }
    }).catch(() => {});

    sipanduApi.getMasterJenisDokumen().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        const activeDocs = res.data.filter((item: any) => item.is_active !== false);
        setJenisDokumenOptions(activeDocs.map((item: any) => item.nama));
      }
    }).catch(() => {});
  }, []);

  const [isUnitPpkOpen, setIsUnitPpkOpen] = useState(false);
  const [unitPpkSearch, setUnitPpkSearch] = useState("");

  const filteredUnitKerjaOptions = unitKerjaOptions.filter((opt) =>
    opt.toLowerCase().includes(unitPpkSearch.toLowerCase())
  );

  const filteredJenisDokumenOptions = jenisDokumenOptions.filter((opt) =>
    opt.toLowerCase().includes(jenisDokumenSearch.toLowerCase())
  );

  // Kategori Pengadaan (Searchable Select: Pengadaan Barang / Jasa, Harwat(Harian Rawat))
  const kategoriPengadaanOptions = [
    "Pengadaan Barang / Jasa",
    "Harwat(Harian Rawat)",
  ];
  const [kategoriPengadaan, setKategoriPengadaan] = useState<string>(
    (initialData as any)?.kategori_pengadaan || "Pengadaan Barang / Jasa"
  );
  const [isKategoriPengadaanOpen, setIsKategoriPengadaanOpen] = useState(false);
  const [kategoriPengadaanSearch, setKategoriPengadaanSearch] = useState("");

  const filteredKategoriPengadaanOptions = kategoriPengadaanOptions.filter((opt) =>
    opt.toLowerCase().includes(kategoriPengadaanSearch.toLowerCase())
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
  const [catatanPerbaikan, setCatatanPerbaikan] = useState(
    (initialData as any)?.catatan_perbaikan || ""
  );

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
      {
        id: "doc-2",
        jenis_dokumen: "",
        nomor_dokumen: "",
        tanggal: new Date().toISOString().split("T")[0],
        file: null,
      },
      {
        id: "doc-3",
        jenis_dokumen: "",
        nomor_dokumen: "",
        tanggal: new Date().toISOString().split("T")[0],
        file: null,
      },
    ];
  });

  // Form validation errors state
  const [formErrors, setFormErrors] = useState<DocumentValidationError>({});

  // VeriText OCR loading state per dokumen pendukung
  const [extractingDocId, setExtractingDocId] = useState<string | null>(null);
  const [ocrSuccessToast, setOcrSuccessToast] = useState<string | null>(null);

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
  // - Minimal 3 baris dokumen pendukung harus tetap ada
  // - Jika baru ditambah di form: langsung hapus baris komponennya saja tanpa modal pilihan.
  // - Jika berasal dari database: konfirmasi hapus langsung dari database.
  const requestRemoveSupportingDoc = (item: SupportingDocumentItem) => {
    if (supportingDocs.length <= 3) {
      setValidationAlert({
        isOpen: true,
        title: "Perhatian: Minimal 3 Dokumen",
        description:
          "Pengajuan pembayaran wajib menyertakan minimal 3 berkas dokumen pendukung. Anda tidak dapat menghapus baris ini.",
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

  // Handler Upload Dokumen Pendukung yang Terintegrasi dengan VeriText OCR
  const handleFileChangeWithVeriText = async (docId: string, file: File | null) => {
    handleUpdateDocField(docId, "file", file);
    if (!file) return;

    try {
      setExtractingDocId(docId);
      const res = await sipanduApi.extractVeriText(file);

      if (res.success && res.data) {
        const meta = res.data.data || res.data;

        // Auto-fill field pada baris dokumen pendukung saat ini
        if (meta.jenis_dokumen) {
          handleUpdateDocField(docId, "jenis_dokumen", meta.jenis_dokumen);
        }
        if (meta.nomor_dokumen) {
          handleUpdateDocField(docId, "nomor_dokumen", meta.nomor_dokumen);
        }
        if (meta.tanggal_dokumen) {
          handleUpdateDocField(docId, "tanggal", meta.tanggal_dokumen);
        }
        if (meta.nilai_pembayaran) {
          handleUpdateDocField(docId, "nilai_pembayaran", meta.nilai_pembayaran);
        }
        if (meta.perihal) {
          handleUpdateDocField(docId, "uraian", meta.perihal);
        }
        if (meta.pihak_eksternal) {
          handleUpdateDocField(docId, "nama_perusahaan", meta.pihak_eksternal);
        }
        if (meta.nomor_spk) {
          handleUpdateDocField(docId, "nomor_spk", meta.nomor_spk);
        }
        if (meta.unit_kerja) {
          handleUpdateDocField(docId, "unit_kerja", meta.unit_kerja);
        }
        if (meta.bank_name) {
          handleUpdateDocField(docId, "bank_name", meta.bank_name);
        }
        if (meta.bank_account) {
          handleUpdateDocField(docId, "bank_account", meta.bank_account);
        }
        if (meta.bank_holder) {
          handleUpdateDocField(docId, "bank_holder", meta.bank_holder);
        }
        if (meta.terbilang) {
          handleUpdateDocField(docId, "terbilang", meta.terbilang);
        }
        if (meta.penandatangan) {
          handleUpdateDocField(docId, "penandatangan", meta.penandatangan);
        }
        if (meta.jabatan_penandatangan) {
          handleUpdateDocField(docId, "jabatan_penandatangan", meta.jabatan_penandatangan);
        }
        handleUpdateDocField(docId, "metadata", meta);

        // Auto-fill ke Form Data Dokumen Utama jika field di form atas masih kosong / default
        if (meta.nomor_dokumen && (!nomorSurat || nomorSurat.trim() === "")) {
          setNomorSurat(meta.nomor_dokumen);
        }
        if (meta.perihal && (!perihal || perihal.trim() === "")) {
          setPerihal(meta.perihal);
        }
        if (meta.tanggal_dokumen && (!tanggalDokumen || tanggalDokumen.trim() === "")) {
          setTanggalDokumen(meta.tanggal_dokumen);
        }
        if (meta.pihak_eksternal && (!pihakEksternal || pihakEksternal.trim() === "")) {
          setPihakEksternal(meta.pihak_eksternal);
        }
        if (meta.nilai_pembayaran && (!nilaiPembayaran || nilaiPembayaran === "" || nilaiPembayaran === "0")) {
          setNilaiPembayaran(new Intl.NumberFormat("id-ID").format(Number(meta.nilai_pembayaran)));
        }

        // Tampilkan toast notifikasi sukses ekstraksi
        setOcrSuccessToast(
          `Metadata dokumen berhasil diekstrak otomatis melalui VeriText (No: ${meta.nomor_dokumen || "-"}, Nilai: Rp ${Number(meta.nilai_pembayaran || 0).toLocaleString("id-ID")})`
        );
        setTimeout(() => setOcrSuccessToast(null), 6000);
      }
    } catch (err: any) {
      console.warn("Ekstraksi VeriText gagal:", err);
    } finally {
      setExtractingDocId(null);
    }
  };

  // Handler Hapus Berkas VeriText beserta pembersihan field metadata otomatisnya
  const handleClearVeriTextUpload = (docId: string) => {
    setSupportingDocs((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            file: null,
            jenis_dokumen: "",
            nomor_dokumen: "",
            tanggal: new Date().toISOString().split("T")[0],
            nilai_pembayaran: 0,
            uraian: "",
            nama_perusahaan: "",
            nomor_spk: "",
            unit_kerja: "",
            bank_name: "",
            bank_account: "",
            bank_holder: "",
            terbilang: "",
            penandatangan: "",
            jabatan_penandatangan: "",
            metadata: undefined,
          };
        }
        return d;
      })
    );
  };

  // Cek apakah minimal 3 dokumen pendukung telah diunggah berkasnya
  const uploadedFilesCount = supportingDocs.filter(
    (d) => Boolean(d.file || d.existing_file_name || d.existing_file_path)
  ).length;
  const isSaveDisabled = loading || uploadedFilesCount < 3;

  // Submit Handler (Simpan Draft atau Kirim Verifikasi) menggunakan documentValidationSchema
  const handleSubmitForm = async (status: "draft" | "menunggu_verifikasi") => {
    const isRejected = Boolean(
      initialData &&
        (initialData.status === "dikembalikan" ||
          initialData.status === "ditolak" ||
          Boolean(initialData.catatan_revisi))
    );

    // Jalankan validasi schema dengan opsi is_edit_mode dan is_rejected
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
        is_rejected: isRejected,
        catatan_perbaikan: catatanPerbaikan,
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
    formData.append("kategori_pengadaan", (kategoriPengadaan || "Pengadaan Barang / Jasa").trim());
    formData.append("kategori", (kategoriPengadaan || jenisDokumen || "Pengadaan Barang / Jasa").trim());
    formData.append("perihal", perihal.trim());
    formData.append("tanggal_dokumen", tanggalDokumen || "");
    formData.append("tanggal_diterima", tanggalDiterima);
    formData.append("pihak_eksternal", pihakEksternal.trim());
    formData.append("unit_kerja", unitPpk.trim());
    formData.append("ppk_name", ppkName.trim());
    formData.append("nilai_pembayaran", getCleanNumber(nilaiPembayaran));
    formData.append("keterangan", keterangan.trim());
    formData.append("catatan_perbaikan", catatanPerbaikan.trim());
    formData.append("status", status);

    // Kirim data update untuk dokumen pendukung yang sudah ada di database (sesuai id attachment)
    const existingAttachments = supportingDocs
      .filter((d) => Boolean(d.existing_attachment_id))
      .map((d) => ({
        id: d.existing_attachment_id,
        document_type: d.jenis_dokumen.trim() || "Dokumen Pendukung",
        nomor_dokumen: d.nomor_dokumen.trim() || "-",
        tanggal_dokumen: d.tanggal || null,
        nilai_pembayaran: Number(d.nilai_pembayaran) || 0,
        uraian: d.uraian || "",
        nama_perusahaan: d.nama_perusahaan || "",
        metadata: {
          ...(d.metadata || {}),
          nomor_spk: d.nomor_spk || "",
          unit_kerja: d.unit_kerja || "",
          bank_name: d.bank_name || "",
          bank_account: d.bank_account || "",
          bank_holder: d.bank_holder || "",
          terbilang: d.terbilang || "",
          penandatangan: d.penandatangan || "",
          jabatan_penandatangan: d.jabatan_penandatangan || "",
        },
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
          nilai_pembayaran: Number(doc.nilai_pembayaran) || 0,
          uraian: doc.uraian || "",
          nama_perusahaan: doc.nama_perusahaan || "",
          metadata: {
            ...(doc.metadata || {}),
            nomor_spk: doc.nomor_spk || "",
            unit_kerja: doc.unit_kerja || "",
            bank_name: doc.bank_name || "",
            bank_account: doc.bank_account || "",
            bank_holder: doc.bank_holder || "",
            terbilang: doc.terbilang || "",
            penandatangan: doc.penandatangan || "",
            jabatan_penandatangan: doc.jabatan_penandatangan || "",
          },
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
              {initialData
                ? initialData.status === "dikembalikan" || initialData.status === "ditolak"
                  ? "Revisi Data Dokumen Pembayaran"
                  : "Edit Data Dokumen Pembayaran"
                : "Pendaftaran & Input Dokumen Pembayaran"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-black">
              <Sparkles className="h-2.5 w-2.5 text-blue-600" />
              VeriText OCR Ready
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {initialData
              ? initialData.status === "dikembalikan" || initialData.status === "ditolak"
                ? `Perbaiki dan lengkapi catatan revisi berkas pembayaran untuk nomor surat ${initialData.nomor_surat}.`
                : `Perbarui informasi dan dokumen pendukung untuk nomor surat ${initialData.nomor_surat}.`
              : "Lengkapi data berkas pembayaran atau cukup upload berkas pendukung (PDF/DOCX/Invoice) untuk diekstrak otomatis oleh VeriText."}
          </p>
        </div>
      </div>

      {/* Banner Notifikasi Berhasil Ekstraksi VeriText */}
      {ocrSuccessToast && (
        <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-blue-900 shadow-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <span className="font-extrabold text-blue-950 block">Ekstraksi Otomatis Berhasil!</span>
              <span className="font-medium text-[11px] text-blue-800">{ocrSuccessToast}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOcrSuccessToast(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAMPILAN KHUSUS DOKUMEN DITOLAK (Catatan Revisi dari Verifikator & Form Penjelasan Perbaikan PPK) */}
      {initialData && (initialData.status === "dikembalikan" || initialData.status === "ditolak" || Boolean(initialData.catatan_revisi)) && (
        <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-6 md:p-7 space-y-4 animate-in fade-in duration-200">
          {/* Card Catatan Revisi dari Verifikator Biro 01 */}
          <div className="p-4 bg-gradient-to-r from-rose-50/90 to-red-50/90 border border-rose-200 rounded-xl text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-xs text-rose-900 uppercase tracking-wider mb-1">
              <span className="p-1 rounded-full bg-rose-200/80 text-rose-700">!</span>
              <span>CATATAN REVISI DARI VERIFIKATOR BIRO 01:</span>
            </div>
            <div className="text-xs font-semibold text-rose-800 leading-relaxed bg-white/80 p-3 rounded-lg border border-rose-200/80 mt-2">
              {initialData.catatan_revisi || "masih kurang"}
            </div>
          </div>

          {/* Form Penjelasan Catatan Perbaikan PPK */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <span>Penjelasan Catatan Perbaikan PPK</span>
                <span className="text-rose-500 font-bold">*Wajib Diisi</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Minimal 5 karakter</span>
            </div>
            <textarea
              rows={3}
              placeholder="Contoh: Faktur pajak nomor 019283 telah diperbaiki stempelnya, kuitansi materai telah diunggah ulang..."
              value={catatanPerbaikan}
              onChange={(e) => {
                setCatatanPerbaikan(e.target.value);
                if (formErrors.catatan_perbaikan) {
                  setFormErrors((prev) => ({ ...prev, catatan_perbaikan: undefined }));
                }
              }}
              className={`w-full px-4 py-3 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none focus:ring-1 text-xs font-medium leading-relaxed transition ${
                formErrors.catatan_perbaikan
                  ? "border-red-400 focus:border-red-500 focus:ring-red-400 bg-red-50/20"
                  : "border-slate-200/90 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />
            {formErrors.catatan_perbaikan && (
              <p className="text-[11px] text-red-500 font-semibold mt-1">
                {formErrors.catatan_perbaikan}
              </p>
            )}
          </div>
        </div>
      )}

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

          {/* Kategori Pengadaan: Searchable Select */}
          <div className="relative">
            <label className="block font-bold text-slate-700 mb-1.5">
              Kategori Pengadaan <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => setIsKategoriPengadaanOpen(!isKategoriPengadaanOpen)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white cursor-pointer flex items-center justify-between font-medium transition hover:border-slate-300"
            >
              <span className={kategoriPengadaan ? "text-slate-900 font-semibold" : "text-slate-400"}>
                {kategoriPengadaan || "Pilih kategori pengadaan..."}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isKategoriPengadaanOpen ? "rotate-180" : ""}`} />
            </div>

            {/* Popover Dropdown Searchable Select Kategori Pengadaan */}
            {isKategoriPengadaanOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsKategoriPengadaanOpen(false)}
                />
                <div className="absolute left-0 right-0 mt-1.5 rounded-xl bg-white shadow-xl border border-slate-200/90 z-50 p-2 text-xs animate-in fade-in duration-100">
                  <div className="relative mb-2">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Cari Pengadaan / Harwat..."
                      value={kategoriPengadaanSearch}
                      onChange={(e) => setKategoriPengadaanSearch(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                    />
                  </div>

                  <div className="max-h-52 overflow-y-auto space-y-0.5">
                    {filteredKategoriPengadaanOptions.length === 0 ? (
                      <div className="py-3 text-center text-slate-400 text-[11px]">
                        Tidak ada opsi yang cocok.
                        <button
                          type="button"
                          onClick={() => {
                            setKategoriPengadaan(kategoriPengadaanSearch.trim());
                            setIsKategoriPengadaanOpen(false);
                            setKategoriPengadaanSearch("");
                          }}
                          className="block mx-auto mt-1 font-bold text-blue-600 hover:underline"
                        >
                          Gunakan "{kategoriPengadaanSearch.trim()}"
                        </button>
                      </div>
                    ) : (
                      filteredKategoriPengadaanOptions.map((opt) => (
                        <div
                          key={opt}
                          onClick={() => {
                            setKategoriPengadaan(opt);
                            setIsKategoriPengadaanOpen(false);
                            setKategoriPengadaanSearch("");
                          }}
                          className={`px-3 py-2 rounded-lg cursor-pointer transition flex items-center justify-between font-semibold ${
                            kategoriPengadaan === opt
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>{opt}</span>
                          {kategoriPengadaan === opt && (
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
            <DatePicker
              value={tanggalDokumen}
              onChange={(dateStr) => {
                setTanggalDokumen(dateStr);
                if (formErrors.tanggal_dokumen) setFormErrors((prev) => ({ ...prev, tanggal_dokumen: undefined }));
              }}
              placeholder="Pilih tanggal dokumen..."
              hasError={Boolean(formErrors.tanggal_dokumen)}
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
            <DatePicker
              value={tanggalDiterima}
              onChange={(dateStr) => {
                setTanggalDiterima(dateStr);
                if (formErrors.tanggal_diterima) setFormErrors((prev) => ({ ...prev, tanggal_diterima: undefined }));
              }}
              placeholder="Pilih tanggal diterima..."
              hasError={Boolean(formErrors.tanggal_diterima)}
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
                  <DatePicker
                    value={item.tanggal}
                    onChange={(dateStr) =>
                      handleUpdateDocField(item.id, "tanggal", dateStr)
                    }
                    placeholder="Pilih tanggal..."
                    hasError={Boolean(formErrors.supporting_doc_items?.[item.id]?.tanggal)}
                  />
                  {formErrors.supporting_doc_items?.[item.id]?.tanggal && (
                    <p className="text-[10px] text-red-500 font-semibold mt-1">
                      {formErrors.supporting_doc_items[item.id].tanggal}
                    </p>
                  )}
                </div>
              </div>

              {/* Field Input Metadata Lengkap (Plaintext) Hasil Ekstraksi VeriText */}
              <div className="space-y-3.5 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Metadata Dokumen Pendukung (Plaintext)</span>
                  {item.metadata && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Terisi Otomatis via VeriText OCR
                    </span>
                  )}
                </div>

                {/* Baris 1: Nomor PO/SPK, Nilai/Grand Total, Pihak Eksternal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor PO / SPK
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: SP-1177/I/2024"
                      value={item.nomor_spk || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "nomor_spk", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Grand Total / Nilai Nominal (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-[11px] font-bold text-slate-400">Rp</span>
                      <input
                        type="text"
                        placeholder="Contoh: 134.259.000"
                        value={
                          item.nilai_pembayaran
                            ? new Intl.NumberFormat("id-ID").format(Number(item.nilai_pembayaran))
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^0-9]/g, "");
                          handleUpdateDocField(item.id, "nilai_pembayaran", raw ? Number(raw) : 0);
                        }}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Pihak Eksternal / Perusahaan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT Asia Sistem Indonesia"
                      value={item.nama_perusahaan || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "nama_perusahaan", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Baris 2: Project Title / Uraian & Terbilang */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Project Title / Uraian Pekerjaan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pemeliharaan dan Perawatan Jaringan Dokumentasi..."
                      value={item.uraian || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "uraian", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Terbilang
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Seratus Tiga Puluh Empat Juta..."
                      value={item.terbilang || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "terbilang", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Baris 3: Rekening Pembayaran (Bank Name, Acc Number, Acc Name) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Bank (Please Remit)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Bank Permata"
                      value={item.bank_name || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "bank_name", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 971.102.012"
                      value={item.bank_account || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "bank_account", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Atas Nama (Acc Name)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: PT. ASIA SISTEM INDONESIA"
                      value={item.bank_holder || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "bank_holder", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                </div>

                {/* Baris 4: Unit/PPK Tujuan (Bill to) & Penandatangan (Approved by) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tujuan Penagihan (Bill To)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: BADAN INTELIJEN NEGARA"
                      value={item.unit_kerja || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "unit_kerja", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Penandatangan (Approved By)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Rizky Detha"
                      value={item.penandatangan || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "penandatangan", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jabatan Penandatangan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Direktur"
                      value={item.jabatan_penandatangan || ""}
                      onChange={(e) =>
                        handleUpdateDocField(item.id, "jabatan_penandatangan", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
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
                      accept=".pdf,.docx,.doc,.xlsx,.xls,.png,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileChangeWithVeriText(item.id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>

                  {/* Tombol Hapus Upload VeriText (Mengosongkan Berkas & Reset Field Metadata yang Terisi) */}
                  {(item.file || item.existing_file_name || item.nomor_dokumen || item.nilai_pembayaran) && (
                    <button
                      type="button"
                      onClick={() => handleClearVeriTextUpload(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-2xs cursor-pointer"
                      title="Hapus berkas dan bersihkan seluruh metadata dokumen ini"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus VeriText</span>
                    </button>
                  )}

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

                {/* ANIMASI SCANNER VERITEXT CANGGIH & UI/UX MODERN */}
                {extractingDocId === item.id && (
                  <div className="mt-3.5 relative overflow-hidden rounded-2xl border-2 border-blue-500/70 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-4 shadow-xl">
                    {/* Laser Scanner Bar yang bergerak naik-turun */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent blur-[1px] animate-[bounce_2s_infinite]"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-blue-500/10 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative p-2.5 rounded-xl bg-blue-600/40 border border-blue-400/40 text-cyan-300 shadow-inner">
                          <ScanLine className="h-6 w-6 animate-pulse" />
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-cyan-300 tracking-wider uppercase">
                              VERITEXT OCR ENGINE ACTIVE
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-[10px] font-bold text-cyan-200 border border-cyan-400/30">
                              AI Scanning...
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Memindai struktur dokumen, mengekstrak Nomor Surat, Tanggal, Nominal, dan Pihak Penyedia...
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <div className="h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[11px] font-bold text-cyan-300 animate-pulse">Mengisi Form Otomatis</span>
                      </div>
                    </div>
                  </div>
                )}

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="text-xs">
          {uploadedFilesCount < 3 ? (
            <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Wajib upload minimal 3 dokumen pendukung ({uploadedFilesCount}/3 terunggah)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Syarat minimal 3 dokumen pendukung terpenuhi ({uploadedFilesCount} berkas)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={isSaveDisabled}
            onClick={() => handleSubmitForm("draft")}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-md ${
              isSaveDisabled
                ? "bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 cursor-pointer"
            }`}
            title={
              uploadedFilesCount < 3
                ? `Tombol simpan dinonaktifkan: Anda harus mengunggah minimal 3 dokumen pendukung (${uploadedFilesCount}/3)`
                : "Simpan dokumen pembayaran"
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Simpan</span>
          </button>
        </div>
      </div>

      {/* AlertDialog Konfirmasi Hapus Dokumen Pendukung dari Database Backend */}
      <AlertDialog
        isOpen={Boolean(docToDeleteItem)}
        title="Hapus Dokumen Pendukung dari Database"
        description={`Berkas "${docToDeleteItem?.jenis_dokumen || "Dokumen Pendukung"}${docToDeleteItem?.nomor_dokumen ? ` (${docToDeleteItem.nomor_dokumen})` : ""}" telah tersimpan di database. Apakah Anda yakin ingin menghapus berkas ini secara permanen dari database?`}
        confirmText={isDeletingFromDb ? "Menghapus..." : "Ya, Hapus Permanen"}
        cancelText="Batal"
        variant="danger"
        onConfirm={confirmDeleteSupportingDoc}
        onCancel={() => setDocToDeleteItem(null)}
      />

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
