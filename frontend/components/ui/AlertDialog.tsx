import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Hapus Data",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200/90 transform transition-all">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 shrink-0">
            <Trash2 className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-lg shadow-rose-600/25 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <>
                <Trash2 className="h-3.5 w-3.5" />
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
