import React, { useState } from "react";
import {
  RefreshCw,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Upload,
  CheckCircle2,
  Calendar,
  Layers,
  FileSpreadsheet
} from "lucide-react";
import { PaymentDocument } from "@/types/sipandu.types";
import {
  revisiDocumentSchema,
  RevisiSupportingDocItem,
  RevisiDocumentValidationResult
} from "@/schemas/document.schema";
import { formatDateID } from "@/lib/dateFormat";

interface RevisiModalProps {
  document: PaymentDocument;
  onClose: () => void;
  onSubmitRevisi: (formData: FormData) => Promise<boolean | void>;
  loading: boolean;
}

export const RevisiModal: React.FC<RevisiModalProps> = ({
  document,
  onClose,
  onSubmitRevisi,
  loading,
}) => {
  const [catatanPerbaikan, setCatatanPerbaikan] = useState("");
  
  // Dokumen perbaikan dinamis (Jenis, Nomor, Tanggal, File)
  const [supportingDocs, setSupportingDocs] = useState<RevisiSupportingDocItem[]>([
    {
      id: "rev-1",
      jenis_dokumen: "",
      nomor_dokumen: "",
      tanggal: new Date().toISOString().split("T")[0],
      file: null,
    },
  ]);

  const [fieldErrors, setFieldErrors] = useState<RevisiDocumentValidationResult["errors"]>({});

  // Tambah baris dokumen tambahan
  const handleAddSupportingDoc = () => {
    setSupportingDocs((prev) => [
      ...prev,
      {
        id: `rev-${Date.now()}`,
        jenis_dokumen: "",
        nomor_dokumen: "",
        tanggal: new Date().toISOString().split("T")[0],
        file: null,
      },
    ]);
  };

  // Hapus baris dokumen tambahan
  const handleRemoveSupportingDoc = (id: string) => {
    setSupportingDocs((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      // Jika kosong, sisakan 1 baris kosong
      if (updated.length === 0) {
        return [
          {
            id: `rev-${Date.now()}`,
            jenis_dokumen: "",
            nomor_dokumen: "",
            tanggal: new Date().toISOString().split("T")[0],
            file: null,
          },
        ];
      }
      return updated;
    });

    if (fieldErrors.item_errors?.[id]) {
      setFieldErrors((prev) => {
        const nextItems = { ...prev.item_errors };
        delete nextItems[id];
        return { ...prev, item_errors: nextItems };
      });
    }
  };

  // Update field tiap baris dokumen
  const handleUpdateDocField = (
    id: string,
    field: keyof RevisiSupportingDocItem,
    value: any
  ) => {
    setSupportingDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );

    if (fieldErrors.item_errors?.[id]) {
      setFieldErrors((prev) => {
        const nextItems = { ...prev.item_errors };
        if (nextItems[id]) {
          const nextRow = { ...nextItems[id] };
          delete nextRow[field as keyof typeof nextRow];
          if (Object.keys(nextRow).length === 0) {
            delete nextItems[id];
          } else {
            nextItems[id] = nextRow;
          }
        }
        return { ...prev, item_errors: Object.keys(nextItems).length > 0 ? nextItems : undefined };
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Saring jika dokumen yang diisi
    const filledDocs = supportingDocs.filter(
      (d) => d.jenis_dokumen || d.nomor_dokumen || d.file
    );

    // Gunakan schema validasi
    const validation = revisiDocumentSchema.validate({
      catatan_perbaikan: catatanPerbaikan,
      supporting_docs: filledDocs.length > 0 ? filledDocs : supportingDocs,
    });

    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }

    setFieldErrors({});

    const formData = new FormData();
    formData.append("catatan_perbaikan", catatanPerbaikan.trim());

    // Lampirkan metadata tiap dokumen pendukung revisi
    const validDocs = filledDocs.length > 0 ? filledDocs : supportingDocs;
    const attachmentMeta = validDocs.map((d) => ({
      document_type: d.jenis_dokumen.trim(),
      nomor_dokumen: d.nomor_dokumen.trim(),
      tanggal_dokumen: d.tanggal,
    }));
    formData.append("attachment_meta", JSON.stringify(attachmentMeta));

    // Append file-file lampiran
    validDocs.forEach((d) => {
      if (d.file) {
        formData.append("files", d.file);
      }
    });

    await onSubmitRevisi(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 md:p-6 overflow-hidden animate-fade-in">
      {/* Modal Container: Max-w-4xl */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight">
                  Form Revisi Berkas: {document.nomor_surat}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  Dikembalikan
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                Lengkapi dan perbaiki dokumen sesuai catatan verifikator sebelum dikirim ulang ke Biro 01.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            title="Tutup (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-xs">
          
          {/* Card Info Ringkasan Dokumen */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Perihal / Nama Kegiatan
              </span>
              <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                {document.perihal || document.nama_kegiatan || "-"}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                PPK / Unit Pengaju
              </span>
              <span className="font-semibold text-slate-700 text-xs mt-0.5 block truncate">
                {document.ppk_name} ({document.unit_kerja})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Nilai Pembayaran
              </span>
              <span className="font-extrabold text-blue-700 text-xs mt-0.5 block">
                Rp {Number(document.nilai_pembayaran || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Banner Pesan Revisi dari Verifikator Biro 01 */}
          <div className="p-4 bg-gradient-to-r from-rose-50/90 to-red-50/90 border border-rose-200 rounded-xl text-rose-900 shadow-2xs">
            <div className="flex items-center gap-2 font-black text-xs text-rose-900 uppercase tracking-wider mb-1">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Catatan Revisi dari Verifikator Biro 01:</span>
            </div>
            <p className="text-xs font-semibold text-rose-800 pl-6 leading-relaxed bg-white/70 p-3 rounded-lg border border-rose-200/70 mt-1.5">
              {document.catatan_revisi || "Mohon perbaiki dan lengkapi berkas yang diminta."}
            </p>
          </div>

          {/* Textarea Catatan Perbaikan PPK */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                <span>Penjelasan Catatan Perbaikan PPK</span>
                <span className="text-rose-500 font-bold">*Wajib Diisi</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Minimal 5 karakter</span>
            </div>
            <textarea
              rows={3}
              value={catatanPerbaikan}
              onChange={(e) => {
                setCatatanPerbaikan(e.target.value);
                if (fieldErrors.catatan_perbaikan) {
                  setFieldErrors((prev) => ({ ...prev, catatan_perbaikan: undefined }));
                }
              }}
              placeholder="Contoh: Faktur pajak nomor 019283 telah diperbaiki stempelnya, kuitansi materai telah diunggah ulang..."
              className={`w-full p-3.5 border rounded-xl font-medium text-xs focus:outline-none transition leading-relaxed ${
                fieldErrors.catatan_perbaikan
                  ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                  : "border-slate-200 focus:border-blue-500 bg-white"
              }`}
            />
            {fieldErrors.catatan_perbaikan && (
              <p className="text-rose-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{fieldErrors.catatan_perbaikan}</span>
              </p>
            )}
          </div>

          {/* Section Dokumen Perbaikan / Pengganti (Additional Docs) */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h4 className="font-extrabold text-slate-800 text-xs md:text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>Dokumen Pendukung Revisi ({supportingDocs.length})</span>
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Lengkapi jenis, nomor dokumen, tanggal, dan unggah berkas yang diperbaiki. Bisa menambahkan lebih dari 1 dokumen.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddSupportingDoc}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 text-xs font-bold transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Dokumen</span>
              </button>
            </div>

            {/* List Dokumen Revisi yang dapat ditambahkan */}
            <div className="space-y-3.5">
              {supportingDocs.map((item, index) => {
                const rowError = fieldErrors.item_errors?.[item.id];

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50/80 transition space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <span className="font-extrabold text-xs text-slate-700 flex items-center gap-1.5">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-slate-400" />
                        <span>Dokumen Revisi {index + 1}</span>
                      </span>

                      {supportingDocs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSupportingDoc(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition cursor-pointer"
                          title="Hapus baris dokumen ini"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Input Grid: Jenis Dokumen, Nomor Dokumen, Tanggal */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Jenis Dokumen <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: Faktur Pajak, Kuitansi, SPK..."
                          value={item.jenis_dokumen}
                          onChange={(e) =>
                            handleUpdateDocField(item.id, "jenis_dokumen", e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none text-xs font-medium transition ${
                            rowError?.jenis_dokumen
                              ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                              : "border-slate-200 focus:border-blue-500"
                          }`}
                        />
                        {rowError?.jenis_dokumen && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            {rowError.jenis_dokumen}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Nomor Dokumen <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Contoh: FP-019283 / KW-002"
                          value={item.nomor_dokumen}
                          onChange={(e) =>
                            handleUpdateDocField(item.id, "nomor_dokumen", e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-xl border bg-white placeholder:text-slate-400 focus:outline-none text-xs font-medium transition ${
                            rowError?.nomor_dokumen
                              ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                              : "border-slate-200 focus:border-blue-500"
                          }`}
                        />
                        {rowError?.nomor_dokumen && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            {rowError.nomor_dokumen}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                          Tanggal Dokumen <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={item.tanggal}
                          onChange={(e) =>
                            handleUpdateDocField(item.id, "tanggal", e.target.value)
                          }
                          className={`w-full px-3 py-2 rounded-xl border bg-white text-slate-700 focus:outline-none text-xs font-medium transition ${
                            rowError?.tanggal
                              ? "border-rose-400 focus:border-rose-500 bg-rose-50/20"
                              : "border-slate-200 focus:border-blue-500"
                          }`}
                        />
                        {rowError?.tanggal && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            {rowError.tanggal}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Upload File Per Dokumen */}
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer ${
                            rowError?.file
                              ? "border-rose-400 bg-rose-50/30 text-rose-700"
                              : "border-slate-200"
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5 text-slate-500" />
                          <span>{item.file ? "Ganti File Berkas" : "Upload Dokumen *"}</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUpdateDocField(item.id, "file", e.target.files[0]);
                              }
                            }}
                          />
                        </label>

                        {item.file ? (
                          <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200/70">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                            <span className="font-semibold truncate max-w-xs">{item.file.name}</span>
                            <span className="text-[10px] text-blue-500">
                              ({(item.file.size / 1024).toFixed(1)} KB)
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateDocField(item.id, "file", null)}
                              className="ml-2 text-rose-500 hover:text-rose-700 font-bold text-[10px] cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Format PDF, JPG, PNG (Maks 25 MB)
                          </span>
                        )}
                      </div>

                      {rowError?.file && (
                        <p className="text-[10px] text-rose-500 font-semibold mt-1">
                          {rowError.file}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{loading ? "Mengirim..." : "Kirim Ulang ke Biro 01"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
