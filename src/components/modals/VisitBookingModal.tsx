import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { format } from "date-fns";
import { CalendarComponent } from "../shared/Calendar";
import { useTranslation } from "../../contexts/TranslationContext";
import { useMeetingSlots } from "../../contexts/MeetingSlotContext";
import { useMeetingBookings } from "../../contexts/MeetingBookingContext";
import { useAuth } from "../../contexts/AuthContext";
import { showToast } from "../../lib/toast";
import { MeetingSlot } from "../../types/auth";

interface VisitBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VisitBookingModal({
  isOpen,
  onClose,
}: VisitBookingModalProps) {
  const { t } = useTranslation('VisitBookingModal');
  const { user } = useAuth();
  const { fetchSlots, fetchSlotsByDay } = useMeetingSlots();
  const { addBooking } = useMeetingBookings();
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [comments, setComments] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSlots();
      // Cargar datos del usuario cuando el modal se abre
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
      }
    } else {
      // Resetear formulario cuando el modal se cierra
      setSelectedDate(undefined);
      setName("");
      setEmail("");
      setPhone("");
      setComments("");
      setSelectedSlotId(null);
      setCurrentMonth(new Date());
    }
  }, [isOpen, user]);

  const loadSlots = async () => {
    try {
      const fetchedSlots = await fetchSlots();
      setSlots(fetchedSlots);
    } catch (error) {
      console.error("Error loading slots:", error);
    }
  };

  const availableDaysDB = React.useMemo(() => {
    const days: number[] = [];
    slots.forEach((slot) => {
      if (slot.status === "OPEN" && slot.availableSpots > 0) {
        const slotDate = new Date(slot.date);
        if (
          slotDate.getMonth() === currentMonth.getMonth() &&
          slotDate.getFullYear() === currentMonth.getFullYear()
        ) {
          const day = slotDate.getDate();
          if (!days.includes(day)) {
            days.push(day);
          }
        }
      }
    });
    return days;
  }, [slots, currentMonth]);

  const bookedDaysDB = React.useMemo(() => {
    const days: number[] = [];
    slots.forEach((slot) => {
      if (slot.availableSpots === 0) {
        const slotDate = new Date(slot.date);
        if (
          slotDate.getMonth() === currentMonth.getMonth() &&
          slotDate.getFullYear() === currentMonth.getFullYear()
        ) {
          const day = slotDate.getDate();
          if (!days.includes(day)) {
            days.push(day);
          }
        }
      }
    });
    return days;
  }, [slots, currentMonth]);

  // Cargar slots específicos del día cuando se selecciona una fecha
  const [dailySlots, setDailySlots] = useState<MeetingSlot[]>([]);

  useEffect(() => {
    if (selectedDate) {
      fetchSlotsByDay(selectedDate).then((fetchedSlots) => {
        setDailySlots(fetchedSlots || []);
      }).catch((error) => {
        console.error("Error loading slots for date:", error);
        setDailySlots([]);
      });
    } else {
      setDailySlots([]);
    }
  }, [selectedDate, fetchSlotsByDay]);

  const availableSlotsForDate = React.useMemo(() => {
    if (!selectedDate) return [];
    
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const filtered = dailySlots.filter((slot) => {
      // Comparar usando startTime ya que el backend filtra por startTime
      const slotDate = new Date(slot.startTime);
      const slotDateStr = format(slotDate, "yyyy-MM-dd");
      
      const isMatch = slotDateStr === dateStr;
      const isOpen = slot.status === "OPEN";
      const hasSpots = slot.availableSpots > 0;
      
      return isMatch && isOpen && hasSpots;
    });
    
    return filtered;
  }, [selectedDate, dailySlots]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlotId(null);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast.error(t('nameRequired'));
      return;
    }

    if (!email.trim()) {
      showToast.error(t('emailRequired'));
      return;
    }

    if (!selectedSlotId) {
      showToast.error(t('slotRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      await addBooking({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        comments: comments.trim() || undefined,
        slotId: selectedSlotId,
      });
      
      showToast.success(t('bookingSuccess'));
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error: any) {
      console.error("Error creating booking:", error);
      const errorMessage = error.response?.data?.error || error.message || t('bookingError');
      showToast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = name.trim() !== "" && email.trim() !== "" && selectedSlotId !== null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-2xl font-bold text-gray-800">{t('title')}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Calendario */}
            <div>
              <CalendarComponent
                selectedDate={selectedDate}
                availableDaysDB={availableDaysDB}
                bookedDaysDB={bookedDaysDB}
                onSelectDate={handleDateSelect}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                simpleLegend={true}
              />
            </div>

            {/* Formulario */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!user}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('email')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!user}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('phone')} <span className="text-gray-400">({t('optional')})</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('comments')} <span className="text-gray-400">({t('optional')})</span>
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={t('commentsPlaceholder')}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectTime')}
                  </label>
                  {availableSlotsForDate.length > 0 ? (
                    <select
                      value={selectedSlotId || ""}
                      onChange={(e) => setSelectedSlotId(Number(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">{t('selectTimePlaceholder')}</option>
                      {availableSlotsForDate.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")} ({slot.availableSpots} {t('available')})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-500">{t('noSlotsAvailable')}</p>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{t('selectDateFirst')}</p>
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || isSubmitting}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isFormValid && !isSubmitting
                      ? "bg-gradient-to-r from-pink-400 to-purple-500 text-white hover:shadow-lg transform hover:scale-105"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isSubmitting ? t('submitting') : t('confirmBooking')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

