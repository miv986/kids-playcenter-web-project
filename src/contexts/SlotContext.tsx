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
        const res = await http.get("/api/birthdaySlots");
        return res.data;
    };

    const fetchSlotsByDay = async (date: Date) => {
        const dateStr = formatDateTime(date);
        const res = await http.get(`/api/birthdaySlots/getSlotsByDay?date=${dateStr}`);
        return res.data;
    };

    const createSlot = async (data: Partial<BirthdaySlot>) => {
        const res = await http.post("/api/birthdaySlots", data);
        return res.data;
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


