import { format } from 'date-fns';
import { es, ca } from 'date-fns/locale';

/**
 * Convierte una fecha (string ISO, Date, o number) a Date object
 * Maneja correctamente:
 * - Strings ISO con Z (UTC) - new Date() los convierte automáticamente a hora local
 * - Strings ISO sin Z (hora local del backend) - los interpreta como hora local directamente
 * @param dateInput - String ISO, Date, o timestamp
 * @returns Date object en hora local del sistema
 */
function toLocalDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput;
  
  // Si es string ISO sin Z ni offset de timezone, interpretarlo como hora local
  if (typeof dateInput === 'string') {
    // Verificar si tiene Z o timezone offset (+/-HH:mm)
    const hasTimezone = dateInput.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateInput);
    
    if (!hasTimezone) {
      // String ISO sin timezone - interpretar como hora local directamente
      const match = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
      if (match) {
        const [, year, month, day, hour, minute, second, millisecond] = match;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hour),
          parseInt(minute),
          parseInt(second),
          millisecond ? parseInt(millisecond.padEnd(3, '0')) : 0
        );
      }
    }
  }
  
  // Para strings ISO con Z/offset o timestamps, usar new Date() que maneja la conversión automáticamente
  return new Date(dateInput);
}

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
  const date = toLocalDate(input);
  if (!date) return '-';

  // Usar format de date-fns para mantener consistencia
  const dateFnsLocale = locale === 'ca' ? ca : es;
  return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale });
}

/**
 * Formatea solo la hora usando hora local para mantener la hora correcta
 * new Date() convierte automáticamente strings ISO con Z (UTC) a hora local del sistema
 */
export function formatTimeOnly(input?: string | number | Date | null, locale: string = 'es-ES'): string {
  const date = toLocalDate(input);
  if (!date) return '-';

  const dateFnsLocale = locale === 'ca' ? ca : es;
  // format de date-fns usa los métodos locales del Date object (getHours(), getMinutes())
  return format(date, "HH:mm", { locale: dateFnsLocale });
}