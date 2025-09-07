"use client";

import { TokenProvider } from "../contexts/TokenContext";
import { BookingProvider } from "../contexts/BookingContext";
import { HttpProvider } from "../contexts/HttpContext";
import { AuthProvider } from "../contexts/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <TokenProvider>
      <HttpProvider >
        <AuthProvider>
          <BookingProvider>
            {children}
          </BookingProvider>
        </AuthProvider>
      </HttpProvider>
    </TokenProvider>

  );
}
