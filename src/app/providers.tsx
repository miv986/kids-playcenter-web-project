import { TokenProvider } from "../contexts/TokenContext";
import { BookingProvider } from "../contexts/BookingContext";
import { HttpProvider } from "../contexts/HttpContext";
import { AuthProvider } from "../contexts/AuthContext";
import { ChildrenProvider } from "../contexts/ChildrenContext";
import { SlotProvider } from "../contexts/SlotContext";
import { DaycareSlotProvider } from "../contexts/DaycareSlotContext";
import { DaycareBookingProvider } from "../contexts/DaycareBookingContext";

export default function Providers({ children }: { children: React.ReactNode }) {

  return (
    <TokenProvider>
      <HttpProvider >
        <AuthProvider>
          <ChildrenProvider>
            <BookingProvider>
              {/* Daycare bookings context */}
              <DaycareBookingProvider>
                {/* Birthday slots context */}
                <SlotProvider>
                  {/* Daycare slots context */}
                  <DaycareSlotProvider>
                    {children}
                  </DaycareSlotProvider>
                </SlotProvider>
              </DaycareBookingProvider>
            </BookingProvider>
          </ChildrenProvider>
        </AuthProvider>
      </HttpProvider >
    </TokenProvider >

  );
}
