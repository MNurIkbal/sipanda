// Schema Validasi Master Data (Unit & Jenis Dokumen) - Frontend

export interface MasterFormInput {
  nama: string;
  keterangan?: string;
}

export interface MasterFormErrors {
  nama?: string;
  keterangan?: string;
}

export interface MasterValidationResult {
  isValid: boolean;
  errors: MasterFormErrors;
  firstError?: string;
}

export const masterValidationSchema = {
  // Validasi Nama Master Data (Unit / Jenis Dokumen)
  validateNama: (
    nama: string,
    entityName = "Nama data",
    existingList: { id: number; nama: string }[] = [],
    currentId?: number
  ): string | null => {
    if (!nama || !nama.trim()) {
      return `${entityName} wajib diisi!`;
    }

    const clean = nama.trim();

    if (clean.length < 3) {
      return `${entityName} minimal 3 karakter!`;
    }

    if (clean.length > 150) {
      return `${entityName} maksimal 150 karakter!`;
    }

    // Aturan validasi: Nama TIDAK BOLEH SAMA / Duplikat (case-insensitive)
    const isDuplicate = existingList.some(
      (item) =>
        item.nama.trim().toLowerCase() === clean.toLowerCase() &&
        (currentId ? item.id !== currentId : true)
    );

    if (isDuplicate) {
      return `${entityName} "${clean}" sudah terdaftar! Nama tidak boleh sama.`;
    }

    return null;
  },

  // Validasi Keterangan (opsional, maks 255 karakter)
  validateKeterangan: (keterangan?: string): string | null => {
    if (!keterangan || !keterangan.trim()) return null;
    if (keterangan.trim().length > 255) {
      return "Keterangan maksimal 255 karakter!";
    }
    return null;
  },

  // Evaluasi Form Penuh
  validate: (
    input: MasterFormInput,
    entityName: "Nama Unit" | "Nama Jenis Dokumen",
    existingList: { id: number; nama: string }[] = [],
    currentId?: number
  ): MasterValidationResult => {
    const errors: MasterFormErrors = {};

    const namaError = masterValidationSchema.validateNama(
      input.nama,
      entityName,
      existingList,
      currentId
    );
    if (namaError) errors.nama = namaError;

    const keteranganError = masterValidationSchema.validateKeterangan(input.keterangan);
    if (keteranganError) errors.keterangan = keteranganError;

    const errorKeys = Object.keys(errors) as (keyof MasterFormErrors)[];
    const isValid = errorKeys.length === 0;
    const firstError = !isValid ? errors[errorKeys[0]] : undefined;

    return {
      isValid,
      errors,
      firstError,
    };
  },
};
