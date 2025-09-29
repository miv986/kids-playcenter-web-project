"use client";

import { TokenProvider } from "../contexts/TokenContext";
import { BookingProvider } from "../contexts/BookingContext";
import { HttpProvider } from "../contexts/HttpContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ChildrenProvider } from "../contexts/ChildrenContext";
import { SlotProvider } from "../contexts/SlotContext";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <TokenProvider>
      <HttpProvider >
        <AuthProvider>
          <ChildrenProvider>
            <BookingProvider>
              <SlotProvider children={children} />
            </BookingProvider>
          </ChildrenProvider>
        </AuthProvider>
      </HttpProvider >
    </TokenProvider >

  );
}
