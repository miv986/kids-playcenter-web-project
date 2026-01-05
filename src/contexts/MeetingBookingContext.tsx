"use client";
import React, { createContext, useContext } from "react";
import { useHttp } from "./HttpContext";
import { MeetingBooking } from "../types/auth";

interface CreateMeetingBookingData {
    email: string;
    name: string;
    phone?: string;
    comments?: string;
    slotId: number;
}

interface MeetingBookingContextType {
    addBooking: (bookingData: CreateMeetingBookingData) => Promise<MeetingBooking>;
    updateBooking: (id: number, bookingData: Partial<MeetingBooking>) => Promise<void>;
    updateBookingStatus: (id: number, status: MeetingBooking['status']) => Promise<void>;
    deleteBooking: (id: number) => Promise<void>;
    fetchBookings: () => Promise<MeetingBooking[]>;      // Admin → todas
    fetchBookingsByMonth: (year: number, month: number) => Promise<MeetingBooking[]>; // Admin → por mes
    fetchBookingsByDate: (date: Date) => Promise<MeetingBooking[]>; // Admin → por fecha
}

const MeetingBookingContext = createContext<MeetingBookingContextType | undefined>(undefined);

export function useMeetingBookings() {
    const context = useContext(MeetingBookingContext);
    if (!context) throw new Error("useMeetingBookings must be used within a MeetingBookingProvider");
    return context;
}

// Función helper para normalizar fechas de reservas de meeting
// PROBLEMA: Las fechas antiguas vienen con Z (UTC), pero representan hora local
// SOLUCIÓN: Eliminar la Z sin convertir la hora, para que se interprete como local
function normalizeMeetingBookingDates(booking: any): MeetingBooking {
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
    
    const normalized = { ...booking };
    
    // Normalizar fechas del slot si existe
    if (normalized.slot) {
        normalized.slot = {
            ...normalized.slot,
            date: normalized.slot.date ? normalizeDate(normalized.slot.date) : normalized.slot.date,
            startTime: normalized.slot.startTime ? normalizeDate(normalized.slot.startTime) : normalized.slot.startTime,
            endTime: normalized.slot.endTime ? normalizeDate(normalized.slot.endTime) : normalized.slot.endTime,
        };
    }
    
    return normalized;
}

export function MeetingBookingProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();

    // 🟢 Obtener todas las reservas (sin filtros, backend aplica rango de 24 meses automáticamente)
    const fetchBookings = async () => {
        try {
            const data = await http.get("/api/meetingBookings");
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (data || []).map(normalizeMeetingBookingDates) as MeetingBooking[];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando todas las reservas de meeting:", err);
            }
            return [];
        }
    };

    // 📅 Obtener reservas por mes específico (año y mes: 0-11)
    const fetchBookingsByMonth = async (year: number, month: number) => {
        try {
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0); // Último día del mes
            
            // Formatear fechas como YYYY-MM-DD
            const startYear = startDate.getFullYear();
            const startMonth = (startDate.getMonth() + 1).toString().padStart(2, "0");
            const startDay = startDate.getDate().toString().padStart(2, "0");
            const formattedStartDate = `${startYear}-${startMonth}-${startDay}`;

            const endYear = endDate.getFullYear();
            const endMonth = (endDate.getMonth() + 1).toString().padStart(2, "0");
            const endDay = endDate.getDate().toString().padStart(2, "0");
            const formattedEndDate = `${endYear}-${endMonth}-${endDay}`;

            // Filtrar en backend usando query params
            const bookings = await http.get(`/api/meetingBookings?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (bookings || []).map(normalizeMeetingBookingDates) as MeetingBooking[];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando reservas por mes:", err);
            }
            return [];
        }
    };

    // 📅 Obtener reservas por fecha (admin)
    const fetchBookingsByDate = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`; // "YYYY-MM-DD"

        try {
            const data = await http.get(`/api/meetingBookings/by-date/${formattedDate}`);
            // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
            return (data || []).map(normalizeMeetingBookingDates) as MeetingBooking[];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando reservas de meeting por fecha:", err);
            }
            return [];
        }
    };

    // ➕ Crear reserva de meeting
    const addBooking = async (bookingData: CreateMeetingBookingData) => {
        try {
            const response = await http.post("/api/meetingBookings", bookingData);
            return response.data || response;
        } catch (err: any) {
            console.error("❌ Error creando reserva meeting:", err);
            throw err;
        }
    };

    // ✏️ Modificar reserva existente
    const updateBooking = async (id: number, bookingData: Partial<MeetingBooking>) => {
        try {
            await http.put(`/api/meetingBookings/${id}`, bookingData);
        } catch (err) {
            console.error("❌ Error actualizando reserva meeting:", err);
            throw err;
        }
    };

    // 🔄 Actualizar solo el estado de la reserva
    const updateBookingStatus = async (id: number, status: MeetingBooking['status']) => {
        try {
            await http.put(`/api/meetingBookings/status/${id}`, { status });
        } catch (err) {
            console.error("❌ Error actualizando estado de reserva meeting:", err);
            throw err;
        }
    };

    // ❌ Eliminar reserva (solo ADMIN, borrado físico)
    const deleteBooking = async (id: number) => {
        try {
            await http.delete(`/api/meetingBookings/${id}`);
        } catch (err) {
            console.error("❌ Error eliminando reserva meeting:", err);
            throw err;
        }
    };

    return (
        <MeetingBookingContext.Provider
            value={{
                addBooking,
                updateBooking,
                updateBookingStatus,
                deleteBooking,
                fetchBookings,
                fetchBookingsByMonth,
                fetchBookingsByDate,
            }}
        >
            {children}
        </MeetingBookingContext.Provider>
    );
}

