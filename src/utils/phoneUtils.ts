export function normalizePhoneNumber(input: string): string {
  const trimmed = String(input || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) {
    const digits = trimmed.slice(1).replace(/\D+/g, '');
    return digits ? `+${digits}` : '';
  }
  const digits = trimmed.replace(/\D+/g, '');
  return digits;
}

