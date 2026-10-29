// Schema Validasi Pendaftaran & Input Dokumen Pembayaran SIPANDU (Frontend)

export interface SupportingDocumentInput {
  id: string;
  jenis_dokumen: string;
  nomor_dokumen: string;
  tanggal: string;
  file: File | null;
  nilai_pembayaran?: string | number;
  uraian?: string;
  nama_perusahaan?: string;
  params?: Record<string, string>;
  metadata?: any;
  existing_file_name?: string | null;
  existing_file_path?: string | null;
  existing_attachment_id?: number | null;
}

export interface DocumentFormInput {
  nomor_surat: string;
  jenis_dokumen: string;
  kategori_pengadaan?: string;
  perihal: string;
  tanggal_dokumen: string;
  tanggal_diterima: string;
  pihak_eksternal: string;
  unit_kerja: string;
  ppk_name?: string;
  nilai_pembayaran: string | number;
  keterangan?: string;
  supporting_docs?: SupportingDocumentInput[];
  is_edit_mode?: boolean;
  is_rejected?: boolean;
  catatan_perbaikan?: string;
}

export interface SupportingDocItemError {
  jenis_dokumen?: string;
  nomor_dokumen?: string;
  tanggal?: string;
  file?: string;
}

export interface DocumentValidationError {
  nomor_surat?: string;
  jenis_dokumen?: string;
  perihal?: string;
  tanggal_dokumen?: string;
  tanggal_diterima?: string;
  pihak_eksternal?: string;
  unit_kerja?: string;
  ppk_name?: string;
  nilai_pembayaran?: string;
  keterangan?: string;
  catatan_perbaikan?: string;
  supporting_docs?: string;
  supporting_doc_items?: Record<string, SupportingDocItemError>;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: DocumentValidationError;
  firstError?: string;
}

