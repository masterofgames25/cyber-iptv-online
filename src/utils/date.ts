interface ExpirationStatus {
  status: 'Vencido' | 'Vencendo' | 'Normal';
  days: number;
}

export const getExpirationStatus = (expirationDate: string): ExpirationStatus => {
  const today = new Date();
  const expDate = parseDateString(expirationDate) || new Date(expirationDate);
  if (!(expDate instanceof Date) || isNaN(expDate.getTime())) {
    return { status: 'Normal', days: Infinity };
  }
  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return { status: 'Vencido', days: diffDays };
  } else if (diffDays <= 7) {
    return { status: 'Vencendo', days: diffDays };
  } else {
    return { status: 'Normal', days: diffDays };
  }
};

export const isWithinTolerance = (expirationDate: string, toleranceDays = 5): boolean => {
  const today = new Date();
  const expDate = parseDateString(expirationDate) || new Date(expirationDate);
  if (!(expDate instanceof Date) || isNaN(expDate.getTime())) return false;
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays < 0 && Math.abs(diffDays) <= toleranceDays;
};

export const isExpired = (expirationDate: string): boolean => {
  const today = new Date();
  const expDate = parseDateString(expirationDate) || new Date(expirationDate);
  if (!(expDate instanceof Date) || isNaN(expDate.getTime())) return false;
  return expDate < today;
};

export const getDaysUntilExpiration = (expirationDate: string): number => {
  const today = new Date();
  const expDate = parseDateString(expirationDate) || new Date(expirationDate);
  if (!(expDate instanceof Date) || isNaN(expDate.getTime())) return Infinity;
  const diffTime = expDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const daysInMonth = (year: number, monthIndex: number): number => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

export const addMonthsStable = (date: Date, months: number): Date => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const target = new Date(y, m + months, 1);
  const dim = daysInMonth(target.getFullYear(), target.getMonth());
  const day = Math.min(d, dim);
  return new Date(target.getFullYear(), target.getMonth(), day);
};

export const formatDateForInput = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateForDisplay = (date: Date): string => {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateStringForDisplay = (dateString: string): string => {
  try {
    const date = parseDateString(dateString);
    if (!date) return '';
    return formatDateForDisplay(date);
  } catch {
    return '';
  }
};

export const parseDateString = (dateString: string): Date | null => {
  try {
    if (typeof dateString !== 'string') return null;
    const s = dateString.trim();
    if (s.includes('-')) {
      const [yearStr, monthStr, dayStr] = s.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const day = Number(dayStr);
      if (!year || !month || !day) return null;
      return new Date(year, month - 1, day);
    }
    if (s.includes('/')) {
      const parts = s.split('/').map(Number);
      if (parts.length !== 3) return null;
      const [a, b, c] = parts;
      if (!a || !b || !c) return null;
      // Determine order: if a > 12 -> DD/MM/YYYY; if b > 12 -> MM/DD/YYYY; default to DD/MM/YYYY
      if (a > 12 && b <= 12) {
        return new Date(c, b - 1, a);
      }
      if (b > 12 && a <= 12) {
        // American MM/DD/YYYY
        return new Date(c, a - 1, b);
      }
      // Ambiguous: default to Brazilian DD/MM/YYYY
      return new Date(c, b - 1, a);
    }
    return null;
  } catch {
    return null;
  }
};

export const runDateConversionSelfTests = () => {
  const cases = [
    { in: '2025-11-16', expect: '16/11/2025' },
    { in: '11/16/2025', expect: '16/11/2025' },
    { in: '16/11/2025', expect: '16/11/2025' },
    { in: '02/03/2025', expect: '03/02/2025' }, // American -> BR
    { in: '03/02/2025', expect: '03/02/2025' }, // BR already
  ];
  const results = cases.map(c => {
    const d = parseDateString(c.in);
    const out = d ? formatDateForDisplay(d) : '';
    return { input: c.in, output: out, pass: out === c.expect };
  });
  return results;
};

export const isThisMonth = (date?: Date | string | null): boolean => {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!(d instanceof Date) || isNaN(d.getTime())) return false;
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
};