"use client";
import React, { createContext, useContext } from "react";
import { MeetingSlot } from "../types/auth";
import { useHttp } from './HttpContext';
import { useTranslation } from './TranslationContext';

interface MeetingSlotContextType {
    fetchSlots: () => Promise<MeetingSlot[]>;
    fetchSlotsByMonth: (year: number, month: number) => Promise<MeetingSlot[]>;
    fetchSlotsByDay: (date: Date) => Promise<MeetingSlot[]>;
    createSlot: (data: Partial<MeetingSlot>) => Promise<MeetingSlot | null>;
    updateSlot: (id: number, data: Partial<MeetingSlot>) => Promise<MeetingSlot | null>;
    deleteSlot: (id: number) => Promise<void>;
}

const MeetingSlotContext = createContext<MeetingSlotContextType | undefined>(undefined);

export function useMeetingSlots() {
    const context = useContext(MeetingSlotContext);
    if (context === undefined) {
        throw new Error('useMeetingSlots must be used within a MeetingSlotProvider');
    }
    return context;
};

export function MeetingSlotProvider({ children }: { children: React.ReactNode }) {
    const http = useHttp();
    const { t } = useTranslation('AdminVisitSlots');

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
            // Sin parámetros, el backend devuelve 12 meses atrás y 12 adelante
            const data = await http.get("/api/meetingSlots");
            return data || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("Error cargando meeting slots", err);
            }
            return [];
        }
    };

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

            // Filtrar en backend usando query params
            const slots = await http.get(`/api/meetingSlots?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
            return slots as MeetingSlot[];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("❌ Error cargando slots por mes:", err);
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
            const data = await http.get(`/api/meetingSlots/getSlotsByDay/${formattedDate}`);
            return data as MeetingSlot[] || [];
        } catch (err: any) {
            if (err.message !== 'No token provided') {
                console.error("Error cargando meeting slots por fecha", err);
            }
            return [];
        }
    };

    const createSlot = async (data: Partial<MeetingSlot>) => {
        try {
            const nuevoSlot = await http.post("/api/meetingSlots", data);
            return nuevoSlot;
        } catch (err: any) {
            const backendMessage = err.response?.data?.error || err.message || t('errors.serverError');
            const translatedMessage = translateError(backendMessage);
            const { showToast } = await import("../lib/toast");
            showToast.error(translatedMessage);
            console.error("Error creando meeting slot", err);
            return null;
        }
    };

    const updateSlot = async (id: number, dataSlot: Partial<MeetingSlot>) => {
        try {
            const data = await http.put(`/api/meetingSlots/${id}`, dataSlot);
            return data;
        } catch (err: any) {
            const backendMessage = err.response?.data?.error || err.message || t('errors.serverError');
            const translatedMessage = translateError(backendMessage);
            const { showToast } = await import("../lib/toast");
            showToast.error(translatedMessage);
            console.error("Error actualizando meeting slot", err);
            return null;
        }
    };

    const deleteSlot = async (id: number) => {
        await http.delete(`/api/meetingSlots/${id}`);
    };

    return (
        <MeetingSlotContext.Provider
            value={{ fetchSlots, fetchSlotsByMonth, fetchSlotsByDay, createSlot, updateSlot, deleteSlot }}
        >
            {children}
        </MeetingSlotContext.Provider>
    );
};

