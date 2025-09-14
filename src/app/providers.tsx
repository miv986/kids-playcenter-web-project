"use client";

import { TokenProvider } from "../contexts/TokenContext";
import { BookingProvider } from "../contexts/BookingContext";
import { HttpProvider } from "../contexts/HttpContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ChildrenProvider } from "../contexts/ChildrenContext";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <TokenProvider>
      <HttpProvider >
        <AuthProvider>
          <ChildrenProvider>
            <BookingProvider>
              {children}
            </BookingProvider>
          </ChildrenProvider>
        </AuthProvider>
      </HttpProvider >
    </TokenProvider >

  );
}
