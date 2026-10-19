const documentRepository = require('../repositories/document.repository');

class MonitoringService {
  async getStats() {
    const documents = await documentRepository.findAll();

    const total = documents.length;
    const menunggu = documents.filter(d => d.status === 'menunggu_verifikasi').length;
    const diverifikasi = documents.filter(d => d.status === 'sedang_diverifikasi').length;
    const dikembalikan = documents.filter(d => d.status === 'dikembalikan').length;
    const revisiUlang = documents.filter(d => d.status === 'menunggu_verifikasi_ulang').length;
    const lengkapValid = documents.filter(d => d.status === 'lengkap_valid').length;
    const sedangDiproses = documents.filter(d => d.status === 'sedang_diproses').length;
    const pengajuanKPPN = documents.filter(d => d.status === 'pengajuan_kppn').length;
    const menungguPencairan = documents.filter(d => d.status === 'menunggu_pencairan').length;
    const danaCair = documents.filter(d => d.status === 'dana_cair').length;
    const totalNilai = documents.reduce((sum, d) => sum + (Number(d.nilai_pembayaran) || 0), 0);

    return {
      total,
      menunggu,
      diverifikasi,
      dikembalikan,
      revisiUlang,
      lengkapValid,
      sedangDiproses,
      pengajuanKPPN,
      menungguPencairan,
      danaCair,
      totalNilai,
      aging: {
        '0-3 hari': 2,
        '4-7 hari': 1,
        '8-14 hari': 1,
        '>14 hari': 0,
      },
    };
  }
}

module.exports = new MonitoringService();
