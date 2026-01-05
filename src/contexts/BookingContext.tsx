"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BirthdayBooking } from '../types/auth';
import { useHttp } from './HttpContext';

interface BookingContextType {
  addBooking: (booking: Omit<BirthdayBooking, 'id' | 'createdAt' | 'status' | 'slot'>) => void;
  updateBookingStatus: (id: number, status: BirthdayBooking['status']) => void;
  updateBooking: (id: number, bookingData: Partial<BirthdayBooking>) => void;
  deleteBooking: (id: number) => void;
  fetchBookings: () => Promise<BirthdayBooking[]>;
  fetchBookingsByMonth: (year: number, month: number) => Promise<BirthdayBooking[]>;
  fetchMyBookings: () => Promise<BirthdayBooking[]>;
  fetchBookingByDate: (date: Date) => Promise<BirthdayBooking[]>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function useBookings() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBookings must be used within a BookingProvider');
  }
  return context;
}

// Función helper para normalizar fechas de reservas de cumpleaños
// PROBLEMA: Las fechas antiguas vienen con Z (UTC), pero representan hora local
// SOLUCIÓN: Eliminar la Z sin convertir la hora, para que se interprete como local
function normalizeBirthdayBookingDates(booking: any): BirthdayBooking {
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

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const http = useHttp();


  // 🟢 Obtener todas las reservas (sin filtros, backend aplica rango de 24 meses automáticamente)
  const fetchBookings = async () => {
    try {
      const data = await http.get('/api/bookings/getBirthdayBookings');
      // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
      return (data || []).map(normalizeBirthdayBookingDates);
    } catch (err: any) {
      if (err.message !== 'No token provided') {
        console.error("Error cargando reservas:", err);
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
      const bookings = await http.get(`/api/bookings/getBirthdayBookings?startDate=${formattedStartDate}&endDate=${formattedEndDate}`);
      // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
      return (bookings || []).map(normalizeBirthdayBookingDates) as BirthdayBooking[];
    } catch (err: any) {
      if (err.message !== 'No token provided') {
        console.error("❌ Error cargando reservas por mes:", err);
      }
      return [];
    }
  };

  const fetchMyBookings = async () => {
    try {
      const data = await http.get('/api/bookings/my');
      return data;
    } catch (err: any) {
      if (err.message !== 'No token provided') {
        console.error("Error cargando reservas:", err);
      }
      return [];
    }
  };

  const fetchBookingByDate = async (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`; // "YYYY-MM-DD"


    try {
      const data = await http.get(`/api/bookings/getBirthdayBooking/by-date/${formattedDate}`);
      // Normalizar fechas para compatibilidad con reservas antiguas y nuevas
      return (data || []).map(normalizeBirthdayBookingDates) as BirthdayBooking[];
    } catch (error) {
      console.error("❌ Error cargando reservas de día:", error);
      return [];
    }
  };

  const addBooking = async (bookingData: Omit<BirthdayBooking, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newBooking = await http.post('/api/bookings/createBirthdayBooking', bookingData);
      return newBooking;
    } catch (err) {
      console.error("Error adding booking:", err);
      throw err;
    }
  };

  const updateBookingStatus = async (id: number, status: BirthdayBooking['status']) => {
    try {
      await http.put(`/api/bookings/updateBirthdayBookingStatus/${id}`, { status });
    } catch (err) {
      console.error("Error updating booking:", err);
    }
  };

  const updateBooking = async (id: number, bookingData: Partial<BirthdayBooking>) => {
    try {
      await http.put(`/api/bookings/updateBirthdayBooking/${id}`, bookingData);
    } catch (err) {
      console.error("Error updating birthday booking", err);
    }
  };

  const deleteBooking = async (id: number) => {
    try {
      await http.delete(`/api/bookings/deleteBirthdayBooking/${id}`);
    } catch (err) {
      console.error("Error deleting booking:", err);
    }
  };

  return (
    <BookingContext.Provider value={{
      addBooking,
      updateBookingStatus,
      updateBooking,
      deleteBooking,
      fetchBookings,
      fetchBookingsByMonth,
      fetchMyBookings,
      fetchBookingByDate
    }}>
      {children}
    </BookingContext.Provider>
  );
}