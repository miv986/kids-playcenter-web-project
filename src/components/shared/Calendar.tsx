import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";

interface CalendarProps {
  selectedDate?: Date;
  availableDaysDB: number[];
  bookedDaysDB: number[];
  onSelectDate: (date: Date) => void;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  simpleLegend?: boolean;
}

export function CalendarComponent({
  currentMonth,
  setCurrentMonth,
  selectedDate,
  availableDaysDB,
  bookedDaysDB,
  onSelectDate,
  simpleLegend = false,
}: CalendarProps) {

  const handleDayClick = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    onSelectDate(date);
  };

  useEffect(() => {
  }, [selectedDate])

  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const daysOfWeek = ["L", "M", "X", "J", "V", "S", "D"];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // lunes = 0

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);

    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
      return newDate;
    });
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="h-fit bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigateMonth("prev")}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>

        <h3 className="text-xl font-bold text-gray-800">
          {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>

        <button
          type="button"
          onClick={() => navigateMonth("next")}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ChevronRight className="w-6 h-6 text-gray-600" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          if (!day) return <div key={idx} className="aspect-square" />;

          const selected =
            selectedDate &&
            selectedDate.getFullYear() === currentMonth.getFullYear() &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getDate() === day;


          const availableDays = availableDaysDB.includes(day);
          const bookedDays = bookedDaysDB.includes(day);

          // Lógica según datos de BD:
          // - Parcial: está en bookedDaysDB Y en availableDaysDB → mitad rojo mitad verde
          // - Totalmente reservado: está en bookedDaysDB pero NO en availableDaysDB → rojo
          // - Disponible: está en availableDaysDB pero NO en bookedDaysDB → verde
          // - Sin slot: no está en ninguno → gris
          const isSlotPartiallyBooked = bookedDays && availableDays;
          const isSlotTotallyBooked = bookedDays && !availableDays;
          const isSlotAvailable = !bookedDays && availableDays;

          // Determinar clases de estilo según el estado
          let buttonClasses = "w-full h-full rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden";

          if (isSlotPartiallyBooked) {
            // Mitad rojo mitad verde: parcialmente reservado
            buttonClasses += selected
              ? " bg-gray-50 text-gray-800 border-2 border-white ring-2 ring-gray-400 font-bold"
              : " bg-gray-50 text-gray-700 border-2 border-transparent";
          } else if (isSlotTotallyBooked) {
            // Rojo: totalmente reservado
            buttonClasses += selected
              ? " bg-red-200 text-red-800 border-2 border-white ring-2 ring-red-400 font-bold"
              : " bg-red-100 text-red-600 hover:bg-red-200 border-2 border-transparent";
          } else if (isSlotAvailable) {
            // Verde: disponible
            buttonClasses += selected
              ? " bg-green-200 text-green-800 border-2 border-white ring-2 ring-green-400 font-bold"
              : " bg-green-100 text-green-600 hover:bg-green-200 border-2 border-transparent";
          } else {
            // Gris: sin slot
            buttonClasses += selected
              ? " bg-gray-200 text-gray-600 border-2 border-white ring-2 ring-gray-400 font-bold"
              : " bg-gray-100 text-gray-400 border-2 border-transparent";
          }

          return (
            <div key={idx} className="aspect-square">
              <button
                onClick={() => handleDayClick(day)}
                type="button"
                className={buttonClasses}
              >
                {isSlotPartiallyBooked && (
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 bg-red-100"></div>
                    <div className="w-1/2 bg-green-100"></div>
                  </div>
                )}
                <span className="relative z-10">{day}</span>
              </button>
            </div>
          );
        })}
      </div>



      {/* Leyenda */}
      {simpleLegend ? (
        <div className="mt-6 flex justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-green-100 rounded"></span> Disponible
          </div>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 bg-gray-100 rounded"></span> No disponible
          </div>
        </div>
      ) : (
      <div className="mt-6 flex justify-center gap-4 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-green-100 rounded"></span> Disponible
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-100 rounded"></span> Totalmente reservado
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded flex">
            <span className="w-1/2 bg-red-100 rounded-l"></span>
            <span className="w-1/2 bg-green-100 rounded-r"></span>
          </span> Parcialmente reservado
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-100 rounded"></span> Sin slot
        </div>
      </div>
      )}
    </div>
  );
}
