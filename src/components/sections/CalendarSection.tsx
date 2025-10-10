import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useSlots } from '../../contexts/SlotContext';
import { PacksForm } from './PacksForm';
import { BirthdayBooking, BirthdaySlot } from '../../types/auth';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';


export function CalendarSection() {

  const { fetchSlotsAvailable, fetchSlots, fetchSlotsByDay } = useSlots();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState([] as Array<BirthdaySlot>);
  const [selectedDay, setSelectedDay] = useState<Date | undefined | undefined>(undefined);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');


  const { user } = useAuth();

  const handleAuthClick = (mode: 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };



  // Fetch all slots
  useEffect(() => {
    fetchSlotsAvailable().then((slots) => setSlots(slots));
  }, []);


  const handleDayClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    console.log("SELECTED DAY", date);
    setSelectedDay(date);
  };

  console.log(slots);

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
    const statusMap: Record<number, 'green' | 'red' | 'gray'> = {};

    // Filtra los slots del mes actual
    const slotsInMonth = slots.filter(slot => {
      const date = new Date(slot.date);
      return date.getFullYear() === currentMonth.getFullYear() &&
        date.getMonth() === currentMonth.getMonth();
    });

    // Agrupa slots por día
    const slotsByDay: Record<number, BirthdaySlot[]> = {};
    slotsInMonth.forEach(slot => {
      const day = new Date(slot.date).getDate();
      if (!slotsByDay[day]) slotsByDay[day] = [];
      slotsByDay[day].push(slot);
    });

    // Asigna estado a cada día
    for (let day = 1; day <= new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate(); day++) {
      const daySlots = slotsByDay[day];
      if (!daySlots || daySlots.length === 0) {
        statusMap[day] = 'gray'; // No hay slots
      } else if (daySlots.every(slot => slot.status === 'CLOSED')) {
        statusMap[day] = 'red'; // Todos ocupados
      } else {
        statusMap[day] = 'green'; // Al menos un slot libre
      }
    }

    return statusMap;
  }, [slots, currentMonth]);

  // dentro de CalendarSection
  const reloadSlots = async () => {
    const updated = await fetchSlotsAvailable();
    setSlots(updated);
  };


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
            Aquí también puedes consultar los horarios disponibles de la ludoteca disponible de lunes a jueves.
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
                  return (
                    <div key={index}
                      onClick={() => handleDayClick(day)}
                      className="aspect-square">
                      {day && (
                        <button
                          className={`w-full h-full rounded-xl font-medium transition-all duration-200 ${dayStatus[day] === 'red'
                            ? 'bg-red-100 text-red-600 cursor-not-allowed'
                            : dayStatus[day] === 'green'
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'hover:bg-gray-100 text-gray-700'}`}
                          disabled={dayStatus[day] === 'gray'}
                        >
                          {day}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-100 rounded"></div>
                  <span className="text-gray-600">Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded"></div>
                  <span className="text-gray-600">Ocupado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded"></div>
                  <span className="text-gray-600">No disponible</span>
                </div>
              </div>
            </div>
            {/* Formulario de reserva */}
            <div className="bg-white rounded-3xl shadow-xl p-8">
              {slots &&
                <PacksForm data={slots} selectedDay={selectedDay} onBookingCreated={reloadSlots} />}
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