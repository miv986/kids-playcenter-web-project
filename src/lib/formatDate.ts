export function formatDateTime(input?: string | number | Date | null): string {
  if (!input) return '-';

  // Convertir todo a Date
  const date = typeof input === 'number' ? new Date(input)
             : typeof input === 'string' ? new Date(input)
             : input;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
