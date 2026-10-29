"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Download, Sparkles, Building2, User, FileText, Calendar, Lock } from "lucide-react";
import { PaymentDocument } from "@/types/sipandu.types";
import { sipanduApi } from "@/services/api.service";
import { GeneratorType, getDefaultTitle, printOfficialDoc } from "@/lib/officialDocPdf";

interface GenerateOfficialDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: PaymentDocument | null;
  initialType?: GeneratorType;
  onSuccess?: () => void;
}

export const GenerateOfficialDocModal: React.FC<GenerateOfficialDocModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  initialType = "BAPP",
  onSuccess,
}) => {
  const [docType, setDocType] = useState<GeneratorType>(initialType);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synced states based on image template
  const [instansi, setInstansi] = useState("BADAN INTELIJEN NEGARA");
  const [judulSurat, setJudulSurat] = useState("BERITA ACARA PENYELESAIAN PEKERJAAN");
  const [nomorDokumen, setNomorDokumen] = useState("");
  const [namaPekerjaan, setNamaPekerjaan] = useState("");
  const [bebanDipa, setBebanDipa] = useState("ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024");

  // Paragraf Pembuka
  const [hari, setHari] = useState("Senin");
  const [tanggalTerbilang, setTanggalTerbilang] = useState("Tiga Puluh");
  const [bulanTerbilang, setBulanTerbilang] = useState("September");
  const [tahunTerbilang, setTahunTerbilang] = useState("Dua Ribu Dua Puluh Empat");

  // Pihak 1 (PPK)
  const [pihak1Nama, setPihak1Nama] = useState("Edy Susanto, S.H., M.H.");
  const [pihak1Jabatan, setPihak1Jabatan] = useState("Pejabat Pembuat Komitmen BIN");
  const [pihak1Alamat, setPihak1Alamat] = useState("Jalan Seno Raya Pejaten Timur Pasar Minggu Jakarta Selatan");
  const [pihak1AtasNama, setPihak1AtasNama] = useState("Badan Intelijen Negara, selanjutnya disebut PPK.");

  // Pihak 2 (Penyedia)
  const [pihak2Nama, setPihak2Nama] = useState("Rizky Detha");
  const [pihak2Jabatan, setPihak2Jabatan] = useState("Direktur PT. Asia Sistem Indonesia");
  const [pihak2Alamat, setPihak2Alamat] = useState(
    "Gedung Sentral Senayan II Lt. 16, Jl. Asia Afrika No. 8, Jakarta Pusat 10270"
  );
  const [pihak2AtasNama, setPihak2AtasNama] = useState(
    "PT. Asia Sistem Indonesia, yang selanjutnya disebut PENYEDIA."
  );

  // Dasar-dasar Berdasarkan hal-hal sebagai berikut:
  const [suratPerjanjian, setSuratPerjanjian] = useState("");
  const [buktiKerja, setBuktiKerja] = useState(
    "Bukti Kerja Pekerjaan Pemeliharaan dan Perawatan Jaringan Dokumentasi dan Informasi Hukum (JDIH) bulan September 2024."
  );

  // Uraian & Prosentase
  const [presentasePenyedia, setPresentasePenyedia] = useState("75%");
  const [lokasiPekerjaan, setLokasiPekerjaan] = useState("Jakarta");
  const [instansiPenerima, setInstansiPenerima] = useState("Badan Intelijen Negara");

  // Field Spesifik BAST
  const [bastPenyelesaianNomor, setBastPenyelesaianNomor] = useState("BAPP-2406 / XI /2024");
  const [bastPenyelesaianTanggal, setBastPenyelesaianTanggal] = useState("29 November 2024");
  const [bastPeriodePekerjaan, setBastPeriodePekerjaan] = useState("bulan September s.d. November 2024");

  // Field Spesifik BAP (Berita Acara Pembayaran)
  const [bapTanggalSurat, setBapTanggalSurat] = useState("02 Desember 2024");
  const [bapDasarList, setBapDasarList] = useState<string[]>([
    "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
    "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
    "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
  ]);
  const [bapPeriodePembayaran, setBapPeriodePembayaran] = useState("bulan September s/d November 2024");
  const [bapNilaiPembayaranAngka, setBapNilaiPembayaranAngka] = useState("134.259.000");
  const [bapNilaiPembayaranTerbilang, setBapNilaiPembayaranTerbilang] = useState(
    "Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah"
  );
  const [bapKppn, setBapKppn] = useState("Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V");

  // Rincian Tabel Pembayaran BAP
  const [bapNilaiKontrak, setBapNilaiKontrak] = useState("537.036.000,-");
  const [bapNilaiBapLalu, setBapNilaiBapLalu] = useState("358.024.000,-");
  const [bapNilaiPekerjaanSaatIni, setBapNilaiPekerjaanSaatIni] = useState("134.259.000,-");
  const [bapDikurangiLalu, setBapDikurangiLalu] = useState("358.024.000,-");
  const [bapSisaPembayaran, setBapSisaPembayaran] = useState("44.753.000,-");
  const [bapNilaiDibayarkan, setBapNilaiDibayarkan] = useState("134.259.000,-");
  const [bapTotalBapIni, setBapTotalBapIni] = useState("492.283.000,-");

  // Signatures
  const [ttdKiriJabatan1, setTtdKiriJabatan1] = useState("Kepala Badan Intelijen Negara");
  const [ttdKiriJabatan2, setTtdKiriJabatan2] = useState("Pejabat Pembuat Komitmen");
  const [ttdKiriNama, setTtdKiriNama] = useState("Edy Susanto, S.H., M.H.");

  const [ttdKananInstansi, setTtdKananInstansi] = useState("PT. Asia Sistem Indonesia");
  const [ttdKananJabatan, setTtdKananJabatan] = useState("Direktur");
  const [ttdKananNama, setTtdKananNama] = useState("Rizky Detha");
  const [includeMaterai, setIncludeMaterai] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Populate data saat modal terbuka atau saat doc / docType berubah
  useEffect(() => {
    if (!doc) return;

    setDocType(initialType);
    applyDocDataForType(initialType, doc);
  }, [doc, initialType, isOpen]);

  const applyDocDataForType = (type: GeneratorType, currentDoc: PaymentDocument) => {
    const savedData = currentDoc.official_docs_data?.[type]?.formData;

    if (savedData) {
      setInstansi(savedData.instansi || "BADAN INTELIJEN NEGARA");
      setJudulSurat(savedData.judulSurat || getDefaultTitle(type));
      setNomorDokumen(savedData.nomorDokumen || `${type}-${currentDoc.id || "2079"} / IX / 2024`);
      setNamaPekerjaan(savedData.namaPekerjaan || currentDoc.perihal || currentDoc.nama_kegiatan || "");
      setBebanDipa(savedData.bebanDipa || "ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024");
      setHari(savedData.hari || "Senin");
      setTanggalTerbilang(savedData.tanggalTerbilang || "Tiga Puluh");
      setBulanTerbilang(savedData.bulanTerbilang || "September");
      setTahunTerbilang(savedData.tahunTerbilang || "Dua Ribu Dua Puluh Empat");
      setPihak1Nama(savedData.pihak1Nama || currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
      setPihak1Jabatan(savedData.pihak1Jabatan || "Pejabat Pembuat Komitmen BIN");
      setPihak1Alamat(savedData.pihak1Alamat || "Jalan Seno Raya Pejaten Timur Pasar Minggu Jakarta Selatan");
      setPihak1AtasNama(savedData.pihak1AtasNama || "Badan Intelijen Negara, selanjutnya disebut PPK.");
      setPihak2Nama(savedData.pihak2Nama || "Rizky Detha");
      setPihak2Jabatan(savedData.pihak2Jabatan || (currentDoc.pihak_eksternal ? `Direktur ${currentDoc.pihak_eksternal}` : "Direktur PT. Asia Sistem Indonesia"));
      setPihak2Alamat(savedData.pihak2Alamat || "Gedung Sentral Senayan II Lt. 16, Jl. Asia Afrika No. 8, Jakarta Pusat 10270");
      setPihak2AtasNama(savedData.pihak2AtasNama || (currentDoc.pihak_eksternal ? `${currentDoc.pihak_eksternal}, yang selanjutnya disebut PENYEDIA.` : "PT. Asia Sistem Indonesia, yang selanjutnya disebut PENYEDIA."));
      setSuratPerjanjian(savedData.suratPerjanjian || (currentDoc.nomor_surat ? `Surat Perjanjian Nomor : ${currentDoc.nomor_surat} tanggal 8 Januari 2024;` : "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;"));
      setBuktiKerja(savedData.buktiKerja || "Bukti Kerja Pekerjaan Pemeliharaan dan Perawatan Jaringan Dokumentasi dan Informasi Hukum (JDIH) bulan September 2024.");
      setPresentasePenyedia(savedData.presentasePenyedia || "75%");
      setLokasiPekerjaan(savedData.lokasiPekerjaan || "Jakarta");
      setInstansiPenerima(savedData.instansiPenerima || "Badan Intelijen Negara");
      setTtdKiriJabatan1(savedData.ttdKiriJabatan1 || "Kepala Badan Intelijen Negara");
      setTtdKiriJabatan2(savedData.ttdKiriJabatan2 || "Pejabat Pembuat Komitmen");
      setTtdKiriNama(savedData.ttdKiriNama || currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
      setTtdKananInstansi(savedData.ttdKananInstansi || currentDoc.pihak_eksternal || "PT. Asia Sistem Indonesia");
      setTtdKananJabatan(savedData.ttdKananJabatan || "Direktur");
      setTtdKananNama(savedData.ttdKananNama || "Rizky Detha");
      setBastPenyelesaianNomor(savedData.bastPenyelesaianNomor || "BAPP-2406 / XI /2024");
      setBastPenyelesaianTanggal(savedData.bastPenyelesaianTanggal || "29 November 2024");
      setBastPeriodePekerjaan(savedData.bastPeriodePekerjaan || "bulan September s.d. November 2024");
      setBapTanggalSurat(savedData.bapTanggalSurat || "02 Desember 2024");
      setBapDasarList(savedData.bapDasarList || [
        "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
        "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
      ]);
      setBapPeriodePembayaran(savedData.bapPeriodePembayaran || "bulan September s/d November 2024");
      setBapNilaiPembayaranAngka(savedData.bapNilaiPembayaranAngka || "134.259.000");
      setBapNilaiPembayaranTerbilang(
        savedData.bapNilaiPembayaranTerbilang || "Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah"
      );
      setBapKppn(savedData.bapKppn || "Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V");
      setBapNilaiKontrak(savedData.bapNilaiKontrak || "537.036.000,-");
      setBapNilaiBapLalu(savedData.bapNilaiBapLalu || "358.024.000,-");
      setBapNilaiPekerjaanSaatIni(savedData.bapNilaiPekerjaanSaatIni || "134.259.000,-");
      setBapDikurangiLalu(savedData.bapDikurangiLalu || "358.024.000,-");
      setBapSisaPembayaran(savedData.bapSisaPembayaran || "44.753.000,-");
      setBapNilaiDibayarkan(savedData.bapNilaiDibayarkan || "134.259.000,-");
      setBapTotalBapIni(savedData.bapTotalBapIni || "492.283.000,-");
      setIncludeMaterai(savedData.includeMaterai !== false);
    } else {
      setInstansi("BADAN INTELIJEN NEGARA");
      setJudulSurat(getDefaultTitle(type));
      setNomorDokumen(
        type === "BAST"
          ? "BAST- 1969 / XI / 2024"
          : type === "BAP"
          ? "BAP- 2026/ XII / 2024"
          : `${type}-${currentDoc.id || "2079"} / IX / 2024`
      );
      setNamaPekerjaan(currentDoc.perihal || currentDoc.nama_kegiatan || "Pemeliharaan dan Perawatan Jaringan Dokumentasi dan Informasi Hukum (JDIH)");
      setBebanDipa("ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024");
      setHari(type === "BAST" ? "Jumat" : "Senin");
      setTanggalTerbilang(type === "BAST" ? "Dua Puluh Sembilan" : type === "BAP" ? "Dua" : "Tiga Puluh");
      setBulanTerbilang(type === "BAST" ? "November" : type === "BAP" ? "Desember" : "September");
      setTahunTerbilang("Dua Ribu Dua Puluh Empat");
      setPihak1Nama(currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
      setPihak1Jabatan("Pejabat Pembuat Komitmen BIN");
      setPihak1Alamat("Jalan Seno Raya Pejaten Timur Pasar Minggu Jakarta Selatan");
      setPihak1AtasNama(
        type === "BAP"
          ? "Badan Intelijen Negara, yang untuk selanjutnya disebut PPK"
          : "Badan Intelijen Negara, selanjutnya disebut PPK."
      );
      setPihak2Nama("Rizky Detha");
      setPihak2Jabatan(currentDoc.pihak_eksternal ? `Direktur ${currentDoc.pihak_eksternal}` : "Direktur PT. Asia Sistem Indonesia");
      setPihak2Alamat("Gedung Sentral Senayan II Lt. 16, Jl. Asia Afrika No. 8, Jakarta Pusat 10270");
      setPihak2AtasNama(
        type === "BAP"
          ? `PT. Asia Sistem Indonesia, yang untuk selanjutnya disebut PENYEDIA`
          : (currentDoc.pihak_eksternal ? `${currentDoc.pihak_eksternal}, yang selanjutnya disebut PENYEDIA.` : "PT. Asia Sistem Indonesia, yang selanjutnya disebut PENYEDIA.")
      );
      setSuratPerjanjian(currentDoc.nomor_surat ? `Surat Perjanjian Nomor : ${currentDoc.nomor_surat} tanggal 8 Januari 2024;` : "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;");
      setBuktiKerja("Bukti Kerja Pekerjaan Pemeliharaan dan Perawatan Jaringan Dokumentasi dan Informasi Hukum (JDIH) bulan September 2024.");
      setPresentasePenyedia(type === "BAST" ? "91.67%" : "75%");
      setLokasiPekerjaan("Jakarta");
      setInstansiPenerima("Badan Intelijen Negara");
      setBastPenyelesaianNomor("BAPP-2406 / XI /2024");
      setBastPenyelesaianTanggal("29 November 2024");
      setBastPeriodePekerjaan("bulan September s.d. November 2024");
      setBapTanggalSurat("02 Desember 2024");
      setBapDasarList([
        "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
        "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
      ]);
      setBapPeriodePembayaran("bulan September s/d November 2024");
      setBapNilaiPembayaranAngka("134.259.000");
      setBapNilaiPembayaranTerbilang(
        "Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah"
      );
      setBapKppn("Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V");
      setBapNilaiKontrak("537.036.000,-");
      setBapNilaiBapLalu("358.024.000,-");
      setBapNilaiPekerjaanSaatIni("134.259.000,-");
      setBapDikurangiLalu("358.024.000,-");
      setBapSisaPembayaran("44.753.000,-");
      setBapNilaiDibayarkan("134.259.000,-");
      setBapTotalBapIni("492.283.000,-");
      setTtdKiriJabatan1("Kepala Badan Intelijen Negara");
      setTtdKiriJabatan2("Pejabat Pembuat Komitmen");
      setTtdKiriNama(currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
      setTtdKananInstansi(currentDoc.pihak_eksternal || "PT. Asia Sistem Indonesia");
      setTtdKananJabatan("Direktur");
      setTtdKananNama("Rizky Detha");
      setIncludeMaterai(true);
    }
  };

  if (!isOpen || !doc) return null;

  // Handler Generate Dokumen & Buka PDF Langsung
  const handleGenerateAndExport = async () => {
    const currentFormData = {
      instansi,
      judulSurat,
      nomorDokumen,
      namaPekerjaan,
      bebanDipa,
      hari,
      tanggalTerbilang,
      bulanTerbilang,
      tahunTerbilang,
      pihak1Nama,
      pihak1Jabatan,
      pihak1Alamat,
      pihak1AtasNama,
      pihak2Nama,
      pihak2Jabatan,
      pihak2Alamat,
      pihak2AtasNama,
      suratPerjanjian,
      buktiKerja,
      presentasePenyedia,
      lokasiPekerjaan,
      instansiPenerima,
      bastPenyelesaianNomor,
      bastPenyelesaianTanggal,
      bastPeriodePekerjaan,
      bapTanggalSurat,
      bapDasarList,
      bapPeriodePembayaran,
      bapNilaiPembayaranAngka,
      bapNilaiPembayaranTerbilang,
      bapKppn,
      bapNilaiKontrak,
      bapNilaiBapLalu,
      bapNilaiPekerjaanSaatIni,
      bapDikurangiLalu,
      bapSisaPembayaran,
      bapNilaiDibayarkan,
      bapTotalBapIni,
      ttdKiriJabatan1,
      ttdKiriJabatan2,
      ttdKiriNama,
      ttdKananInstansi,
      ttdKananJabatan,
      ttdKananNama,
      includeMaterai,
    };

    try {
      setIsSubmitting(true);
      await sipanduApi.saveOfficialDoc(doc.id, {
        type: docType,
        formData: currentFormData,
      });

      // Buka print preview PDF
      printOfficialDoc(doc, docType, currentFormData);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal menyimpan dokumen resmi:", err);
      printOfficialDoc(doc, docType, currentFormData);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !doc) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in font-sans">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col z-[10000]">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4.5 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                  Formulir Parameter: {judulSurat}
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Lengkapi atau sesuaikan rincian data sebelum berkas resmi di-generate dan dikunci.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Top Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Dokumen yang akan dibuat:</span>
            <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-xs shadow-xs">
              {docType}
            </span>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-700">
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              1. Header & Judul Berkas (Kop Surat)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Instansi Atas</label>
                <input
                  type="text"
                  value={instansi}
                  onChange={(e) => setInstansi(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Dokumen</label>
                <input
                  type="text"
                  value={judulSurat}
                  onChange={(e) => setJudulSurat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Dokumen</label>
                <input
                  type="text"
                  value={nomorDokumen}
                  onChange={(e) => setNomorDokumen(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Beban DIPA</label>
                <input
                  type="text"
                  value={bebanDipa}
                  onChange={(e) => setBebanDipa(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">Nama Pekerjaan (Tentang)</label>
                <textarea
                  rows={2}
                  value={namaPekerjaan}
                  onChange={(e) => setNamaPekerjaan(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Bagian 2: Hari & Tanggal Pelaksanaan (Format Terbilang) */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-600"></span>
              2. Hari & Tanggal Pelaksanaan
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hari</label>
                <input
                  type="text"
                  value={hari}
                  onChange={(e) => setHari(e.target.value)}
                  placeholder="Senin"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal (Terbilang)</label>
                <input
                  type="text"
                  value={tanggalTerbilang}
                  onChange={(e) => setTanggalTerbilang(e.target.value)}
                  placeholder="Tiga Puluh"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Bulan</label>
                <input
                  type="text"
                  value={bulanTerbilang}
                  onChange={(e) => setBulanTerbilang(e.target.value)}
                  placeholder="September"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun (Terbilang)</label>
                <input
                  type="text"
                  value={tahunTerbilang}
                  onChange={(e) => setTahunTerbilang(e.target.value)}
                  placeholder="Dua Ribu Dua Puluh Empat"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Bagian 3: Pihak Pertama (PPK) & Pihak Kedua (Penyedia) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pihak 1 (PPK) */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                Pihak 1: PPK
              </h3>
              <div className="space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={pihak1Nama}
                    onChange={(e) => setPihak1Nama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan</label>
                  <input
                    type="text"
                    value={pihak1Jabatan}
                    onChange={(e) => setPihak1Jabatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Kantor</label>
                  <input
                    type="text"
                    value={pihak1Alamat}
                    onChange={(e) => setPihak1Alamat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bertindak untuk dan atas nama</label>
                  <input
                    type="text"
                    value={pihak1AtasNama}
                    onChange={(e) => setPihak1AtasNama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Pihak 2 (Penyedia) */}
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                Pihak 2: Penyedia
              </h3>
              <div className="space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Pimpinan / Direktur</label>
                  <input
                    type="text"
                    value={pihak2Nama}
                    onChange={(e) => setPihak2Nama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jabatan & Perusahaan</label>
                  <input
                    type="text"
                    value={pihak2Jabatan}
                    onChange={(e) => setPihak2Jabatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alamat Kantor Penyedia</label>
                  <input
                    type="text"
                    value={pihak2Alamat}
                    onChange={(e) => setPihak2Alamat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bertindak untuk dan atas nama</label>
                  <input
                    type="text"
                    value={pihak2AtasNama}
                    onChange={(e) => setPihak2AtasNama(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bagian 3: Dasar & Detail Pekerjaan */}
          {docType === "BAST" ? (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                3. Pernyataan Serah Terima Pekerjaan (PPK & PENYEDIA)
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Presentase Pekerjaan Diserahkan / Diterima</label>
                    <input
                      type="text"
                      value={presentasePenyedia}
                      onChange={(e) => setPresentasePenyedia(e.target.value)}
                      placeholder="Contoh: 91.67%"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Periode Pekerjaan</label>
                    <input
                      type="text"
                      value={bastPeriodePekerjaan}
                      onChange={(e) => setBastPeriodePekerjaan(e.target.value)}
                      placeholder="Contoh: bulan September s.d. November 2024"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dasar Berita Acara Penyelesaian Pekerjaan (Nomor BAPP)</label>
                    <input
                      type="text"
                      value={bastPenyelesaianNomor}
                      onChange={(e) => setBastPenyelesaianNomor(e.target.value)}
                      placeholder="Contoh: BAPP-2406 / XI /2024"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Berita Acara Penyelesaian Pekerjaan (BAPP)</label>
                    <input
                      type="text"
                      value={bastPenyelesaianTanggal}
                      onChange={(e) => setBastPenyelesaianTanggal(e.target.value)}
                      placeholder="Contoh: 29 November 2024"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : docType === "BAP" ? (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                3. Dasar Pembayaran & Rincian Pembayaran (BAP)
              </h3>

              {/* Dasar-dasar Berdasarkan hal-hal sebagai berikut */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">Daftar Dasar Berkas (Surat Perjanjian, BAPP, BAST):</label>
                {bapDasarList.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 text-center font-bold text-slate-500">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const updated = [...bapDasarList];
                        updated[idx] = e.target.value;
                        setBapDasarList(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium text-xs"
                    />
                  </div>
                ))}
              </div>

              {/* Uraian Hak Pembayaran Penyedia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periode Pembayaran Penyedia</label>
                  <input
                    type="text"
                    value={bapPeriodePembayaran}
                    onChange={(e) => setBapPeriodePembayaran(e.target.value)}
                    placeholder="Contoh: bulan September s/d November 2024"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nilai Pembayaran (Rp)</label>
                  <input
                    type="text"
                    value={bapNilaiPembayaranAngka}
                    onChange={(e) => setBapNilaiPembayaranAngka(e.target.value)}
                    placeholder="Contoh: 134.259.000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nilai Terbilang</label>
                  <input
                    type="text"
                    value={bapNilaiPembayaranTerbilang}
                    onChange={(e) => setBapNilaiPembayaranTerbilang(e.target.value)}
                    placeholder="Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tujuan Pembayaran KPPN</label>
                  <input
                    type="text"
                    value={bapKppn}
                    onChange={(e) => setBapKppn(e.target.value)}
                    placeholder="Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              {/* Rincian Tabel Pembayaran */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">Tabel Rincian Pembayaran (Jumlah Rp):</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">1. Nilai Kontrak</label>
                    <input
                      type="text"
                      value={bapNilaiKontrak}
                      onChange={(e) => setBapNilaiKontrak(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">2. Nilai Pembayaran s/d BAP Lalu</label>
                    <input
                      type="text"
                      value={bapNilaiBapLalu}
                      onChange={(e) => setBapNilaiBapLalu(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">3a. Nilai Pekerjaan pada BAP ini</label>
                    <input
                      type="text"
                      value={bapNilaiPekerjaanSaatIni}
                      onChange={(e) => setBapNilaiPekerjaanSaatIni(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">3a. Dikurangi Nilai Pekerjaan Berita Acara Lalu</label>
                    <input
                      type="text"
                      value={bapDikurangiLalu}
                      onChange={(e) => setBapDikurangiLalu(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">3a. Nilai Sisa Pembayaran s.d Pekerjaan Saat Ini</label>
                    <input
                      type="text"
                      value={bapSisaPembayaran}
                      onChange={(e) => setBapSisaPembayaran(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">3b. Nilai Dibayarkan (Termasuk Pajak)</label>
                    <input
                      type="text"
                      value={bapNilaiDibayarkan}
                      onChange={(e) => setBapNilaiDibayarkan(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">4. Nilai Pembayaran s/d BAP Ini (Termasuk Pajak)</label>
                    <input
                      type="text"
                      value={bapTotalBapIni}
                      onChange={(e) => setBapTotalBapIni(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                3. Dasar & Uraian Penyelesaian Pekerjaan
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dasar 1: Surat Perjanjian</label>
                  <input
                    type="text"
                    value={suratPerjanjian}
                    onChange={(e) => setSuratPerjanjian(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dasar 2: Bukti Kerja</label>
                  <input
                    type="text"
                    value={buktiKerja}
                    onChange={(e) => setBuktiKerja(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Presentase Selesai</label>
                    <input
                      type="text"
                      value={presentasePenyedia}
                      onChange={(e) => setPresentasePenyedia(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lokasi Pekerjaan</label>
                    <input
                      type="text"
                      value={lokasiPekerjaan}
                      onChange={(e) => setLokasiPekerjaan(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Instansi Penerima</label>
                    <input
                      type="text"
                      value={instansiPenerima}
                      onChange={(e) => setInstansiPenerima(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bagian 4: Tanda Tangan */}
          <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                4. Penandatanganan Dokumen
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="font-extrabold text-slate-800">Tanda Tangan Kiri (PPK)</span>
                <input
                  type="text"
                  value={ttdKiriJabatan1}
                  onChange={(e) => setTtdKiriJabatan1(e.target.value)}
                  placeholder="Jabatan 1"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  value={ttdKiriJabatan2}
                  onChange={(e) => setTtdKiriJabatan2(e.target.value)}
                  placeholder="Jabatan 2"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  value={ttdKiriNama}
                  onChange={(e) => setTtdKiriNama(e.target.value)}
                  placeholder="Nama Terang"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-slate-800">Tanda Tangan Kanan (Penyedia)</span>
                <input
                  type="text"
                  value={ttdKananInstansi}
                  onChange={(e) => setTtdKananInstansi(e.target.value)}
                  placeholder="Instansi / PT"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  value={ttdKananJabatan}
                  onChange={(e) => setTtdKananJabatan(e.target.value)}
                  placeholder="Jabatan"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium"
                />
                <input
                  type="text"
                  value={ttdKananNama}
                  onChange={(e) => setTtdKananNama(e.target.value)}
                  placeholder="Nama Terang"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 font-medium">
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGenerateAndExport}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              <span>{isSubmitting ? "Menyimpan..." : "Generate & Cetak PDF"}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  if (typeof document !== "undefined" && mounted) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
