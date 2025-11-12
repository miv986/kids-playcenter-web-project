export function formatDateTime(input?: string | number | Date | null, p0?: string): string {
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

/**
 * Formatea solo la fecha usando UTC para evitar problemas de zona horaria
 */
export function formatDateOnly(input?: string | number | Date | null, locale: string = 'es-ES'): string {
  if (!input) return '-';

  const date = typeof input === 'number' ? new Date(input)
             : typeof input === 'string' ? new Date(input)
             : input;

  // Usar UTC para evitar problemas de zona horaria
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const dateObj = new Date(year, month - 1, day);
  
  return dateObj.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES');
}

/**
 * Formatea solo la hora usando UTC para evitar problemas de zona horaria
 */
export function formatTimeOnly(input?: string | number | Date | null, locale: string = 'es-ES'): string {
  if (!input) return '-';

  const date = typeof input === 'number' ? new Date(input)
             : typeof input === 'string' ? new Date(input)
             : input;

  // Usar UTC para evitar problemas de zona horaria
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const dateObj = new Date(2000, 0, 1, hours, minutes);
  
  return dateObj.toLocaleTimeString(locale === 'ca' ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
}