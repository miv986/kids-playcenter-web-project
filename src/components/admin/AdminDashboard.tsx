import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { BirthdayBooking, Child } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import TabComponent from '../shared/TabComponent';
import { AdminBookings } from './AdminBookings';
import { AdminBirthdaySlots } from './AdminBirthdaySlots';
import { AdminDaycareSlots } from './AdminDaycareSlots';
import { AdminDaycareBookings } from './AdminDaycareBookings';
import { AdminTutors } from './AdminTutors';
import { useTranslation } from '../../contexts/TranslationContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const { fetchBookings, updateBookingStatus, deleteBooking } = useBookings();
  const t = useTranslation('Dashboard');

  const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)

  useEffect(() => {
    if (!!user) {
      fetchBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])


  const tabs = [
    { id: "birthdayBookings", label: t.t('admin.birthdayBookings'), content: <AdminBookings /> },
    { id: "birthdaySlots", label: t.t('admin.birthdaySlots'), content: <AdminBirthdaySlots /> },
    { id: "daycareSlots", label: t.t('admin.daycareSlots'), content: <AdminDaycareSlots /> },
    { id: "daycareBookings", label: t.t('admin.daycareBookings'), content: <AdminDaycareBookings /> },
    { id: "tutors", label: t.t('admin.tutors'), content: <AdminTutors /> },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab="birthdayBookings"></TabComponent>
    </div>
  );
}