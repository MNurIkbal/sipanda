import React, { useState } from "react";
import { RefreshCw, XCircle } from "lucide-react";
import { PaymentDocument } from "@/types/sipandu.types";

interface RevisiModalProps {
  document: PaymentDocument;
  onClose: () => void;
  onSubmitRevisi: (formData: FormData) => Promise<void>;
  loading: boolean;
}

export const RevisiModal: React.FC<RevisiModalProps> = ({
  document,
  onClose,
  onSubmitRevisi,
  loading,
}) => {
  const [catatanPerbaikan, setCatatanPerbaikan] = useState("");
  const [revisiFiles, setRevisiFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("catatan_perbaikan", catatanPerbaikan);

    revisiFiles.forEach((file) => {
      formData.append("files", file);
    });

    await onSubmitRevisi(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4 animate-fade-in">
      <div className="bg-white w-full h-full md:h-auto md:max-w-2xl rounded-none md:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm md:text-base flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-amber-600" />
            Form Revisi Berkas: {document.nomor_surat}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 text-xs space-y-3">
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
            <div className="font-bold text-xs">Pesan Revisi dari Verifikator:</div>
            <p className="mt-0.5">{document.catatan_revisi || "Mohon lengkapi berkas."}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Penjelasan Catatan Perbaikan Petugas:
            </label>
            <textarea
              rows={3}
              required
              value={catatanPerbaikan}
              onChange={(e) => setCatatanPerbaikan(e.target.value)}
              placeholder="Contoh: Faktur pajak dan rincian kuitansi telah diperbaiki dan diupload ulang."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Upload Berkas Hasil Revisi:
            </label>
            <input
              type="file"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  setRevisiFiles(Array.from(e.target.files));
                }
              }}
              className="w-full p-2 border border-slate-200 rounded-lg text-xs"
            />
            {revisiFiles.length > 0 && (
              <div className="mt-2 text-slate-500">
                {revisiFiles.length} file revisi dipilih.
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 font-semibold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold"
            >
              {loading ? "Mengirim..." : "Kirim Ulang ke Biro 01"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
