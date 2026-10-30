import { PaymentDocument } from "@/types/sipandu.types";

export type GeneratorType = "BAST" | "BAP" | "BAPP";

export function getDefaultTitle(type: GeneratorType) {
  if (type === "BAST") return "BERITA ACARA SERAH TERIMA PEKERJAAN";
  if (type === "BAP") return "BERITA ACARA PEMBAYARAN";
  return "BERITA ACARA PENYELESAIAN PEKERJAAN";
}

export function printOfficialDoc(doc: PaymentDocument, type: GeneratorType, customData?: any) {
  const savedData = customData || doc.official_docs_data?.[type]?.formData || {};

  const instansi = savedData.instansi || "BADAN INTELIJEN NEGARA";
  const judulSurat = savedData.judulSurat || getDefaultTitle(type);
  const nomorDokumen = savedData.nomorDokumen || `${type}-${doc.id || "2079"} / IX / 2024`;
  const namaPekerjaan = savedData.namaPekerjaan || doc.perihal || doc.nama_kegiatan || "PEKERJAAN PEMELIHARAAN DAN PERAWATAN JARINGAN DOKUMENTASI DAN INFORMASI HUKUM (JDIH)";
  const bebanDipa = savedData.bebanDipa || "ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024";
  const hari = savedData.hari || "Senin";
  const tanggalTerbilang = savedData.tanggalTerbilang || "Tiga Puluh";
  const bulanTerbilang = savedData.bulanTerbilang || "September";
  const tahunTerbilang = savedData.tahunTerbilang || "Dua Ribu Dua Puluh Empat";
  const pihak1Nama = savedData.pihak1Nama || doc.ppk_name || "Edy Susanto, S.H., M.H.";
  const pihak1Jabatan = savedData.pihak1Jabatan || "Pejabat Pembuat Komitmen BIN";
  const pihak1Alamat = savedData.pihak1Alamat || "Jalan Seno Raya Pejaten Timur Pasar Minggu Jakarta Selatan";
  const pihak1AtasNama = savedData.pihak1AtasNama || "Badan Intelijen Negara, selanjutnya disebut PPK.";
  const pihak2Nama = savedData.pihak2Nama || "";
  const pihak2Jabatan = savedData.pihak2Jabatan || (doc.pihak_eksternal ? `Direktur ${doc.pihak_eksternal}` : "");
  const pihak2Alamat = savedData.pihak2Alamat || "Gedung Sentral Senayan II Lt. 16, Jl. Asia Afrika No. 8, Jakarta Pusat 10270";
  const pihak2AtasNama = savedData.pihak2AtasNama || (doc.pihak_eksternal ? `${doc.pihak_eksternal}, yang selanjutnya disebut PENYEDIA.` : " yang selanjutnya disebut PENYEDIA.");
  const suratPerjanjian = savedData.suratPerjanjian || (doc.nomor_surat ? `Surat Perjanjian Nomor : ${doc.nomor_surat} tanggal 8 Januari 2024;` : "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;");
  const buktiKerja = savedData.buktiKerja || "Bukti Kerja Pekerjaan Pemeliharaan dan Perawatan Jaringan Dokumentasi dan Informasi Hukum (JDIH) bulan September 2024.";
  const presentasePenyedia = savedData.presentasePenyedia || (type === "BAST" ? "91.67%" : "75%");
  const lokasiPekerjaan = savedData.lokasiPekerjaan || "Jakarta";
  const instansiPenerima = savedData.instansiPenerima || "Badan Intelijen Negara";

  // Data khusus BAST (Berita Acara Serah Terima Pekerjaan)
  const bastPenyelesaianNomor = savedData.bastPenyelesaianNomor || `BAPP-2406 / XI /2024`;
  const bastPenyelesaianTanggal = savedData.bastPenyelesaianTanggal || `29 November 2024`;
  const bastPeriodePekerjaan = savedData.bastPeriodePekerjaan || `bulan September s.d. November 2024`;

  // Data khusus BAP (Berita Acara Pembayaran)
  const bapTanggalSurat = savedData.bapTanggalSurat || "02 Desember 2024";
  const bapDasarList: string[] = savedData.bapDasarList || [
    "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
    "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
  ];
  const bapPeriodePembayaran = savedData.bapPeriodePembayaran || "bulan September s/d November 2024";
  const bapNilaiPembayaranAngka = savedData.bapNilaiPembayaranAngka || (doc.nilai_pembayaran ? new Intl.NumberFormat("id-ID").format(doc.nilai_pembayaran) : "134.259.000");
  const bapNilaiPembayaranTerbilang = savedData.bapNilaiPembayaranTerbilang || "Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah";
  const bapKppn = savedData.bapKppn || "Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V";
  const bapNilaiKontrak = savedData.bapNilaiKontrak || "537.036.000,-";
  const bapNilaiBapLalu = savedData.bapNilaiBapLalu || "358.024.000,-";
  const bapNilaiPekerjaanSaatIni = savedData.bapNilaiPekerjaanSaatIni || "134.259.000,-";
  const bapDikurangiLalu = savedData.bapDikurangiLalu || "358.024.000,-";
  const bapSisaPembayaran = savedData.bapSisaPembayaran || "44.753.000,-";
  const bapNilaiDibayarkan = savedData.bapNilaiDibayarkan || "134.259.000,-";
  const bapTotalBapIni = savedData.bapTotalBapIni || "492.283.000,-";

  const ttdKiriJabatan1 = savedData.ttdKiriJabatan1 || "Kepala Badan Intelijen Negara";
  const ttdKiriJabatan2 = savedData.ttdKiriJabatan2 || "Pejabat Pembuat Komitmen";
  const ttdKiriNama = savedData.ttdKiriNama || doc.ppk_name || "Edy Susanto, S.H., M.H.";
  const ttdKananInstansi = savedData.ttdKananInstansi || doc.pihak_eksternal || "";
  const ttdKananJabatan = savedData.ttdKananJabatan || "";
  const ttdKananNama = savedData.ttdKananNama || "";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.warn("Popup blocker aktif. Izinkan popup untuk mencetak/export PDF.");
    return false;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${judulSurat} - ${nomorDokumen}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 18mm 12mm 18mm;
        }
        * {
          box-sizing: border-box;
        }
        body {
          font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
          color: #000;
          line-height: 1.25;
          font-size: 10pt;
          margin: 0;
          padding: 0;
        }
        .header-instansi {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 12px;
          letter-spacing: 0.5px;
        }
        .title-section {
          text-align: center;
          margin-bottom: 14px;
        }
        .main-title {
          font-size: 11pt;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 3px;
        }
        .doc-num {
          font-size: 10pt;
          font-weight: bold;
          margin-bottom: 4px;
        }
        .tentang {
          font-size: 10pt;
          margin-bottom: 3px;
        }
        .pekerjaan-title {
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
          max-width: 90%;
          margin: 0 auto 3px auto;
        }
        .beban-dipa {
          font-size: 10pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .p-intro {
          text-align: justify;
          margin-top: 10px;
          margin-bottom: 6px;
        }
        .party-table {
          width: 100%;
          margin-left: 15px;
          margin-bottom: 4px;
          font-size: 10pt;
          border-collapse: collapse;
        }
        .party-table td {
          vertical-align: top;
          padding: 1px 0;
        }
        .col-num {
          width: 85px;
        }
        .col-colon {
          width: 14px;
          text-align: center;
        }
        .party-closing {
          margin-bottom: 8px;
          text-align: justify;
        }
        .list-dasar {
          margin-top: 4px;
          margin-bottom: 8px;
          padding-left: 20px;
        }
        .list-dasar li {
          margin-bottom: 2px;
          text-align: justify;
        }
        .paragraph {
          text-align: justify;
          margin-bottom: 7px;
        }
        .item-summary {
          margin-left: 10px;
          margin-bottom: 8px;
        }
        .item-summary table {
          font-size: 10pt;
          border-collapse: collapse;
        }
        .item-summary td {
          padding: 1px 0;
          vertical-align: top;
        }
        .table-bap {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 12px;
          font-size: 10pt;
          page-break-inside: auto;
        }
        .table-bap th, .table-bap td {
          border: 1px solid #000;
          padding: 5px 8px;
          vertical-align: top;
          line-height: 1.35;
        }
        .table-bap th {
          text-align: center;
          font-weight: bold;
        }
        .table-header-bap {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #000;
          margin-bottom: 12px;
        }
        .table-header-bap td, .table-header-bap th {
          border: 1px solid #000;
          padding: 6px 10px;
          vertical-align: middle;
        }
        .ttd-section {
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          page-break-inside: avoid;
        }
        @media print {
          html, body {
            height: auto;
            overflow: visible;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header-instansi">${instansi}</div>

      ${type === "BAP"
      ? `
      <table class="table-header-bap">
        <tr>
          <td style="width: 50%; text-align: center; font-weight: bold; font-size: 10pt; text-transform: uppercase;">
            URAIAN PEKERJAAN
          </td>
          <td style="width: 50%; text-align: center; font-weight: bold; font-size: 10pt; text-transform: uppercase;">
            BERITA ACARA PEMBAYARAN
          </td>
        </tr>
        <tr>
          <td style="width: 50%; vertical-align: top; font-weight: bold; font-size: 10pt; padding: 6px 10px;">
            ${namaPekerjaan}
          </td>
          <td style="width: 50%; vertical-align: top; font-size: 10pt; padding: 6px 10px;">
            <div>Nomor &nbsp;&nbsp;: ${nomorDokumen}</div>
            <div>Tanggal : ${bapTanggalSurat}</div>
          </td>
        </tr>
      </table>
      `
      : `
      <div class="title-section">
        <div class="main-title">${judulSurat}</div>
        <div class="doc-num">${nomorDokumen}</div>
        <div class="tentang">tentang</div>
        <div class="pekerjaan-title">${namaPekerjaan}</div>
        <div class="beban-dipa">${bebanDipa}</div>
      </div>
      `
    }

      <div class="p-intro">
        Pada hari ini <strong>${hari}</strong> tanggal <strong>${tanggalTerbilang}</strong> bulan <strong>${bulanTerbilang}</strong> tahun <strong>${tahunTerbilang}</strong>, yang bertanda tangan di bawah ini :
      </div>

      <table class="party-table">
        <tr>
          <td class="col-num">1. Nama</td>
          <td class="col-colon">:</td>
          <td><strong>${pihak1Nama}</strong></td>
        </tr>
        <tr>
          <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Jabatan</td>
          <td class="col-colon">:</td>
          <td>${pihak1Jabatan}</td>
        </tr>
        <tr>
          <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Alamat</td>
          <td class="col-colon">:</td>
          <td>${pihak1Alamat}</td>
        </tr>
      </table>
      <div class="party-closing">
        Dalam hal ini bertindak untuk dan atas nama <strong>${pihak1AtasNama}</strong>
      </div>

      <table class="party-table">
        <tr>
          <td class="col-num">2. Nama</td>
          <td class="col-colon">:</td>
          <td><strong>${pihak2Nama}</strong></td>
        </tr>
        <tr>
          <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Jabatan</td>
          <td class="col-colon">:</td>
          <td>${pihak2Jabatan}</td>
        </tr>
        <tr>
          <td>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Alamat</td>
          <td class="col-colon">:</td>
          <td>${pihak2Alamat}</td>
        </tr>
      </table>
      <div class="party-closing">
        Dalam hal ini bertindak untuk dan atas nama <strong>${pihak2AtasNama}</strong>
      </div>

      ${type === "BAST"
      ? `
      <div class="paragraph" style="margin-top: 10px; margin-bottom: 8px;">
        Dengan ini <strong>PPK</strong> dan <strong>PENYEDIA</strong> menyatakan sebagai berikut :
      </div>

      <div class="paragraph" style="margin-left: 5px; margin-bottom: 8px;">
        1. <strong>PENYEDIA</strong> menyerahkan kepada <strong>PPK</strong> sebesar <strong>${presentasePenyedia}</strong> <strong>${namaPekerjaan}</strong>, ${bastPeriodePekerjaan} berdasarkan Berita Acara Penyelesaian Pekerjaan Nomor : ${bastPenyelesaianNomor} tanggal ${bastPenyelesaianTanggal}.
      </div>

      <div class="paragraph" style="margin-left: 5px; margin-bottom: 12px;">
        2. <strong>PPK</strong> menerima dari <strong>PENYEDIA</strong> sebesar <strong>${presentasePenyedia}</strong> dan telah diperiksa dalam keadaan baik pekerjaan tersebut yang dilaksanakan berdasarkan Berita Acara Penyelesaian Pekerjaan Nomor : ${bastPenyelesaianNomor} tanggal ${bastPenyelesaianTanggal}.
      </div>

      <div class="paragraph">
        Demikian Berita Acara Serah Terima Pekerjaan ini dibuat dengan sesungguhnya dan ditanda tangani oleh kedua pihak untuk dipergunakan sebagaimana mestinya.
      </div>
      `
      : type === "BAP"
        ? `
      <div class="paragraph" style="margin-bottom: 4px;">
        Berdasarkan hal-hal sebagai berikut:
      </div>

      <div style="margin-left: 5px; margin-bottom: 6px; font-size: 9.5pt;">
        ${(bapDasarList || [])
          .filter((d: string) => d && d.trim())
          .map(
            (dasar: string, idx: number) => `
          <div style="margin-bottom: 2px;">
            ${idx + 1}. ${dasar}
          </div>
        `
          )
          .join("")}
      </div>

      <div class="paragraph" style="margin-bottom: 6px;">
        Bahwa kedua belah pihak menyatakan sebagai berikut:
      </div>

      <div class="paragraph" style="margin-bottom: 4px;">
        1. <strong>PENYEDIA</strong> berdasarkan hal-hal tersebut di atas berhak menerima pembayaran ${bapPeriodePembayaran} sebesar Rp${bapNilaiPembayaranAngka},- (${bapNilaiPembayaranTerbilang}) dari <strong>PPK</strong>, dengan rincian pembayaran sebagai berikut :
      </div>

      <table class="table-bap">
        <thead>
          <tr>
            <th style="width: 35px;">No</th>
            <th>Rincian Pembayaran</th>
            <th style="width: 140px;">Jumlah (Rp.)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="text-align: center;">1</td>
            <td>Nilai Kontrak</td>
            <td style="text-align: right;">${bapNilaiKontrak}</td>
          </tr>
          <tr>
            <td style="text-align: center;">2</td>
            <td>Nilai Pembayaran s/d Berita Acara Pembayaran (BAP) yang lalu:</td>
            <td style="text-align: right;">${bapNilaiBapLalu}</td>
          </tr>
          <tr>
            <td style="text-align: center;">3</td>
            <td>
              <div>a. Perhitungan Nilai Pembayaran s.d Nilai Pekerjaan saat ini</div>
              <div style="padding-left: 12px;">&gt; Nilai Pekerjaan pada BAP ini:</div>
              <div style="padding-left: 12px;">&gt; Dikurangi nilai pekerjaan pada Berita Acara yang lalu:</div>
              <div style="padding-left: 12px;">&gt; Nilai sisa pembayaran s.d pekerjaan saat ini:</div>
            </td>
            <td style="text-align: right;">
              <div>&nbsp;</div>
              <div>${bapNilaiPekerjaanSaatIni}</div>
              <div>${bapDikurangiLalu}</div>
              <div>${bapSisaPembayaran}</div>
            </td>
          </tr>
          <tr>
            <td>&nbsp;</td>
            <td>b. Nilai Dibayarkan (termasuk pajak-pajak)</td>
            <td style="text-align: right;">${bapNilaiDibayarkan}</td>
          </tr>
          <tr>
            <td style="text-align: center;">4</td>
            <td>Nilai Pembayaran s/d Berita Acara Pembayaran (BAP) ini (termasuk pajak)</td>
            <td style="text-align: right; font-weight: bold;">${bapTotalBapIni}</td>
          </tr>
        </tbody>
      </table>

      <div class="paragraph" style="margin-top: 6px; margin-bottom: 6px;">
        2. <strong>PPK</strong> akan melakukan pembayaran sebagaimana dimaksud pada poin 1 kepada <strong>PENYEDIA</strong> melalui ${bapKppn}
      </div>

      <div class="paragraph">
        Demikian Berita Acara Pembayaran ini dibuat untuk dipergunakan sebagaimana mestinya.
      </div>
      `
        : `
      <div class="paragraph">
        Berdasarkan hal-hal sebagai berikut :
      </div>

      <ul class="list-dasar" style="list-style-type: circle;">
        <li>${suratPerjanjian}</li>
        <li>${buktiKerja}</li>
      </ul>

      <div class="paragraph">
        Dengan ini menyatakan <strong>${namaPekerjaan}</strong> untuk bulan <strong>${bulanTerbilang} ${tahunTerbilang.includes("Empat") ? "2024" : ""}</strong> telah selesai dilaksanakan dengan presentase sebesar <strong>${presentasePenyedia}</strong> dari target 100% yang akan dicapai pada bulan Desember 2024.
      </div>

      <div class="paragraph">
        <strong>PENYEDIA</strong> telah menyelesaikan pekerjaan dengan presentase sebesar <strong>${presentasePenyedia}</strong> dan <strong>PPK</strong> menyatakan menerima dari <strong>PENYEDIA</strong> atas hasil pekerjaan yang telah selesai sebagai berikut :
      </div>

      <div class="item-summary">
        <table>
          <tr>
            <td style="width: 100px;">1. Pekerjaan</td>
            <td style="width: 15px; text-align: center;">:</td>
            <td><strong>${namaPekerjaan}</strong>;</td>
          </tr>
          <tr>
            <td>2. Lokasi</td>
            <td style="text-align: center;">:</td>
            <td>${lokasiPekerjaan};</td>
          </tr>
          <tr>
            <td>3. Instansi</td>
            <td style="text-align: center;">:</td>
            <td>${instansiPenerima}</td>
          </tr>
        </table>
      </div>

      <div class="paragraph">
        Demikian ${judulSurat} ini dibuat dengan sesungguhnya dan ditanda tangani oleh kedua pihak untuk dipergunakan sebagaimana mestinya.
      </div>
      `
    }

      <table class="ttd-section">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold;">Untuk dan atas nama</div>
            <div style="font-weight: bold;">${ttdKiriJabatan1}</div>
            <div style="font-weight: bold;">${ttdKiriJabatan2}</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${ttdKiriNama}</div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top;">
            <div style="font-weight: bold;">Untuk dan atas nama</div>
            <div style="font-weight: bold;">${ttdKananInstansi}</div>
            <div style="font-weight: bold;">${ttdKananJabatan}</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${ttdKananNama}</div>
          </td>
        </tr>
      </table>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
}

