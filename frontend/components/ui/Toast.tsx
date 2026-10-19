import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let borderClass = "border-emerald-500/30 bg-emerald-950/90 text-emerald-200";
        let icon = <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;

        if (toast.type === "error") {
          borderClass = "border-rose-500/30 bg-rose-950/90 text-rose-200";
          icon = <XCircle className="h-5 w-5 text-rose-400 shrink-0" />;
        } else if (toast.type === "warning") {
          borderClass = "border-amber-500/30 bg-amber-950/90 text-amber-200";
          icon = <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
        } else if (toast.type === "info") {
          borderClass = "border-blue-500/30 bg-blue-950/90 text-blue-200";
          icon = <Info className="h-5 w-5 text-blue-400 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-top-3 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold leading-tight tracking-tight">{toast.title}</div>
              <div className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{toast.message}</div>
            </div>
            <button
              onClick={() => onClose(toast.id)}
              className="opacity-70 hover:opacity-100 p-0.5 rounded-lg transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