export const documentValidationSchema = {
  // Aturan Validasi Nomor Dokumen / Surat (Wajib)
  validateNomorSurat: (nomorSurat: string): string | null => {
    if (!nomorSurat || !nomorSurat.trim()) {
      return "Nomor Surat / Nomor Dokumen wajib diisi!";
    }
    const clean = nomorSurat.trim();
    if (clean.length < 3) {
      return "Nomor Dokumen minimal 3 karakter!";
    }
    if (clean.length > 100) {
      return "Nomor Dokumen maksimal 100 karakter!";
    }
    return null;
  },

  // Aturan Validasi Jenis Dokumen (Wajib)
  validateJenisDokumen: (jenisDokumen: string): string | null => {
    if (!jenisDokumen || !jenisDokumen.trim()) {
      return "Jenis Dokumen wajib dipilih atau diisi!";
    }
    if (jenisDokumen.trim().length > 100) {
      return "Jenis Dokumen maksimal 100 karakter!";
    }
    return null;
  },

  // Aturan Validasi Perihal (Wajib)
  validatePerihal: (perihal: string): string | null => {
    if (!perihal || !perihal.trim()) {
      return "Perihal wajib diisi!";
    }
    if (perihal.trim().length < 3) {
      return "Perihal minimal 3 karakter!";
    }
    if (perihal.length > 255) {
      return "Perihal maksimal 255 karakter!";
    }
    return null;
  },

  // Aturan Validasi Tanggal Dokumen (Wajib)
  validateTanggalDokumen: (tanggal: string): string | null => {
    if (!tanggal || !tanggal.trim()) {
      return "Tanggal Dokumen wajib diisi!";
    }
    if (isNaN(Date.parse(tanggal))) {
      return "Format tanggal dokumen tidak valid!";
    }
    return null;
  },

  // Aturan Validasi Tanggal Diterima (Wajib)
  validateTanggalDiterima: (tanggal: string): string | null => {
    if (!tanggal || !tanggal.trim()) {
      return "Tanggal Diterima wajib diisi!";
    }
    if (isNaN(Date.parse(tanggal))) {
      return "Format tanggal diterima tidak valid!";
    }
    return null;
  },

  // Aturan Validasi Pihak Eksternal (Wajib)
  validatePihakEksternal: (pihak: string): string | null => {
    if (!pihak || !pihak.trim()) {
      return "Pihak Eksternal wajib diisi!";
    }
    if (pihak.trim().length < 2) {
      return "Nama pihak eksternal minimal 2 karakter!";
    }
    if (pihak.trim().length > 150) {
      return "Nama pihak eksternal maksimal 150 karakter!";
    }
    return null;
  },

  // Aturan Validasi Unit / PPK (Wajib)
  validateUnitKerja: (unit: string): string | null => {
    if (!unit || !unit.trim()) {
      return "Unit / PPK wajib dipilih!";
    }
    if (unit.trim().length > 150) {
      return "Unit / PPK maksimal 150 karakter!";
    }
    return null;
  },

  // Aturan Validasi Nilai Pembayaran (Wajib, angka positif)
  validateNilaiPembayaran: (nilai: string | number): string | null => {
    if (nilai === undefined || nilai === null || nilai === "" || String(nilai).trim() === "") {
      return "Nilai Pembayaran (Rp) wajib diisi!";
    }
    // Jika berupa format rupiah string (misal: "1.500.000")
    const cleanNumber = typeof nilai === "string" ? nilai.replace(/[^0-9]/g, "") : String(nilai);
    if (!cleanNumber) {
      return "Nilai Pembayaran wajib diisi dengan angka valid!";
    }
    const numericValue = Number(cleanNumber);
    if (isNaN(numericValue)) {
      return "Nilai pembayaran harus berupa angka valid!";
    }
    if (numericValue <= 0) {
      return "Nilai pembayaran harus lebih besar dari 0!";
    }
    return null;
  },

  // Aturan Validasi Keterangan (Opsional)
  validateKeterangan: (keterangan?: string): string | null => {
    if (!keterangan || !keterangan.trim()) return null; // Opsional
    if (keterangan.length > 1000) {
      return "Keterangan maksimal 1000 karakter!";
    }
    return null;
  },

  // Aturan Validasi Dokumen Pendukung:
  // - Pada Edit Mode: jika file sebelumnya sudah ada di database (existing_file_name/existing_file_path), upload file tidak wajib!
  // - Validasi Dokumen Pendukung (VeriText Dinamis):
  //   Input statis Jenis Dokumen, Nomor Dokumen, dan Tanggal Dokumen pada dokumen pendukung telah dihapus karena diekstrak otomatis via VeriText ke dalam params JSON.
  //   Oleh sebab itu, validasi dokumen pendukung hanya memeriksa ketersediaan berkas (minimal 3 berkas pendukung diunggah).
  validateSupportingDocs: (
    docs?: SupportingDocumentInput[],
    requireAtLeastOne = true,
    isEditMode = false
  ): { summaryError: string | null; itemErrors: Record<string, SupportingDocItemError> } => {
    const itemErrors: Record<string, SupportingDocItemError> = {};

    if (!docs || docs.length === 0) {
      return {
        summaryError: "Pengajuan dokumen harus memiliki minimal 3 dokumen pendukung!",
        itemErrors,
      };
    }

    // Cek minimal 3 dokumen pendukung yang memiliki file
    const validUploadedDocs = docs.filter(
      (d) => Boolean(d.file || d.existing_file_name || d.existing_file_path)
    );

    if (requireAtLeastOne && !isEditMode && validUploadedDocs.length < 3) {
      docs.forEach((doc, idx) => {
        const hasFile = Boolean(doc.file || doc.existing_file_name || doc.existing_file_path);
        if (!hasFile && idx < 3) {
          itemErrors[doc.id] = {
            file: "File lampiran wajib diunggah!",
          };
        }
      });

      return {
        summaryError: `Wajib mengunggah minimal 3 dokumen pendukung (saat ini baru ${validUploadedDocs.length} berkas yang diunggah)!`,
        itemErrors,
      };
    }

    return { summaryError: null, itemErrors };
  },

  // Validasi Form Penuh Berdasarkan Schema
  validate: (
    data: DocumentFormInput,
    status: "draft" | "menunggu_verifikasi" = "menunggu_verifikasi"
  ): DocumentValidationResult => {
    const errors: DocumentValidationError = {};

    const nomorSuratErr = documentValidationSchema.validateNomorSurat(data.nomor_surat);
    if (nomorSuratErr) errors.nomor_surat = nomorSuratErr;

    const jenisDokumenErr = documentValidationSchema.validateJenisDokumen(data.jenis_dokumen);
    if (jenisDokumenErr) errors.jenis_dokumen = jenisDokumenErr;

    const perihalErr = documentValidationSchema.validatePerihal(data.perihal);
    if (perihalErr) errors.perihal = perihalErr;

    const tanggalDokErr = documentValidationSchema.validateTanggalDokumen(data.tanggal_dokumen);
    if (tanggalDokErr) errors.tanggal_dokumen = tanggalDokErr;

    const tanggalTerimaErr = documentValidationSchema.validateTanggalDiterima(data.tanggal_diterima);
    if (tanggalTerimaErr) errors.tanggal_diterima = tanggalTerimaErr;

    const pihakEksternalErr = documentValidationSchema.validatePihakEksternal(data.pihak_eksternal);
    if (pihakEksternalErr) errors.pihak_eksternal = pihakEksternalErr;

    const unitKerjaErr = documentValidationSchema.validateUnitKerja(data.unit_kerja);
    if (unitKerjaErr) errors.unit_kerja = unitKerjaErr;

    const nilaiErr = documentValidationSchema.validateNilaiPembayaran(data.nilai_pembayaran);
    if (nilaiErr) errors.nilai_pembayaran = nilaiErr;

    const ketErr = documentValidationSchema.validateKeterangan(data.keterangan);
    if (ketErr) errors.keterangan = ketErr;

    // Jika status dokumen ditolak (dikembalikan / revisi), Penjelasan Catatan Perbaikan PPK wajib diisi minimal 5 karakter
    if (data.is_rejected) {
      if (!data.catatan_perbaikan || !data.catatan_perbaikan.trim()) {
        errors.catatan_perbaikan = "Penjelasan Catatan Perbaikan PPK wajib diisi jika dokumen direvisi/ditolak!";
      } else if (data.catatan_perbaikan.trim().length < 5) {
        errors.catatan_perbaikan = "Penjelasan Catatan Perbaikan PPK minimal 5 karakter!";
      }
    }

    const requireFile = status === "menunggu_verifikasi";
    const docsValidation = documentValidationSchema.validateSupportingDocs(
      data.supporting_docs,
      requireFile,
      Boolean(data.is_edit_mode)
    );

    if (docsValidation.summaryError) {
      errors.supporting_docs = docsValidation.summaryError;
    }
    if (Object.keys(docsValidation.itemErrors).length > 0) {
      errors.supporting_doc_items = docsValidation.itemErrors;
    }

    const errorKeys = Object.keys(errors) as (keyof DocumentValidationError)[];
    const isValid = errorKeys.length === 0;
    const firstError = !isValid ? (errors[errorKeys[0]] as string) : undefined;

    return {
      isValid,
      errors,
      firstError,
    };
  },
};

