// Schema Validasi Filter & Export Laporan Dokumen SIPANDA (Frontend)

export interface ReportFilterInput {
  startDate: string;
  endDate: string;
  statusFilter?: string;
}

export interface ReportFilterErrors {
  startDate?: string;
  endDate?: string;
}

/**
 * Validasi parameter filter laporan sebelum melakukan ekspor Excel / PDF
 */
export const validateReportExportFilter = (
  input: ReportFilterInput
): { isValid: boolean; errors: ReportFilterErrors } => {
  const errors: ReportFilterErrors = {};

  // 1. Validasi Tanggal Awal wajib diisi
  if (!input.startDate || !input.startDate.trim()) {
    errors.startDate = "Tanggal awal wajib diisi untuk melakukan ekspor laporan!";
  }

  // 2. Validasi Tanggal Akhir wajib diisi
  if (!input.endDate || !input.endDate.trim()) {
    errors.endDate = "Tanggal akhir wajib diisi untuk melakukan ekspor laporan!";
  }

  // 3. Validasi Logika Rentang Tanggal (Dua Arah)
  if (input.startDate && input.endDate) {
    if (input.startDate > input.endDate) {
      errors.startDate = "Tanggal awal tidak boleh lebih besar dari tanggal akhir!";
      errors.endDate = "Tanggal akhir tidak boleh lebih kecil dari tanggal awal!";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
