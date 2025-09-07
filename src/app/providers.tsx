"use client";

import { AuthProvider } from "../contexts/AuthContext";
import { BookingProvider } from "../contexts/BookingContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BookingProvider>{children}</BookingProvider>
    </AuthProvider>
  );
}
