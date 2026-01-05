/**
 * ========================================================================
 * SISTEMA UNIFICADO DE MANEJO DE FECHAS Y TIMEZONES - FRONTEND
 * ========================================================================
 * 
 * PRINCIPIOS:
 * 1. El backend envía fechas en formato ISO sin Z: "2026-01-05T09:00:00.000"
 * 2. Estas fechas representan hora de Madrid (Europe/Madrid)
 * 3. SIEMPRE mostrar al usuario hora de Madrid, independiente del timezone del navegador
 * 4. NUNCA confiar en el timezone del navegador para lógica de negocio
 * 
 * FLUJO:
 * - API → String ISO sin Z → parseFromAPI() → Date object
 * - Display → Date object → formatForDisplay() → String legible
 * - Input → User input → toAPIFormat() → String ISO sin Z → API
 * 
 * ========================================================================
 */

import { format } from 'date-fns';
import { es, ca } from 'date-fns/locale';

const MADRID_TIMEZONE = 'Europe/Madrid';

/**
 * Parsea un string de la API y lo convierte a Date object
 * El backend siempre envía ISO sin Z representando hora de Madrid
 * 
 * @param apiDateString - String ISO de la API: "2026-01-05T09:00:00.000"
 * @returns Date object
 */
export function parseFromAPI(apiDateString: string | null | undefined): Date | null {
    if (!apiDateString) return null;
    
    // Si el string ya tiene Z o timezone offset, usar new Date() directamente
    if (apiDateString.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(apiDateString)) {
        return new Date(apiDateString);
    }
    
    // String ISO sin timezone - interpretar como hora local directamente
    // El backend lo envía representando hora de Madrid
    const match = apiDateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?/);
    if (!match) {
        console.warn(`Invalid date format from API: ${apiDateString}`);
        return new Date(apiDateString);
    }
    
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

/**
 * Formatea un Date object para enviar a la API
 * El backend espera ISO sin Z representando hora de Madrid
 * 
 * @param date - Date object
 * @returns String ISO sin Z: "2026-01-05T09:00:00.000"
 */
