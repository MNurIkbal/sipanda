import React from "react";
import { AlertTriangle, Trash2, Info, CheckCircle2, X } from "lucide-react";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Mengerti",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
  showCancel = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          iconBg: "bg-amber-50 border-amber-200/80",
          btnColor: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25",
        };
      case "info":
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          iconBg: "bg-blue-50 border-blue-200/80",
          btnColor: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25",
        };
      case "danger":
      default:
        return {
          icon: <Trash2 className="h-6 w-6 text-rose-600" />,
          iconBg: "bg-rose-50 border-rose-200/80",
          btnColor: "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25",
        };
    }
  };

  const currentVariant = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200/90 transform transition-all">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl border shrink-0 ${currentVariant.iconBg}`}>
            {currentVariant.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
          {showCancel && onCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-xl transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white shadow-lg rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${currentVariant.btnColor}`}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Memproses...
              </span>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