// ==========================================
// SCHEMA VALIDASI VERIFIKASI DOKUMEN (BIRO 01)
// ==========================================

export interface VerifyDocumentInput {
  action: "approve" | "reject";
  pesan?: string;
}

export interface VerifyDocumentValidationResult {
  isValid: boolean;
  error?: string;
}

export const verifyDocumentSchema = {
  validate: (input: VerifyDocumentInput): VerifyDocumentValidationResult => {
    // Jika aksi adalah tolak / reject (decline), catatan wajib diisi
    if (input.action === "reject") {
      if (!input.pesan || !input.pesan.trim()) {
        return {
          isValid: false,
          error: "Catatan atau alasan penolakan wajib diisi untuk mengembalikan dokumen!",
        };
      }
      if (input.pesan.trim().length < 5) {
        return {
          isValid: false,
          error: "Catatan penolakan terlalu singkat. Harap berikan penjelasan minimal 5 karakter.",
        };
      }
    }

    // Jika setuju / approve, catatan bersifat opsional
    return {
      isValid: true,
    };
  },
};

// ==========================================
// SCHEMA VALIDASI REVISI DOKUMEN (PETUGAS / PPK)
// ==========================================

export interface RevisiSupportingDocItem {
  id: string;
  jenis_dokumen: string;
  nomor_dokumen: string;
  tanggal: string;
  file: File | null;
}

export interface RevisiDocumentInput {
  catatan_perbaikan: string;
  supporting_docs?: RevisiSupportingDocItem[];
  files?: File[];
}

