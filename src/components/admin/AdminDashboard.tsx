import React, { useEffect, useState } from 'react';
import { Users, Gift, Baby, Building2 } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { BirthdayBooking } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import TabComponent from '../shared/TabComponent';
import { AdminBirthday } from './birthdays/AdminBirthday';
import { AdminDaycare } from './daycare/AdminDaycare';
import { AdminTutors } from './AdminTutors';
import { AdminVisits } from './visits/AdminVisits';
import { useTranslation } from '../../contexts/TranslationContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const { fetchBookings } = useBookings();
  const t = useTranslation('Dashboard');

  const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('adminDashboardActiveTab');
      return savedTab || 'birthday';
    }
    return 'birthday';
  });

  useEffect(() => {
    if (!!user) {
      fetchBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDashboardActiveTab', tabId);
    }
  };

  const tabs = [
    { id: "birthday", label: t.t('admin.birthday'), icon: Gift, content: <AdminBirthday /> },
    { id: "daycare", label: t.t('admin.daycare'), icon: Baby, content: <AdminDaycare /> },
    { id: "visits", label: t.t('admin.visits'), icon: Building2, content: <AdminVisits /> },
    { id: "tutors", label: t.t('admin.tutors'), icon: Users, content: <AdminTutors /> },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab={activeTab} onTabChange={handleTabChange}></TabComponent>
    </div>
  );
}