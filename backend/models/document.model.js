const { getLegendForStatus } = require('../utils/status.util');

class PaymentDocument {
  constructor({
    id,
    nomor_surat,
    nomor_agenda,
    nama_kegiatan,
    kategori = 'LS-Kontraktual',
    ppk_name,
    unit_kerja,
    nilai_pembayaran = 0,
    tanggal_pengajuan = new Date().toISOString().split('T')[0],
    
    // Field baru sesuai form & view gambar
    jenis_dokumen = '',
    perihal = '',
    tanggal_dokumen = null,
    tanggal_diterima = new Date().toISOString().split('T')[0],
    pihak_eksternal = '',
    keterangan = '',

    bast_generated = false,
    bap_generated = false,
    bapp_generated = false,
    official_docs_data = {},
    status = 'menunggu_verifikasi',
    catatan_revisi = '',
    catatan_verifikasi = '',
    tanggal_verifikasi = null,
    verified_by_name = null,
    attachments = [],
    created_at = new Date().toISOString(),
    updated_at = new Date().toISOString(),
  }) {
    this.id = id;
    this.nomor_surat = nomor_surat;
    this.nomor_agenda = nomor_agenda || `AGD-${Date.now().toString().slice(-4)}`;
    this.nama_kegiatan = nama_kegiatan || perihal || '-';
    this.kategori = kategori || jenis_dokumen || 'LS-Kontraktual';
    this.ppk_name = ppk_name;
    this.unit_kerja = unit_kerja;
    this.nilai_pembayaran = Number(nilai_pembayaran) || 0;
    this.tanggal_pengajuan = tanggal_pengajuan;

    this.jenis_dokumen = jenis_dokumen;
    this.perihal = perihal;
    this.tanggal_dokumen = tanggal_dokumen;
    this.tanggal_diterima = tanggal_diterima;
    this.pihak_eksternal = pihak_eksternal;
    this.keterangan = keterangan;

    this.status = status;
    this.bast_generated = Boolean(bast_generated);
    this.bap_generated = Boolean(bap_generated);
    this.bapp_generated = Boolean(bapp_generated);
    this.official_docs_data = official_docs_data || {};
    this.catatan_revisi = catatan_revisi;
    this.catatan_verifikasi = catatan_verifikasi;
    this.tanggal_verifikasi = tanggal_verifikasi;
    this.verified_by_name = verified_by_name;
    this.attachments = attachments;
    this.created_at = created_at;
    this.updated_at = updated_at;

    const legend = getLegendForStatus(status);
    this.legend_status = legend.label;
    this.legend_color = legend.color;
  }
}

module.exports = PaymentDocument;
