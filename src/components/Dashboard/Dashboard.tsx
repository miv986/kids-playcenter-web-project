import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { UserDashboard } from './UserDashboard';

export function Dashboard() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <p>Debes iniciar sesión</p>;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}