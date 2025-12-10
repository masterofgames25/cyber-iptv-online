export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  // Remove tudo que não é número
  const numbers = phone.replace(/\D/g, '');

  // Formata como (11) 99999-9999 ou (11) 9999-9999
  if (numbers.length === 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  }

  // Retorna o original se não conseguir formatar
  return phone;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string): string => {
  try {
    const parts = String(dateString || '').trim();
    if (!parts) return '';
    const [d, m, y] = parts.includes('/') ? parts.split('/') : parts.split('-').reverse();
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);
    if (!day || !month || !year) return '';
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
  } catch {
    return '';
  }
};

export const formatDateTime = (dateString: string): string => {
  try {
    const s = String(dateString || '').trim();
    if (!s) return '';
    const date = new Date(s);
    if (isNaN(date.getTime())) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return '';
  }
};

export const sanitizeText = (text: string): string => {
  return text.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};