export function toAPIFormat(date: Date): string {
    // Obtener componentes en timezone de Madrid
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: MADRID_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '00';
    
    // Obtener milisegundos manualmente
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}`;
}

/**
 * Formatea una fecha para mostrar al usuario (fecha completa legible)
 * Siempre en timezone de Madrid
 * 
 * @param dateInput - Date object, string de API, o null
 * @param locale - 'es' o 'ca'
 * @returns String formateado: "lunes, 5 de enero de 2026"
 */
export function formatDateForDisplay(
    dateInput: Date | string | null | undefined,
    locale: 'es' | 'ca' = 'es'
): string {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return '-';
    
    const dateFnsLocale = locale === 'ca' ? ca : es;
    
    // date-fns usa los métodos nativos de Date (getHours(), etc.)
    // que ya están ajustados al timezone correcto por parseFromAPI()
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale });
}

/**
 * Formatea solo la hora para mostrar al usuario
 * Siempre en timezone de Madrid
 * 
 * @param dateInput - Date object, string de API, o null
 * @returns String formateado: "09:00"
 */
export function formatTimeForDisplay(
    dateInput: Date | string | null | undefined
): string {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return '-';
    
    return format(date, 'HH:mm');
}

/**
 * Formatea fecha corta para mostrar al usuario
 * Siempre en timezone de Madrid
 * 
 * @param dateInput - Date object, string de API, o null
 * @param locale - 'es' o 'ca'
 * @returns String formateado: "05/01/2026"
 */
export function formatDateShort(
    dateInput: Date | string | null | undefined,
    locale: 'es' | 'ca' = 'es'
): string {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return '-';
    
    const dateFnsLocale = locale === 'ca' ? ca : es;
    return format(date, 'dd/MM/yyyy', { locale: dateFnsLocale });
}

/**
 * Formatea fecha y hora completa para mostrar al usuario
 * Siempre en timezone de Madrid
 * 
 * @param dateInput - Date object, string de API, o null
 * @param locale - 'es' o 'ca'
 * @returns String formateado: "05/01/2026 09:00"
 */
export function formatDateTimeForDisplay(
    dateInput: Date | string | null | undefined,
    locale: 'es' | 'ca' = 'es'
): string {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return '-';
    
    const dateFnsLocale = locale === 'ca' ? ca : es;
    return format(date, 'dd/MM/yyyy HH:mm', { locale: dateFnsLocale });
}

/**
 * Verifica si una fecha ya pasó (en timezone de Madrid)
 * 
 * @param dateInput - Date object o string de API
 * @returns true si ya pasó
 */
export function isPastMadrid(dateInput: Date | string): boolean {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return false;
    
    const now = new Date();
    return date.getTime() < now.getTime();
}

/**
 * Verifica si una fecha es hoy (en timezone de Madrid)
 * 
 * @param dateInput - Date object o string de API
 * @returns true si es hoy
 */
export function isTodayMadrid(dateInput: Date | string): boolean {
    const date = typeof dateInput === 'string' ? parseFromAPI(dateInput) : dateInput;
    if (!date) return false;
    
    // Obtener inicio y fin del día en Madrid
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: MADRID_TIMEZONE });
    const todayStart = parseFromAPI(`${todayStr}T00:00:00.000`);
    const todayEnd = parseFromAPI(`${todayStr}T23:59:59.999`);
    
    if (!todayStart || !todayEnd) return false;
    
    const timestamp = date.getTime();
    return timestamp >= todayStart.getTime() && timestamp <= todayEnd.getTime();
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD (timezone de Madrid)
 * Útil para inputs de tipo date
 * 
 * @returns String "YYYY-MM-DD"
 */
export function getTodayMadrid(): string {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: MADRID_TIMEZONE });
}

/**
 * Crea un Date object para una fecha específica a las 00:00 en Madrid
 * 
 * @param year - Año
 * @param month - Mes (1-12)
 * @param day - Día
 * @returns Date object
 */
export function createMadridDate(year: number, month: number, day: number): Date {
    return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Crea un Date object para una fecha y hora específicas en Madrid
 * 
 * @param year - Año
 * @param month - Mes (1-12)
 * @param day - Día
 * @param hour - Hora (0-23)
 * @param minute - Minuto (0-59)
 * @returns Date object
 */
export function createMadridDateTime(
    year: number,
    month: number,
    day: number,
    hour: number,
    minute: number
): Date {
    return new Date(year, month - 1, day, hour, minute, 0, 0);
}

/**
 * Compara dos fechas para ordenamiento
 * 
 * @param a - Primera fecha (Date, string, o null)
 * @param b - Segunda fecha (Date, string, o null)
 * @returns Número para sort (negativo si a < b, positivo si a > b, 0 si iguales)
 */
export function compareDates(
    a: Date | string | null | undefined,
    b: Date | string | null | undefined
): number {
    const dateA = typeof a === 'string' ? parseFromAPI(a) : a;
    const dateB = typeof b === 'string' ? parseFromAPI(b) : b;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA.getTime() - dateB.getTime();
}

/**
 * Formatea una duración en minutos a formato legible
 * 
 * @param minutes - Duración en minutos
 * @param locale - 'es' o 'ca'
 * @returns String formateado: "2 horas" o "90 minutos"
 */
export function formatDuration(minutes: number, locale: 'es' | 'ca' = 'es'): string {
    if (minutes < 60) {
        return locale === 'ca' ? `${minutes} minuts` : `${minutes} minutos`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        const hourWord = locale === 'ca' 
            ? (hours === 1 ? 'hora' : 'hores')
            : (hours === 1 ? 'hora' : 'horas');
        return `${hours} ${hourWord}`;
    }
    
    const hourWord = locale === 'ca' 
        ? (hours === 1 ? 'hora' : 'hores')
        : (hours === 1 ? 'hora' : 'horas');
    const minuteWord = locale === 'ca' ? 'minuts' : 'minutos';
    
    return `${hours} ${hourWord} ${remainingMinutes} ${minuteWord}`;
}

