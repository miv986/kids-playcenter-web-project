import React, { createContext, useContext } from "react";
import { useHttp } from "./HttpContext";
import { DaycareBooking } from "../types/auth";

interface DaycareBookingContextType {
    addBooking: (bookingData: Omit<DaycareBooking, "id" | "status">) => Promise<DaycareBooking>;
    updateBooking: (id: number, bookingData: Partial<DaycareBooking>) => Promise<void>;
    deleteBooking: (id: number) => Promise<void>;
    fetchBookings: () => Promise<DaycareBooking[]>;      // Admin → todas
    fetchMyBookings: () => Promise<DaycareBooking[]>;    // Usuario → solo las suyas
    fetchAvailableSlotsByDate: (date: Date) => Promise<any[]>; // Slots disponibles por día
}

const DaycareBookingContext = createContext<DaycareBookingContextType | undefined>(undefined);

export function useDaycareBookings() {
    const context = useContext(DaycareBookingContext);
    if (!context) throw new Error("useDaycareBookings must be used within a DaycareBookingProvider");
    return context;
}

export function DaycareBookingProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();

    // 🟢 Obtener todas las reservas (admin)
    const fetchBookings = async () => {
        try {
            const data = await http.get("/api/daycare-bookings");
            return data as DaycareBooking[];
        } catch (err) {
            console.error("❌ Error cargando todas las reservas de daycare:", err);
            return [];
        }
    };

    // 🧍 Obtener solo las reservas del usuario actual
    const fetchMyBookings = async () => {
        try {
            const data = await http.get("/api/daycare-bookings");
            return data as DaycareBooking[];
        } catch (err) {
            console.error("❌ Error cargando reservas del usuario:", err);
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
    const addBooking = async (bookingData: Omit<DaycareBooking, "id" | "status">) => {
        try {
            const newBooking = await http.post("/api/daycare-bookings", bookingData);
            return newBooking;
        } catch (err) {
            console.error("❌ Error creando reserva daycare:", err);
            throw err;
        }
    };

    // ✏️ Modificar reserva existente
    const updateBooking = async (id: number, bookingData: Partial<DaycareBooking>) => {
        try {
            await http.put(`/api/daycare-bookings/${id}`, bookingData);
        } catch (err) {
            console.error("❌ Error actualizando reserva daycare:", err);
            throw err;
        }
    };

    // ❌ Eliminar reserva
    const deleteBooking = async (id: number) => {
        try {
            await http.delete(`/api/daycare-bookings/deletedDaycareBooking/${id}`);
        } catch (err) {
            console.error("❌ Error eliminando reserva daycare:", err);
            throw err;
        }
    };

    return (
        <DaycareBookingContext.Provider
            value={{
                addBooking,
                updateBooking,
                deleteBooking,
                fetchBookings,
                fetchMyBookings,
                fetchAvailableSlotsByDate,
            }}
        >
            {children}
        </DaycareBookingContext.Provider>
    );
}
