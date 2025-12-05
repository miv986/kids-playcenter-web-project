import React, { useState } from 'react';
import TabComponent from '../../shared/TabComponent';
import { AdminVisitSlots } from './AdminVisitSlots';
import { AdminVisitBookings } from './AdminVisitBookings';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Calendar, Users } from 'lucide-react';

export function AdminVisits() {
  const t = useTranslation('Dashboard');
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('adminVisitsActiveTab');
      return savedTab || 'visitSlots';
    }
    return 'visitSlots';
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminVisitsActiveTab', tabId);
    }
  };

  const tabs = [
    { 
      id: "visitSlots", 
      label: t.t('admin.visitSlots'), 
      icon: Calendar, 
      content: <AdminVisitSlots /> 
    },
    { 
      id: "visitBookings", 
      label: t.t('admin.visitBookings'), 
      icon: Users, 
      content: <AdminVisitBookings /> 
    },
  ];

  return (
    <div>
      <TabComponent tabs={tabs} defaultTab={activeTab} onTabChange={handleTabChange} variant="secondary"></TabComponent>
    </div>
  );
}

