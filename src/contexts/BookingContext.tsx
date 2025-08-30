import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking } from '../types/auth';

interface BookingContextType {
  bookings: Booking[];
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => void;
  updateBookingStatus: (id: string, status: Booking['status']) => void;
  deleteBooking: (id: string) => void;
  getUserBookings: (userId: string) => Booking[];
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
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    // Load bookings from localStorage
    const storedBookings = localStorage.getItem('bookings');
    if (storedBookings) {
      setBookings(JSON.parse(storedBookings));
    } else {
      // Initialize with some mock data
      const mockBookings: Booking[] = [
        {
          id: '1',
          userId: '2',
          userName: 'María García',
          userPhone: '+34 123 456 789',
          date: '2024-12-15',
          time: '16:00',
          numberOfKids: '6-10 niños',
          package: 'Pack Fiesta - 25€',
          comments: 'Cumpleaños de mi hija Sofia',
          status: 'pending',
          createdAt: '2024-12-01T10:00:00Z'
        },
        {
          id: '2',
          userId: '3',
          userName: 'Carlos López',
          userPhone: '+34 987 654 321',
          date: '2024-12-20',
          time: '18:00',
          numberOfKids: '11-15 niños',
          package: 'Pack Especial - 35€',
          comments: 'Celebración fin de curso',
          status: 'confirmed',
          createdAt: '2024-11-28T14:30:00Z'
        }
      ];
      setBookings(mockBookings);
      localStorage.setItem('bookings', JSON.stringify(mockBookings));
    }
  }, []);

  const addBooking = (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    const newBooking: Booking = {
      ...bookingData,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  const updateBookingStatus = (id: string, status: Booking['status']) => {
    const updatedBookings = bookings.map(booking =>
      booking.id === id ? { ...booking, status } : booking
    );
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  const deleteBooking = (id: string) => {
    const updatedBookings = bookings.filter(booking => booking.id !== id);
    setBookings(updatedBookings);
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  const getUserBookings = (userId: string) => {
    return bookings.filter(booking => booking.userId === userId);
  };

  return (
    <BookingContext.Provider value={{
      bookings,
      addBooking,
      updateBookingStatus,
      deleteBooking,
      getUserBookings
    }}>
      {children}
    </BookingContext.Provider>
  );
}