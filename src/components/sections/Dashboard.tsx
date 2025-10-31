import React from 'react';
import { AdminDashboard } from '../admin/AdminDashboard';
import {UserDashboard} from '../user/UserDashboard';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const t = useTranslation('Dashboard');

  if (!user) {
    return <p>{t.t('mustLogin')}</p>;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}