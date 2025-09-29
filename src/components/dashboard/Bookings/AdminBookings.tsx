import React, { useEffect, useState } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Trash2, Phone, Clock, Glasses } from 'lucide-react';
import { useBookings } from '../../../contexts/BookingContext';
import { BirthdayBooking } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { BirthdayBookingModal } from '../../ui/BirthdayBookingModal';
import { formatDateTime } from '../../../lib/formatDate';
import { CalendarComponent } from './Calendar';
import { useMemo } from "react";
import { BookingCard } from './BookingCard';

export function AdminBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date()); // empieza en mes actual


    const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
    const { fetchBookings, updateBookingStatus, deleteBooking, updateBooking, fetchBookingByDate } = useBookings();
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dailyBookings, setDailyBookings] = useState<BirthdayBooking[]>([]);

    const [bookedDaysDB, setBookedDaysDB] = useState<number[]>([]);

    const [selectedBooking, setSelectedBooking] = useState<BirthdayBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (booking: BirthdayBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (!!user) {
            fetchBookings().then((bookings) => setBookings(bookings))
        }
    }, [user])

    const filteredBookings = bookings.filter(booking =>
        filter === 'all' || booking.status === filter
    );


    const bookedDays = useMemo(() => {
        return bookings
            .map(b => new Date(b.slot.startTime))
            .filter(date =>
                date.getUTCFullYear() === currentMonth.getUTCFullYear() &&
                date.getUTCMonth() === currentMonth.getUTCMonth()
            )
            .map(date => date.getUTCDate());
    }, [bookings, currentMonth]);

    console.log("SELECTED DAY", selectedDate);

    const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const allDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    const availableDaysDB = allDays.filter(d => !bookedDays.includes(d));

    const handleUpdateBookingStatus = async (id: number, status: BirthdayBooking['status']) => {
        try {
            // Actualización optimista en front
            setBookings(prev =>
                prev.map(b => (b.id === id ? { ...b, status } : b))
            );

            if (selectedDate) {
                setDailyBookings(prev =>
                    prev.map(b => (b.id === id ? { ...b, status } : b))
                );
            }

            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status } : prev);
                setSelectedBooking(prev => prev ? { ...prev, status } : prev);
            }

            // Llamada al backend
            updateBookingStatus(id, status);

            // Notificación opcional
            alert(`Reserva ${id} actualizada a ${status}`);
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la reserva");
        }
    };

    const handleDeleteBooking = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta reserva?")) return;

        try {
            setBookings(prev => prev.filter(b => b.id !== id));

            if (selectedDate) {
                setDailyBookings(prev => prev.filter(b => b.id !== id));
            }

            deleteBooking(id);
            alert(`Reserva ${id} eliminada`);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar la reserva");
        }
    };


    const handleUpdateBooking = async (id: number, data: Partial<BirthdayBooking>) => {
        // Actualiza inmediatamente en la lista principal
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

        // Actualiza en dailyBookings si hay fecha seleccionada
        if (selectedDate) {
            setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
        }

        // Actualiza también el modal si está abierto
        if (selectedBooking?.id === id) {
            setSelectedBooking(prev => prev ? { ...prev, ...data } : prev);
        }

        try {
            updateBooking(id, data); // Llamada al backend
            alert("Reserva actualizada correctamente");
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la reserva");
        }
    };



    const stats = {
        total: bookings.length,
        PENDING: bookings.filter(b => b.status === 'PENDING').length,
        CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length
    };
    const bookingsToShow = selectedDate ? dailyBookings : filteredBookings;

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Administración</h1>
                <p className="text-gray-600">Gestiona todas las reservas de cumpleaños</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
                <div className="min-h-auto bg-gray-50 py-8">


                    {/* Stats Cards */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                                    <div className="text-gray-600">Total Reservas</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.PENDING}</div>
                                    <div className="text-gray-600">Pendientes</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.CONFIRMED}</div>
                                    <div className="text-gray-600">Confirmadas</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-800">{stats.CANCELLED}</div>
                                    <div className="text-gray-600">Canceladas</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    {!selectedDate && (
                        <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'all'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Todas ({stats.total})
                                </button>
                                <button
                                    onClick={() => setFilter('PENDING')}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'PENDING'
                                        ? 'bg-yellow-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Pendientes ({stats.PENDING})
                                </button>
                                <button
                                    onClick={() => setFilter('CONFIRMED')}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'CONFIRMED'
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Confirmadas ({stats.CONFIRMED})
                                </button>
                                <button
                                    onClick={() => setFilter('CANCELLED')}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${filter === 'CANCELLED'
                                        ? 'bg-red-500 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Canceladas ({stats.CANCELLED})
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Bookings List */}
                    <div className="space-y-6">
                        {/* Botón para mostrar todas las reservas */}
                        {/* Botón para mostrar todas las reservas */}
                        {selectedDate && (
                            <div className="mb-4">
                                <button
                                    onClick={() => {
                                        setSelectedDate(null);
                                        setDailyBookings([]); // limpio las de ese día
                                    }}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                >
                                    Mostrar todas
                                </button>
                            </div>
                        )}

                        {/* Lista de reservas */}
                        {bookingsToShow.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                    {selectedDate ? "No hay reservas para este día" : "No hay reservas"}
                                </h3>
                                <p className="text-gray-500">
                                    {selectedDate
                                        ? "Selecciona otro día o vuelve a mostrar todas las reservas"
                                        : "No se encontraron reservas con el filtro seleccionado"}
                                </p>
                            </div>
                        ) : (
                            bookingsToShow.map((booking) => (
                                <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                            ))
                        )}

                        <BirthdayBookingModal
                            isOpen={isModalOpen}
                            onClose={closeModal}
                            booking={selectedBooking}
                            updateBooking={handleUpdateBooking}
                            updateBookingStatus={handleUpdateBookingStatus}
                            deleteBooking={handleDeleteBooking}

                        />
                    </div>
                </div>
                {/* Columna Calendario */}
                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={availableDaysDB}
                        onSelectDate={async (date) => {
                            setSelectedDate(date);
                            const bookingsForDay = await fetchBookingByDate(date);
                            setDailyBookings(bookingsForDay || []);
                        }}
                        bookedDaysDB={bookedDays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}

                    ></CalendarComponent>
                </div>
            </div>
        </div>
    );
}