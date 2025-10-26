import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useSlots } from '../../contexts/SlotContext';
import { useDaycareSlots } from '../../contexts/DaycareSlotContext';
import { PacksForm } from './PacksForm';
import { BirthdayBooking, BirthdaySlot, DaycareSlot } from '../../types/auth';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';


export function CalendarSection() {

  const { fetchSlotsAvailable, fetchSlots, fetchSlotsByDay } = useSlots();
  const { fetchAvailableSlotsByDate } = useDaycareSlots();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [birthdaySlots, setBirthdaySlots] = useState([] as Array<BirthdaySlot>);
  const [daycareSlots, setDaycareSlots] = useState([] as Array<DaycareSlot>);
  const [selectedDay, setSelectedDay] = useState<Date | undefined | undefined>(undefined);
  const [selectedDaySlots, setSelectedDaySlots] = useState<DaycareSlot[]>([]);
  const [selectedDayType, setSelectedDayType] = useState<'birthday' | 'daycare' | 'both' | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');


  const { user } = useAuth();

  const handleAuthClick = (mode: 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };



  // Fetch all slots
  useEffect(() => {
    fetchSlotsAvailable().then((slots) => setBirthdaySlots(slots));
    fetchDaycareSlotsForMonth();
  }, []);

  const fetchDaycareSlotsForMonth = async () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const slotsMap = new Map<number, DaycareSlot[]>();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const slots = await fetchAvailableSlotsByDate(date);
      slotsMap.set(day, slots);
    }
    // Convert map to flat array for now
    const allDaycareSlots: DaycareSlot[] = [];
    slotsMap.forEach(slots => allDaycareSlots.push(...slots));
    setDaycareSlots(allDaycareSlots);
  };


  const handleDayClick = async (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    setSelectedDay(date);
    
    // Determinar tipo de día
    const status = dayStatus[day];
    setSelectedDayType(status.type === 'birthday' ? 'birthday' : status.type === 'daycare' ? 'daycare' : status.type === 'both' ? 'both' : null);
    
    // Si hay slots de daycare, cargarlos
    if (status.type === 'daycare' || status.type === 'both') {
      const slots = await fetchAvailableSlotsByDate(date);
      setSelectedDaySlots(slots);
    } else {
      setSelectedDaySlots([]);
    }
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];


  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

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

    // Filtra daycare slots del mes actual
    const daycareSlotsInMonth = daycareSlots.filter(slot => {
      const date = new Date(slot.date);
      return date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth();
    });

    // Agrupa daycare slots por día
    const daycareSlotsByDay: Record<number, DaycareSlot[]> = {};
    daycareSlotsInMonth.forEach(slot => {
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

  // dentro de CalendarSection
  const reloadSlots = async () => {
    const updated = await fetchSlotsAvailable();
    setBirthdaySlots(updated);
    await fetchDaycareSlotsForMonth();
  };

  useEffect(() => {
    fetchDaycareSlotsForMonth();
  }, [currentMonth]);


  const days = getDaysInMonth(currentMonth);


  return (

    <><section id="calendario" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Encabezado */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Calendario y Reservas
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Consulta nuestra disponibilidad y reserva el día perfecto para tu celebración.
            ¡No esperes más para asegurar tu fecha!
          </p>
          {/* Nuevo texto informativo */}
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-6">
            <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-2 align-middle"></span>
            Solo Cumpleaños (Viernes-Domingo) | 
            <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded ml-3 mr-2 align-middle"></span>
            Solo Ludoteca (Lunes-Jueves) | 
            <span className="inline-block w-3 h-3 bg-gradient-to-br from-orange-100 to-orange-200 border border-orange-300 rounded ml-3 mr-2 align-middle"></span>
            Ambos servicios
          </p>

          {!user &&
            <><p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-6">
              Selecciona un día de lunes a jueves para ver los horarios disponibles.
              ¿Quieres reservar? Crea tu cuenta o inicia sesión.
            </p><button
              onClick={() => handleAuthClick('login')} // función que abre el modal
              className="mt-4 inline-block bg-pink-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-500 transition-colors"
            >
                Iniciar sesión / Crear cuenta
              </button></>
          }
        </div>

        <div className="max-w-4xl mx-auto">
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
                  const bgClass = 
                    status.type === 'both' ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700 hover:from-orange-200 hover:to-orange-300' :
                    status.type === 'birthday' ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700 hover:from-green-200 hover:to-green-300' :
                    status.type === 'daycare' ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 hover:from-blue-200 hover:to-blue-300' :
                    'bg-gray-100 text-gray-400 cursor-not-allowed';
                  
                  return (
                    <div key={index}
                      onClick={() => handleDayClick(day)}
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

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                  <span className="text-gray-600">Solo Cumpleaños</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-gray-600">Solo Ludoteca</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-orange-200 border border-orange-300 rounded"></div>
                  <span className="text-gray-600">Ambos</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span className="text-gray-600">No disponible</span>
                </div>
              </div>
            </div>
            {/* Formulario de reserva */}
            <div className="space-y-6">
              {/* Formulario de cumpleaños */}
              {selectedDayType === 'birthday' && birthdaySlots &&
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <PacksForm data={birthdaySlots} selectedDay={selectedDay} onBookingCreated={reloadSlots} />
                </div>
              }
              
              {/* Horarios de ludoteca */}
              {(selectedDayType === 'daycare' || selectedDayType === 'both') && selectedDay && (
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    {selectedDayType === 'both' ? 'Ludoteca' : ''} Horarios - {selectedDay.toLocaleDateString('es-ES')}
                  </h3>
                  {selectedDaySlots.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDaySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-blue-50 transition-all">
                          <div>
                            <p className="font-medium text-gray-800">{slot.openHour} - {slot.closeHour}</p>
                            <p className="text-sm text-gray-500">{slot.availableSpots} plazas disponibles</p>
                          </div>
                          {user ? (
                            <button 
                              onClick={() => {
                                localStorage.setItem('openDaycareBooking', selectedDay.toISOString());
                                localStorage.setItem('shouldOpenDaycareBooking', 'true');
                                window.location.href = '/';
                              }}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm font-medium"
                            >
                              Reservar en Perfil
                            </button>
                          ) : (
                            <button onClick={() => handleAuthClick('login')} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium">
                              Iniciar Sesión
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No hay horarios disponibles para este día</p>
                  )}
                </div>
              )}
              
              {/* Mostrar ambos si es 'both' */}
              {selectedDayType === 'both' && birthdaySlots &&
                <div className="bg-white rounded-3xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">Cumpleaños</h3>
                  <PacksForm data={birthdaySlots} selectedDay={selectedDay} onBookingCreated={reloadSlots} />
                </div>
              }
            </div>


          </div>
        </div>
      </div>
    </section><>
        {/* AuthModal*/}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          initialMode={authMode} />
      </></>


  );
}