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
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Synced states based on image template
  const [instansi, setInstansi] = useState("BADAN INTELIJEN NEGARA");
  const [judulSurat, setJudulSurat] = useState("BERITA ACARA PENYELESAIAN PEKERJAAN");
  const [nomorDokumen, setNomorDokumen] = useState("");
  const [namaPekerjaan, setNamaPekerjaan] = useState("");
  const [bebanDipa, setBebanDipa] = useState("");

  // Paragraf Pembuka
  const [hari, setHari] = useState("");
  const [tanggalTerbilang, setTanggalTerbilang] = useState("");
  const [bulanTerbilang, setBulanTerbilang] = useState("");
  const [tahunTerbilang, setTahunTerbilang] = useState("");

  // Pihak 1 (PPK)
  const [pihak1Nama, setPihak1Nama] = useState("");
  const [pihak1Jabatan, setPihak1Jabatan] = useState("");
  const [pihak1Alamat, setPihak1Alamat] = useState("");
  const [pihak1AtasNama, setPihak1AtasNama] = useState("");

  // Pihak 2 (Penyedia)
  const [pihak2Nama, setPihak2Nama] = useState("");
  const [pihak2Jabatan, setPihak2Jabatan] = useState("");
  const [pihak2Alamat, setPihak2Alamat] = useState("");
  const [pihak2AtasNama, setPihak2AtasNama] = useState("");

  // Dasar-dasar Berdasarkan hal-hal sebagai berikut:
  const [suratPerjanjian, setSuratPerjanjian] = useState("");
  const [buktiKerja, setBuktiKerja] = useState("");

  // Uraian & Prosentase
  const [presentasePenyedia, setPresentasePenyedia] = useState("");
  const [lokasiPekerjaan, setLokasiPekerjaan] = useState("Jakarta");
  const [instansiPenerima, setInstansiPenerima] = useState("Badan Intelijen Negara");

  // Field Spesifik BAST
  const [bastPenyelesaianNomor, setBastPenyelesaianNomor] = useState("");
  const [bastPenyelesaianTanggal, setBastPenyelesaianTanggal] = useState("");
  const [bastPeriodePekerjaan, setBastPeriodePekerjaan] = useState("");

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
  const [ttdKiriNama, setTtdKiriNama] = useState("");

  const [ttdKananInstansi, setTtdKananInstansi] = useState("");
  const [ttdKananJabatan, setTtdKananJabatan] = useState("");
  const [ttdKananNama, setTtdKananNama] = useState("");
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
    setErrors({});
    const savedData = currentDoc.official_docs_data?.[type]?.formData;

    // Cari lampiran invoice / dokumen tagihan untuk mengambil metadata pihak penyedia
    const invoiceAtt = (currentDoc.attachments || []).find((att) => {
      const docTypeLower = (att.document_type || "").toLowerCase();
      const fileNameLower = (att.file_name || "").toLowerCase();
      return docTypeLower.includes("invoice") || fileNameLower.includes("invoice");
    });

    const invoiceParams = (invoiceAtt?.params || invoiceAtt?.metadata || {}) as Record<string, any>;

    // Helper untuk mencari nilai dari invoice metadata
    const getInvoiceValue = (keys: string[]): string => {
      for (const k of keys) {
        const normK = k.toLowerCase();
        for (const [paramK, paramV] of Object.entries(invoiceParams)) {
          if (paramK.toLowerCase() === normK && paramV) {
            return String(paramV).trim();
          }
        }
      }
      return "";
    };

    // Ekstrak metadata invoice untuk pihak penyedia
    const invoicePerusahaan =
      getInvoiceValue(["Perusahaan / Pihak Eksternal", "Nama Perusahaan", "Perusahaan", "Company", "Nama Pengusaha Kena Pajak"]) ||
      invoiceAtt?.nama_perusahaan ||
      currentDoc.pihak_eksternal ||
      "";

    const invoicePimpinan =
      getInvoiceValue(["Approved By", "Approved by", "Nama Pimpinan", "Direktur", "Nama Direktur", "Pimpinan", "Penandatangan"]) ||
      "";

    const invoiceJabatan =
      getInvoiceValue(["Jabatan", "Position", "Title"]) ||
      (invoicePerusahaan ? `Direktur ${invoicePerusahaan}` : "");

    const invoiceJabatanPerusahaan =
      invoicePimpinan && invoiceJabatan
        ? `${invoiceJabatan}`
        : invoicePerusahaan
        ? `Direktur ${invoicePerusahaan}`
        : "";

    const invoiceAlamat =
      getInvoiceValue(["Alamat Perusahaan", "Alamat Kantor", "Alamat", "Address", "Alamat Kantor Penyedia"]) ||
      "";

    const invoiceAtasNama = invoicePerusahaan
      ? `${invoicePerusahaan}, yang selanjutnya disebut PENYEDIA.`
      : "";

    const invoiceTtdKananInstansi = invoicePerusahaan;
    const invoiceTtdKananJabatan = getInvoiceValue(["Jabatan"]) || "Direktur";
    const invoiceTtdKananNama = invoicePimpinan;

    if (savedData) {
      setInstansi(savedData.instansi || "BADAN INTELIJEN NEGARA");
      setJudulSurat(savedData.judulSurat || getDefaultTitle(type));
      setNomorDokumen(savedData.nomorDokumen || "");
      setNamaPekerjaan(savedData.namaPekerjaan || "");
      setBebanDipa(savedData.bebanDipa || "");
      setHari(savedData.hari || "");
      setTanggalTerbilang(savedData.tanggalTerbilang || "");
      setBulanTerbilang(savedData.bulanTerbilang || "");
      setTahunTerbilang(savedData.tahunTerbilang || "");
      setPihak1Nama(savedData.pihak1Nama || "");
      setPihak1Jabatan(savedData.pihak1Jabatan || "");
      setPihak1Alamat(savedData.pihak1Alamat || "");
      setPihak1AtasNama(savedData.pihak1AtasNama || "");

      // Pihak 2 (Penyedia)
      setPihak2Nama(savedData.pihak2Nama || invoicePimpinan || "");
      setPihak2Jabatan(savedData.pihak2Jabatan || invoiceJabatanPerusahaan || "");
      setPihak2Alamat(savedData.pihak2Alamat || invoiceAlamat || "");
      setPihak2AtasNama(savedData.pihak2AtasNama || invoiceAtasNama || "");

      setSuratPerjanjian(savedData.suratPerjanjian || "");
      setBuktiKerja(savedData.buktiKerja || "");
      setPresentasePenyedia(savedData.presentasePenyedia || "");
      setLokasiPekerjaan(savedData.lokasiPekerjaan || "Jakarta");
      setInstansiPenerima(savedData.instansiPenerima || "Badan Intelijen Negara");
      setTtdKiriJabatan1(savedData.ttdKiriJabatan1 || "Kepala Badan Intelijen Negara");
      setTtdKiriJabatan2(savedData.ttdKiriJabatan2 || "Pejabat Pembuat Komitmen");
      setPihak1Nama(savedData.ttdKiriNama || savedData.pihak1Nama || "");
      setTtdKiriNama(savedData.ttdKiriNama || savedData.pihak1Nama || "");

      setTtdKananInstansi(savedData.ttdKananInstansi || invoiceTtdKananInstansi || "");
      setTtdKananJabatan(savedData.ttdKananJabatan || invoiceTtdKananJabatan || "Direktur");
      setTtdKananNama(savedData.ttdKananNama || invoiceTtdKananNama || "");

      setBastPenyelesaianNomor(savedData.bastPenyelesaianNomor || "");
      setBastPenyelesaianTanggal(savedData.bastPenyelesaianTanggal || "");
      setBastPeriodePekerjaan(savedData.bastPeriodePekerjaan || "");
      setBapTanggalSurat(savedData.bapTanggalSurat || "");
      setBapDasarList(savedData.bapDasarList || [
        "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
        "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
        "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
      ]);
      setBapPeriodePembayaran(savedData.bapPeriodePembayaran || "");
      setBapNilaiPembayaranAngka(savedData.bapNilaiPembayaranAngka || "");
      setBapNilaiPembayaranTerbilang(savedData.bapNilaiPembayaranTerbilang || "");
      setBapKppn(savedData.bapKppn || "Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V");
      setBapNilaiKontrak(savedData.bapNilaiKontrak || "");
      setBapNilaiBapLalu(savedData.bapNilaiBapLalu || "");
      setBapNilaiPekerjaanSaatIni(savedData.bapNilaiPekerjaanSaatIni || "");
      setBapDikurangiLalu(savedData.bapDikurangiLalu || "");
      setBapSisaPembayaran(savedData.bapSisaPembayaran || "");
      setBapNilaiDibayarkan(savedData.bapNilaiDibayarkan || "");
      setBapTotalBapIni(savedData.bapTotalBapIni || "");
      setIncludeMaterai(savedData.includeMaterai !== false);
    } else {
      setInstansi("BADAN INTELIJEN NEGARA");
      setJudulSurat(getDefaultTitle(type));

      // Untuk form BAST, kosongkan seluruh field berikut sesuai instruksi pengguna:
      if (type === "BAST") {
        setNomorDokumen("");
        setNamaPekerjaan("");
        setBebanDipa("");
        setHari("");
        setTanggalTerbilang("");
        setBulanTerbilang("");
        setTahunTerbilang("");
        setPihak1Nama("");
        setPihak1Jabatan("");
        setPihak1Alamat("");
        setPihak1AtasNama("");
        setPresentasePenyedia("");
        setBastPenyelesaianNomor("");
        setBastPeriodePekerjaan("");
        setBastPenyelesaianTanggal("");
        setTtdKiriNama("");

        // Pihak 2 (Penyedia) & TTD Kanan diambil dari metadata invoice
        setPihak2Nama(invoicePimpinan);
        setPihak2Jabatan(invoiceJabatanPerusahaan);
        setPihak2Alamat(invoiceAlamat);
        setPihak2AtasNama(invoiceAtasNama);
        setTtdKananInstansi(invoiceTtdKananInstansi);
        setTtdKananJabatan(invoiceTtdKananJabatan);
        setTtdKananNama(invoiceTtdKananNama);
      } else {
        // Untuk selain BAST (BAP/BAPP)
        setNomorDokumen(type === "BAP" ? "BAP- 2026/ XII / 2024" : `${type}-${currentDoc.id || "2079"} / IX / 2024`);
        setNamaPekerjaan(currentDoc.perihal || currentDoc.nama_kegiatan || "");
        setBebanDipa("ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024");
        setHari("Senin");
        setTanggalTerbilang(type === "BAP" ? "Dua" : "Tiga Puluh");
        setBulanTerbilang(type === "BAP" ? "Desember" : "September");
        setTahunTerbilang("Dua Ribu Dua Puluh Empat");
        setPihak1Nama(currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
        setPihak1Jabatan("Pejabat Pembuat Komitmen BIN");
        setPihak1Alamat("Jalan Seno Raya Pejaten Timur Pasar Minggu Jakarta Selatan");
        setPihak1AtasNama(
          type === "BAP"
            ? "Badan Intelijen Negara, yang untuk selanjutnya disebut PPK"
            : "Badan Intelijen Negara, selanjutnya disebut PPK."
        );
        setPihak2Nama(invoicePimpinan);
        setPihak2Jabatan(invoiceJabatanPerusahaan || (currentDoc.pihak_eksternal ? `Direktur ${currentDoc.pihak_eksternal}` : ""));
        setPihak2Alamat(invoiceAlamat || "Gedung Sentral Senayan II Lt. 16, Jl. Asia Afrika No. 8, Jakarta Pusat 10270");
        setPihak2AtasNama(
          invoiceAtasNama || (currentDoc.pihak_eksternal ? `${currentDoc.pihak_eksternal}, yang selanjutnya disebut PENYEDIA.` : "")
        );
        setSuratPerjanjian(currentDoc.nomor_surat ? `Surat Perjanjian Nomor : ${currentDoc.nomor_surat} tanggal 8 Januari 2024;` : "");
        setBuktiKerja("");
        setPresentasePenyedia("75%");
        setLokasiPekerjaan("Jakarta");
        setInstansiPenerima("Badan Intelijen Negara");
        setBastPenyelesaianNomor("");
        setBastPenyelesaianTanggal("");
        setBastPeriodePekerjaan("");
        setBapTanggalSurat("02 Desember 2024");
        setBapDasarList([
          "Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;",
          "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2079/IX/2024 tanggal 30 September 2024;",
          "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2249/X/2024 tanggal 31 Oktober 2024;",
          "Berita Acara Penyelesaian Pekerjaan Nomor : BAPP-2406/XI/2024 tanggal 29 November 2024;",
          "Berita Acara Serah Terima Pekerjaan Nomor : BAST-1969/XI/2024 tanggal 29 November 2024.",
        ]);
        setBapPeriodePembayaran("bulan September s/d November 2024");
        setBapNilaiPembayaranAngka(currentDoc.nilai_pembayaran ? new Intl.NumberFormat("id-ID").format(currentDoc.nilai_pembayaran) : "");
        setBapNilaiPembayaranTerbilang("");
        setBapKppn("Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V");
        setBapNilaiKontrak("");
        setBapNilaiBapLalu("");
        setBapNilaiPekerjaanSaatIni("");
        setBapDikurangiLalu("");
        setBapSisaPembayaran("");
        setBapNilaiDibayarkan("");
        setBapTotalBapIni("");
        setTtdKiriJabatan1("Kepala Badan Intelijen Negara");
        setTtdKiriJabatan2("Pejabat Pembuat Komitmen");
        setTtdKiriNama(currentDoc.ppk_name || "Edy Susanto, S.H., M.H.");
        setTtdKananInstansi(invoiceTtdKananInstansi || currentDoc.pihak_eksternal || "");
        setTtdKananJabatan(invoiceTtdKananJabatan || "Direktur");
        setTtdKananNama(invoiceTtdKananNama);
      }
      setIncludeMaterai(true);
    }
  };

  if (!isOpen || !doc) return null;

  // Handler Generate Dokumen & Buka PDF Langsung dengan Skema Validasi
  const handleGenerateAndExport = async () => {
    // Validasi input khusus dokumen BAST (semua input wajib diisi)
    if (docType === "BAST") {
      const newErrors: Record<string, string> = {};

      if (!nomorDokumen.trim()) newErrors.nomorDokumen = "Nomor Dokumen wajib diisi";
      if (!namaPekerjaan.trim()) newErrors.namaPekerjaan = "Nama Pekerjaan (Tentang) wajib diisi";
      if (!bebanDipa.trim()) newErrors.bebanDipa = "Beban DIPA wajib diisi";
      if (!hari.trim()) newErrors.hari = "Hari wajib diisi";
      if (!tanggalTerbilang.trim()) newErrors.tanggalTerbilang = "Tanggal (Terbilang) wajib diisi";
      if (!bulanTerbilang.trim()) newErrors.bulanTerbilang = "Bulan wajib diisi";
      if (!tahunTerbilang.trim()) newErrors.tahunTerbilang = "Tahun (Terbilang) wajib diisi";
      if (!pihak1Nama.trim()) newErrors.pihak1Nama = "Nama Lengkap & Gelar PPK wajib diisi";
      if (!pihak1Jabatan.trim()) newErrors.pihak1Jabatan = "Jabatan PPK wajib diisi";
      if (!pihak1Alamat.trim()) newErrors.pihak1Alamat = "Alamat Kantor PPK wajib diisi";
      if (!pihak1AtasNama.trim()) newErrors.pihak1AtasNama = "Bertindak untuk dan atas nama (PPK) wajib diisi";
      if (!presentasePenyedia.trim()) newErrors.presentasePenyedia = "Presentase Pekerjaan Diserahkan / Diterima wajib diisi";
      if (!bastPenyelesaianNomor.trim()) newErrors.bastPenyelesaianNomor = "Dasar Berita Acara Penyelesaian Pekerjaan (Nomor BAPP) wajib diisi";
      if (!bastPeriodePekerjaan.trim()) newErrors.bastPeriodePekerjaan = "Periode Pekerjaan wajib diisi";
      if (!bastPenyelesaianTanggal.trim()) newErrors.bastPenyelesaianTanggal = "Tanggal Berita Acara Penyelesaian Pekerjaan (BAPP) wajib diisi";
      if (!ttdKiriNama.trim()) newErrors.ttdKiriNama = "Tanda Tangan Kiri (PPK) wajib diisi";
      if (!pihak2Nama.trim()) newErrors.pihak2Nama = "Nama Pimpinan / Direktur wajib diisi";
      if (!pihak2Jabatan.trim()) newErrors.pihak2Jabatan = "Jabatan & Perusahaan wajib diisi";
      if (!pihak2Alamat.trim()) newErrors.pihak2Alamat = "Alamat Kantor Penyedia wajib diisi";
      if (!pihak2AtasNama.trim()) newErrors.pihak2AtasNama = "Bertindak untuk dan atas nama (Penyedia) wajib diisi";
      if (!ttdKananNama.trim()) newErrors.ttdKananNama = "Tanda Tangan Kanan (Penyedia) wajib diisi";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    setErrors({});

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
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Dokumen {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={nomorDokumen}
                  onChange={(e) => {
                    setNomorDokumen(e.target.value);
                    if (errors.nomorDokumen) setErrors((prev) => ({ ...prev, nomorDokumen: "" }));
                  }}
                  placeholder="Masukkan Nomor Dokumen..."
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.nomorDokumen ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.nomorDokumen && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.nomorDokumen}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Beban DIPA {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={bebanDipa}
                  onChange={(e) => {
                    setBebanDipa(e.target.value);
                    if (errors.bebanDipa) setErrors((prev) => ({ ...prev, bebanDipa: "" }));
                  }}
                  placeholder="Contoh: ATAS BEBAN DIPA BIN TAHUN ANGGARAN 2024"
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.bebanDipa ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.bebanDipa && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bebanDipa}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Pekerjaan (Tentang) {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={namaPekerjaan}
                  onChange={(e) => {
                    setNamaPekerjaan(e.target.value);
                    if (errors.namaPekerjaan) setErrors((prev) => ({ ...prev, namaPekerjaan: "" }));
                  }}
                  placeholder="Masukkan Nama Pekerjaan..."
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.namaPekerjaan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.namaPekerjaan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.namaPekerjaan}</p>}
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
                <label className="block font-bold text-slate-700 mb-1">
                  Hari {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={hari}
                  onChange={(e) => {
                    setHari(e.target.value);
                    if (errors.hari) setErrors((prev) => ({ ...prev, hari: "" }));
                  }}
                  placeholder="Contoh: Senin"
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.hari ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.hari && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.hari}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal (Terbilang) {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={tanggalTerbilang}
                  onChange={(e) => {
                    setTanggalTerbilang(e.target.value);
                    if (errors.tanggalTerbilang) setErrors((prev) => ({ ...prev, tanggalTerbilang: "" }));
                  }}
                  placeholder="Contoh: Tiga Puluh"
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.tanggalTerbilang ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.tanggalTerbilang && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.tanggalTerbilang}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Bulan {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={bulanTerbilang}
                  onChange={(e) => {
                    setBulanTerbilang(e.target.value);
                    if (errors.bulanTerbilang) setErrors((prev) => ({ ...prev, bulanTerbilang: "" }));
                  }}
                  placeholder="Contoh: September"
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.bulanTerbilang ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.bulanTerbilang && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bulanTerbilang}</p>}
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tahun (Terbilang) {docType === "BAST" && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={tahunTerbilang}
                  onChange={(e) => {
                    setTahunTerbilang(e.target.value);
                    if (errors.tahunTerbilang) setErrors((prev) => ({ ...prev, tahunTerbilang: "" }));
                  }}
                  placeholder="Contoh: Dua Ribu Dua Puluh Empat"
                  className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                    errors.tahunTerbilang ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.tahunTerbilang && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.tahunTerbilang}</p>}
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Lengkap & Gelar {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak1Nama}
                    onChange={(e) => {
                      setPihak1Nama(e.target.value);
                      if (errors.pihak1Nama) setErrors((prev) => ({ ...prev, pihak1Nama: "" }));
                    }}
                    placeholder="Masukkan Nama Lengkap & Gelar PPK..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak1Nama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak1Nama && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak1Nama}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak1Jabatan}
                    onChange={(e) => {
                      setPihak1Jabatan(e.target.value);
                      if (errors.pihak1Jabatan) setErrors((prev) => ({ ...prev, pihak1Jabatan: "" }));
                    }}
                    placeholder="Contoh: Pejabat Pembuat Komitmen BIN"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak1Jabatan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak1Jabatan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak1Jabatan}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Kantor {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak1Alamat}
                    onChange={(e) => {
                      setPihak1Alamat(e.target.value);
                      if (errors.pihak1Alamat) setErrors((prev) => ({ ...prev, pihak1Alamat: "" }));
                    }}
                    placeholder="Masukkan Alamat Kantor PPK..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak1Alamat ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak1Alamat && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak1Alamat}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bertindak untuk dan atas nama {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak1AtasNama}
                    onChange={(e) => {
                      setPihak1AtasNama(e.target.value);
                      if (errors.pihak1AtasNama) setErrors((prev) => ({ ...prev, pihak1AtasNama: "" }));
                    }}
                    placeholder="Contoh: Badan Intelijen Negara, selanjutnya disebut PPK."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak1AtasNama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak1AtasNama && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak1AtasNama}</p>}
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Pimpinan / Direktur {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak2Nama}
                    onChange={(e) => {
                      setPihak2Nama(e.target.value);
                      if (errors.pihak2Nama) setErrors((prev) => ({ ...prev, pihak2Nama: "" }));
                    }}
                    placeholder="Diambil dari Approved By / Pimpinan Invoice..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Nama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Nama && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Nama}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan & Perusahaan {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak2Jabatan}
                    onChange={(e) => {
                      setPihak2Jabatan(e.target.value);
                      if (errors.pihak2Jabatan) setErrors((prev) => ({ ...prev, pihak2Jabatan: "" }));
                    }}
                    placeholder="Diambil dari Jabatan / Perusahaan Invoice..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Jabatan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Jabatan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Jabatan}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Kantor Penyedia {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak2Alamat}
                    onChange={(e) => {
                      setPihak2Alamat(e.target.value);
                      if (errors.pihak2Alamat) setErrors((prev) => ({ ...prev, pihak2Alamat: "" }));
                    }}
                    placeholder="Diambil dari Alamat Invoice..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Alamat ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Alamat && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Alamat}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bertindak untuk dan atas nama {docType === "BAST" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={pihak2AtasNama}
                    onChange={(e) => {
                      setPihak2AtasNama(e.target.value);
                      if (errors.pihak2AtasNama) setErrors((prev) => ({ ...prev, pihak2AtasNama: "" }));
                    }}
                    placeholder="Contoh: PT..., yang selanjutnya disebut PENYEDIA."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2AtasNama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2AtasNama && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2AtasNama}</p>}
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
                    <label className="block font-bold text-slate-700 mb-1">
                      Presentase Pekerjaan Diserahkan / Diterima <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={presentasePenyedia}
                      onChange={(e) => {
                        setPresentasePenyedia(e.target.value);
                        if (errors.presentasePenyedia) setErrors((prev) => ({ ...prev, presentasePenyedia: "" }));
                      }}
                      placeholder="Contoh: 91.67%"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.presentasePenyedia ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.presentasePenyedia && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.presentasePenyedia}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Periode Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bastPeriodePekerjaan}
                      onChange={(e) => {
                        setBastPeriodePekerjaan(e.target.value);
                        if (errors.bastPeriodePekerjaan) setErrors((prev) => ({ ...prev, bastPeriodePekerjaan: "" }));
                      }}
                      placeholder="Contoh: bulan September s.d. November 2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.bastPeriodePekerjaan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bastPeriodePekerjaan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bastPeriodePekerjaan}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Dasar Berita Acara Penyelesaian Pekerjaan (Nomor BAPP) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bastPenyelesaianNomor}
                      onChange={(e) => {
                        setBastPenyelesaianNomor(e.target.value);
                        if (errors.bastPenyelesaianNomor) setErrors((prev) => ({ ...prev, bastPenyelesaianNomor: "" }));
                      }}
                      placeholder="Contoh: BAPP-2406 / XI /2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.bastPenyelesaianNomor ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bastPenyelesaianNomor && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bastPenyelesaianNomor}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Berita Acara Penyelesaian Pekerjaan (BAPP) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bastPenyelesaianTanggal}
                      onChange={(e) => {
                        setBastPenyelesaianTanggal(e.target.value);
                        if (errors.bastPenyelesaianTanggal) setErrors((prev) => ({ ...prev, bastPenyelesaianTanggal: "" }));
                      }}
                      placeholder="Contoh: 29 November 2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.bastPenyelesaianTanggal ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bastPenyelesaianTanggal && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bastPenyelesaianTanggal}</p>}
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
                <span className="font-extrabold text-slate-800">
                  Tanda Tangan Kiri (PPK) {docType === "BAST" && <span className="text-red-500">*</span>}
                </span>
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
                  onChange={(e) => {
                    setTtdKiriNama(e.target.value);
                    if (errors.ttdKiriNama) setErrors((prev) => ({ ...prev, ttdKiriNama: "" }));
                  }}
                  placeholder="Nama Terang PPK..."
                  className={`w-full px-3 py-1.5 rounded-lg border bg-white font-bold ${
                    errors.ttdKiriNama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.ttdKiriNama && <p className="text-[10px] text-red-500 font-semibold">{errors.ttdKiriNama}</p>}
              </div>

              <div className="space-y-2">
                <span className="font-extrabold text-slate-800">
                  Tanda Tangan Kanan (Penyedia) {docType === "BAST" && <span className="text-red-500">*</span>}
                </span>
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
                  onChange={(e) => {
                    setTtdKananNama(e.target.value);
                    if (errors.ttdKananNama) setErrors((prev) => ({ ...prev, ttdKananNama: "" }));
                  }}
                  placeholder="Nama Terang Penyedia (Diambil dari Invoice)..."
                  className={`w-full px-3 py-1.5 rounded-lg border bg-white font-bold ${
                    errors.ttdKananNama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.ttdKananNama && <p className="text-[10px] text-red-500 font-semibold">{errors.ttdKananNama}</p>}
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
