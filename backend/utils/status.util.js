/**
 * Status Dokumen & Legenda Mapping
 */
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'slate' },
  menunggu_verifikasi: { label: 'Menunggu Verifikasi', color: 'amber' },
  sedang_diverifikasi: { label: 'Sedang Diverifikasi', color: 'blue' },
  dikembalikan: { label: 'Dikembalikan untuk Perbaikan', color: 'red' },
  menunggu_verifikasi_ulang: { label: 'Menunggu Verifikasi Ulang', color: 'orange' },
  lengkap_valid: { label: 'Lengkap / Valid (Disetujui)', color: 'emerald' },
  sedang_diproses: { label: 'Sedang Diproses', color: 'blue' },
  pengajuan_kppn: { label: 'Pengajuan ke KPPN', color: 'indigo' },
  menunggu_pencairan: { label: 'Menunggu Pencairan', color: 'amber' },
  dana_cair: { label: 'Dana Cair', color: 'green' },
  siap_digunakan: { label: 'Siap Digunakan', color: 'emerald' },
};

function getLegendForStatus(status) {
  return STATUS_CONFIG[status] || { label: status, color: 'blue' };
}

module.exports = {
  STATUS_CONFIG,
  getLegendForStatus,
};
