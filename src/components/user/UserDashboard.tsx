import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { BirthdayBooking, Child } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import TabComponent from '../shared/TabComponent';
import { UserProfile } from './UserProfile';
import { UserDaycareBookings } from './UserDaycareBookings';
import { useChildren } from '../../contexts/ChildrenContext';
import { useTranslation } from '../../contexts/TranslationContext';

export function UserDashboard() {
  const { user } = useAuth();
  const { fetchMyBookings, updateBookingStatus, deleteBooking } = useBookings();
  const t = useTranslation('Dashboard');

  const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
  const [kids, setKids] = useState<Child[]>([]);



  useEffect(() => {
    if (!!user) {
      fetchMyBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])


  const tabs = [
    { id: "daycareBookings", label: t.t('user.myReservations'), content: <UserDaycareBookings /> },
    { id: "userProfile", label: t.t('user.profile'), content: <UserProfile /> },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab="daycareBookings"></TabComponent>
    </div>
  );
}