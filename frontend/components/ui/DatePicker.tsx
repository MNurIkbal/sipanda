"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value?: string | null; // format 'YYYY-MM-DD'
  onChange: (dateStr: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
  hasError = false,
  disabled = false,
  minDate,
  maxDate,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial selected date or fallback to today
  const parsedDate = value ? new Date(value) : null;
  const initialYear = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getFullYear() : new Date().getFullYear();
  const initialMonth = parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate.getMonth() : new Date().getMonth();

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Sync view when value changes from outside
  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Generate calendar days
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday

  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  // Format YYYY-MM-DD
  const formatISO = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return value === formatISO(viewYear, viewMonth, day);
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  // Cek apakah tanggal berada di luar batas minDate atau maxDate
  const isDateDisabled = (day: number) => {
    const iso = formatISO(viewYear, viewMonth, day);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  };

  const handleSelectDay = (day: number) => {
    if (isDateDisabled(day)) return;
    const iso = formatISO(viewYear, viewMonth, day);
    onChange(iso);
    setIsOpen(false);
  };

  const handleSetToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    const iso = formatISO(now.getFullYear(), now.getMonth(), now.getDate());
    if (minDate && iso < minDate) return;
    if (maxDate && iso > maxDate) return;
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onChange(iso);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Formatted display
  const displayValue = () => {
    if (!value) return "";
    try {
      const parts = value.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        return `${d} ${MONTH_NAMES[m]} ${y}`;
      }
    } catch {
      // fallback
    }
    return value;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`w-full px-3.5 py-2.5 rounded-xl border bg-white flex items-center justify-between text-xs font-semibold cursor-pointer transition select-none ${
          disabled
            ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
            : hasError
            ? "border-red-400 bg-red-50/20 text-slate-900 focus:border-red-500 focus:ring-1 focus:ring-red-400"
            : "border-slate-200/90 hover:border-slate-300 text-slate-800"
        } ${isOpen ? "ring-2 ring-blue-500/20 border-blue-500" : ""}`}
      >
        <div className="flex items-center gap-2 truncate">
          <CalendarIcon className={`h-4 w-4 shrink-0 ${value ? "text-blue-600" : "text-slate-400"}`} />
          <span className={value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
            {displayValue() || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-slate-100 transition"
              title="Hapus tanggal"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Popover Calendar */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72 animate-in fade-in duration-150">
          {/* Header Month / Year & Navigation */}
          <div className="flex items-center justify-between mb-3">
            <span className="font-extrabold text-sm text-slate-800">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 mb-1.5">
            {DAY_NAMES.map((d, i) => (
              <span key={d} className={i === 0 ? "text-rose-500" : ""}>
                {d}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Prev month days */}
            {Array.from({ length: firstDayWeekday }).map((_, i) => {
              const dayNum = prevMonthDays - firstDayWeekday + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="h-8 flex items-center justify-center text-slate-300 select-none text-[11px]"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const today = isToday(dayNum);
              const disabledDay = isDateDisabled(dayNum);

              return (
                <button
                  type="button"
                  key={`cur-${dayNum}`}
                  disabled={disabledDay}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`h-8 rounded-lg flex items-center justify-center font-bold transition text-xs ${
                    disabledDay
                      ? "text-slate-300 bg-slate-50 cursor-not-allowed opacity-50 line-through"
                      : selected
                      ? "bg-blue-600 text-white shadow-xs cursor-pointer"
                      : today
                      ? "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 cursor-pointer"
                      : "text-slate-700 hover:bg-slate-100 cursor-pointer"
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer Actions */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
