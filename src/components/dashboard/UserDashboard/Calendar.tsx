import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(false);

    const months = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
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
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === "next" ? 1 : -1));
            return newDate;
        });
    };

    const days = getDaysInMonth(currentMonth);
    const bookedDays = [5, 12, 18, 25, 28]; // demo
    const availableDays = [3, 7, 14, 21, 24, 30]; // demo

    const handleDayClick = async (e: React.FormEvent) => {
        e.preventDefault();
        alert("clicked");
        setLoading(true);
    }

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

            <div className="grid grid-cols-7 gap-2 mb-4">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => (
                    <div key={idx} className="aspect-square">
                        {day && (
                            <button
                                onClick={handleDayClick}
                                type="button"
                                className={`w-full h-full rounded-lg text-sm font-medium transition
                  ${bookedDays.includes(day)
                                        ? "bg-red-100 text-red-600 cursor-not-allowed"
                                        : availableDays.includes(day)
                                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                                            : "hover:bg-gray-100 text-gray-700"
                                    }`}
                                disabled={bookedDays.includes(day)}
                            >
                                {day}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-100 rounded"></span> Disponible
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-100 rounded"></span> Ocupado
                </div>
                <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-100 rounded"></span> No disponible
                </div>
            </div>
        </div>
    );
}
