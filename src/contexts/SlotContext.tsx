import React, { createContext, useContext } from "react";
import { BirthdaySlot } from "../types/auth";
import { useHttp } from './HttpContext';

import { formatDateTime } from "../lib/formatDate";

interface SlotContextType {
    fetchSlots: () => Promise<BirthdaySlot[]>;
    fetchSlotsByDay: (date: Date) => Promise<BirthdaySlot[]>;
    createSlot: (data: Partial<BirthdaySlot>) => Promise<BirthdaySlot>;
    updateSlot: (id: number, data: Partial<BirthdaySlot>) => Promise<BirthdaySlot>;
    deleteSlot: (id: number) => Promise<void>;
}

const SlotContext = createContext<SlotContextType | undefined>(undefined);

export function useSlots() {
    const context = useContext(SlotContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a SlotProvider');
    }
    return context;
};

export function SlotProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();

    const fetchSlots = async () => {
        try {
            const data = await http.get("/api/birthdaySlots");
            return data || [];
        } catch (err) {
            console.error("Error cargando slots", err);
        }
    };

    const fetchSlotsByDay = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`; // "YYYY-MM-DD"
        console.log("Fecha formateada pre", formattedDate);

        try {
            const data = await http.get(`/api/birthdaySlots/getSlotsByDay/${formattedDate}`);
            return data as BirthdaySlot[] || [];
        } catch (err) {
            console.error("Error cargando slots por fecha", err);
            return [];

        }
    };

    const createSlot = async (data: Partial<BirthdaySlot>) => {
        try {
            const nuevoSlot = await http.post("/api/birthdaySlots", data);
            return nuevoSlot;
        } catch (err) {
            console.error("Error creando slot", err);
        }
    };

    const updateSlot = async (id: number, data: Partial<BirthdaySlot>) => {
        const res = await http.put(`/api/birthdaySlots/${id}`, data);
        return res.data;
    };

    const deleteSlot = async (id: number) => {
        await http.delete(`/api/birthdaySlots/${id}`);
    };

    return (
        <SlotContext.Provider
            value={{ fetchSlots, fetchSlotsByDay, createSlot, updateSlot, deleteSlot }}
        >
            {children}
        </SlotContext.Provider>
    );
};


