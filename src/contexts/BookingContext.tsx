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

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const http = useHttp();


  const fetchBookings = async () => {
    try {
      const data = await http.get('/api/bookings/getBirthdayBookings');
      return data;
    } catch (err: any) {
      if (err.message !== 'No token provided') {
        console.error("Error cargando reservas:", err);
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

    console.log("📅 Enviando al backend:", formattedDate);

    try {
      const data = await http.get(`/api/bookings/getBirthdayBooking/by-date/${formattedDate}`);
      console.log("📦 Reservas devueltas:", data);
      return data as BirthdayBooking[];
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
      await http.delete(`/api/bookings/${id}`);
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
      fetchMyBookings,
      fetchBookingByDate
    }}>
      {children}
    </BookingContext.Provider>
  );
}