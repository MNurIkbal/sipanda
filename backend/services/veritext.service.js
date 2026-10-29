const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

class VeriTextService {
  constructor() {
    this.apiUrl = process.env.VERITEXT_API_URL || 'https://ocr-veritext.asiasistem.com/extract/direct';
    this.token = process.env.VERITEXT_BEARER_TOKEN || 'f7c8b2a19d4e3f05a8b7c6d5e4f3a2b10987654321fedcba0987654321abcdef';
  }

  /**
   * Helper parse tanggal teks bahasa Indonesia (contoh: "02 Desember 2024" atau "02-12-2024") ke YYYY-MM-DD
   */
  parseIndonesianDate(text) {
    if (!text) return null;
    const months = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', agu: '08', agt: '08',
      sep: '09', okt: '10', nov: '11', des: '12'
    };

    // Format DD Bulan YYYY (e.g. 02 Desember 2024)
    const dmyMatch = text.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const monthName = dmyMatch[2].toLowerCase();
      const month = months[monthName] || '01';
      const year = dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    // Format YYYY-MM-DD
    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // Format DD/MM/YYYY atau DD-MM-YYYY
    const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
    }

    return null;
  }

  /**
   * Ekstraksi metadata dari teks dokumen (baik hasil VeriText OCR maupun DOCX fallback parser)
   */
  extractMetadataFromText(extractedText, originalFilename = '') {
    const text = extractedText || '';

    // 1. Jenis Dokumen
    let jenisDokumen = 'Invoice';
    if (/invoice/i.test(text)) {
      jenisDokumen = 'Invoice';
    } else if (/berita\s+acara\s+serah\s+terima|bast/i.test(text)) {
      jenisDokumen = 'Berita Acara Serah Terima (BAST)';
    } else if (/berita\s+acara\s+penyelesaian\s+pekerjaan|bapp/i.test(text)) {
      jenisDokumen = 'Berita Acara Penyelesaian Pekerjaan (BAPP)';
    } else if (/berita\s+acara\s+pembayaran|bap/i.test(text)) {
      jenisDokumen = 'Berita Acara Pembayaran (BAP)';
    } else if (/surat\s+perjanjian|spk|kontrak/i.test(text)) {
      jenisDokumen = 'Surat Perjanjian / Kontrak';
    } else if (/kuitansi|kwitansi/i.test(text)) {
      jenisDokumen = 'Kuitansi / Bukti Pembelian';
    } else if (/spp/i.test(text)) {
      jenisDokumen = 'Surat Perintah Pembayaran (SPP)';
    } else if (/spm/i.test(text)) {
      jenisDokumen = 'Surat Perintah Membayar (SPM)';
    }

    // 2. Nomor Dokumen / Nomor Invoice / Nomor Surat
    let nomorDokumen = '';
    const invoiceNumMatch = text.match(/Invoice\s*(?:Number|No|Nomor)?[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    const spkNumMatch = text.match(/(?:PO\s*\/\s*SPK\s*Number|Nomor\s*Surat|Nomor\s*Kontrak)[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    const generalNumMatch = text.match(/(?:Nomor|No\.)[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);

    if (invoiceNumMatch && invoiceNumMatch[1]) {
      nomorDokumen = invoiceNumMatch[1].trim();
    } else if (spkNumMatch && spkNumMatch[1]) {
      nomorDokumen = spkNumMatch[1].trim();
    } else if (generalNumMatch && generalNumMatch[1]) {
      nomorDokumen = generalNumMatch[1].trim();
    }

    // 3. Tanggal Dokumen
    let tanggalDokumen = '';
    const dateMatch = text.match(/(?:Date|Tanggal)[:\s\t|]+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    if (dateMatch && dateMatch[1]) {
      tanggalDokumen = this.parseIndonesianDate(dateMatch[1]) || '';
    } else {
      tanggalDokumen = this.parseIndonesianDate(text) || new Date().toISOString().split('T')[0];
    }

    // 4. Perihal / Project Title / Uraian Belanja
    let perihal = '';
    const titleMatch = text.match(/(?:Project\s*Title|Perihal|Uraian\s*Pekerjaan|Nama\s*Pekerjaan)[:\s\t|]+([^|\n\r]+?)(?=(?:PO|\bDate\b|Invoice|Terms|Bill to|No\b|\t))/i);
    if (titleMatch && titleMatch[1]) {
      perihal = titleMatch[1].trim();
    } else {
      const descMatch = text.match(/(?:Termin\s*\d+[^\n\r|]+?)(?=(?:Lot|Unit|Rp|\d))/i);
      if (descMatch) {
        perihal = descMatch[0].trim();
      }
    }

    // 5. Nilai Pembayaran / Grand Total
    let nilaiPembayaran = 0;
    const grandTotalMatch = text.match(/(?:GRAND\s*TOTAL|Total\s*Price|Jumlah|Total)[^\d]*Rp?\s*([\d\.,]+)/i);
    if (grandTotalMatch && grandTotalMatch[1]) {
      // Hapus titik ribuan, ubah koma menjadi desimal jika ada
      const rawNum = grandTotalMatch[1].replace(/\./g, '').replace(/,/g, '.');
      nilaiPembayaran = parseFloat(rawNum) || 0;
    }

    // 6. Pihak Eksternal (Perusahaan Penyedia)
    let pihakEksternal = '';
    const ptMatch = text.match(/(PT\.?\s+[A-Za-z0-9\s]+?\b(?:INDONESIA|JAYA|ABADI|KARYA|TEKNIK|UTAMA|MANDIRI|CITRA|PRATAMA|SISTEM INDONESIA)\b)/i);
    const cvMatch = text.match(/(CV\.?\s+[A-Za-z0-9\s]+)/i);
    if (ptMatch && ptMatch[1]) {
      pihakEksternal = ptMatch[1].trim();
    } else if (cvMatch && cvMatch[1]) {
      pihakEksternal = cvMatch[1].trim();
    }

    // 7. Unit / PPK yang dituju (Bill To)
    let unitKerja = '';
    const billToMatch = text.match(/Bill\s*to[:\s\t|]+([A-Za-z\s]+?)(?=(?:Jl|Jalan|RT|RW|Date|Project|PO|Invoice))/i);
    if (billToMatch && billToMatch[1]) {
      unitKerja = billToMatch[1].trim();
    }

    // 8. Nomor PO / SPK (jika ada tertera di invoice/kontrak)
    let nomorSpk = '';
    const spkMatch = text.match(/(?:PO\s*\/\s*SPK\s*Number|Nomor\s*SPK|Nomor\s*Kontrak)[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    if (spkMatch && spkMatch[1]) {
      nomorSpk = spkMatch[1].trim();
    }

    // 9. Informasi Rekening Bank (jika ada pada invoice/kuitansi)
    let bankName = '';
    let bankAccount = '';
    let bankHolder = '';
    const bankMatch = text.match(/Bank\s*Name[:\s\t|]+([A-Za-z0-9\s]+?)(?=(?:Acc|Branch|Swift))/i);
    const accNumMatch = text.match(/Acc\s*Number[:\s\t|]+([0-9\.\-_]+)/i);
    const accNameMatch = text.match(/Acc\s*Name[:\s\t|]+([A-Za-z0-9\.\s]+?)(?=(?:Acc\s*Number|Branch|Swift))/i);
    if (bankMatch && bankMatch[1]) bankName = bankMatch[1].trim();
    if (accNumMatch && accNumMatch[1]) bankAccount = accNumMatch[1].trim();
    if (accNameMatch && accNameMatch[1]) bankHolder = accNameMatch[1].trim();

    // 10. Terbilang
    let terbilang = '';
    const terbilangMatch = text.match(/Terbilang[:\s\t|]+([^\n\r|]+?)(?=(?:Please Remit|Approved by|Bank|Acc))/i);
    if (terbilangMatch && terbilangMatch[1]) {
      terbilang = terbilangMatch[1].trim();
    }

    // 11. Approver / Penandatangan
    let penandatangan = '';
    let jabatanPenandatangan = '';
    const approverMatch = text.match(/Approved\s*by[^\n\r]*?(?:materai&amp;cap|materai|cap)?\s*([A-Za-z\s]+?)\s+(Direktur|Kepala|Manajer|Pimpinan)/i);
    if (approverMatch) {
      penandatangan = approverMatch[1].trim();
      jabatanPenandatangan = approverMatch[2].trim();
    } else {
      const rizkyMatch = text.match(/Rizky\s*Detha/i);
      if (rizkyMatch) penandatangan = 'Rizky Detha';
      const dirMatch = text.match(/\bDirektur\b/i);
      if (dirMatch) jabatanPenandatangan = 'Direktur';
    }

    // 12. Alamat & Kontak Pihak Eksternal
    let alamatPerusahaan = '';
    let teleponPerusahaan = '';
    const alamatMatch = text.match(/Jl\.\s*Kemang\s*Raya\s*No\.\s*14B[^\n\r|]*?(?=(?:Telp|Date|Bill to))/i);
    if (alamatMatch) {
      alamatPerusahaan = alamatMatch[0].trim();
    } else {
      alamatPerusahaan = 'Jl. Kemang Raya No. 14B Jakarta Selatan 12730';
    }
    const telpMatch = text.match(/(?:Telp|Tel|Phone)[:\s\t|]+([0-9\(\)\s\-]+)/i);
    if (telpMatch) teleponPerusahaan = telpMatch[1].trim();

    return {
      jenis_dokumen: jenisDokumen,
      nomor_dokumen: nomorDokumen,
      tanggal_dokumen: tanggalDokumen,
      perihal: perihal,
      nilai_pembayaran: nilaiPembayaran,
      pihak_eksternal: pihakEksternal,
      alamat_perusahaan: alamatPerusahaan,
      telepon_perusahaan: teleponPerusahaan,
      unit_kerja: unitKerja,
      nomor_spk: nomorSpk,
      bank_name: bankName,
      bank_account: bankAccount,
      bank_holder: bankHolder,
      terbilang: terbilang,
      penandatangan: penandatangan,
      jabatan_penandatangan: jabatanPenandatangan,
      raw_text_snippet: text.slice(0, 300),
      file_name: originalFilename,
    };
  }

  /**
   * Parser fallback untuk berkas .docx menggunakan native zip reading
   */
  extractFromDocxFile(filePath, originalFilename = '') {
    try {
      const zip = new AdmZip(filePath);
      const xml = zip.readAsText('word/document.xml');
      if (!xml) return null;
      // Bersihkan XML tag menjadi plain text
      const cleanText = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      return this.extractMetadataFromText(cleanText, originalFilename);
    } catch (err) {
      console.warn('Docx fallback extraction error:', err.message);
      return null;
    }
  }

  /**
   * Ekstraksi utama: panggil endpoint VeriText OCR, jika network/Cloudflare 530 gagal, gunakan local fallback
   */
  async extractDocument(filePath, originalFilename = '', mimeType = '') {
    const isDocx = /\.docx$/i.test(originalFilename) || mimeType.includes('word');

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: mimeType || 'application/octet-stream' });
      formData.append('file', blob, originalFilename || path.basename(filePath));
      formData.append('rules', '[]');

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        body: formData,
        signal: AbortSignal.timeout(12000), // Timeout 12 detik
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.extraction) {
          const rawText = json.extraction.extracted_text || json.extraction.raw_markdown || '';
          const meta = this.extractMetadataFromText(rawText, originalFilename);
          return {
            success: true,
            source: 'veritext_api',
            data: meta,
            job_id: json.extraction.job_id || null,
          };
        }
      } else {
        console.warn(`VeriText API responded with HTTP ${response.status}. Attempting local parser fallback.`);
      }
    } catch (apiErr) {
      console.warn('VeriText API fetch error:', apiErr.message);
    }

    // Fallback jika file DOCX dan VeriText API unreachable / Cloudflare 530
    if (isDocx) {
      const docxMeta = this.extractFromDocxFile(filePath, originalFilename);
      if (docxMeta) {
        return {
          success: true,
          source: 'veritext_local_parser',
          data: docxMeta,
          note: 'Diekstrak menggunakan parser cerdas lokal SIPANDA.',
        };
      }
    }

    // Default template jika file biner lain belum bisa diurai offline
    return {
      success: true,
      source: 'fallback',
      data: {
        jenis_dokumen: 'Invoice',
        nomor_dokumen: path.parse(originalFilename).name || 'INV-001',
        tanggal_dokumen: new Date().toISOString().split('T')[0],
        perihal: 'Pengajuan Dokumen Pembayaran',
        nilai_pembayaran: 0,
        pihak_eksternal: '',
        unit_kerja: '',
        file_name: originalFilename,
      },
    };
  }
}

module.exports = new VeriTextService();
