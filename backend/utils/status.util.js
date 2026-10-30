/**
 * Status Dokumen & Legenda Mapping
 */
const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'slate' },
  submit_dokumen: { label: 'Submit Dokumen', color: 'amber' },
  menunggu_verifikasi: { label: 'Submit Dokumen', color: 'amber' },
  review: { label: 'Review', color: 'blue' },
  sedang_diverifikasi: { label: 'Review', color: 'blue' },
  ditolak: { label: 'Ditolak', color: 'red' },
  dikembalikan: { label: 'Ditolak', color: 'red' },
  pengajuan_ulang: { label: 'Pengajuan Ulang', color: 'orange' },
  menunggu_verifikasi_ulang: { label: 'Pengajuan Ulang', color: 'orange' },
  disetujui: { label: 'Disetujui', color: 'emerald' },
  lengkap_valid: { label: 'Disetujui', color: 'emerald' },
  selesai: { label: 'Selesai', color: 'emerald' },
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
