import React, { createContext, useContext } from "react";
import { useHttp } from "./HttpContext";
import { DaycareSlot } from "../types/auth";

interface DaycareSlotContextType {
    fetchSlots: () => Promise<DaycareSlot[]>;
    generateSlots: (params: { openHour: string; closeHour: string; capacity: number }) => Promise<void>;
    updateSlot: (id: number, data: Partial<DaycareSlot>) => Promise<void>;
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
        openHour,
        closeHour,
        capacity,
    }: {
        openHour: string;
        closeHour: string;
        capacity: number;
    }) => {
        try {
            await http.post("/api/daycareSlots/generate-daycare-slots", {
                openHour,
                closeHour,
                capacity,
            });
        } catch (err) {
            console.error("❌ Error generando slots de daycare:", err);
            throw err;
        }
    };

    // ✏️ Actualizar un slot individual
    const updateSlot = async (id: number, data: Partial<DaycareSlot>) => {
        try {
            await http.put(`/api/daycareSlots/daycare-slots/${id}`, data);
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

    // 📅 Obtener slots disponibles (abiertos y con plazas)
    const fetchAvailableSlotsByDate = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;
        try {
            const res = await http.get(`/api/daycareSlots/available/date/${formattedDate}`);
            console.log("DATA BY DATE", res.availableSlots);
            return res.availableSlots || [];
        } catch (err) {
            console.error("❌ Error obteniendo slots disponibles:", err);
            return [];
        }
    };

    // 📅 Obtener slots disponibles (abiertos y con plazas)
    const fetchSlots = async () => {
        try {
            const data = await http.get("/api/daycareSlots/");
            return data || [];
        } catch (err) {
            console.error("❌ Error obteniendo slots disponibles:", err);
            return [];
        }
    };

    return (
        <DaycareSlotContext.Provider
            value={{
                fetchSlots,
                generateSlots,
                updateSlot,
                updateMultipleSlots,
                deleteSlot,
                deleteMultipleSlots,
                fetchAvailableSlotsByDate,
            }}
        >
            {children}
        </DaycareSlotContext.Provider>
    );
}
