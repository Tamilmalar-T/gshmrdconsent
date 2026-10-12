// Date utility functions for consistent DD/MM/YYYY numeric format across the application

/**
 * Formats a date value (Date object, ISO string, timestamp, etc.) to DD/MM/YYYY.
 * e.g., '2026-10-07' -> '07/10/2026'
 */
export const formatDateToDDMMYYYY = (dateInput) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // If already in DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
      const [d, m, y] = trimmed.split('/');
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // If in YYYY-MM-DD format (or with time)
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // If in DD-MM-YYYY format
    const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dashMatch) {
      const [, d, m, y] = dashMatch;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }

    // If textual format like 07-Oct-2026 or Oct 07 2026
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return trimmed;
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return '';
};

/**
 * Converts a DD/MM/YYYY or date string into YYYY-MM-DD format (for HTML5 date picker value).
 */
export const parseDateToISO = (dateInput) => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // If already in YYYY-MM-DD format (including full ISO like 2026-09-26T18:30:00.000Z)
    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    }

    // If DD/MM/YYYY
    const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slashMatch) {
      const [, d, m, y] = slashMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    // If DD-MM-YYYY
    const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
    if (dashMatch) {
      const [, d, m, y] = dashMatch;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${year}-${month}-${day}`;
    }

    return '';
  }

  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${year}-${month}-${day}`;
  }

  return '';
};

/**
 * Returns today's date formatted as DD/MM/YYYY (e.g. 07/10/2026).
 */
export const getTodayDDMMYYYY = () => {
  return formatDateToDDMMYYYY(new Date());
};

/**
 * Returns today's date formatted as YYYY-MM-DD (e.g. 2026-10-07).
 */
export const getTodayISO = () => {
  return parseDateToISO(new Date());
};