export interface RevisiDocumentValidationResult {
  isValid: boolean;
  errors: {
    catatan_perbaikan?: string;
    supporting_docs?: string;
    item_errors?: Record<string, { jenis_dokumen?: string; nomor_dokumen?: string; tanggal?: string; file?: string }>;
    files?: string;
  };
  firstError?: string;
}

export const revisiDocumentSchema = {
  validate: (input: RevisiDocumentInput): RevisiDocumentValidationResult => {
    const errors: RevisiDocumentValidationResult["errors"] = {};
    const item_errors: Record<string, { jenis_dokumen?: string; nomor_dokumen?: string; tanggal?: string; file?: string }> = {};

    if (!input.catatan_perbaikan || !input.catatan_perbaikan.trim()) {
      errors.catatan_perbaikan = "Penjelasan catatan perbaikan wajib diisi!";
    } else if (input.catatan_perbaikan.trim().length < 5) {
      errors.catatan_perbaikan = "Penjelasan catatan perbaikan minimal 5 karakter.";
    }

    if (input.supporting_docs && input.supporting_docs.length > 0) {
      input.supporting_docs.forEach((doc, idx) => {
        const itemErr: { jenis_dokumen?: string; nomor_dokumen?: string; tanggal?: string; file?: string } = {};
        
        if (!doc.jenis_dokumen || !doc.jenis_dokumen.trim()) {
          itemErr.jenis_dokumen = `Jenis dokumen wajib diisi`;
        }
        if (!doc.nomor_dokumen || !doc.nomor_dokumen.trim()) {
          itemErr.nomor_dokumen = `Nomor dokumen wajib diisi`;
        }
        if (!doc.tanggal || !doc.tanggal.trim()) {
          itemErr.tanggal = `Tanggal dokumen wajib diisi`;
        }
        if (!doc.file) {
          itemErr.file = `File berkas wajib diunggah`;
        } else if (doc.file.size > 25 * 1024 * 1024) {
          itemErr.file = `Ukuran file melebihi 25 MB`;
        }

        if (Object.keys(itemErr).length > 0) {
          item_errors[doc.id] = itemErr;
        }
      });

      if (Object.keys(item_errors).length > 0) {
        errors.item_errors = item_errors;
      }
    }

    if (input.files && input.files.length > 0) {
      for (const file of input.files) {
        if (file.size > 25 * 1024 * 1024) {
          errors.files = `Ukuran file '${file.name}' melebihi batas maksimal 25 MB!`;
          break;
        }
      }
    }

    const hasItemErrors = Object.keys(item_errors).length > 0;
    const isValid = !errors.catatan_perbaikan && !errors.files && !hasItemErrors;
    const firstError = errors.catatan_perbaikan || (hasItemErrors ? "Mohon lengkapi semua isian dokumen perbaikan yang ditambahkan!" : errors.files);

    return {
      isValid,
      errors,
      firstError,
    };
  },
};

// Schema Validasi Rentang Tanggal Filter Dokumen (Daftar Dokumen & Dokumen Pendukung)
export interface DateRangeFilterInput {
  startDate: string;
  endDate: string;
}

export interface DateRangeFilterErrors {
  startDate?: string;
  endDate?: string;
}

export const dateRangeFilterSchema = {
  validate: (
    input: DateRangeFilterInput
  ): { isValid: boolean; errors: DateRangeFilterErrors } => {
    const errors: DateRangeFilterErrors = {};

    // Validasi format tanggal YYYY-MM-DD jika diisi
    const isValidFormat = (val: string) => /^\d{4}-\d{2}-\d{2}$/.test(val);

    if (input.startDate && !isValidFormat(input.startDate)) {
      errors.startDate = "Format tanggal mulai tidak valid (YYYY-MM-DD)!";
    }

    if (input.endDate && !isValidFormat(input.endDate)) {
      errors.endDate = "Format tanggal akhir tidak valid (YYYY-MM-DD)!";
    }

    // Validasi logika rentang tanggal jika kedua tanggal terisi
    if (input.startDate && input.endDate && isValidFormat(input.startDate) && isValidFormat(input.endDate)) {
      if (input.startDate > input.endDate) {
        errors.startDate = "Tanggal mulai tidak boleh melebihi tanggal akhir!";
        errors.endDate = "Tanggal akhir tidak boleh mendahului tanggal mulai!";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
