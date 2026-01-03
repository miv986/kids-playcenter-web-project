import { DaycareBooking } from '../types/auth';
import { format, Locale } from 'date-fns';

/**
 * Formatea la fecha de una reserva con formato completo
 */
export function formatBookingDate(date: Date | string, locale: Locale): string {
    return format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale });
}

/**
 * Formatea el horario de una reserva (HH:mm - HH:mm)
 */
export function formatBookingTime(startTime: Date | string, endTime: Date | string): string {
    return `${format(new Date(startTime), "HH:mm")} - ${format(new Date(endTime), "HH:mm")}`;
}

/**
 * Formatea fecha y hora completa (dd/MM/yyyy HH:mm)
 */
export function formatBookingDateTime(date: Date | string, locale: Locale): string {
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale });
}

/**
 * Obtiene el texto de los nombres de los niños de una reserva
 */
export function getChildrenNames(booking: DaycareBooking): string {
    if (booking.isManual) {
        return booking.manualChildName || '';
    }
    return booking.children?.map(c => `${c.name} ${c.surname}`).join(' ') || '';
}

/**
 * Obtiene el texto completo para mostrar los niños (con número)
 */
export function getChildrenDisplayText(booking: DaycareBooking): string {
    if (booking.isManual) {
        const count = booking.manualNumberOfChildren || 0;
        return `${booking.manualClientName || 'Cliente manual'} (${count} niño${count !== 1 ? 's' : ''})`;
    }
    return booking.children?.map(child => child.name).join(', ') || '';
}

/**
 * Filtra bookings por query de búsqueda
 */
export function filterBookingsByQuery(
    bookings: DaycareBooking[],
    query: string,
    locale: Locale
): DaycareBooking[] {
    if (!query.trim()) return bookings;

    const searchQuery = query.toLowerCase().trim();
    
    return bookings.filter(booking => {
        const bookingId = booking.id.toString();
        const userName = booking.user?.name?.toLowerCase() || "";
        const userEmail = booking.user?.email?.toLowerCase() || "";
        const comments = booking.comments?.toLowerCase() || "";
        const startTime = booking.startTime ? formatBookingDateTime(booking.startTime, locale) : "";
        const endTime = booking.endTime ? format(new Date(booking.endTime), "HH:mm", { locale }) : "";
        const status = booking.status.toLowerCase();
        const childrenNames = getChildrenNames(booking).toLowerCase();
        
        return bookingId.includes(searchQuery) ||
               userName.includes(searchQuery) ||
               userEmail.includes(searchQuery) ||
               comments.includes(searchQuery) ||
               startTime.includes(searchQuery) ||
               endTime.includes(searchQuery) ||
               status.includes(searchQuery) ||
               childrenNames.includes(searchQuery);
    });
}

/**
 * Ordena bookings por fecha y hora ascendente
 */
export function sortBookingsByTime(bookings: DaycareBooking[]): DaycareBooking[] {
    return [...bookings].sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeA - timeB;
    });
}

/**
 * Valida los datos de una reserva manual
 */
export interface ManualBookingValidation {
    isValid: boolean;
    error?: string;
}

export function validateManualBooking(data: {
    clientName: string;
    childName: string;
    parent1Name: string;
    parent1Phone: string;
    numberOfChildren: number;
    selectedDate: Date | null;
    selectedSlotsCount: number;
    notes?: string;
}): ManualBookingValidation {
    if (!data.clientName.trim()) {
        return { isValid: false, error: 'El nombre del cliente es obligatorio' };
    }

    if (!data.childName.trim()) {
        return { isValid: false, error: 'El nombre de los niños es obligatorio' };
    }

    if (!data.parent1Name.trim()) {
        return { isValid: false, error: 'El nombre del padre/madre 1 es obligatorio' };
    }

    if (!data.parent1Phone.trim()) {
        return { isValid: false, error: 'El teléfono del padre/madre 1 es obligatorio' };
    }

    if (data.numberOfChildren < 1) {
        return { isValid: false, error: 'Debe haber al menos un niño' };
    }

    if (!data.selectedDate) {
        return { isValid: false, error: 'Debes seleccionar una fecha' };
    }

    if (data.selectedSlotsCount === 0) {
        return { isValid: false, error: 'Debes seleccionar al menos un slot' };
    }

    if (data.notes && data.notes.length > 500) {
        return { isValid: false, error: 'Las notas no pueden exceder 500 caracteres' };
    }

    return { isValid: true };
}

/**
 * Formatea fecha como ISO local (sin conversión UTC)
 */
export function formatDateAsLocalISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Calcula startTime y endTime a partir de slots seleccionados
 */
export function calculateBookingTimes(
    sortedSlots: Array<{ date: string; hour: number }>
): { startTime: Date; endTime: Date } {
    if (sortedSlots.length === 0) {
        throw new Error('No hay slots seleccionados');
    }

    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    
    const [year, month, day] = firstSlot.date.split('-').map(Number);
    const slotDate = new Date(year, month - 1, day);
    
    const startHour = firstSlot.hour;
    const endHour = lastSlot.hour + 1; // Cada slot es de 1 hora

    const startTime = new Date(slotDate);
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date(slotDate);
    endTime.setHours(endHour, 0, 0, 0);

    return { startTime, endTime };
}

