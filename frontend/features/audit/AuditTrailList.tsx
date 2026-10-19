import React from "react";
import { AuditTrail } from "@/types/sipandu.types";
import { DataTable, Column } from "@/components/ui/DataTable";
import { ChevronRight, ShieldCheck, Database } from "lucide-react";
import { formatDateTimeID } from "@/lib/dateFormat";

interface AuditTrailListProps {
  logs: AuditTrail[];
}

export const AuditTrailList: React.FC<AuditTrailListProps> = ({ logs }) => {
  const columns: Column<AuditTrail>[] = [
    {
      header: "Waktu Kejadian",
      cell: (log) => (
        <span className="font-mono text-slate-500 whitespace-nowrap text-[11px]">
          {formatDateTimeID(log.created_at, { format: "short", includeTimezone: true })}
        </span>
      ),
    },
    {
      header: "Pengguna & Role",
      cell: (log) => (
        <div>
          <div className="font-bold text-slate-800">{log.user_name}</div>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-200/60">
            {log.user_role}
          </span>
        </div>
      ),
    },
    {
      header: "Aksi Log",
      cell: (log) => (
        <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-mono text-[10px] font-bold text-slate-700 border border-slate-200/80">
          {log.action}
        </span>
      ),
    },
    {
      header: "Nomor Surat",
      cell: (log) => (
        <span className="font-extrabold text-blue-700 whitespace-nowrap">
          {log.nomor_surat || "-"}
        </span>
      ),
    },
    {
      header: "Keterangan Aktivitas",
      cell: (log) => (
        <span className="text-slate-600 max-w-sm line-clamp-2 leading-relaxed">
          {log.description}
        </span>
      ),
    },
    {
      header: "Status Perubahan",
      cell: (log) => (
        <div className="flex items-center gap-1.5 text-[11px] whitespace-nowrap">
          <span className="text-slate-400 font-medium">{log.previous_status || "-"}</span>
          <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="font-bold text-slate-800">{log.new_status || "-"}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Audit Trail & Log Aktivitas</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Database className="h-2.5 w-2.5" /> Immutable Log
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Seluruh riwayat aksi pembuatan dokumen, upload berkas, verifikasi Biro 01, revisi, dan penghapusan tercatat otomatis pada sistem.
          </p>
        </div>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Cari waktu, user, aksi, nomor surat, atau keterangan..."
        searchFilterKeys={["user_name", "user_role", "action", "nomor_surat", "description"]}
        initialPageSize={10}
        pageSizeOptions={[5, 10, 20, 50]}
      />
    </div>
  );
};
