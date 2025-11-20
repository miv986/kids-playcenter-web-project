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
 * Formatea solo la fecha usando hora local para mantener la fecha correcta
 */
export function formatDateOnly(input?: string | number | Date | null, locale: string = 'es-ES'): string {
  if (!input) return '-';

  const date = typeof input === 'number' ? new Date(input)
             : typeof input === 'string' ? new Date(input)
             : input;

  // Usar hora local para mantener la fecha correcta tal como viene del backend
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateObj = new Date(year, month - 1, day);
  
  return dateObj.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES');
}

/**
 * Formatea solo la hora usando hora local para mantener la hora correcta
 */
export function formatTimeOnly(input?: string | number | Date | null, locale: string = 'es-ES'): string {
  if (!input) return '-';

  const date = typeof input === 'number' ? new Date(input)
             : typeof input === 'string' ? new Date(input)
             : input;

  // Usar hora local para mantener la hora correcta tal como viene del backend
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const dateObj = new Date(2000, 0, 1, hours, minutes);
  
  return dateObj.toLocaleTimeString(locale === 'ca' ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
}