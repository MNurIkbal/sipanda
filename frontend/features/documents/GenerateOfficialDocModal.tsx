"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Download, Sparkles, Building2, User, FileText, Calendar, Lock, Plus, Trash2 } from "lucide-react";
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

  // Field Spesifik PPD (Surat Permintaan Pencairan Dana)
  const [ppdKopInstansi, setPpdKopInstansi] = useState("");
  const [ppdAlamatInstansi, setPpdAlamatInstansi] = useState("");
  const [ppdTelpInstansi, setPpdTelpInstansi] = useState("");
  const [ppdEmailInstansi, setPpdEmailInstansi] = useState("");
  const [ppdNomorSurat, setPpdNomorSurat] = useState("");
  const [ppdTujuanPejabat, setPpdTujuanPejabat] = useState("");
  const [ppdTujuanInstansi, setPpdTujuanInstansi] = useState("");
  const [ppdNamaKegiatan, setPpdNamaKegiatan] = useState("");
  const [ppdNomorKontrakSpk, setPpdNomorKontrakSpk] = useState("");
  const [ppdNamaPemohon, setPpdNamaPemohon] = useState("");
  const [ppdUraianKegiatan, setPpdUraianKegiatan] = useState("");
  const [ppdNomorInvoice, setPpdNomorInvoice] = useState("");
  const [ppdTanggalInvoice, setPpdTanggalInvoice] = useState("");
  const [ppdJumlahDiminta, setPpdJumlahDiminta] = useState("");
  const [ppdTerbilang, setPpdTerbilang] = useState("");
  const [ppdNamaBank, setPpdNamaBank] = useState("");
  const [ppdNomorRekening, setPpdNomorRekening] = useState("");
  const [ppdNamaPemilikRekening, setPpdNamaPemilikRekening] = useState("");
  const [ppdKotaTtd, setPpdKotaTtd] = useState("");
  const [ppdTanggalTtd, setPpdTanggalTtd] = useState("");
  const [ppdJabatanPemohonTtd, setPpdJabatanPemohonTtd] = useState("");
  const [ppdNamaLengkapTtd, setPpdNamaLengkapTtd] = useState("");
  const [ppdNipJabatanTtd, setPpdNipJabatanTtd] = useState("");

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

    // Helper untuk mencari nilai dari metadata
    const getParamValue = (paramsObj: Record<string, any>, keys: string[]): string => {
      for (const k of keys) {
        const normK = k.toLowerCase();
        for (const [paramK, paramV] of Object.entries(paramsObj)) {
          if (paramK.toLowerCase() === normK && paramV) {
            return String(paramV).trim();
          }
        }
      }
      return "";
    };

    // Helper untuk mencari nilai dari invoice metadata
    const getInvoiceValue = (keys: string[]): string => getParamValue(invoiceParams, keys);

    // Cari lampiran kuitansi / bukti pembayaran untuk BAP
    const kwitansiAtt = (currentDoc.attachments || []).find((att) => {
      const docTypeLower = (att.document_type || "").toLowerCase();
      const fileNameLower = (att.file_name || "").toLowerCase();
      return (
        docTypeLower.includes("kuitansi") ||
        docTypeLower.includes("kwitansi") ||
        fileNameLower.includes("kuitansi") ||
        fileNameLower.includes("kwitansi")
      );
    });

    const kwitansiParams = (kwitansiAtt?.params || kwitansiAtt?.metadata || {}) as Record<string, any>;
    const getKwitansiValue = (keys: string[]): string => getParamValue(kwitansiParams, keys);

    // Metadata dari Kuitansi
    const kwitansiPerusahaan =
      getKwitansiValue(["Perusahaan / Pihak Eksternal", "Nama Perusahaan", "Perusahaan", "Company", "Pihak Eksternal", "Nama Toko / Rekanan", "PT"]) ||
      kwitansiAtt?.nama_perusahaan ||
      currentDoc.pihak_eksternal ||
      "";

    const kwitansiPimpinan =
      getKwitansiValue(["Admin", "Direktur", "Approved By", "Nama Pimpinan", "Nama Direktur", "Pimpinan", "Penandatangan", "Penerima Uang"]) ||
      "";

    const kwitansiJabatan =
      getKwitansiValue(["Jabatan", "Position", "Title"]) ||
      (kwitansiPerusahaan ? `Direktur ${kwitansiPerusahaan}` : "Direktur");

    const kwitansiJabatanPerusahaan =
      kwitansiPimpinan && kwitansiJabatan
        ? kwitansiJabatan
        : kwitansiPerusahaan
        ? `Direktur ${kwitansiPerusahaan}`
        : "Direktur";

    const kwitansiAlamat =
      getKwitansiValue(["Alamat Perusahaan", "Alamat Kantor", "Alamat", "Address", "Alamat Kantor Penyedia"]) ||
      "";

    const kwitansiAtasNama = kwitansiPerusahaan
      ? `${kwitansiPerusahaan}, yang untuk selanjutnya disebut PENYEDIA`
      : "";

    const kwitansiTtdKananInstansi = kwitansiPerusahaan;
    const kwitansiTtdKananJabatan = kwitansiJabatan || "Direktur";
    const kwitansiTtdKananNama = kwitansiPimpinan;

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
      const p2Nama = savedData.pihak2Nama || (type === "BAP" ? (kwitansiPimpinan || invoicePimpinan) : invoicePimpinan) || "";
      const p2Jabatan = savedData.pihak2Jabatan || (type === "BAP" ? (kwitansiJabatanPerusahaan || invoiceJabatanPerusahaan) : invoiceJabatanPerusahaan) || "";
      const p2Alamat = savedData.pihak2Alamat || (type === "BAP" ? (kwitansiAlamat || invoiceAlamat) : invoiceAlamat) || "";
      const p2AtasNama = savedData.pihak2AtasNama || (type === "BAP" ? (kwitansiAtasNama || invoiceAtasNama) : invoiceAtasNama) || "";

      setPihak2Nama(p2Nama);
      setPihak2Jabatan(p2Jabatan);
      setPihak2Alamat(p2Alamat);
      setPihak2AtasNama(p2AtasNama);

      setSuratPerjanjian(savedData.suratPerjanjian || "");
      setBuktiKerja(savedData.buktiKerja || "");
      setPresentasePenyedia(savedData.presentasePenyedia || "");
      setLokasiPekerjaan(savedData.lokasiPekerjaan || "Jakarta");
      setInstansiPenerima(savedData.instansiPenerima || "Badan Intelijen Negara");
      setTtdKiriJabatan1(savedData.ttdKiriJabatan1 || "Kepala Badan Intelijen Negara");
      setTtdKiriJabatan2(savedData.ttdKiriJabatan2 || "Pejabat Pembuat Komitmen");
      setPihak1Nama(savedData.ttdKiriNama || savedData.pihak1Nama || "");
      setTtdKiriNama(savedData.ttdKiriNama || savedData.pihak1Nama || "");

      const ttdKananInst = savedData.ttdKananInstansi || (type === "BAP" ? (kwitansiTtdKananInstansi || invoiceTtdKananInstansi) : invoiceTtdKananInstansi) || "";
      const ttdKananJab = savedData.ttdKananJabatan || (type === "BAP" ? (kwitansiTtdKananJabatan || invoiceTtdKananJabatan) : invoiceTtdKananJabatan) || "Direktur";
      const ttdKananNm = savedData.ttdKananNama || (type === "BAP" ? (kwitansiTtdKananNama || invoiceTtdKananNama) : invoiceTtdKananNama) || "";

      setTtdKananInstansi(ttdKananInst);
      setTtdKananJabatan(ttdKananJab);
      setTtdKananNama(ttdKananNm);

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

      // Data PPD
      setPpdKopInstansi(savedData.ppdKopInstansi || "");
      setPpdAlamatInstansi(savedData.ppdAlamatInstansi || "");
      setPpdTelpInstansi(savedData.ppdTelpInstansi || "");
      setPpdEmailInstansi(savedData.ppdEmailInstansi || "");
      setPpdNomorSurat(savedData.ppdNomorSurat || "");
      setPpdTujuanPejabat(savedData.ppdTujuanPejabat || "");
      setPpdTujuanInstansi(savedData.ppdTujuanInstansi || "");
      setPpdNamaKegiatan(savedData.ppdNamaKegiatan || "");
      setPpdNomorKontrakSpk(savedData.ppdNomorKontrakSpk || "");
      setPpdNamaPemohon(savedData.ppdNamaPemohon || "");
      setPpdUraianKegiatan(savedData.ppdUraianKegiatan || "");
      setPpdNomorInvoice(savedData.ppdNomorInvoice || "");
      setPpdTanggalInvoice(savedData.ppdTanggalInvoice || "");
      setPpdJumlahDiminta(savedData.ppdJumlahDiminta || "");
      setPpdTerbilang(savedData.ppdTerbilang || "");
      setPpdNamaBank(savedData.ppdNamaBank || "");
      setPpdNomorRekening(savedData.ppdNomorRekening || "");
      setPpdNamaPemilikRekening(savedData.ppdNamaPemilikRekening || "");
      setPpdKotaTtd(savedData.ppdKotaTtd || "");
      setPpdTanggalTtd(savedData.ppdTanggalTtd || "");
      setPpdJabatanPemohonTtd(savedData.ppdJabatanPemohonTtd || "");
      setPpdNamaLengkapTtd(savedData.ppdNamaLengkapTtd || "");
      setPpdNipJabatanTtd(savedData.ppdNipJabatanTtd || "");

      setIncludeMaterai(savedData.includeMaterai !== false);
    } else {
      setInstansi("BADAN INTELIJEN NEGARA");
      setJudulSurat(getDefaultTitle(type));

      if (type === "PPD") {
        // Form PPD: Kosongkan semua isinya sesuai permintaan pengguna
        setPpdKopInstansi("");
        setPpdAlamatInstansi("");
        setPpdTelpInstansi("");
        setPpdEmailInstansi("");
        setPpdNomorSurat("");
        setPpdTujuanPejabat("");
        setPpdTujuanInstansi("");
        setPpdNamaKegiatan("");
        setPpdNomorKontrakSpk("");
        setPpdNamaPemohon("");
        setPpdUraianKegiatan("");
        setPpdNomorInvoice("");
        setPpdTanggalInvoice("");
        setPpdJumlahDiminta("");
        setPpdTerbilang("");
        setPpdNamaBank("");
        setPpdNomorRekening("");
        setPpdNamaPemilikRekening("");
        setPpdKotaTtd("");
        setPpdTanggalTtd("");
        setPpdJabatanPemohonTtd("");
        setPpdNamaLengkapTtd("");
        setPpdNipJabatanTtd("");
      } else if (type === "BAST") {
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
      } else if (type === "BAP") {
        // Untuk form BAP (Berita Acara Pembayaran)
        // Kosongkan: Nomor Dokumen, Beban DIPA, Nama Pekerjaan (Tentang), Hari & Tanggal Pelaksanaan, Pihak 1: PPK, 3. Dasar Pembayaran & Rincian Pembayaran (BAP), Tanda Tangan Kiri (PPK)
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
        setTtdKiriNama("");

        // 3. Dasar Pembayaran & Rincian Pembayaran (BAP) dikosongkan
        setBapDasarList(["", "", "", "", ""]);
        setBapPeriodePembayaran("");
        setBapNilaiPembayaranAngka("");
        setBapNilaiPembayaranTerbilang("");
        setBapKppn("");
        setBapNilaiKontrak("");
        setBapNilaiBapLalu("");
        setBapNilaiPekerjaanSaatIni("");
        setBapDikurangiLalu("");
        setBapSisaPembayaran("");
        setBapNilaiDibayarkan("");
        setBapTotalBapIni("");

        // Pihak 2: Penyedia & Tanda Tangan Kanan (Penyedia) diambil dari metadata kwitansi (fallback invoice)
        setPihak2Nama(kwitansiPimpinan || invoicePimpinan);
        setPihak2Jabatan(kwitansiJabatanPerusahaan || invoiceJabatanPerusahaan);
        setPihak2Alamat(kwitansiAlamat || invoiceAlamat);
        setPihak2AtasNama(kwitansiAtasNama || invoiceAtasNama);
        setTtdKananInstansi(kwitansiTtdKananInstansi || invoiceTtdKananInstansi);
        setTtdKananJabatan(kwitansiTtdKananJabatan || invoiceTtdKananJabatan);
        setTtdKananNama(kwitansiTtdKananNama || invoiceTtdKananNama);
      } else {
        // Untuk form BAPP (Berita Acara Penyelesaian Pekerjaan)
        // Kosongkan: Nomor Dokumen, Beban DIPA, Nama Pekerjaan (Tentang), Hari & Tanggal Pelaksanaan, Pihak 1: PPK, 3. Dasar & Uraian Penyelesaian Pekerjaan, Tanda Tangan Kiri (PPK)
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
        setSuratPerjanjian("");
        setBuktiKerja("");
        setPresentasePenyedia("");
        setLokasiPekerjaan("");
        setInstansiPenerima("");
        setTtdKiriNama("");

        // Pihak 2: Penyedia & Tanda Tangan Kanan (Penyedia) diambil dari metadata kwitansi (fallback invoice)
        setPihak2Nama(kwitansiPimpinan || invoicePimpinan);
        setPihak2Jabatan(kwitansiJabatanPerusahaan || invoiceJabatanPerusahaan);
        setPihak2Alamat(kwitansiAlamat || invoiceAlamat);
        setPihak2AtasNama(kwitansiAtasNama || invoiceAtasNama);
        setTtdKananInstansi(kwitansiTtdKananInstansi || invoiceTtdKananInstansi);
        setTtdKananJabatan(kwitansiTtdKananJabatan || invoiceTtdKananJabatan);
        setTtdKananNama(kwitansiTtdKananNama || invoiceTtdKananNama);
      }
      setIncludeMaterai(true);
    }
  };

  // Handler Generate Dokumen & Buka PDF Langsung dengan Skema Validasi
  const handleGenerateAndExport = async () => {
    if (!doc) return;
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

    // Validasi input khusus dokumen BAP (Berita Acara Pembayaran - semua input wajib diisi)
    if (docType === "BAP") {
      const newErrors: Record<string, string> = {};

      if (!nomorDokumen.trim()) newErrors.nomorDokumen = "Nomor Dokumen wajib diisi";
      if (!bebanDipa.trim()) newErrors.bebanDipa = "Beban DIPA wajib diisi";
      if (!namaPekerjaan.trim()) newErrors.namaPekerjaan = "Nama Pekerjaan (Tentang) wajib diisi";
      if (!hari.trim()) newErrors.hari = "Hari wajib diisi";
      if (!tanggalTerbilang.trim()) newErrors.tanggalTerbilang = "Tanggal (Terbilang) wajib diisi";
      if (!bulanTerbilang.trim()) newErrors.bulanTerbilang = "Bulan wajib diisi";
      if (!tahunTerbilang.trim()) newErrors.tahunTerbilang = "Tahun (Terbilang) wajib diisi";
      if (!pihak1Nama.trim()) newErrors.pihak1Nama = "Nama Lengkap & Gelar PPK wajib diisi";
      if (!pihak1Jabatan.trim()) newErrors.pihak1Jabatan = "Jabatan PPK wajib diisi";
      if (!pihak1Alamat.trim()) newErrors.pihak1Alamat = "Alamat Kantor PPK wajib diisi";
      if (!pihak1AtasNama.trim()) newErrors.pihak1AtasNama = "Bertindak untuk dan atas nama (PPK) wajib diisi";
      if (!pihak2Nama.trim()) newErrors.pihak2Nama = "Nama Pimpinan / Direktur (Penyedia) wajib diisi";
      if (!pihak2Jabatan.trim()) newErrors.pihak2Jabatan = "Jabatan & Perusahaan wajib diisi";
      if (!pihak2Alamat.trim()) newErrors.pihak2Alamat = "Alamat Kantor Penyedia wajib diisi";
      if (!pihak2AtasNama.trim()) newErrors.pihak2AtasNama = "Bertindak untuk dan atas nama (Penyedia) wajib diisi";

      // 3. Dasar Pembayaran & Rincian Pembayaran (BAP)
      const validDasarList = bapDasarList.filter((d) => d.trim());
      if (validDasarList.length === 0) {
        newErrors.bapDasarList = "Minimal 1 daftar dasar berkas wajib diisi";
      }
      if (!bapPeriodePembayaran.trim()) newErrors.bapPeriodePembayaran = "Periode Pembayaran Penyedia wajib diisi";
      if (!bapNilaiPembayaranAngka.trim()) newErrors.bapNilaiPembayaranAngka = "Nilai Pembayaran (Rp) wajib diisi";
      if (!bapNilaiPembayaranTerbilang.trim()) newErrors.bapNilaiPembayaranTerbilang = "Nilai Terbilang wajib diisi";
      if (!bapKppn.trim()) newErrors.bapKppn = "Tujuan Pembayaran KPPN wajib diisi";
      if (!bapNilaiKontrak.trim()) newErrors.bapNilaiKontrak = "Nilai Kontrak wajib diisi";
      if (!bapNilaiBapLalu.trim()) newErrors.bapNilaiBapLalu = "Nilai Pembayaran s/d BAP Lalu wajib diisi";
      if (!bapNilaiPekerjaanSaatIni.trim()) newErrors.bapNilaiPekerjaanSaatIni = "Nilai Pekerjaan pada BAP ini wajib diisi";
      if (!bapDikurangiLalu.trim()) newErrors.bapDikurangiLalu = "Nilai pekerjaan Berita Acara lalu wajib diisi";
      if (!bapSisaPembayaran.trim()) newErrors.bapSisaPembayaran = "Nilai Sisa Pembayaran wajib diisi";
      if (!bapNilaiDibayarkan.trim()) newErrors.bapNilaiDibayarkan = "Nilai Dibayarkan wajib diisi";
      if (!bapTotalBapIni.trim()) newErrors.bapTotalBapIni = "Nilai Pembayaran s/d BAP Ini wajib diisi";

      // Penandatanganan
      if (!ttdKiriNama.trim()) newErrors.ttdKiriNama = "Tanda Tangan Kiri (PPK) wajib diisi";
      if (!ttdKananNama.trim()) newErrors.ttdKananNama = "Tanda Tangan Kanan (Penyedia) wajib diisi";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    // Validasi input khusus dokumen BAPP (Berita Acara Penyelesaian Pekerjaan - semua input wajib diisi)
    if (docType === "BAPP") {
      const newErrors: Record<string, string> = {};

      if (!nomorDokumen.trim()) newErrors.nomorDokumen = "Nomor Dokumen wajib diisi";
      if (!bebanDipa.trim()) newErrors.bebanDipa = "Beban DIPA wajib diisi";
      if (!namaPekerjaan.trim()) newErrors.namaPekerjaan = "Nama Pekerjaan (Tentang) wajib diisi";
      if (!hari.trim()) newErrors.hari = "Hari wajib diisi";
      if (!tanggalTerbilang.trim()) newErrors.tanggalTerbilang = "Tanggal (Terbilang) wajib diisi";
      if (!bulanTerbilang.trim()) newErrors.bulanTerbilang = "Bulan wajib diisi";
      if (!tahunTerbilang.trim()) newErrors.tahunTerbilang = "Tahun (Terbilang) wajib diisi";
      if (!pihak1Nama.trim()) newErrors.pihak1Nama = "Nama Lengkap & Gelar PPK wajib diisi";
      if (!pihak1Jabatan.trim()) newErrors.pihak1Jabatan = "Jabatan PPK wajib diisi";
      if (!pihak1Alamat.trim()) newErrors.pihak1Alamat = "Alamat Kantor PPK wajib diisi";
      if (!pihak1AtasNama.trim()) newErrors.pihak1AtasNama = "Bertindak untuk dan atas nama (PPK) wajib diisi";
      if (!pihak2Nama.trim()) newErrors.pihak2Nama = "Nama Pimpinan / Direktur (Penyedia) wajib diisi";
      if (!pihak2Jabatan.trim()) newErrors.pihak2Jabatan = "Jabatan & Perusahaan wajib diisi";
      if (!pihak2Alamat.trim()) newErrors.pihak2Alamat = "Alamat Kantor Penyedia wajib diisi";
      if (!pihak2AtasNama.trim()) newErrors.pihak2AtasNama = "Bertindak untuk dan atas nama (Penyedia) wajib diisi";

      // 3. Dasar & Uraian Penyelesaian Pekerjaan (BAPP)
      if (!suratPerjanjian.trim()) newErrors.suratPerjanjian = "Dasar 1: Surat Perjanjian wajib diisi";
      if (!buktiKerja.trim()) newErrors.buktiKerja = "Dasar 2: Bukti Kerja wajib diisi";
      if (!presentasePenyedia.trim()) newErrors.presentasePenyedia = "Presentase Selesai wajib diisi";
      if (!lokasiPekerjaan.trim()) newErrors.lokasiPekerjaan = "Lokasi Pekerjaan wajib diisi";
      if (!instansiPenerima.trim()) newErrors.instansiPenerima = "Instansi Penerima wajib diisi";

      // Penandatanganan
      if (!ttdKiriNama.trim()) newErrors.ttdKiriNama = "Tanda Tangan Kiri (PPK) wajib diisi";
      if (!ttdKananNama.trim()) newErrors.ttdKananNama = "Tanda Tangan Kanan (Penyedia) wajib diisi";

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    // Validasi input khusus dokumen PPD (Surat Permintaan Pencairan Dana - semua input wajib diisi)
    if (docType === "PPD") {
      const newErrors: Record<string, string> = {};

      if (!ppdKopInstansi.trim()) newErrors.ppdKopInstansi = "Kop Surat Instansi / Perusahaan wajib diisi";
      if (!ppdAlamatInstansi.trim()) newErrors.ppdAlamatInstansi = "Alamat Instansi wajib diisi";
      if (!ppdTelpInstansi.trim()) newErrors.ppdTelpInstansi = "Nomor Telepon wajib diisi";
      if (!ppdEmailInstansi.trim()) newErrors.ppdEmailInstansi = "Email Resmi wajib diisi";
      if (!ppdNomorSurat.trim()) newErrors.ppdNomorSurat = "Nomor Surat wajib diisi";
      if (!ppdTujuanPejabat.trim()) newErrors.ppdTujuanPejabat = "Nama Pejabat / Bagian Keuangan wajib diisi";
      if (!ppdTujuanInstansi.trim()) newErrors.ppdTujuanInstansi = "Nama Instansi / Perusahaan Tujuan wajib diisi";
      if (!ppdNamaKegiatan.trim()) newErrors.ppdNamaKegiatan = "Nama Kegiatan / Pekerjaan wajib diisi";
      if (!ppdNomorKontrakSpk.trim()) newErrors.ppdNomorKontrakSpk = "Nomor Kontrak / SPK / Pesanan wajib diisi";
      if (!ppdNamaPemohon.trim()) newErrors.ppdNamaPemohon = "Nama Pemohon / Penyedia wajib diisi";
      if (!ppdUraianKegiatan.trim()) newErrors.ppdUraianKegiatan = "Uraian Kegiatan / Barang / Jasa wajib diisi";
      if (!ppdNomorInvoice.trim()) newErrors.ppdNomorInvoice = "Nomor Invoice / Tagihan wajib diisi";
      if (!ppdTanggalInvoice.trim()) newErrors.ppdTanggalInvoice = "Tanggal Invoice / Tagihan wajib diisi";
      if (!ppdJumlahDiminta.trim()) newErrors.ppdJumlahDiminta = "Jumlah yang Diminta (Rp) wajib diisi";
      if (!ppdTerbilang.trim()) newErrors.ppdTerbilang = "Nominal Terbilang wajib diisi";
      if (!ppdNamaBank.trim()) newErrors.ppdNamaBank = "Nama Bank wajib diisi";
      if (!ppdNomorRekening.trim()) newErrors.ppdNomorRekening = "Nomor Rekening wajib diisi";
      if (!ppdNamaPemilikRekening.trim()) newErrors.ppdNamaPemilikRekening = "Nama Pemilik Rekening wajib diisi";
      if (!ppdKotaTtd.trim()) newErrors.ppdKotaTtd = "Kota Penandatanganan wajib diisi";
      if (!ppdTanggalTtd.trim()) newErrors.ppdTanggalTtd = "Tanggal Penandatanganan wajib diisi";
      if (!ppdJabatanPemohonTtd.trim()) newErrors.ppdJabatanPemohonTtd = "Jabatan Pemohon Penandatangan wajib diisi";
      if (!ppdNamaLengkapTtd.trim()) newErrors.ppdNamaLengkapTtd = "Nama Lengkap Penandatangan wajib diisi";

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
      ppdKopInstansi,
      ppdAlamatInstansi,
      ppdTelpInstansi,
      ppdEmailInstansi,
      ppdNomorSurat,
      ppdTujuanPejabat,
      ppdTujuanInstansi,
      ppdNamaKegiatan,
      ppdNomorKontrakSpk,
      ppdNamaPemohon,
      ppdUraianKegiatan,
      ppdNomorInvoice,
      ppdTanggalInvoice,
      ppdJumlahDiminta,
      ppdTerbilang,
      ppdNamaBank,
      ppdNomorRekening,
      ppdNamaPemilikRekening,
      ppdKotaTtd,
      ppdTanggalTtd,
      ppdJabatanPemohonTtd,
      ppdNamaLengkapTtd,
      ppdNipJabatanTtd,
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
          {docType === "PPD" ? (
            /* =========================================================================
               FORMULIR SPESIFIK SURAT PERMINTAAN PENCAIRAN DANA (PPD)
               SESUAI TEMPLATE GAMBAR PENGGUNA (SEMUA INPUT DIKOSONGKAN & VALIDASI WAJIB)
               ========================================================================= */
            <div className="space-y-6">
              {/* Bagian 1: Kop Surat Instansi / Perusahaan */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  1. Kop Surat Instansi / Perusahaan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Instansi / Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdKopInstansi}
                      onChange={(e) => {
                        setPpdKopInstansi(e.target.value);
                        if (errors.ppdKopInstansi) setErrors((prev) => ({ ...prev, ppdKopInstansi: "" }));
                      }}
                      placeholder="Contoh: PT. MULTI TEKNOLOGI NUSANTARA"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdKopInstansi ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdKopInstansi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdKopInstansi}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Alamat Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdAlamatInstansi}
                      onChange={(e) => {
                        setPpdAlamatInstansi(e.target.value);
                        if (errors.ppdAlamatInstansi) setErrors((prev) => ({ ...prev, ppdAlamatInstansi: "" }));
                      }}
                      placeholder="Contoh: Jl. Jenderal Sudirman Kav. 52-53, Jakarta Selatan"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdAlamatInstansi ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdAlamatInstansi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdAlamatInstansi}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Telepon <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTelpInstansi}
                      onChange={(e) => {
                        setPpdTelpInstansi(e.target.value);
                        if (errors.ppdTelpInstansi) setErrors((prev) => ({ ...prev, ppdTelpInstansi: "" }));
                      }}
                      placeholder="Contoh: (021) 57901234"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTelpInstansi ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTelpInstansi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTelpInstansi}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Email Resmi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdEmailInstansi}
                      onChange={(e) => {
                        setPpdEmailInstansi(e.target.value);
                        if (errors.ppdEmailInstansi) setErrors((prev) => ({ ...prev, ppdEmailInstansi: "" }));
                      }}
                      placeholder="Contoh: finance@multiteknologi.co.id"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdEmailInstansi ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdEmailInstansi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdEmailInstansi}</p>}
                  </div>
                </div>
              </div>

              {/* Bagian 2: Nomor Surat & Tujuan Surat */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  2. Nomor Surat & Tujuan Permintaan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Surat Permintaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNomorSurat}
                      onChange={(e) => {
                        setPpdNomorSurat(e.target.value);
                        if (errors.ppdNomorSurat) setErrors((prev) => ({ ...prev, ppdNomorSurat: "" }));
                      }}
                      placeholder="Contoh: 045/MTN/PPD/XI/2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNomorSurat ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNomorSurat && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNomorSurat}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pejabat / Bagian Keuangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTujuanPejabat}
                      onChange={(e) => {
                        setPpdTujuanPejabat(e.target.value);
                        if (errors.ppdTujuanPejabat) setErrors((prev) => ({ ...prev, ppdTujuanPejabat: "" }));
                      }}
                      placeholder="Contoh: Pejabat Pembuat Komitmen (PPK)"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTujuanPejabat ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTujuanPejabat && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTujuanPejabat}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Instansi / Perusahaan Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTujuanInstansi}
                      onChange={(e) => {
                        setPpdTujuanInstansi(e.target.value);
                        if (errors.ppdTujuanInstansi) setErrors((prev) => ({ ...prev, ppdTujuanInstansi: "" }));
                      }}
                      placeholder="Contoh: Badan Intelijen Negara"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTujuanInstansi ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTujuanInstansi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTujuanInstansi}</p>}
                  </div>
                </div>
              </div>

              {/* Bagian 3: Rincian Permintaan Pencairan Dana (Tabel) */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  3. Rincian Permintaan Pencairan Dana
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Kegiatan / Transaksi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNamaKegiatan}
                      onChange={(e) => {
                        setPpdNamaKegiatan(e.target.value);
                        if (errors.ppdNamaKegiatan) setErrors((prev) => ({ ...prev, ppdNamaKegiatan: "" }));
                      }}
                      placeholder="Contoh: Pengadaan Perangkat Keras JDIH"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNamaKegiatan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNamaKegiatan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNamaKegiatan}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Kontrak / SPK / Pesanan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNomorKontrakSpk}
                      onChange={(e) => {
                        setPpdNomorKontrakSpk(e.target.value);
                        if (errors.ppdNomorKontrakSpk) setErrors((prev) => ({ ...prev, ppdNomorKontrakSpk: "" }));
                      }}
                      placeholder="Contoh: SP-1177 / I / 2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNomorKontrakSpk ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNomorKontrakSpk && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNomorKontrakSpk}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pemohon / Penyedia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNamaPemohon}
                      onChange={(e) => {
                        setPpdNamaPemohon(e.target.value);
                        if (errors.ppdNamaPemohon) setErrors((prev) => ({ ...prev, ppdNamaPemohon: "" }));
                      }}
                      placeholder="Contoh: PT. Multi Teknologi Nusantara"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNamaPemohon ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNamaPemohon && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNamaPemohon}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Uraian Kegiatan / Barang / Jasa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdUraianKegiatan}
                      onChange={(e) => {
                        setPpdUraianKegiatan(e.target.value);
                        if (errors.ppdUraianKegiatan) setErrors((prev) => ({ ...prev, ppdUraianKegiatan: "" }));
                      }}
                      placeholder="Contoh: Pengadaan 5 Unit Server dan Lisensi Aplikasi"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdUraianKegiatan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdUraianKegiatan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdUraianKegiatan}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Invoice / Tagihan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNomorInvoice}
                      onChange={(e) => {
                        setPpdNomorInvoice(e.target.value);
                        if (errors.ppdNomorInvoice) setErrors((prev) => ({ ...prev, ppdNomorInvoice: "" }));
                      }}
                      placeholder="Contoh: INV-2024-0988"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNomorInvoice ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNomorInvoice && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNomorInvoice}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Invoice / Tagihan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTanggalInvoice}
                      onChange={(e) => {
                        setPpdTanggalInvoice(e.target.value);
                        if (errors.ppdTanggalInvoice) setErrors((prev) => ({ ...prev, ppdTanggalInvoice: "" }));
                      }}
                      placeholder="Contoh: 15 November 2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTanggalInvoice ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTanggalInvoice && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTanggalInvoice}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jumlah yang Diminta (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdJumlahDiminta}
                      onChange={(e) => {
                        setPpdJumlahDiminta(e.target.value);
                        if (errors.ppdJumlahDiminta) setErrors((prev) => ({ ...prev, ppdJumlahDiminta: "" }));
                      }}
                      placeholder="Contoh: 150.000.000"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdJumlahDiminta ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdJumlahDiminta && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdJumlahDiminta}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Terbilang <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTerbilang}
                      onChange={(e) => {
                        setPpdTerbilang(e.target.value);
                        if (errors.ppdTerbilang) setErrors((prev) => ({ ...prev, ppdTerbilang: "" }));
                      }}
                      placeholder="Contoh: Seratus lima puluh juta rupiah"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTerbilang ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTerbilang && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTerbilang}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Bank <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNamaBank}
                      onChange={(e) => {
                        setPpdNamaBank(e.target.value);
                        if (errors.ppdNamaBank) setErrors((prev) => ({ ...prev, ppdNamaBank: "" }));
                      }}
                      placeholder="Contoh: Bank Mandiri KCP Jakarta Thamrin"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNamaBank ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNamaBank && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNamaBank}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nomor Rekening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNomorRekening}
                      onChange={(e) => {
                        setPpdNomorRekening(e.target.value);
                        if (errors.ppdNomorRekening) setErrors((prev) => ({ ...prev, ppdNomorRekening: "" }));
                      }}
                      placeholder="Contoh: 123-00-9876543-2"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNomorRekening ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNomorRekening && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNomorRekening}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Pemilik Rekening <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNamaPemilikRekening}
                      onChange={(e) => {
                        setPpdNamaPemilikRekening(e.target.value);
                        if (errors.ppdNamaPemilikRekening) setErrors((prev) => ({ ...prev, ppdNamaPemilikRekening: "" }));
                      }}
                      placeholder="Contoh: PT Multi Teknologi Nusantara"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNamaPemilikRekening ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNamaPemilikRekening && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNamaPemilikRekening}</p>}
                  </div>
                </div>
              </div>

              {/* Bagian 4: Penandatanganan PPD */}
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  4. Penandatanganan Pemohon / Penyedia
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Kota Tempat Penandatanganan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdKotaTtd}
                      onChange={(e) => {
                        setPpdKotaTtd(e.target.value);
                        if (errors.ppdKotaTtd) setErrors((prev) => ({ ...prev, ppdKotaTtd: "" }));
                      }}
                      placeholder="Contoh: Jakarta"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdKotaTtd ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdKotaTtd && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdKotaTtd}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Tanggal Surat Penandatanganan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdTanggalTtd}
                      onChange={(e) => {
                        setPpdTanggalTtd(e.target.value);
                        if (errors.ppdTanggalTtd) setErrors((prev) => ({ ...prev, ppdTanggalTtd: "" }));
                      }}
                      placeholder="Contoh: 18 November 2024"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdTanggalTtd ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdTanggalTtd && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdTanggalTtd}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jabatan Pemohon / Penyedia <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdJabatanPemohonTtd}
                      onChange={(e) => {
                        setPpdJabatanPemohonTtd(e.target.value);
                        if (errors.ppdJabatanPemohonTtd) setErrors((prev) => ({ ...prev, ppdJabatanPemohonTtd: "" }));
                      }}
                      placeholder="Contoh: Direktur Utama PT. Multi Teknologi Nusantara"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdJabatanPemohonTtd ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdJabatanPemohonTtd && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdJabatanPemohonTtd}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nama Lengkap Penandatangan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ppdNamaLengkapTtd}
                      onChange={(e) => {
                        setPpdNamaLengkapTtd(e.target.value);
                        if (errors.ppdNamaLengkapTtd) setErrors((prev) => ({ ...prev, ppdNamaLengkapTtd: "" }));
                      }}
                      placeholder="Contoh: Ir. Bambang Hermanto"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.ppdNamaLengkapTtd ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.ppdNamaLengkapTtd && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.ppdNamaLengkapTtd}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      NIP / Keterangan Jabatan Lainnya (Jika ada)
                    </label>
                    <input
                      type="text"
                      value={ppdNipJabatanTtd}
                      onChange={(e) => setPpdNipJabatanTtd(e.target.value)}
                      placeholder="Contoh: NIP. 19800512 200501 1 002 (Opsional)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
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
                  Nomor Dokumen <span className="text-red-500">*</span>
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
                  Beban DIPA <span className="text-red-500">*</span>
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
                  Nama Pekerjaan (Tentang) <span className="text-red-500">*</span>
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
                  Hari <span className="text-red-500">*</span>
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
                  Tanggal (Terbilang) <span className="text-red-500">*</span>
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
                  Bulan <span className="text-red-500">*</span>
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
                  Tahun (Terbilang) <span className="text-red-500">*</span>
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
                    Nama Lengkap & Gelar <span className="text-red-500">*</span>
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
                    Jabatan <span className="text-red-500">*</span>
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
                    Alamat Kantor <span className="text-red-500">*</span>
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
                    Bertindak untuk dan atas nama <span className="text-red-500">*</span>
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
                    Nama Pimpinan / Direktur <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pihak2Nama}
                    onChange={(e) => {
                      setPihak2Nama(e.target.value);
                      if (errors.pihak2Nama) setErrors((prev) => ({ ...prev, pihak2Nama: "" }));
                    }}
                    placeholder={docType === "BAST" ? "Diambil dari Approved By / Pimpinan Invoice..." : "Diambil dari Metadata Kwitansi..."}
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Nama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Nama && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Nama}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan & Perusahaan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pihak2Jabatan}
                    onChange={(e) => {
                      setPihak2Jabatan(e.target.value);
                      if (errors.pihak2Jabatan) setErrors((prev) => ({ ...prev, pihak2Jabatan: "" }));
                    }}
                    placeholder={docType === "BAST" ? "Diambil dari Jabatan / Perusahaan Invoice..." : "Diambil dari Metadata Kwitansi..."}
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Jabatan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Jabatan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Jabatan}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat Kantor Penyedia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={pihak2Alamat}
                    onChange={(e) => {
                      setPihak2Alamat(e.target.value);
                      if (errors.pihak2Alamat) setErrors((prev) => ({ ...prev, pihak2Alamat: "" }));
                    }}
                    placeholder={docType === "BAST" ? "Diambil dari Alamat Invoice..." : "Diambil dari Metadata Kwitansi..."}
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.pihak2Alamat ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.pihak2Alamat && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.pihak2Alamat}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Bertindak untuk dan atas nama <span className="text-red-500">*</span>
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
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Daftar Dasar Berkas (Surat Perjanjian, BAPP, BAST) <span className="text-red-500">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setBapDasarList([...bapDasarList, ""]);
                      if (errors.bapDasarList) setErrors((prev) => ({ ...prev, bapDasarList: "" }));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Tambah Dasar Berkas</span>
                  </button>
                </div>

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
                        if (errors.bapDasarList) setErrors((prev) => ({ ...prev, bapDasarList: "" }));
                      }}
                      placeholder={`Dasar berkas ${idx + 1}...`}
                      className={`flex-1 px-3 py-1.5 rounded-lg border bg-white font-medium text-xs ${
                        errors.bapDasarList && !item.trim() ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {bapDasarList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = bapDasarList.filter((_, i) => i !== idx);
                          setBapDasarList(updated);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus baris ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {errors.bapDasarList && <p className="text-[10px] text-red-500 font-semibold">{errors.bapDasarList}</p>}
              </div>

              {/* Uraian Hak Pembayaran Penyedia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Periode Pembayaran Penyedia <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bapPeriodePembayaran}
                    onChange={(e) => {
                      setBapPeriodePembayaran(e.target.value);
                      if (errors.bapPeriodePembayaran) setErrors((prev) => ({ ...prev, bapPeriodePembayaran: "" }));
                    }}
                    placeholder="Contoh: bulan September s/d November 2024"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.bapPeriodePembayaran ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.bapPeriodePembayaran && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bapPeriodePembayaran}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nilai Pembayaran (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bapNilaiPembayaranAngka}
                    onChange={(e) => {
                      setBapNilaiPembayaranAngka(e.target.value);
                      if (errors.bapNilaiPembayaranAngka) setErrors((prev) => ({ ...prev, bapNilaiPembayaranAngka: "" }));
                    }}
                    placeholder="Contoh: 134.259.000"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.bapNilaiPembayaranAngka ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.bapNilaiPembayaranAngka && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bapNilaiPembayaranAngka}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Nilai Terbilang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bapNilaiPembayaranTerbilang}
                    onChange={(e) => {
                      setBapNilaiPembayaranTerbilang(e.target.value);
                      if (errors.bapNilaiPembayaranTerbilang) setErrors((prev) => ({ ...prev, bapNilaiPembayaranTerbilang: "" }));
                    }}
                    placeholder="Seratus tiga puluh empat juta dua ratus lima puluh sembilan ribu rupiah"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.bapNilaiPembayaranTerbilang ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.bapNilaiPembayaranTerbilang && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bapNilaiPembayaranTerbilang}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tujuan Pembayaran KPPN <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bapKppn}
                    onChange={(e) => {
                      setBapKppn(e.target.value);
                      if (errors.bapKppn) setErrors((prev) => ({ ...prev, bapKppn: "" }));
                    }}
                    placeholder="Kantor Pelayanan Perbendaharaan Negara (KPPN) Jakarta V"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.bapKppn ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.bapKppn && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.bapKppn}</p>}
                </div>
              </div>

              {/* Rincian Tabel Pembayaran */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <label className="block font-bold text-slate-700">Tabel Rincian Pembayaran (Jumlah Rp):</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      1. Nilai Kontrak <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapNilaiKontrak}
                      onChange={(e) => {
                        setBapNilaiKontrak(e.target.value);
                        if (errors.bapNilaiKontrak) setErrors((prev) => ({ ...prev, bapNilaiKontrak: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapNilaiKontrak ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapNilaiKontrak && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapNilaiKontrak}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      2. Nilai Pembayaran s/d BAP Lalu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapNilaiBapLalu}
                      onChange={(e) => {
                        setBapNilaiBapLalu(e.target.value);
                        if (errors.bapNilaiBapLalu) setErrors((prev) => ({ ...prev, bapNilaiBapLalu: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapNilaiBapLalu ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapNilaiBapLalu && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapNilaiBapLalu}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      3a. Nilai Pekerjaan pada BAP ini <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapNilaiPekerjaanSaatIni}
                      onChange={(e) => {
                        setBapNilaiPekerjaanSaatIni(e.target.value);
                        if (errors.bapNilaiPekerjaanSaatIni) setErrors((prev) => ({ ...prev, bapNilaiPekerjaanSaatIni: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapNilaiPekerjaanSaatIni ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapNilaiPekerjaanSaatIni && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapNilaiPekerjaanSaatIni}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      3a. Dikurangi Nilai Pekerjaan Berita Acara Lalu <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapDikurangiLalu}
                      onChange={(e) => {
                        setBapDikurangiLalu(e.target.value);
                        if (errors.bapDikurangiLalu) setErrors((prev) => ({ ...prev, bapDikurangiLalu: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapDikurangiLalu ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapDikurangiLalu && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapDikurangiLalu}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      3a. Nilai Sisa Pembayaran s.d Pekerjaan Saat Ini <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapSisaPembayaran}
                      onChange={(e) => {
                        setBapSisaPembayaran(e.target.value);
                        if (errors.bapSisaPembayaran) setErrors((prev) => ({ ...prev, bapSisaPembayaran: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapSisaPembayaran ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapSisaPembayaran && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapSisaPembayaran}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">
                      3b. Nilai Dibayarkan (Termasuk Pajak) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapNilaiDibayarkan}
                      onChange={(e) => {
                        setBapNilaiDibayarkan(e.target.value);
                        if (errors.bapNilaiDibayarkan) setErrors((prev) => ({ ...prev, bapNilaiDibayarkan: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapNilaiDibayarkan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapNilaiDibayarkan && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapNilaiDibayarkan}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-slate-600">
                      4. Nilai Pembayaran s/d BAP Ini (Termasuk Pajak) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bapTotalBapIni}
                      onChange={(e) => {
                        setBapTotalBapIni(e.target.value);
                        if (errors.bapTotalBapIni) setErrors((prev) => ({ ...prev, bapTotalBapIni: "" }));
                      }}
                      className={`w-full px-3 py-1.5 rounded-lg border bg-white font-medium ${
                        errors.bapTotalBapIni ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.bapTotalBapIni && <p className="text-[10px] text-red-500 mt-0.5 font-semibold">{errors.bapTotalBapIni}</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
              <h3 className="font-extrabold text-slate-900 text-xs tracking-wide uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                3. Dasar & Uraian Penyelesaian Pekerjaan (BAPP)
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dasar 1: Surat Perjanjian <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={suratPerjanjian}
                    onChange={(e) => {
                      setSuratPerjanjian(e.target.value);
                      if (errors.suratPerjanjian) setErrors((prev) => ({ ...prev, suratPerjanjian: "" }));
                    }}
                    placeholder="Contoh: Surat Perjanjian Nomor : SP-1177 / I /2024 tanggal 8 Januari 2024;"
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.suratPerjanjian ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.suratPerjanjian && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.suratPerjanjian}</p>}
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Dasar 2: Bukti Kerja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={buktiKerja}
                    onChange={(e) => {
                      setBuktiKerja(e.target.value);
                      if (errors.buktiKerja) setErrors((prev) => ({ ...prev, buktiKerja: "" }));
                    }}
                    placeholder="Contoh: Bukti Kerja Pekerjaan Pemeliharaan dan Perawatan..."
                    className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                      errors.buktiKerja ? "border-red-500 bg-red-50/20" : "border-slate-200"
                    }`}
                  />
                  {errors.buktiKerja && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.buktiKerja}</p>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Presentase Selesai <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={presentasePenyedia}
                      onChange={(e) => {
                        setPresentasePenyedia(e.target.value);
                        if (errors.presentasePenyedia) setErrors((prev) => ({ ...prev, presentasePenyedia: "" }));
                      }}
                      placeholder="Contoh: 75%"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.presentasePenyedia ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.presentasePenyedia && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.presentasePenyedia}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Lokasi Pekerjaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lokasiPekerjaan}
                      onChange={(e) => {
                        setLokasiPekerjaan(e.target.value);
                        if (errors.lokasiPekerjaan) setErrors((prev) => ({ ...prev, lokasiPekerjaan: "" }));
                      }}
                      placeholder="Contoh: Jakarta"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.lokasiPekerjaan ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.lokasiPekerjaan && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.lokasiPekerjaan}</p>}
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Instansi Penerima <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={instansiPenerima}
                      onChange={(e) => {
                        setInstansiPenerima(e.target.value);
                        if (errors.instansiPenerima) setErrors((prev) => ({ ...prev, instansiPenerima: "" }));
                      }}
                      placeholder="Contoh: Badan Intelijen Negara"
                      className={`w-full px-3 py-2 rounded-xl border bg-white font-medium ${
                        errors.instansiPenerima ? "border-red-500 bg-red-50/20" : "border-slate-200"
                      }`}
                    />
                    {errors.instansiPenerima && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.instansiPenerima}</p>}
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
                  Tanda Tangan Kiri (PPK) <span className="text-red-500">*</span>
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
                  Tanda Tangan Kanan (Penyedia) <span className="text-red-500">*</span>
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
                  placeholder={docType === "BAST" ? "Nama Terang Penyedia (Diambil dari Invoice)..." : "Nama Terang Penyedia (Diambil dari Kwitansi)..."}
                  className={`w-full px-3 py-1.5 rounded-lg border bg-white font-bold ${
                    errors.ttdKananNama ? "border-red-500 bg-red-50/20" : "border-slate-200"
                  }`}
                />
                {errors.ttdKananNama && <p className="text-[10px] text-red-500 font-semibold">{errors.ttdKananNama}</p>}
              </div>
            </div>
          </div>
          </>
          )}
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
