import React from 'react';
import { AdminDashboard } from '../admin/AdminDashboard';
import {UserDashboard} from '../user/UserDashboard';
import { useAuth } from '../../contexts/AuthContext';

export function Dashboard() {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <p>Debes iniciar sesión</p>;
  }

  return isAdmin ? <AdminDashboard /> : <UserDashboard />;
}