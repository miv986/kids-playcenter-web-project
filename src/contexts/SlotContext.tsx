"use client";
import React, { createContext, useContext } from "react";
import { BirthdaySlot } from "../types/auth";
import { useHttp } from './HttpContext';
import { useTranslation } from './TranslationContext';

import { formatDateTime } from "../lib/formatDate";

interface SlotContextType {
    fetchSlots: () => Promise<BirthdaySlot[]>;
    fetchSlotsAvailable: () => Promise<BirthdaySlot[]>;
    fetchSlotsByDay: (date: Date) => Promise<BirthdaySlot[]>;
    createSlot: (data: Partial<BirthdaySlot>) => Promise<BirthdaySlot>;
    updateSlot: (id: number, data: Partial<BirthdaySlot>) => Promise<BirthdaySlot>;
    deleteSlot: (id: number) => Promise<void>;

}

const SlotContext = createContext<SlotContextType | undefined>(undefined);

export function useSlots() {
    const context = useContext(SlotContext);
    if (context === undefined) {
        throw new Error('useSlots must be used within a SlotProvider');
    }
    return context;
};

export function SlotProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();
    const { t } = useTranslation('AdminBirthdaySlots');

    // Mapeo de mensajes de error del backend a claves de traducción
    const translateError = (errorMessage: string): string => {
        const errorMap: Record<string, string> = {
            "Fechas inválidas. Por favor, verifica las fechas proporcionadas.": t('errors.invalidDates'),
            "No se pueden crear slots con fechas pasadas.": t('errors.pastDateCreate'),
            "No se pueden crear slots con horarios pasados.": t('errors.pastTimeCreate'),
            "No se pueden actualizar slots a fechas pasadas.": t('errors.pastDateUpdate'),
            "No se pueden actualizar slots a horarios pasados.": t('errors.pastTimeUpdate'),
            "ID de slot inválido.": t('errors.invalidSlotId'),
            "La hora de inicio debe ser anterior a la hora de fin.": t('errors.startAfterEnd'),
            "Slot no encontrado": t('errors.slotNotFound'),
            "Slot no encontrado.": t('errors.slotNotFound'),
            "No se puede eliminar un slot que tiene una reserva activa.": t('errors.cannotDeleteWithBooking'),
            "Error interno del servidor.": t('errors.serverError'),
            "Internal server error": t('errors.serverError'),
            "Ya existe un slot con esa fecha y horario exacto": t('errors.slotExists'),
            "El slot se solapa con otro existente": t('errors.slotOverlaps'),
            "La hora de fin debe ser posterior a la de inicio": t('errors.endAfterStart'),
            "Debes proporcionar un parámetro ?date=dd-MM-yyyy": t('errors.missingDateParam'),
        };

        // Buscar coincidencia exacta
        if (errorMap[errorMessage]) {
            return errorMap[errorMessage];
        }

        // Buscar coincidencia parcial para mensajes que empiezan con ciertos textos
        if (errorMessage.startsWith("Ya existe")) {
            return t('errors.slotExists');
        }
        if (errorMessage.startsWith("El slot")) {
            return t('errors.slotOverlaps');
        }
        if (errorMessage.includes("hora de fin")) {
            return t('errors.endAfterStart');
        }

        // Si no hay traducción, devolver el mensaje original
        return errorMessage;
    };

    const fetchSlots = async () => {
        try {
            const data = await http.get("/api/birthdaySlots");
            return data || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("Error cargando slots", err);
            }
            return [];
        }
    };


    const fetchSlotsAvailable = async () => {
        try {
            const data = await http.get("/api/birthdaySlots/availableSlots");
            return data || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("Error cargando slots", err);
            }
            return [];
        }
    };

    const fetchSlotsByDay = async (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`; // "YYYY-MM-DD"

        try {
            const data = await http.get(`/api/birthdaySlots/getSlotsByDay/${formattedDate}`);
            return data as BirthdaySlot[] || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("Error cargando slots por fecha", err);
            }
            return [];

        }
    };

    const createSlot = async (data: Partial<BirthdaySlot>) => {
        try {
            const nuevoSlot = await http.post("/api/birthdaySlots", data);
            return nuevoSlot;
        } catch (err: any) {
            const backendMessage = err.response?.data?.error || err.message || t('errors.serverError');
            const translatedMessage = translateError(backendMessage);
            const { showToast } = await import("../lib/toast");
            showToast.error(translatedMessage);
            console.error("Error creando slot", err);
            return null;
        }
    };

    const updateSlot = async (id: number, dataSlot: Partial<BirthdaySlot>) => {
        try {
            const data = await http.put(`/api/birthdaySlots/${id}`, dataSlot);
            return data;
        } catch (err: any) {
            const backendMessage = err.response?.data?.error || err.message || t('errors.serverError');
            const translatedMessage = translateError(backendMessage);
            const { showToast } = await import("../lib/toast");
            showToast.error(translatedMessage);
            console.error("Error actualizando slot", err);
            return null;
        }
    };

    const deleteSlot = async (id: number) => {
        await http.delete(`/api/birthdaySlots/${id}`);
    };

    return (
        <SlotContext.Provider
            value={{ fetchSlots, fetchSlotsAvailable, fetchSlotsByDay, createSlot, updateSlot, deleteSlot }}
        >
            {children}
        </SlotContext.Provider>
    );
};


