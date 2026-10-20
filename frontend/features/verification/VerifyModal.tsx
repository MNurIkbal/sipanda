import React, { useState } from "react";
import {
  ShieldCheck,
  XCircle,
  CheckCircle2,
  Save,
  Clock,
  ArrowRight,
  Check,
  Calendar,
  FileText
} from "lucide-react";
import { PaymentDocument } from "@/types/sipandu.types";
import { verifyDocumentSchema } from "@/schemas/document.schema";

interface VerifyModalProps {
  document: PaymentDocument;
  onClose: () => void;
  onVerify: (action: "approve" | "reject", message: string) => Promise<boolean | void>;
  onAdvanceStage: (stage: string, label: string, note?: string) => Promise<boolean | void>;
  loading: boolean;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  document: initialDoc,
  onClose,
  onVerify,
  onAdvanceStage,
  loading,
}) => {
  // Simpan state dokumen lokal agar perubahan tahapan langsung terupdate seketika tanpa perlu tutup/buka modal
  const [currentDoc, setCurrentDoc] = useState<PaymentDocument>(initialDoc);

  // Sync state lokal jika props berubah
  React.useEffect(() => {
    setCurrentDoc(initialDoc);
  }, [initialDoc]);

  // Cek apakah dokumen sudah pernah disetujui atau berada di tahapan setelah disetujui
  const isAlreadyApproved = [
    "lengkap_valid",
    "sedang_diproses",
    "pengajuan_kppn",
    "menunggu_pencairan",
    "dana_cair",
    "siap_digunakan",
  ].includes(currentDoc.status);

  // State untuk Verifikasi Awal (Sebelum Disetujui)
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject">("approve");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // State form untuk tahapan alur pembayaran (Tanggal & Catatan dapat diinput/diedit oleh user)
  const todayStr = new Date().toISOString().split("T")[0];
  const [stageDate, setStageDate] = useState<string>(todayStr);
  const [stageNote, setStageNote] = useState<string>("");

  // Submit Verifikasi Awal (Setujui / Kembalikan)
  const handleInitialSubmit = async () => {
    const validation = verifyDocumentSchema.validate({
      action: verifyAction,
      pesan: verifyMessage,
    });

    if (!validation.isValid) {
      setFieldError(validation.error || "Catatan atau alasan penolakan wajib diisi!");
      return;
    }

    setFieldError(null);
    const result = await onVerify(verifyAction, verifyMessage);
    if (result !== false && verifyAction === "approve") {
      setCurrentDoc((prev) => ({
        ...prev,
        status: "lengkap_valid",
        legend_status: "Lengkap / Valid (Disetujui)",
        legend_color: "emerald",
      }));
    }
  };

  // Submit Tahap: Simpan ke Sedang Diproses
  const handleSaveSedangDiproses = async () => {
    const custom = stageNote.trim() ? ` — Catatan: "${stageNote.trim()}"` : "";
    const noteText = `Memajukan tahapan dokumen ke Sedang Diproses (Penerbitan SPM)${custom}`;
    const res = await onAdvanceStage("sedang_diproses", "Sedang Diproses", noteText);
    if (res !== false) {
      setCurrentDoc((prev) => ({
        ...prev,
        status: "sedang_diproses",
        legend_status: "Sedang Diproses",
        legend_color: "indigo",
      }));
      setStageNote("");
    }
  };

  // Submit Tahap: Pengajuan ke KPPN
  const handleSavePengajuanKppn = async () => {
    const custom = stageNote.trim() ? ` — Catatan: "${stageNote.trim()}"` : "";
    const noteText = `Memajukan tahapan dokumen ke Pengajuan SP2D ke KPPN${custom}`;
    const res = await onAdvanceStage("pengajuan_kppn", "Pengajuan ke KPPN", noteText);
    if (res !== false) {
      setCurrentDoc((prev) => ({
        ...prev,
        status: "pengajuan_kppn",
        legend_status: "Pengajuan ke KPPN",
        legend_color: "purple",
      }));
      setStageNote("");
    }
  };

  // Submit Tahap: Menunggu Pencairan
  const handleSaveMenungguPencairan = async () => {
    const custom = stageNote.trim() ? ` — Catatan: "${stageNote.trim()}"` : "";
    const noteText = `Memajukan tahapan dokumen ke Menunggu Pencairan Bank (Kliring SP2D)${custom}`;
    const res = await onAdvanceStage("menunggu_pencairan", "Menunggu Pencairan", noteText);
    if (res !== false) {
      setCurrentDoc((prev) => ({
        ...prev,
        status: "menunggu_pencairan",
        legend_status: "Menunggu Pencairan",
        legend_color: "orange",
      }));
      setStageNote("");
    }
  };

  // Submit Tahap: Dana Cair
  const handleSaveDanaCair = async () => {
    const custom = stageNote.trim() ? ` — Catatan: "${stageNote.trim()}"` : "";
    const noteText = `Menyelesaikan alur pembayaran: Dana telah berhasil dicairkan ke rekening tujuan${custom}`;
    const res = await onAdvanceStage("dana_cair", "Dana Cair", noteText);
    if (res !== false) {
      setCurrentDoc((prev) => ({
        ...prev,
        status: "dana_cair",
        legend_status: "Dana Cair",
        legend_color: "emerald",
      }));
      setStageNote("");
    }
  };

  // Daftar tahapan alur pembayaran
  const stages = [
    { key: "lengkap_valid", label: "Disetujui" },
    { key: "sedang_diproses", label: "Sedang Diproses" },
    { key: "pengajuan_kppn", label: "Pengajuan ke KPPN" },
    { key: "menunggu_pencairan", label: "Menunggu Pencairan" },
    { key: "dana_cair", label: "Dana Cair" },
  ];

  const getStageIndex = (status: string) => {
    switch (status) {
      case "lengkap_valid": return 0;
      case "sedang_diproses": return 1;
      case "pengajuan_kppn": return 2;
      case "menunggu_pencairan": return 3;
      case "dana_cair":
      case "siap_digunakan": return 4;
      default: return -1;
    }
  };

  const currentStageIndex = getStageIndex(currentDoc.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 animate-fade-in overflow-hidden">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base">
                {isAlreadyApproved ? "Proses Alur Pembayaran" : "Verifikasi Dokumen"}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Nomor Surat: <span className="font-bold text-blue-700">{currentDoc.nomor_surat}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 text-xs space-y-4 overflow-y-auto flex-1">
          {/* Ringkasan Dokumen */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-2">
            <div className="font-bold text-slate-800 text-sm">{currentDoc.nama_kegiatan || currentDoc.perihal}</div>
            <div className="text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>PPK: <strong className="text-slate-700">{currentDoc.ppk_name}</strong></span>
              <span>Unit: <strong className="text-slate-700">{currentDoc.unit_kerja}</strong></span>
              <span>Nilai: <strong className="text-slate-900">Rp {Number(currentDoc.nilai_pembayaran).toLocaleString("id-ID")}</strong></span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/60 mt-1">
              <span className="text-blue-700 font-semibold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {currentDoc.attachments?.length || 0} berkas dokumen terlampir
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-blue-50 text-blue-800 border border-blue-200">
                Status Saat Ini: {currentDoc.legend_status || currentDoc.status}
              </span>
            </div>
          </div>

          {/* Stepper Indikator Alur Pembayaran (Jika Sudah Disetujui) */}
          {isAlreadyApproved && (
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Alur Tahapan Pembayaran:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {stages.map((stg, idx) => {
                  const isDone = currentStageIndex > idx;
                  const isCurrent = currentStageIndex === idx;
                  return (
                    <div key={stg.key} className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                          isDone
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : isCurrent
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {isDone ? <Check className="h-3 w-3" /> : <span>{idx + 1}.</span>}
                        <span>{stg.label}</span>
                      </div>
                      {idx < stages.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* KASUS 1: BELUM DISETUJUI (Menunggu Verifikasi)           */}
          {/* ======================================================== */}
          {!isAlreadyApproved ? (
            <div className="space-y-4 pt-1">
              <div>
                <label className="block font-bold text-slate-700 mb-2">
                  Keputusan Hasil Verifikasi Biro 01 Keuangan:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerifyAction("approve")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      verifyAction === "approve"
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Setujui (Lengkap / Valid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyAction("reject")}
                    className={`p-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                      verifyAction === "reject"
                        ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-600" />
                    Kembalikan (Perlu Revisi)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  {verifyAction === "approve"
                    ? "Catatan Verifikasi (Opsional):"
                    : "Catatan / Alasan Revisi Dokumen (Wajib):"}
                </label>
                <textarea
                  rows={3}
                  value={verifyMessage}
                  onChange={(e) => {
                    setVerifyMessage(e.target.value);
                    if (fieldError) setFieldError(null);
                  }}
                  placeholder={
                    verifyAction === "approve"
                      ? "Contoh: Seluruh dokumen pendukung telah lengkap dan sesuai aturan perpajakan."
                      : "Contoh: BAST belum ditandatangani rekanan, kuitansi materai kurang jelas."
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-none text-slate-800 font-medium transition ${
                    fieldError
                      ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                      : "border-slate-200 focus:border-blue-500"
                  }`}
                />
                {fieldError && (
                  <p className="text-rose-600 text-[11px] font-semibold mt-1">
                    {fieldError}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* KASUS 2: SUDAH DISETUJUI                                 */
            /* Pilihan Setujui/Kembalikan sudah TIDAK MUNCUL LAGI.      */
            /* Tanggal & Catatan BISA DIISI, hanya status yang READONLY */
            /* (berwarna grey otomatis sesuai statusnya).               */
            /* ======================================================== */
            <div className="space-y-4 pt-1">
              {/* TAHAPAN 1: Lengkap/Valid -> Menuju 'Sedang Diproses' */}
              {currentDoc.status === "lengkap_valid" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Tahapan Alur: Sedang Diproses
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={stageDate}
                        onChange={(e) => setStageDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <input
                        type="text"
                        readOnly
                        value="Sedang Diproses"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 font-bold text-slate-700 text-xs cursor-not-allowed shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={2.5}
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Masukkan catatan proses penerbitan SPM atau rincian pemrosesan..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* TAHAPAN 2: Sedang Diproses -> Menuju 'Pengajuan ke KPPN' */}
              {currentDoc.status === "sedang_diproses" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-600" />
                    Tahapan Alur: Pengajuan ke KPPN
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={stageDate}
                        onChange={(e) => setStageDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <input
                        type="text"
                        readOnly
                        value="Pengajuan ke KPPN"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 font-bold text-slate-700 text-xs cursor-not-allowed shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={2.5}
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Contoh: Dokumen SPM telah lengkap dan diteruskan untuk pengajuan penerbitan SP2D ke KPPN."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* TAHAPAN 3: Pengajuan ke KPPN -> Menuju 'Menunggu Pencairan' */}
              {currentDoc.status === "pengajuan_kppn" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-600" />
                    Tahapan Alur: Menunggu Pencairan
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={stageDate}
                        onChange={(e) => setStageDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <input
                        type="text"
                        readOnly
                        value="Menunggu Pencairan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 font-bold text-slate-700 text-xs cursor-not-allowed shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={2.5}
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Contoh: Berkas SP2D telah diverifikasi KPPN, menunggu proses kliring dan pencairan dana ke rekening tujuan."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* TAHAPAN 4: Menunggu Pencairan -> Menuju 'Dana Cair' */}
              {currentDoc.status === "menunggu_pencairan" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-2xs">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Tahapan Alur: Dana Cair (Selesai)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-500" />
                        Tanggal
                      </label>
                      <input
                        type="date"
                        value={stageDate}
                        onChange={(e) => setStageDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Status</label>
                      <input
                        type="text"
                        readOnly
                        value="Dana Cair"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-100 font-bold text-slate-700 text-xs cursor-not-allowed shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={2.5}
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Contoh: Dana pembayaran telah berhasil masuk ke rekening rekanan/pelaksana secara lengkap dan tervalidasi."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 text-xs focus:outline-blue-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* TAHAPAN 5: Dana Telah Cair (Alur Pembayaran Rampung) */}
              {(currentDoc.status === "dana_cair" || currentDoc.status === "siap_digunakan") && (
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                  <div className="font-bold text-emerald-900 text-sm">
                    Alur Pembayaran Telah Selesai
                  </div>
                  <p className="text-emerald-700 text-xs leading-relaxed max-w-md mx-auto">
                    Dokumen ini telah menyelesaikan seluruh tahapan alur verifikasi berkas hingga pencairan dana (Dana Cair).
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
          >
            Batal
          </button>

          {/* Tombol Aksi: Simpan */}
          {!isAlreadyApproved ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleInitialSubmit}
              className={`px-5 py-2 rounded-xl text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md ${
                verifyAction === "approve"
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{loading ? "Menyimpan..." : "Simpan"}</span>
            </button>
          ) : (
            <>
              {/* Jika Lengkap/Valid -> Tombol Simpan untuk proses Sedang Diproses */}
              {currentDoc.status === "lengkap_valid" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveSedangDiproses}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-blue-600/20"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                </button>
              )}

              {/* Jika Sedang Diproses -> Tombol Simpan untuk lanjut Pengajuan ke KPPN */}
              {currentDoc.status === "sedang_diproses" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSavePengajuanKppn}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-indigo-600/20"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                </button>
              )}

              {/* Jika Pengajuan KPPN -> Tombol Simpan untuk lanjut Menunggu Pencairan */}
              {currentDoc.status === "pengajuan_kppn" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveMenungguPencairan}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-purple-600/20"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                </button>
              )}

              {/* Jika Menunggu Pencairan -> Tombol Simpan untuk menyelesaikan Dana Cair */}
              {currentDoc.status === "menunggu_pencairan" && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSaveDanaCair}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md shadow-emerald-600/20"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? "Menyimpan..." : "Simpan"}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
