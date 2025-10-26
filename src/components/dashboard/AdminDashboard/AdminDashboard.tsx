import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle } from 'lucide-react';
import { useBookings } from '../../../contexts/BookingContext';
import { BirthdayBooking, Child } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import TabComponent from '../TabComponent/TabComponent';
import { AdminBookings } from '../Bookings/AdminBookings';
import { AdminBirthdaySlots } from './AdminBirthdaySlots';
import { AdminDaycareSlots } from './AdminDaycareSlots';
import { AdminDaycareBookings } from './AdminDaycareBookings';

export function AdminDashboard() {
  const { user } = useAuth();
  const { fetchBookings, updateBookingStatus, deleteBooking } = useBookings();

  const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)

  useEffect(() => {
    if (!!user) {
      fetchBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])


  const tabs = [
    { id: "birthdayBookings", label: "Reservas Cumpleaños", content: <AdminBookings /> },
    { id: "birthdaySlots", label: "Slots Cumpleaños", content: <AdminBirthdaySlots /> },
    { id: "daycareSlots", label: "Slots Ludoteca", content: <AdminDaycareSlots /> },
    { id: "daycareBookings", label: "Reservas Ludoteca", content: <AdminDaycareBookings /> },

  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab="birthdayBookings"></TabComponent>
    </div>
  );
}