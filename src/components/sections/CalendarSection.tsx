import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useSlots } from '../../contexts/SlotContext';
import { useDaycareSlots } from '../../contexts/DaycareSlotContext';
import { PacksForm } from './PacksForm';
import { BirthdayBooking, BirthdaySlot, DaycareSlot } from '../../types/auth';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { Spinner } from '../shared/Spinner';


export function CalendarSection() {
  const router = useRouter();
  const tHook = useTranslation('Calendar');
  const t = tHook.t;
  const locale = tHook.locale;
  const { fetchSlotsAvailable } = useSlots();
  const { fetchSlots } = useDaycareSlots();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [birthdaySlots, setBirthdaySlots] = useState([] as Array<BirthdaySlot>);
  const [allDaycareSlots, setAllDaycareSlots] = useState([] as Array<DaycareSlot>); // Todos los slots cargados
  const [selectedDay, setSelectedDay] = useState<Date | undefined | undefined>(undefined);
  const [selectedDaySlots, setSelectedDaySlots] = useState<DaycareSlot[]>([]);
  const [selectedDayType, setSelectedDayType] = useState<'birthday' | 'daycare' | 'both' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const { user } = useAuth();

  const handleAuthClick = (mode: 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Fetch all slots - UNA SOLA PETICIÓN
  useEffect(() => {
    const loadAllSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const [birthdayData, daycareData] = await Promise.all([
          fetchSlotsAvailable(),
          fetchSlots()
        ]);
        setBirthdaySlots(birthdayData);
        setAllDaycareSlots(daycareData || []);
      } catch (error) {
        console.error('Error loading slots:', error);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    loadAllSlots();
  }, []);

  // Filtrar slots del mes actual desde todos los slots cargados
  const daycareSlots = useMemo(() => {
    return allDaycareSlots.filter(slot => {
      // El campo date viene como string ISO desde el backend
      const slotDate = new Date(slot.date);
      return slotDate.getFullYear() === currentMonth.getFullYear() &&
        slotDate.getMonth() === currentMonth.getMonth() &&
        slot.status === 'OPEN' &&
        slot.availableSpots > 0;
    });
  }, [allDaycareSlots, currentMonth]);


  const handleDayClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDay(date);

    // Determinar tipo de día
    const status = dayStatus[day];
    setSelectedDayType(status.type === 'birthday' ? 'birthday' : status.type === 'daycare' ? 'daycare' : status.type === 'both' ? 'both' : null);

    // Filtrar slots del día seleccionado desde los slots ya cargados
    if (status.type === 'daycare' || status.type === 'both') {
      const daySlots = allDaycareSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate.getFullYear() === date.getFullYear() &&
          slotDate.getMonth() === date.getMonth() &&
          slotDate.getDate() === date.getDate() &&
          slot.status === 'OPEN' &&
          slot.availableSpots > 0;
      });
      setSelectedDaySlots(daySlots);
    } else {
      setSelectedDaySlots([]);
    }
  };

  const months = [
    t('months.0'), t('months.1'), t('months.2'), t('months.3'),
    t('months.4'), t('months.5'), t('months.6'), t('months.7'),
    t('months.8'), t('months.9'), t('months.10'), t('months.11')
  ];

  const daysOfWeek = [
    t('daysOfWeek.0'), t('daysOfWeek.1'), t('daysOfWeek.2'),
    t('daysOfWeek.3'), t('daysOfWeek.4'), t('daysOfWeek.5'), t('daysOfWeek.6')
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Adjust for Monday start

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const dayStatus = useMemo(() => {
    const statusMap: Record<number, { type: 'both' | 'birthday' | 'daycare' | 'none', available: boolean }> = {};

    // Filtra birthday slots del mes actual
    const birthdaySlotsInMonth = birthdaySlots.filter(slot => {
      const date = new Date(slot.date);
      return date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth();
    });

    // Agrupa birthday slots por día
    const birthdaySlotsByDay: Record<number, BirthdaySlot[]> = {};
    birthdaySlotsInMonth.forEach(slot => {
      const day = new Date(slot.date).getDate();
      if (!birthdaySlotsByDay[day]) birthdaySlotsByDay[day] = [];
      birthdaySlotsByDay[day].push(slot);
    });

    // daycareSlots ya está filtrado por mes en useMemo, así que usamos directamente
    // Agrupa daycare slots por día
    const daycareSlotsByDay: Record<number, DaycareSlot[]> = {};
    daycareSlots.forEach(slot => {
      const day = new Date(slot.date).getDate();
      if (!daycareSlotsByDay[day]) daycareSlotsByDay[day] = [];
      daycareSlotsByDay[day].push(slot);
    });

    // Asigna estado a cada día
    for (let day = 1; day <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const birthdayDaySlots = birthdaySlotsByDay[day] || [];
      const daycareDaySlots = daycareSlotsByDay[day] || [];

      const hasBirthdaySlots = birthdayDaySlots.length > 0 && !birthdayDaySlots.every(slot => slot.status === 'CLOSED');
      const hasDaycareSlots = !isWeekend && daycareDaySlots.length > 0 && daycareDaySlots.some(slot => slot.availableSpots > 0);

      if (hasBirthdaySlots && hasDaycareSlots) {
        statusMap[day] = { type: 'both', available: true };
      } else if (hasBirthdaySlots) {
        statusMap[day] = { type: 'birthday', available: true };
      } else if (hasDaycareSlots) {
        statusMap[day] = { type: 'daycare', available: true };
      } else {
        statusMap[day] = { type: 'none', available: false };
      }
    }

    return statusMap;
  }, [birthdaySlots, daycareSlots, currentMonth]);

  // Recargar todos los slots después de crear una reserva
  const reloadSlots = async () => {
    const [birthdayData, daycareData] = await Promise.all([
      fetchSlotsAvailable(),
      fetchSlots()
    ]);
    setBirthdaySlots(birthdayData);
    setAllDaycareSlots(daycareData || []);
  };


  const days = getDaysInMonth(currentMonth);


  return (

    <><section id="calendario" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            {t('title')}
          </h2>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {t('subtitle')}
          </p>

          {/* Leyenda minimalista */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-8">
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-700 font-medium">{t('birthday')}</span>
              <span className="text-gray-500">{t('birthdayDays')}</span>
            </div>
            <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-gray-700 font-medium">{t('daycare')}</span>
              <span className="text-gray-500">{t('daycareDays')}</span>
            </div>
            <div className="flex items-center space-x-2 bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
              <span className="text-gray-700 font-medium">{t('both')}</span>
            </div>
          </div>

          {!user && (
            <div className="mt-8 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 max-w-md mx-auto">
                <p className="text-sm text-gray-700">
                  💡 <span className="font-semibold">{t('reserveBirthdayNoAccount')}</span> |
                  <span className="text-blue-600 font-semibold"> {t('loginOnlyDaycare')}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          {isLoadingSlots ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" text={t('loadingCalendar')} />
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Calendar */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-600" />
                </button>

                <h3 className="text-2xl font-bold text-gray-800">
                  {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>

                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <ChevronRight className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {daysOfWeek.map(day => (
                  <div key={day}
                    className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => {
                  if (!day) return <div key={index} className="aspect-square" />;
                  const status = dayStatus[day];
                  const isSelected = selectedDay && 
                    day === selectedDay.getDate() &&
                    currentMonth.getMonth() === selectedDay.getMonth() &&
                    currentMonth.getFullYear() === selectedDay.getFullYear();
                  
                  let bgClass = '';
                  if (status.type === 'none') {
                    bgClass = 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-transparent';
                  } else if (isSelected) {
                    if (status.type === 'both') {
                      bgClass = 'bg-orange-200 text-orange-800 border-2 border-white ring-2 ring-orange-400 font-bold';
                    } else if (status.type === 'birthday') {
                      bgClass = 'bg-green-200 text-green-800 border-2 border-white ring-2 ring-green-400 font-bold';
                    } else if (status.type === 'daycare') {
                      bgClass = 'bg-blue-200 text-blue-800 border-2 border-white ring-2 ring-blue-400 font-bold';
                    }
                  } else {
                    if (status.type === 'both') {
                      bgClass = 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300 border-2 border-transparent';
                    } else if (status.type === 'birthday') {
                      bgClass = 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300 border-2 border-transparent';
                    } else if (status.type === 'daycare') {
                      bgClass = 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300 border-2 border-transparent';
                    }
                  }

                  return (
                    <div key={index}
                      onClick={() => {
                        handleDayClick(day)
                      }}
                      className="aspect-square">
                      {day && (
                        <button
                          className={`w-full h-full rounded-xl font-medium transition-all duration-200 ${bgClass}`}
                          disabled={status.type === 'none'}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leyenda del calendario */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center mb-3">{t('legend')}</p>
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">{t('birthday')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-blue-100 border border-blue-300 rounded"></div>
                    <span className="text-gray-600">{t('daycare')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-orange-100 border border-orange-300 rounded"></div>
                    <span className="text-gray-600">{t('both')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-gray-100 rounded"></div>
                    <span className="text-gray-600">{t('notAvailable')}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Formulario de reserva */}
            <div className="space-y-6">
              {/* Formulario de cumpleaños */}
              {selectedDayType === 'birthday' && birthdaySlots &&
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  {!user && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {t('canReserveWithoutLogin')}
                      </p>
                    </div>
                  )}
                  <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium">
                      {t('depositInfo')}
                    </p>
                  </div>
                  <PacksForm data={birthdaySlots} selectedDay={selectedDay} onBookingCreated={reloadSlots} />
                </div>
              }

              {/* Horarios de ludoteca */}
              {(selectedDayType === 'daycare' || selectedDayType === 'both') && selectedDay && (
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {selectedDayType === 'both' ? t('daycare') + ' ' : ''}{t('schedules')} - {selectedDay.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES')}
                  </h3>
                  {selectedDaySlots.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDaySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-all">
                          <div>
                            <p className="font-medium text-gray-800">{slot.openHour} - {slot.closeHour}</p>
                            <p className="text-sm text-gray-500">{slot.availableSpots} {t('availableSpots')}</p>
                          </div>
                          {user ? (
                            <button
                              onClick={() => {
                                localStorage.setItem('openDaycareBooking', selectedDay.toISOString());
                                localStorage.setItem('shouldOpenDaycareBooking', 'true');
                                router.push('/dashboard');
                              }}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium transition-all"
                            >
                              {t('book')}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAuthClick('login')}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg hover:shadow-md text-sm font-medium transition-all"
                            >
                              {t('loginToBook')}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">{t('noSlots')}</p>
                  )}
                </div>
              )}

              {/* Mostrar ambos si es 'both' */}
              {selectedDayType === 'both' && birthdaySlots &&
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('birthday')}</h3>
                  {!user && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-700">
                        ✓ {t('reserveBirthdayWithoutLogin')}
                      </p>
                    </div>
                  )}
                  <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                    <p className="text-sm text-amber-800 font-medium">
                      {t('depositInfo')}
                    </p>
                  </div>
                  <PacksForm data={birthdaySlots} selectedDay={selectedDay} onBookingCreated={reloadSlots} />
                </div>
              }
            </div>
          </div>
          )}
        </div>
      </div>
    </section>
    <>
        {/* AuthModal*/}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode} />
      </></>


  );
}