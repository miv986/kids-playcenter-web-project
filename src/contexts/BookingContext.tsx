import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking } from '../types/auth';
import { useHttp } from './HttpContext';

interface BookingContextType {
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  updateBookingStatus: (id: number, status: Booking['status']) => void;
  deleteBooking: (id: number) => void;
  fetchBookings: () => Promise<Booking[]>;
  fetchMyBookings: () => Promise<Booking[]>;
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
      const data = await http.get('/api/bookings');
      return data;
    } catch (err) {
      console.error("Error cargando reservas:", err);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const data = await http.get('/api/bookings/my');
      return data;
    } catch (err) {
      console.error("Error cargando reservas:", err);
    }
  };

  const addBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    try {
      const newBooking = await http.post('/api/bookings', bookingData);
      return newBooking;
    } catch (err) {
      console.error("Error adding booking:", err);
      throw err;
    }
  };

  const updateBookingStatus = async (id: number, status: Booking['status']) => {
    try {
      await http.put(`/api/bookings/${id}`, { status });
    } catch (err) {
      console.error("Error updating booking:", err);
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
      deleteBooking,
      fetchBookings,
      fetchMyBookings
    }}>
      {children}
    </BookingContext.Provider>
  );
}