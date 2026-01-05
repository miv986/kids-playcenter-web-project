"use client";
import React, { createContext, useContext } from "react";
import { useHttp } from "./HttpContext";
import { DaycareBooking } from "../types/auth";

interface CreateDaycareBookingData {
    userId: number;
    slotId: number;
    childrenIds: number[]; // IDs de los hijos seleccionados
    startTime: string;
    endTime: string;
    comments?: string;
}

interface DaycareBookingContextType {
    addBooking: (bookingData: CreateDaycareBookingData) => Promise<DaycareBooking>;
    updateBooking: (id: number, bookingData: Partial<DaycareBooking> & { childrenIds?: number[] }) => Promise<void>;
    cancelBooking: (id: number) => Promise<void>;
    deleteBooking: (id: number) => Promise<void>;
    markAttendance: (id: number, attendanceStatus: "ATTENDED" | "NOT_ATTENDED" | "PENDING") => Promise<DaycareBooking>;
    fetchBookings: () => Promise<DaycareBooking[]>;      // Admin → todas
    fetchBookingsByMonth: (year: number, month: number) => Promise<DaycareBooking[]>; // Admin → por mes
    fetchMyBookings: () => Promise<DaycareBooking[]>;    // Usuario → solo las suyas
    fetchAvailableSlotsByDate: (date: Date) => Promise<any[]>; // Slots disponibles por día
}

const DaycareBookingContext = createContext<DaycareBookingContextType | undefined>(undefined);

export function useDaycareBookings() {
    const context = useContext(DaycareBookingContext);
    if (!context) throw new Error("useDaycareBookings must be used within a DaycareBookingProvider");
    return context;
}

// Función helper para normalizar fechas de reservas (compatible con formato antiguo y nuevo)
// PROBLEMA: Las fechas antiguas vienen con Z (UTC), pero representan hora local
// SOLUCIÓN: Eliminar la Z sin convertir la hora, para que se interprete como local
function normalizeBookingDates(booking: any): DaycareBooking {
    const normalizeDate = (dateStr: string | Date): string => {
        if (!dateStr) return dateStr;
        
        if (dateStr instanceof Date) {
            const year = dateStr.getFullYear();
            const month = String(dateStr.getMonth() + 1).padStart(2, '0');
            const day = String(dateStr.getDate()).padStart(2, '0');
            const hours = String(dateStr.getHours()).padStart(2, '0');
            const minutes = String(dateStr.getMinutes()).padStart(2, '0');
            const seconds = String(dateStr.getSeconds()).padStart(2, '0');
            const milliseconds = String(dateStr.getMilliseconds()).padStart(3, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
        }
        
        // Si viene con Z o timezone, eliminarlos sin convertir (interpretar como local)
        if (typeof dateStr === 'string' && (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr))) {
            // Quitar Z o timezone y devolver como local
            return dateStr.replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
        }
        
        return dateStr;
    };
    
    return {
        ...booking,
        startTime: normalizeDate(booking.startTime),
        endTime: normalizeDate(booking.endTime),
    };
}

export function DaycareBookingProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();

    // 🟢 Obtener todas las reservas (sin filtros, backend aplica rango de 24 meses automáticamente)
    const fetchBookings = async () => {
        try {
            const data = await http.get("/api/daycareBookings");
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (data as DaycareBooking[]).map(normalizeBookingDates);
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando todas las reservas de daycare:", err);
            }
            return [];
        }
    };

    // 📅 Obtener reservas por mes específico (año y mes: 0-11)
    const fetchBookingsByMonth = async (year: number, month: number) => {
        try {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0); // Último día del mes
            
            const startYear = startDate.getFullYear();
            const startMonth = (startDate.getMonth() + 1).toString().padStart(2, "0");
            const startDay = startDate.getDate().toString().padStart(2, "0");
            const formattedStartDate = `${startYear}-${startMonth}-${startDay}`;

            const endYear = endDate.getFullYear();
            const endMonth = (endDate.getMonth() + 1).toString().padStart(2, "0");
            const endDay = endDate.getDate().toString().padStart(2, "0");
            const formattedEndDate = `${endYear}-${endMonth}-${endDay}`;

            // Filtrar en backend usando query params
            const bookings = await http.get(`/api/daycareBookings?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (bookings as DaycareBooking[]).map(normalizeBookingDates);
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando reservas por mes:", err);
            }
            return [];
        }
    };

    // 🧍 Obtener solo las reservas del usuario actual
    const fetchMyBookings = async () => {
        try {
            const data = await http.get("/api/daycareBookings");
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (data as DaycareBooking[]).map(normalizeBookingDates);
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando reservas del usuario:", err);
            }
            return [];
        }
    };

    // 📅 Obtener slots disponibles por fecha
    const fetchAvailableSlotsByDate = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        try {
            const data = await http.get(`/api/daycare-slots/available?date=${formattedDate}`);
            return data?.availableSlots || [];
        } catch (err) {
            console.error("❌ Error obteniendo slots disponibles:", err);
            return [];
        }
    };

    // ➕ Crear reserva de daycare
    const addBooking = async (bookingData: CreateDaycareBookingData) => {
        try {
            const response = await http.post("/api/daycareBookings", bookingData);
            return response.data || response;
        } catch (err) {
            console.error("❌ Error creando reserva daycare:", err);
            throw err;
        }
    };

    // ✏️ Modificar reserva existente
    const updateBooking = async (id: number, bookingData: Partial<DaycareBooking>) => {
        try {
            await http.put(`/api/daycareBookings/${id}`, bookingData);
        } catch (err) {
            console.error("❌ Error actualizando reserva daycare:", err);
            throw err;
        }
    };

    // 🚫 Cancelar reserva (libera plazas, mantiene en BD con status CANCEL)
    const cancelBooking = async (id: number) => {
        try {
            await http.put(`/api/daycareBookings/${id}/cancel`);
        } catch (err) {
            console.error("❌ Error cancelando reserva daycare:", err);
            throw err;
        }
    };

    // ❌ Eliminar reserva (solo ADMIN, borrado físico)
    const deleteBooking = async (id: number) => {
        try {
            await http.delete(`/api/daycareBookings/deletedDaycareBooking/${id}`);
        } catch (err) {
            console.error("❌ Error eliminando reserva daycare:", err);
            throw err;
        }
    };

    // ✅ Marcar asistencia (solo ADMIN)
    const markAttendance = async (id: number, attendanceStatus: "ATTENDED" | "NOT_ATTENDED" | "PENDING") => {
        try {
            const response = await http.put(`/api/daycareBookings/${id}/attendance`, { attendanceStatus });
            return response.booking || response;
        } catch (err) {
            console.error("❌ Error marcando asistencia:", err);
            throw err;
        }
    };

    return (
        <DaycareBookingContext.Provider
            value={{
                addBooking,
                updateBooking,
                cancelBooking,
                deleteBooking,
                markAttendance,
                fetchBookings,
                fetchBookingsByMonth,
                fetchMyBookings,
                fetchAvailableSlotsByDate,
            }}
        >
            {children}
        </DaycareBookingContext.Provider>
    );
}
