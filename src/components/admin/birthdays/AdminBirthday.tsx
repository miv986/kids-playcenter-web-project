import React, { useState } from 'react';
import TabComponent from '../../shared/TabComponent';
import { AdminBirthdaySlots } from './AdminBirthdaySlots';
import { AdminBookings } from './AdminBookings';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Calendar, Gift } from 'lucide-react';

export function AdminBirthday() {
  const t = useTranslation('Dashboard');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('adminBirthdayActiveTab');
      return savedTab || 'birthdayBookings';
    }
    return 'birthdayBookings';
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminBirthdayActiveTab', tabId);
    }
  };

  const tabs = [
    { 
      id: "birthdayBookings", 
      label: t.t('admin.birthdayBookings'), 
      icon: Gift, 
      content: <AdminBookings /> 
    },
    { 
      id: "birthdaySlots", 
      label: t.t('admin.birthdaySlots'), 
      icon: Calendar, 
      content: <AdminBirthdaySlots /> 
    },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab={activeTab} onTabChange={handleTabChange} variant="secondary"></TabComponent>
    </div>
  );
}

