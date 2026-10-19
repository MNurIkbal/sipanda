import React, { useState } from "react";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";
import { PaymentDocument } from "@/types/sipandu.types";
import { AlertDialog } from "@/components/ui/AlertDialog";

interface VerifyModalProps {
  document: PaymentDocument;
  onClose: () => void;
  onVerify: (action: "approve" | "reject", message: string) => Promise<void>;
  onAdvanceStage: (stage: string, label: string) => Promise<void>;
  loading: boolean;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  document,
  onClose,
  onVerify,
  onAdvanceStage,
  loading,
}) => {
  const [verifyAction, setVerifyAction] = useState<"approve" | "reject">("approve");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [validationAlert, setValidationAlert] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
  }>({
    isOpen: false,
    title: "",
    description: "",
  });

  const handleSubmit = async () => {
    if (verifyAction === "reject" && (!verifyMessage || verifyMessage.trim() === "")) {
      setValidationAlert({
        isOpen: true,
        title: "Catatan Revisi Wajib Diisi",
        description: "Harap masukkan penjelasan catatan/alasan perbaikan dokumen yang dikembalikan agar petugas dapat merevisi berkas dengan tepat.",
      });
      return;
    }
    await onVerify(verifyAction, verifyMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-w-2xl rounded-none md:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Verifikasi Dokumen: {document.nomor_surat}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 text-xs space-y-4 overflow-y-auto flex-1">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
            <div className="font-bold text-slate-800 text-sm">{document.nama_kegiatan}</div>
            <div className="text-slate-500">
              PPK: <span className="font-semibold text-slate-700">{document.ppk_name}</span> • Nilai: <span className="font-bold text-slate-900">Rp {Number(document.nilai_pembayaran).toLocaleString("id-ID")}</span>
            </div>
            <div className="text-blue-700 font-semibold text-xs">
              File Terlampir: {document.attachments?.length || 0} berkas dokumen pendukung
            </div>
          </div>

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
              {verifyAction === "approve" ? "Catatan Verifikasi (Opsional):" : "Catatan / Alasan Revisi Dokumen (Wajib):"}
            </label>
            <textarea
              rows={3}
              value={verifyMessage}
              onChange={(e) => setVerifyMessage(e.target.value)}
              placeholder={
                verifyAction === "approve"
                  ? "Contoh: Seluruh dokumen pendukung telah lengkap dan sesuai aturan perpajakan."
                  : "Contoh: BAST belum ditandatangani rekanan, kuitansi materai kurang jelas."
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-800 font-medium transition"
            />
          </div>

          {/* Akselerasi Tahapan Proses Pembayaran (Biro 01) */}
          {document.status === "lengkap_valid" && (
            <div className="pt-4 border-t border-slate-100">
              <label className="block font-bold text-slate-800 mb-2">
                Majukan Tahapan Alur Pembayaran:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onAdvanceStage("sedang_diproses", "Sedang Diproses")}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Proses Penerbitan SPM
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onAdvanceStage("pengajuan_kppn", "Pengajuan ke KPPN")}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Ajukan SP2D ke KPPN
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onAdvanceStage("menunggu_pencairan", "Menunggu Pencairan")}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Menunggu Pencairan
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => onAdvanceStage("dana_cair", "Dana Cair")}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Dana Cair (Selesai)
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSubmit}
            className={`px-5 py-2 rounded-xl text-white font-bold transition flex items-center gap-1.5 cursor-pointer text-xs shadow-md ${
              verifyAction === "approve"
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
            }`}
          >
            {loading ? "Menyimpan..." : verifyAction === "approve" ? "Setujui Dokumen" : "Kembalikan Dokumen"}
          </button>
        </div>
      </div>

      {/* AlertDialog Validasi Catatan Revisi */}
      <AlertDialog
        isOpen={validationAlert.isOpen}
        title={validationAlert.title}
        description={validationAlert.description}
        confirmText="Saya Mengerti"
        cancelText="Tutup"
        variant="warning"
        onConfirm={() => setValidationAlert((prev) => ({ ...prev, isOpen: false }))}
        onCancel={() => setValidationAlert((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
