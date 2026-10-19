import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, ArrowUpDown } from "lucide-react";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFilterKeys?: (keyof T)[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  filterComponent?: React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  data,
  columns,
  searchPlaceholder = "Cari data...",
  searchFilterKeys = [],
  initialPageSize = 5,
  pageSizeOptions = [5, 10, 20, 50],
  filterComponent,
  emptyMessage = "Tidak ada data yang ditemukan.",
  onRowClick,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Search filtering
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase();

    return data.filter((item) => {
      if (searchFilterKeys.length > 0) {
        return searchFilterKeys.some((key) => {
          const val = item[key];
          return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
        });
      }
      return Object.values(item).some(
        (val) => val !== undefined && val !== null && String(val).toLowerCase().includes(query)
      );
    });
  }, [data, searchTerm, searchFilterKeys]);

  // Pagination calculation
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Safe current page adjustment
  const activePage = Math.min(currentPage, totalPages);
  const startIndex = (activePage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Page Size & Custom Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200/80 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 font-medium transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {filterComponent}

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="hidden sm:inline text-slate-400">Tampilkan:</span>
            <select
              aria-label="Jumlah Baris Per Halaman"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/80 font-bold text-slate-700 outline-none cursor-pointer hover:bg-white transition"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} baris
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-5 py-3.5 ${
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    } ${col.className || ""}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <FileSpreadsheet className="h-10 w-10 text-slate-300 mb-2 stroke-1" />
                      <span className="font-semibold text-slate-600">{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr
                    key={row.id || rowIdx}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`hover:bg-blue-50/25 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`px-5 py-3.5 align-middle ${
                          col.align === "center"
                            ? "text-center"
                            : col.align === "right"
                            ? "text-right"
                            : "text-left"
                        } ${col.className || ""}`}
                      >
                        {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as any)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
          <div>
            Menampilkan{" "}
            <span className="font-bold text-slate-800">
              {totalItems === 0 ? 0 : startIndex + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-slate-800">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{" "}
            dari <span className="font-bold text-slate-900">{totalItems}</span> total data
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Halaman Pertama"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(activePage - 1)}
              disabled={activePage === 1}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-3 py-1 font-bold text-slate-800 bg-white border border-slate-200/80 rounded-lg text-xs">
              {activePage} / {totalPages}
            </span>

            <button
              onClick={() => handlePageChange(activePage + 1)}
              disabled={activePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={activePage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Halaman Terakhir"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
