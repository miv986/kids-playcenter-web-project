import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle } from 'lucide-react';
import { useBookings } from '../../../contexts/BookingContext';
import { Booking, Child } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import TabComponent from '../TabComponent/TabComponent';
import { UserBookings } from '../Bookings/UserBookings';
import { UserProfile } from '../Bookings/UserProfile';
import { useChildren } from '../../../contexts/ChildrenContext';

export function UserDashboard() {
  const { user } = useAuth();
  const { fetchMyBookings, updateBookingStatus, deleteBooking } = useBookings();

  const [bookings, setBookings] = useState([] as Array<Booking>)
  const [kids, setKids] = useState<Child[]>([]);



  useEffect(() => {
    if (!!user) {
      fetchMyBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])


  const tabs = [
    { id: "bookings", label: "Reservas", content: <UserBookings /> },
    { id: "userProfile", label: "Perfil", content: <UserProfile /> },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab="bookings"></TabComponent>
    </div>
  );
}