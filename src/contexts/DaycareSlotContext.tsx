"use client";
import React, { createContext, useContext } from "react";
import { useHttp } from "./HttpContext";
import { DaycareSlot } from "../types/auth";

interface DaycareSlotContextType {
    fetchSlots: () => Promise<DaycareSlot[]>;
    fetchSlotsByMonth: (year: number, month: number) => Promise<DaycareSlot[]>;
    generateSlots: (params: { startDate: string; openHour: string; closeHour: string; capacity: number; customDates?: string[] }) => Promise<void>;
    updateSlot: (id: number, data: Partial<DaycareSlot>) => Promise<DaycareSlot | undefined>;
    updateMultipleSlots: (params: {
        date: string;
        startHour: string;
        endHour: string;
        capacity?: number;
        status?: string;
    }) => Promise<void>;
    deleteSlot: (id: number) => Promise<void>;
    deleteMultipleSlots: (params: {
        date: string;
        startHour?: string;
        endHour?: string;
    }) => Promise<void>;
    fetchAvailableSlotsByDate: (date: Date) => Promise<DaycareSlot[]>;
    fetchAvailableSlotsByDateRange: (startDate: Date, endDate: Date) => Promise<DaycareSlot[]>;
}

const DaycareSlotContext = createContext<DaycareSlotContextType | undefined>(undefined);

export function useDaycareSlots() {
    const context = useContext(DaycareSlotContext);
    if (!context) {
        throw new Error("useDaycareSlots must be used within a DaycareSlotProvider");
    }
    return context;
}

export function DaycareSlotProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();

    // 🟢 Generar slots automáticamente (admin)
    const generateSlots = async ({
        startDate,
        openHour,
        closeHour,
        capacity,
        customDates,
    }: {
        startDate: string;
        openHour: string;
        closeHour: string;
        capacity: number;
        customDates?: string[];
    }) => {
        try {
            await http.post("/api/daycareSlots/generate-daycare-slots", {
                startDate,
                openHour,
                closeHour,
                capacity,
                ...(customDates && customDates.length > 0 && { customDates }),
            });
        } catch (err) {
            console.error("❌ Error generando slots de daycare:", err);
            throw err;
        }
    };

    // ✏️ Actualizar un slot individual
    const updateSlot = async (id: number, data: Partial<DaycareSlot>) => {
        try {
            const response = await http.put(`/api/daycareSlots/daycare-slots/${id}`, data);
            return response.data?.slot; // Devolver el slot actualizado
        } catch (err) {
            console.error("❌ Error actualizando slot:", err);
            throw err;
        }
    };

    // 🧩 Actualizar varios slots a la vez (por fecha y rango horario)
    const updateMultipleSlots = async (params: {
        date: string;
        startHour: string;
        endHour: string;
        capacity?: number;
        status?: string;
    }) => {
        try {
            await http.put("/api/daycareSlots/daycare-slots", params);
        } catch (err) {
            console.error("❌ Error actualizando múltiples slots:", err);
            throw err;
        }
    };

    // 🗑️ Eliminar un slot
    const deleteSlot = async (id: number) => {
        try {
            await http.delete(`/api/daycareSlots/daycare-slots/${id}`);
        } catch (err) {
            console.error("❌ Error eliminando slot:", err);
            throw err;
        }
    };

    // 🗑️ Eliminar varios slots (por fecha o rango)
    const deleteMultipleSlots = async (params: {
        date: string;
        startHour?: string;
        endHour?: string;
    }) => {
        try {
            await http.delete("/api/daycareSlots/daycare-slots", { data: params });
        } catch (err) {
            console.error("❌ Error eliminando múltiples slots:", err);
            throw err;
        }
    };

    // 📅 Obtener slots disponibles (abiertos y con plazas) por fecha
    const fetchAvailableSlotsByDate = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        try {
            const res = await http.get(`/api/daycareSlots/available/date/${formattedDate}`);
            return res.availableSlots || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error obteniendo slots disponibles:", err);
            }
            return [];
        }
    };

    // 📅 Obtener slots disponibles por rango de fechas (mes completo)
    const fetchAvailableSlotsByDateRange = async (startDate: Date, endDate: Date) => {
        const startYear = startDate.getFullYear();
        const startMonth = (startDate.getMonth() + 1).toString().padStart(2, "0");
        const startDay = startDate.getDate().toString().padStart(2, "0");
        const formattedStartDate = `${startYear}-${startMonth}-${startDay}`;

        const endYear = endDate.getFullYear();
        const endMonth = (endDate.getMonth() + 1).toString().padStart(2, "0");
        const endDay = endDate.getDate().toString().padStart(2, "0");
        const formattedEndDate = `${endYear}-${endMonth}-${endDay}`;

        try {
            const res = await http.get(`/api/daycareSlots/?startDate=${formattedStartDate}&endDate=${formattedEndDate}&availableOnly=true`);
            return res.availableSlots || res || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error obteniendo slots disponibles por rango:", err);
            }
            return [];
        }
    };

    // 📅 Obtener todos los slots (sin filtros, backend aplica rango de 24 meses automáticamente)
    const fetchSlots = async () => {
        try {
            // Sin parámetros, el backend devuelve 12 meses atrás y 12 adelante
            const data = await http.get("/api/daycareSlots/");
            return data || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error obteniendo slots disponibles:", err);
            }
            return [];
        }
    };

    // 📅 Obtener slots por mes específico (año y mes: 0-11)
    const fetchSlotsByMonth = async (year: number, month: number) => {
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

            const data = await http.get(`/api/daycareSlots/?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
            return data || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error obteniendo slots por mes:", err);
            }
            return [];
        }
    };

    return (
        <DaycareSlotContext.Provider
            value={{
                fetchSlots,
                fetchSlotsByMonth,
                generateSlots,
                updateSlot,
                updateMultipleSlots,
                deleteSlot,
                deleteMultipleSlots,
                fetchAvailableSlotsByDate,
                fetchAvailableSlotsByDateRange,
            }}
        >
            {children}
        </DaycareSlotContext.Provider>
    );
}
