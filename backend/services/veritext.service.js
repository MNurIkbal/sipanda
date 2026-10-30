const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
let sharp = null;
let Tesseract = null;
try {
  sharp = require('sharp');
  Tesseract = require('tesseract.js');
} catch (e) {
}

class VeriTextService {
  constructor() {
    this.apiUrl = process.env.VERITEXT_API_URL || 'https://ocr-veritext.asiasistem.com/extract/direct';
    this.token = process.env.VERITEXT_BEARER_TOKEN || 'f7c8b2a19d4e3f05a8b7c6d5e4f3a2b10987654321fedcba0987654321abcdef';
  }

  parseIndonesianDate(text) {
    if (!text) return null;
    const months = {
      januari: '01', februari: '02', maret: '03', april: '04', mei: '05', juni: '06',
      juli: '07', agustus: '08', september: '09', oktober: '10', november: '11', desember: '12',
      jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', agu: '08', agt: '08',
      sep: '09', okt: '10', nov: '11', des: '12'
    };

    const dmyMatch = text.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const monthName = dmyMatch[2].toLowerCase();
      if (months[monthName]) {
        return `${dmyMatch[3]}-${months[monthName]}-${day}`;
      }
    }

    const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    const slashMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
      return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
    }

    return null;
  }

  extractGenericKeyValuePairs(text) {
    const dynamicParams = {};
    if (!text) return dynamicParams;

    const lines = text.split(/[\r\n]+/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      if (line.startsWith('|') && line.endsWith('|')) {
        const cols = line
          .split('|')
          .map((c) => c.trim())
          .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

        if (cols.every((c) => /^[\-:\s]*$/.test(c))) continue;

        if (cols.length >= 3 && (cols[1] === ':' || cols[1] === '=')) {
          const k = cols[0].replace(/[:=]$/, '').trim();
          const v = cols.slice(2).join(' ').trim();
          if (k && v && k.length <= 45 && v.length <= 350) {
            dynamicParams[k] = v;
          }
          continue;
        } else if (cols.length === 2) {
          const k = cols[0].replace(/[:=]$/, '').trim();
          const v = cols[1].replace(/^[:=]\s*/, '').trim();
          const isRemitGarbage = /please\s*remit|permata\s*acc|indonesia\s*acc/i.test(k);
          if (k && v && k.length <= 45 && v.length <= 350 && !/^no\.?$/i.test(k) && !isRemitGarbage) {
            dynamicParams[k] = v;
          }
          continue;
        }
      }

      const kvMatch = line.match(/^([A-Za-z0-9\s\/\.\-\(\)&_]{2,45}?)\s*[:=]\s*(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const val = kvMatch[2].trim();
        const isRemitGarbage = /please\s*remit|permata\s*acc|indonesia\s*acc/i.test(key);
        if (key && val && !/^https?$/i.test(key) && val.length <= 350 && !isRemitGarbage) {
          dynamicParams[key] = val;
        }
      }
    }

    if (Object.keys(dynamicParams).length === 0) {
      const inlineMatches = text.matchAll(/([A-Z][A-Za-z0-9\s\/\(\)]{1,30}?)\s*:\s*([^:\n\r]+?)(?=(?:\s+[A-Z][A-Za-z0-9\s\/\(\)]{1,25}?\s*:|$))/g);
      for (const m of inlineMatches) {
        const k = m[1].trim();
        const v = m[2].trim();
        const isRemitGarbage = /please\s*remit|permata\s*acc|indonesia\s*acc/i.test(k);
        if (k && v && k.length <= 40 && v.length <= 250 && !isRemitGarbage) {
          dynamicParams[k] = v;
        }
      }
    }

    return dynamicParams;
  }

  extractStructuredDocxParams(xml) {
    const params = {};
    if (!xml) return params;

    const cleanCell = (str) =>
      str
        .replace(/<\/w:p>/g, '\n')
        .replace(/<w:br[^>]*\/?>/g, '\n')
        .replace(/<w:tab[^>]*\/?>/g, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n+/g, ' ')
        .trim();

    const bodyWithoutTables = xml.replace(/<w:tbl[\s\S]*?<\/w:tbl>/g, '');
    const paragraphs = [...bodyWithoutTables.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)]
      .map((m) => cleanCell(m[0]))
      .filter(Boolean);

    for (const p of paragraphs) {
      const noAndDateMatch = p.match(/^No\.?\s*:\s*([^\s]+)\s+([A-Za-z]+,\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})$/i);
      if (noAndDateMatch) {
        params['No'] = noAndDateMatch[1].trim();
        params['Tanggal'] = noAndDateMatch[2].trim();
        continue;
      }

      const cityDateMatch = p.match(/^([A-Za-z\s]{3,25}),\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4})$/);
      if (cityDateMatch) {
        params['Tanggal'] = `${cityDateMatch[1].trim()}, ${cityDateMatch[2].trim()}`;
        continue;
      }

      const kv = p.match(/^([A-Za-z0-9\s\/\.\-\(\)&_]{2,40}?)\s*:\s*(.+)$/);
      if (kv) {
        const k = kv[1].trim();
        const v = kv[2].trim();
        if (k && v) {
          params[k] = v;
        }
      }
    }

    const tables = [...xml.matchAll(/<w:tbl[\s>][\s\S]*?<\/w:tbl>/g)].map((m) => m[0]);
    for (const tbl of tables) {
      const rows = [...tbl.matchAll(/<w:tr[\s>][\s\S]*?<\/w:tr>/g)].map((r) => {
        return [...r[0].matchAll(/<w:tc[\s>][\s\S]*?<\/w:tc>/g)].map((c) => cleanCell(c[0]));
      });

      if (rows.length === 0) continue;

      const firstRowText = rows[0].join(' ').toLowerCase();
      const isItemTable =
        rows[0].length >= 4 &&
        (firstRowText.includes('description') ||
          firstRowText.includes('uraian') ||
          firstRowText.includes('unit price') ||
          firstRowText.includes('qty') ||
          firstRowText.includes('kuantitas'));

      if (isItemTable) {
        const headers = rows[0].map((h, i) => h || `Kolom ${i + 1}`);
        if (rows[1] && rows[1].length >= 3) {
          headers.forEach((h, idx) => {
            const val = rows[1][idx];
            if (h && val && !/^no\.?$/i.test(h)) {
              params[h] = val;
            }
          });
        }
        for (let rIdx = 2; rIdx < rows.length; rIdx++) {
          const r = rows[rIdx].filter(Boolean);
          if (r.length === 2) {
            params[r[0].replace(/:$/, '').trim()] = r[1];
          } else if (r.length === 1) {
            const kv = r[0].match(/^([A-Za-z0-9\s\/\.\-\(\)]{2,30}?)\s*:\s*(.+)$/);
            if (kv) {
              params[kv[1].trim()] = kv[2].trim();
            }
          }
        }
      } else {
        for (const r of rows) {
          if (r.length >= 3 && (r[1] === ':' || r[1] === '=' || r[1] === '')) {
            const k = r[0].replace(/[:=]$/, '').trim();
            const v = r.slice(2).filter(Boolean).join(' ').replace(/^[:=]\s*/, '').trim();
            if (k && v && k.length <= 45 && !/^please remit$/i.test(k)) {
              params[k] = v;
            }
          } else if (r.length >= 2) {
            const k = r[0].replace(/:$/, '').trim();
            const v = r[1].replace(/^:\s*/, '').trim();
            if (k && v && k.length <= 45 && !/^please remit$/i.test(k)) {
              params[k] = v;
            }
            if (r[2]) {
              const col3 = r[2].trim();
              const billMatch = col3.match(/^(Bill\s*to|Kepada|Tujuan)[:\s]+(.+)$/i);
              if (billMatch && !params[billMatch[1].trim()]) {
                params['Bill To'] = billMatch[2].trim();
              } else {
                const kv3 = col3.match(/^([A-Za-z0-9\s\/]{2,30}?)\s*:\s*(.+)$/);
                if (kv3 && !params[kv3[1].trim()]) {
                  params[kv3[1].trim()] = kv3[2].trim();
                }
              }
            }
          }
        }
      }
    }

    return params;
  }

  extractMetadataFromText(extractedText, originalFilename = '', preExtractedParams = null) {
    const text = extractedText || '';
    const params = preExtractedParams && Object.keys(preExtractedParams).length > 0
      ? { ...preExtractedParams }
      : {};

    let jenisDokumen = 'Dokumen Pendukung';
    if (/faktur\s*pajak/i.test(text) || /faktur\s*pajak/i.test(originalFilename)) {
      jenisDokumen = 'Faktur Pajak';
    } else if (/invoice/i.test(text) || /invoice/i.test(originalFilename)) {
      jenisDokumen = 'Invoice';
    } else if (/kuitansi|kwitansi/i.test(text) || /kuitansi|kwitansi/i.test(originalFilename)) {
      jenisDokumen = 'Kuitansi / Bukti Pembelian';
    } else if (/surat\s+permohonan\s+pembayaran|\bspp\b/i.test(text) || /spp|permohonan\s+pembayaran/i.test(originalFilename)) {
      jenisDokumen = 'Surat Permohonan Pembayaran (SPP)';
    } else if (/berita\s+acara\s+serah\s+terima|\bbast\b/i.test(text) || /bast/i.test(originalFilename)) {
      jenisDokumen = 'Berita Acara Serah Terima (BAST)';
    } else if (/berita\s+acara\s+penyelesaian\s+pekerjaan|\bbapp\b/i.test(text) || /bapp/i.test(originalFilename)) {
      jenisDokumen = 'Berita Acara Penyelesaian Pekerjaan (BAPP)';
    } else if (/berita\s+acara\s+pembayaran|\bbap\b/i.test(text) || /bap/i.test(originalFilename)) {
      jenisDokumen = 'Berita Acara Pembayaran (BAP)';
    } else if (/surat\s+perjanjian|\bspk\b|kontrak/i.test(text) || /spk|kontrak/i.test(originalFilename)) {
      jenisDokumen = 'Surat Perjanjian / Kontrak';
    } else if (/biodata|identitas|ktp|pegawai|peserta/i.test(text)) {
      jenisDokumen = 'Dokumen Identitas / Biodata';
    }

    const hasKey = (label) => {
      const norm = label.toLowerCase().replace(/[^a-z0-9]/g, '');
      return Object.keys(params).some((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === norm);
    };

    const setParamIfMissing = (label, value) => {
      if (value !== undefined && value !== null && String(value).trim() !== '' && !hasKey(label)) {
        params[label] = String(value).trim();
      }
    };

    // Deteksi dan ekstraksi spesifik jika dokumen adalah Faktur Pajak
    if (jenisDokumen === 'Faktur Pajak' || /faktur\s*pajak/i.test(text)) {
      const noFakturMatch = text.match(/(?:Kode dan Nomor Seri Faktur Pajak|Nomor Seri Faktur Pajak|Faktur Pajak)[.:\s\t|]+([0-9\.\-]+)/i);
      if (noFakturMatch && noFakturMatch[1]) {
        const cleanNo = noFakturMatch[1].trim();
        if (cleanNo && !/^seri$/i.test(cleanNo)) {
          setParamIfMissing('Kode dan Nomor Seri Faktur Pajak', cleanNo);
          setParamIfMissing('Nomor Faktur Pajak', cleanNo);
        }
      }

      const pkpMatch = text.match(/Pengusaha Kena Pajak[:\s\t|]*\n+Nama\s*[:\s\t|]+([^\n\r]+)/i);
      if (pkpMatch) setParamIfMissing('Nama Pengusaha Kena Pajak', pkpMatch[1].replace(/[\d\|]+/g, '').trim());

      const pkpNpwMatch = text.match(/Pengusaha Kena Pajak[\s\S]*?NPWP\s*[:\s\t|]+([0-9\.\-]+)/i);
      if (pkpNpwMatch) setParamIfMissing('NPWP Penjual', pkpNpwMatch[1].trim());

      const pembeliMatch = text.match(/(?:Pembeli Barang|Penerima Jasa)[\s\S]*?Nama\s*[:\s\t|]+([^\n\r]+)/i);
      if (pembeliMatch) setParamIfMissing('Nama Pembeli', pembeliMatch[1].trim());

      const pembeliNpwp = text.match(/(?:Pembeli Barang|Penerima Jasa)[\s\S]*?NPWP\s*[:\s\t|]+([0-9\.\-]+)/i);
      if (pembeliNpwp) setParamIfMissing('NPWP Pembeli', pembeliNpwp[1].trim());

      const uraianMatch = text.match(/(?:Nama Barang Kena Pajak|Pembayaran Pekerjaan)[^\n\r]+(?:\n+[^\n\r]+)?/i) || text.match(/Biaya Tahap[^\n\r]+/i);
      if (uraianMatch) setParamIfMissing('Uraian Pekerjaan', uraianMatch[0].replace(/\n+/g, ' ').trim());

      const dppMatch = text.match(/Dasar Pengenaan Pajak[^\d]*([\d\.,]+)/i);
      if (dppMatch) setParamIfMissing('Dasar Pengenaan Pajak (DPP)', 'Rp ' + dppMatch[1].trim());

      const ppnMatch = text.match(/(?:Jumlah PPN|Pajak Pertambahan Nilai|PPN\s*=)[^\d]*([\d\.,]+)/i);
      if (ppnMatch) setParamIfMissing('Jumlah PPN', 'Rp ' + ppnMatch[1].trim());

      const hargaMatch = text.match(/Rp\s*([\d\.,]+)\s*x\s*1/i);
      if (hargaMatch && hargaMatch[1]) setParamIfMissing('Total Nilai Transaksi', 'Rp ' + hargaMatch[1].trim());

      const tglFakturMatch = text.match(/([A-Z\s]{4,25}),\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/);
      if (tglFakturMatch) setParamIfMissing('Tanggal Faktur', tglFakturMatch[1].trim() + ', ' + tglFakturMatch[2].trim());
    }

    // Ekstraksi umum untuk Pihak Eksternal / Perusahaan (PT, CV, UD, Yayasan, Universitas, Firma, dsb.)
    // Cari yang paling spesifik di awal dokumen atau baris pengirim/penjual
    let pihakEksternal = params['Nama Pengusaha Kena Pajak'] || params['Perusahaan / Pihak Eksternal'] || '';
    if (!pihakEksternal) {
      const companyHeaderMatch = text.match(/\|\s*((?:PT|CV|UD|PO|UNIVERSITAS|YAYASAN)\.?\s+[A-Za-z0-9\s\.\-]{2,50}?)(?=(?:\s+Jl|\s+Jalan|\t|\||\n|\r))/i);
      const generalPtMatch = text.match(/\b((?:PT|CV|UD|UNIVERSITAS|YAYASAN)\.?\s+[A-Za-z0-9\s\.\-]{2,50}?)(?=(?:\s+Jl|\s+Jalan|\t|\||\n|\r|,|;|$))/i);
      if (companyHeaderMatch && companyHeaderMatch[1]) {
        pihakEksternal = companyHeaderMatch[1].trim();
      } else if (generalPtMatch && generalPtMatch[1]) {
        pihakEksternal = generalPtMatch[1].trim();
      }
    }
    if (pihakEksternal) {
      // Bersihkan jika ada akhiran "Jl" atau "Jalan" yang tak sengaja terikut
      pihakEksternal = pihakEksternal.replace(/\s+(?:Jl\.?|Jalan)$/i, '').trim();
      setParamIfMissing('Perusahaan / Pihak Eksternal', pihakEksternal);
    }

    // Ekstraksi dinamis Alamat Perusahaan (mendeteksi pola Jl. atau Jalan)
    const alamatMatch = text.match(/((?:Jl\.|Jalan)[^\n\r|\t]+?)(?=(?:\s+Telp|\s+Phone|\s+Date|Date|Bill to|\||$))/i);
    if (alamatMatch && alamatMatch[1]) {
      const cleanAlamat = alamatMatch[1].replace(/\|/g, '').replace(/\s+/g, ' ').trim();
      if (cleanAlamat.length > 5) {
        setParamIfMissing('Alamat Perusahaan', cleanAlamat);
      }
    }

    const telpMatch = text.match(/(?:Telp|Tel|Phone)[:\s\t|]+([0-9\(\)\s\-]{6,25})/i);
    if (telpMatch && telpMatch[1]) {
      setParamIfMissing('Telp', telpMatch[1].trim());
    }

    const dateMatch = text.match(/(?:Date|Tanggal)[:\s\t|]+([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4}|[0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4}|[0-9]{4}-[0-9]{2}-[0-9]{2})/i);
    const cityDateMatch = text.match(/\b([A-Za-z]{3,20}),\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})\b/);
    let rawDateStr = params['Tanggal Faktur'] || params['Tanggal'] || params['Date'] || '';
    if (!rawDateStr) {
      if (cityDateMatch && cityDateMatch[2]) {
        rawDateStr = cityDateMatch[2].trim();
        if (!hasKey('Date') && !hasKey('Tanggal')) {
          setParamIfMissing('Tanggal', `${cityDateMatch[1].trim()}, ${cityDateMatch[2].trim()}`);
        }
      } else if (dateMatch && dateMatch[1]) {
        rawDateStr = dateMatch[1].trim();
        if (!hasKey('Date') && !hasKey('Tanggal')) {
          setParamIfMissing('Date', rawDateStr);
        }
      }
    }
    const tanggalDokumen = this.parseIndonesianDate(rawDateStr || text) || new Date().toISOString().split('T')[0];

    const titleMatch = text.match(/(?:Project\s*Title|Perihal|Untuk\s*Pembayaran|Uraian\s*Pekerjaan|Nama\s*Pekerjaan)[:\s\t|]+([^|\n\r]+?)(?=(?:PO\s*\/|PO\/SPK|\bDate\b|Invoice|Terms|Bill to|Terbilang|No\b|\t|$))/i);
    let perihal = params['Project Title'] || params['Perihal'] || params['Untuk Pembayaran'] || '';
    if (titleMatch && titleMatch[1] && !perihal) {
      perihal = titleMatch[1].trim();
      setParamIfMissing('Untuk Pembayaran', perihal);
    }

    const spkMatch = text.match(/(?:PO\s*\/\s*SPK\s*Number|Nomor\s*SPK|Nomor\s*Kontrak)[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    if (spkMatch && spkMatch[1] && !hasKey('PO/SPK Number') && !hasKey('Nomor SPK')) {
      setParamIfMissing('PO/SPK Number', spkMatch[1].trim());
    }

    const kwitansiNumMatch = text.match(/(?:Kwitansi|Kuitansi)\s*(?:No\.?|Nomor|Number)?[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    const invoiceNumMatch = text.match(/Invoice\s*(?:Number|No|Nomor)?[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    const generalNumMatch = text.match(/(?:Nomor\s*Surat|Nomor\s*Dokumen|Nomor|No\.)[:\s\t|]+([A-Za-z0-9\/\.\-_]+)/i);
    let nomorDokumen =
      params['Kode dan Nomor Seri Faktur Pajak'] ||
      params['Nomor Faktur Pajak'] ||
      params['Kwitansi No.'] ||
      params['Kwitansi No'] ||
      params['No. Kwitansi'] ||
      params['Invoice Number'] ||
      params['Nomor Dokumen'] ||
      params['Nomor Surat'] ||
      params['No'] ||
      '';
    // Hindari kata generik 'Seri' terambil sebagai nomor dokumen
    if (/^seri$/i.test(nomorDokumen.trim())) {
      nomorDokumen = params['Kode dan Nomor Seri Faktur Pajak'] || '';
    }
    if (params['Nomor Dokumen'] && /^seri$/i.test(params['Nomor Dokumen'].trim())) {
      delete params['Nomor Dokumen'];
    }
    if (!nomorDokumen) {
      if (kwitansiNumMatch && kwitansiNumMatch[1]) {
        nomorDokumen = kwitansiNumMatch[1].trim();
        setParamIfMissing('Kwitansi No.', nomorDokumen);
      } else if (invoiceNumMatch && invoiceNumMatch[1]) {
        nomorDokumen = invoiceNumMatch[1].trim();
        setParamIfMissing('Invoice Number', nomorDokumen);
      } else if (spkMatch && spkMatch[1]) {
        nomorDokumen = spkMatch[1].trim();
      } else if (generalNumMatch && generalNumMatch[1]) {
        nomorDokumen = generalNumMatch[1].trim();
        setParamIfMissing('Nomor Dokumen', nomorDokumen);
      }
    }

    const billToMatch = text.match(/(?:Bill\s*to|Sudah\s*terima\s*dari)[:\s\t|]+([A-Za-z0-9\.\s,]+?)(?=(?:PO\/SPK|Invoice\s*Number|Banyaknya\s*uang|Terms|No\s+Description|\n|\r|\||$))/i);
    let unitKerja = params['Bill To'] || params['Sudah terima dari'] || '';
    if (billToMatch && billToMatch[1] && !unitKerja) {
      unitKerja = billToMatch[1].trim();
      if (/kwitansi|kuitansi/i.test(jenisDokumen)) {
        setParamIfMissing('Sudah terima dari', unitKerja);
      } else {
        setParamIfMissing('Bill To', unitKerja);
      }
    }

    // Cek nominal dari params terlebih dahulu (seperti 'Total Nilai Transaksi', 'Dasar Pengenaan Pajak (DPP)', 'Banyaknya uang', 'GRAND TOTAL', 'Total Price(IDR)')
    let nilaiPembayaran = 0;
    const paramNominalRaw =
      params['Total Nilai Transaksi'] ||
      params['Dasar Pengenaan Pajak (DPP)'] ||
      params['Banyaknya uang'] ||
      params['Banyaknya Uang'] ||
      params['GRAND TOTAL'] ||
      params['Total Price(IDR)'] ||
      params['Total Price (IDR)'] ||
      params['Nilai Pembayaran'] ||
      '';
    if (paramNominalRaw) {
      const m = String(paramNominalRaw).match(/([\d\.]{4,})/);
      if (m && m[1]) {
        nilaiPembayaran = parseFloat(m[1].replace(/\./g, '')) || 0;
      }
    }

    const grandTotalMatch = text.match(/(?:GRAND\s*TOTAL|Total\s*Price|Banyaknya\s*uang|Jumlah|Nilai\s*Pembayaran|sebesar)[^\d]*Rp\.?\s*([\d\.,]+)/i);
    if (grandTotalMatch && grandTotalMatch[1]) {
      const cleanNumStr = grandTotalMatch[1].replace(/[,-]+$/, '').trim();
      const rawNum = cleanNumStr.replace(/\./g, '').replace(/,/g, '.');
      if (!nilaiPembayaran) {
        nilaiPembayaran = parseFloat(rawNum) || 0;
      }
      if (/kwitansi|kuitansi/i.test(jenisDokumen)) {
        if (!hasKey('Banyaknya uang')) {
          setParamIfMissing('Banyaknya uang', `Rp${cleanNumStr},-`);
        }
      } else if (!hasKey('GRAND TOTAL') && !hasKey('Total Price (IDR)') && !hasKey('Total Price(IDR)') && !hasKey('Banyaknya uang')) {
        setParamIfMissing('Nominal Pembayaran', `Rp${cleanNumStr}`);
      }
    }

    const terbilangMatch = text.match(/Terbilang[:\s\t|]+([^\n\r|]+?)(?=(?:Please Remit|Approved by|Bank\s*Name|Acc\s*Name|Jakarta,|$))/i);
    if (terbilangMatch && terbilangMatch[1]) {
      setParamIfMissing('Terbilang', terbilangMatch[1].trim());
    }

    const bankMatch = text.match(/Bank\s*Name[:\s\t|]+([A-Za-z0-9\s]+?)(?=(?:Acc|Branch|Swift|$))/i);
    const accNameMatch = text.match(/Acc\s*Name[:\s\t|]+([A-Za-z0-9\.\s]+?)(?=(?:Acc\s*Number|Branch|Swift|$))/i);
    const accNumMatch = text.match(/Acc\s*Number[:\s\t|]+([0-9\.\-_]+)/i);
    const branchMatch = text.match(/Branch[:\s\t|]+([A-Za-z0-9\s]+?)(?=(?:Swift|Approved|materai|\n|\r|$))/i);
    const swiftMatch = text.match(/Swift\s*Code[:\s\t|]+([A-Za-z0-9]+)/i);

    if (bankMatch && bankMatch[1]) setParamIfMissing('Bank Name', bankMatch[1].trim());
    if (accNameMatch && accNameMatch[1]) setParamIfMissing('Acc Name', accNameMatch[1].trim());
    if (accNumMatch && accNumMatch[1]) setParamIfMissing('Acc Number', accNumMatch[1].trim());
    if (branchMatch && branchMatch[1]) setParamIfMissing('Branch', branchMatch[1].trim());
    if (swiftMatch && swiftMatch[1]) setParamIfMissing('Swift Code', swiftMatch[1].trim());

    const approverMatch = text.match(/Approved\s*by[\s\S]*?(?:materai&amp;cap|materai&cap|materai|cap)?[\s\n\r|]*([A-Za-z\s]{3,35}?)[\s\n\r|]+(Direktur|Kepala|Manajer|Pimpinan|PPK)/i);
    if (approverMatch) {
      setParamIfMissing('Approved By', approverMatch[1].trim());
      setParamIfMissing('Jabatan', approverMatch[2].trim());
    } else {
      const genericSigner = text.match(/([A-Z][a-zA-Z\s]{2,30})\n+(Direktur|Kepala|Pimpinan|PPK|Manager|Manajer)/i);
      if (genericSigner && !hasKey('Approved By')) {
        setParamIfMissing('Approved By', genericSigner[1].trim());
        if (!hasKey('Jabatan')) setParamIfMissing('Jabatan', genericSigner[2].trim());
      }
    }

    // Gabungkan key-value generik dari dokumen apa pun (misal Nama, NIK, Jenis Kelamin, Tempat/Tgl Lahir, Jabatan, dsb.)
    const genericKV = this.extractGenericKeyValuePairs(text);
    for (const [k, v] of Object.entries(genericKV)) {
      setParamIfMissing(k, v);
    }

    // Jika dokumen berisi teks paragraf namun tidak memiliki pola "Key : Value" sama sekali, simpan ringkasan isi dokumen sebagai field dinamis
    if (Object.keys(params).length === 0 && text.trim().length > 0) {
      params['Nama File'] = originalFilename || 'Dokumen';
      params['Ringkasan Isi Dokumen'] = text.trim().slice(0, 250);
    }

    return {
      jenis_dokumen: jenisDokumen,
      nomor_dokumen: nomorDokumen,
      tanggal_dokumen: tanggalDokumen,
      perihal: perihal,
      nilai_pembayaran: nilaiPembayaran,
      pihak_eksternal: pihakEksternal,
      unit_kerja: unitKerja,
      params: params,
      metadata: params,
      raw_text_snippet: text.slice(0, 300),
      file_name: originalFilename,
    };
  }

  /**
   * Parser untuk berkas .docx menggunakan native zip reading
   */
  extractFromDocxFile(filePath, originalFilename = '') {
    try {
      const zip = new AdmZip(filePath);
      const xml = zip.readAsText('word/document.xml');
      if (!xml) return null;

      // Ekstrak struktur tabel dan paragraf dari XML terlebih dahulu
      const structuredParams = this.extractStructuredDocxParams(xml);

      const cleanText = xml
        .replace(/<\/w:p>/g, '\n')
        .replace(/<\/w:tr>/g, '\n')
        .replace(/<\/w:tc>/g, ' | ')
        .replace(/<w:tab[^>]*\/?>/g, ' ')
        .replace(/<w:br[^>]*\/?>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/[ \t]+/g, ' ')
        .trim();

      return this.extractMetadataFromText(cleanText, originalFilename, structuredParams);
    } catch (err) {
      console.warn('Docx extraction error:', err.message);
      return null;
    }
  }

  /**
   * Ekstraksi utama: panggil endpoint VeriText OCR, dan gabungkan/fallback dengan struktur dokumen
   */
  async extractDocument(filePath, originalFilename = '', mimeType = '') {
    const isDocx = /\.docx$/i.test(originalFilename) || mimeType.includes('word');

    // Jika file DOCX, kita juga bisa mengekstrak struktur XML tabelnya secara presisi
    let docxStructuredParams = null;
    if (isDocx) {
      try {
        const zip = new AdmZip(filePath);
        const xml = zip.readAsText('word/document.xml');
        if (xml) {
          docxStructuredParams = this.extractStructuredDocxParams(xml);
        }
      } catch (e) { }
    }

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
        signal: AbortSignal.timeout(12000),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.extraction) {
          let rawText = json.extraction.extracted_text || json.extraction.raw_markdown || '';

          // Jika API Veritext hanya mengembalikan link gambar scanned tanpa teks OCR
          // atau teksnya kosong / kurang dari 30 karakter, lakukan OCR cadangan dengan Sharp + Tesseract
          const isScannedImageOnly = !rawText.trim() || /^!\[Extracted Image\]/i.test(rawText.trim());
          if (isScannedImageOnly && (/\.(jpe?g|png|webp|bmp|tiff)$/i.test(originalFilename) || mimeType.startsWith('image/'))) {
            try {
              if (sharp && Tesseract) {
                const processed = await sharp(fileBuffer)
                  .resize({ width: 2200 })
                  .grayscale()
                  .threshold(160)
                  .toBuffer();
                const ocrResult = await Tesseract.recognize(processed, 'ind+eng');
                if (ocrResult?.data?.text && ocrResult.data.text.trim().length > 20) {
                  rawText = ocrResult.data.text;
                }
              }
            } catch (tessErr) {
              console.warn('Local OCR enhancement warning:', tessErr.message);
            }
          }

          const meta = this.extractMetadataFromText(rawText, originalFilename, docxStructuredParams);
          return {
            success: true,
            source: 'veritext_api',
            data: meta,
            job_id: json.extraction.job_id || null,
          };
        }
      } else {
        console.warn(`VeriText API responded with HTTP ${response.status}. Using local document extractor.`);
      }
    } catch (apiErr) {
      console.warn('VeriText API fetch error:', apiErr.message);
    }

    if (isDocx) {
      const docxMeta = this.extractFromDocxFile(filePath, originalFilename);
      if (docxMeta) {
        return {
          success: true,
          source: 'veritext_local_parser',
          data: docxMeta,
          note: 'Diekstrak secara dinamis sesuai struktur konten dokumen.',
        };
      }
    }

    return {
      success: true,
      source: 'fallback',
      data: {
        jenis_dokumen: 'Dokumen Pendukung',
        nomor_dokumen: path.parse(originalFilename).name || 'DOK-001',
        tanggal_dokumen: new Date().toISOString().split('T')[0],
        perihal: '',
        nilai_pembayaran: 0,
        pihak_eksternal: '',
        unit_kerja: '',
        params: {
          'Nama Berkas': originalFilename,
        },
        metadata: {
          'Nama Berkas': originalFilename,
        },
        file_name: originalFilename,
      },
    };
  }
}

module.exports = new VeriTextService();
