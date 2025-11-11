import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle, User } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { BirthdayBooking, Child } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import TabComponent from '../shared/TabComponent';
import { UserProfile } from './UserProfile';
import { UserDaycareBookings } from './UserDaycareBookings';
import { useTranslation } from '../../contexts/TranslationContext';

export function UserDashboard() {
  const { user } = useAuth();
  const { fetchMyBookings, updateBookingStatus, deleteBooking } = useBookings();
  const t = useTranslation('Dashboard');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
  const [kids, setKids] = useState<Child[]>([]);



  useEffect(() => {
    if (!!user) {
      fetchMyBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])

  // Mapear el tab del query param al id del tab
  const getDefaultTab = () => {
    if (tabParam === 'profile') {
      return 'userProfile';
    }
    return 'daycareBookings';
  };

  const tabs = [
    { id: "daycareBookings", label: t.t('user.myReservations'), icon: Calendar, content: <UserDaycareBookings /> },
    { id: "userProfile", label: t.t('user.profile'), icon: User, content: <UserProfile /> },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab={getDefaultTab()}></TabComponent>
    </div>
  );
}