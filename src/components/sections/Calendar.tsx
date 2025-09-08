import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { useAuth } from '../../contexts/AuthContext';
export function Calendar() {
  0
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [name, setName] = useState("");
  const [contact_number, setContactNumber] = useState("");
  const [kids, setKids] = useState(0);
  const [pack, setPack] = useState("Alegria");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  useEffect(() => {
    console.warn(kids)
  }, [kids])

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

  const days = getDaysInMonth(currentMonth);
  const bookedDays = [5, 12, 18, 25, 28]; // Example booked days
  const availableDays = [3, 7, 14, 21, 24, 30]; // Example available days

  // obtenemos al usuario autenticado
  const { user } = useAuth();
  //funcion de añadir reserva
  const { addBooking } = useBookings();

  console.log("USER ID Y NOMBRE: ", user?.id, " ", user?.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user?.id) {
      alert("Debes iniciar sesión para reservar");
      setLoading(false);
      return;
    }
    try {
      addBooking({
        contact_number,
        number_of_kinds: kids,
        type_of_package : pack,
        comments,
      });

      alert("✅ Reserva creada con éxito");
      // limpiar
      setName("");
      setContactNumber("");
      setKids(0);
      setPack("");
      setComments("");
    } catch (err: any) {
      alert("❌ " + err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <section id="calendario" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Calendario y Reservas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Consulta nuestra disponibilidad y reserva el día perfecto para tu celebración.
            ¡No esperes más para asegurar tu fecha!
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
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
                  <div key={day} className="text-center font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {days.map((day, index) => (
                  <div key={index} className="aspect-square">
                    {day && (
                      <button
                        className={`w-full h-full rounded-xl font-medium transition-all duration-200 ${bookedDays.includes(day)
                          ? 'bg-red-100 text-red-600 cursor-not-allowed'
                          : availableDays.includes(day)
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        disabled={bookedDays.includes(day)}
                      >
                        {day}
                      </button>
                    )}
                  </div>
                ))}
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

            {/* Booking Form */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl shadow-xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Hacer Reserva</h3>
              </div>

              <form className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Nombre del responsable
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    value={contact_number}
                    onChange={e => setContactNumber(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                    placeholder="+34 123 456 789"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Número de niños
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                    value={kids}
                    onChange={e => setKids(Number(e.target.value))}
                    required
                  >
                    <option value={0}>Selecciona cantidad</option>
                    <option value={5}>1-5 niños</option>
                    <option value={10}>6-10 niños</option>
                    <option value={15}>11-15 niños</option>
                    <option value={20}>Más de 15 niños</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Pack elegido
                  </label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                    value={pack}
                    onChange={e => setPack(e.target.value)}
                    required>
                    <option value={"Alegria"}>Pack Alegría - 15€</option>
                    <option value={"Fiesta"}>Pack Fiesta - 25€</option>
                    <option value={"Especial"}>Pack Especial - 35€</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Comentarios adicionales
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                    value={comments}
                    onChange={e => setComments(e.target.value)}
                    placeholder="Cuéntanos sobre la celebración..."
                  ></textarea>
                </div>

                <button
                  onClick={handleSubmit}
                  type="submit"
                  className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  {loading ? "Procesando..." : "Confirmar Reserva"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}