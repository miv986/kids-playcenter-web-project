import React, { useState } from 'react';
import TabComponent from '../../shared/TabComponent';
import { AdminDaycareSlots } from './AdminDaycareSlots';
import { AdminDaycareBookings } from './AdminDaycareBookings';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Calendar, Baby } from 'lucide-react';

export function AdminDaycare() {
  const t = useTranslation('Dashboard');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('adminDaycareActiveTab');
      return savedTab || 'daycareBookings';
    }
    return 'daycareBookings';
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDaycareActiveTab', tabId);
    }
  };

  const tabs = [
    { 
      id: "daycareBookings", 
      label: t.t('admin.daycareBookings'), 
      icon: Baby, 
      content: <AdminDaycareBookings /> 
    },
    { 
      id: "daycareSlots", 
      label: t.t('admin.daycareSlots'), 
      icon: Calendar, 
      content: <AdminDaycareSlots /> 
    },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab={activeTab} onTabChange={handleTabChange} variant="secondary"></TabComponent>
    </div>
  );
}

