"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Dashboard } from "../../components/sections/Dashboard";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Limpiar flag de localStorage si existe
    if (localStorage.getItem('shouldOpenDaycareBooking')) {
      localStorage.removeItem('shouldOpenDaycareBooking');
    }
  }, []);

  return <Dashboard />;
}

