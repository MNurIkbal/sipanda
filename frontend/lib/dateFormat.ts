/**
 * Helper utilitas pemformatan tanggal & waktu standar Bahasa Indonesia (id-ID)
 */

const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const SHORT_MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Format tanggal ke format standar Indonesia: "20 Januari 2027" atau format numerik "20/01/2027"
 */
export const formatDateID = (
  dateStr?: string | Date | null,
  options?: { format?: "numeric" | "long" | "short" }
): string => {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);

    const day = d.getDate();
    const dayStr = String(day).padStart(2, "0");
    const month = d.getMonth();
    const monthStr = String(month + 1).padStart(2, "0");
    const year = d.getFullYear();

    if (options?.format === "long") {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}`;
    }

    if (options?.format === "short") {
      return `${day} ${SHORT_MONTH_NAMES_ID[month]} ${year}`;
    }

    // Default numeric: dd/mm/yyyy
    return `${dayStr}/${monthStr}/${year}`;
  } catch {
    return String(dateStr);
  }
};

/**
 * Format tanggal dan waktu ke format standar Indonesia: "20/01/2027 13:56" atau "20 Januari 2027, 13:56 WIB"
 */
export const formatDateTimeID = (
  dateStr?: string | Date | null,
  options?: { format?: "numeric" | "long" | "short"; includeTimezone?: boolean }
): string => {
  if (!dateStr) return "-";
  try {
    const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    if (isNaN(d.getTime())) return String(dateStr);

    const day = d.getDate();
    const dayStr = String(day).padStart(2, "0");
    const month = d.getMonth();
    const monthStr = String(month + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const tz = options?.includeTimezone ? " WIB" : "";

    if (options?.format === "long") {
      return `${day} ${MONTH_NAMES_ID[month]} ${year}, ${hours}:${minutes}${tz}`;
    }

    if (options?.format === "short") {
      return `${day} ${SHORT_MONTH_NAMES_ID[month]} ${year} ${hours}:${minutes}${tz}`;
    }

    return `${dayStr}/${monthStr}/${year} ${hours}:${minutes}${tz}`;
  } catch {
    return String(dateStr);
  }
};
