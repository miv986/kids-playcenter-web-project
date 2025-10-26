import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Trash2, Phone, Clock, CalendarDays, Filter } from 'lucide-react';
import { useDaycareBookings } from '../../../contexts/DaycareBookingContext';
import { DaycareBooking } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { format } from 'date-fns';
import { CalendarComponent } from '../Bookings/Calendar';

export function AdminDaycareBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([] as Array<DaycareBooking>);
    const { fetchBookings, updateBooking, deleteBooking } = useDaycareBookings();
    const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<DaycareBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<DaycareBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (booking: DaycareBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    useEffect(() => {
        if (!!user) {
            fetchBookings().then((bookings) => setBookings(bookings));
        }
    }, [user]);

    const filteredBookings = bookings.filter(booking =>
        filter === 'all' || booking.status === filter
    );

    const bookedDays = useMemo(() => {
        return bookings
            .map(b => new Date(b.startTime))
            .filter(date =>
                date.getFullYear() === currentMonth.getFullYear() &&
                date.getMonth() === currentMonth.getMonth()
            )
            .map(date => date.getDate());
    }, [bookings, currentMonth]);

    const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const allDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    const availableDaysDB = allDays.filter(d => !bookedDays.includes(d));

    const handleDeleteBooking = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres eliminar esta reserva?")) return;

        try {
            setBookings(prev => prev.filter(b => b.id !== id));
            if (selectedDate) {
                setDailyBookings(prev => prev.filter(b => b.id !== id));
            }
            await deleteBooking(id);
            alert(`Reserva ${id} eliminada`);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar la reserva");
        }
    };

    const handleUpdateBooking = async (id: number, data: Partial<DaycareBooking>) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
        if (selectedDate) {
            setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
        }
        if (selectedBooking?.id === id) {
            setSelectedBooking(prev => prev ? { ...prev, ...data } : prev);
        }
        try {
            await updateBooking(id, data);
            alert("Reserva actualizada correctamente");
        } catch (err) {
            console.error(err);
            alert("Error al actualizar la reserva");
        }
    };

    const stats = {
        total: bookings.length,
        CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length
    };

    const bookingsToShow = selectedDate ? dailyBookings : filteredBookings;

    // Agrupar reservas por día
    const bookingsByDate = useMemo(() => {
        const grouped: Record<string, DaycareBooking[]> = {};
        bookingsToShow.forEach(booking => {
            const date = format(new Date(booking.startTime), 'yyyy-MM-dd');
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(booking);
        });
        return grouped;
    }, [bookingsToShow]);

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Reservas Ludoteca</h1>
                <p className="text-gray-600">Gestiona todas las reservas de ludoteca</p>
            </div>

            {/* Controles superiores */}
            <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${viewMode === "calendar"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        Vista Calendario
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${viewMode === "list"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Vista Lista
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600"
                    >
                        <Filter className="w-4 h-4" />
                        Filtros
                    </button>
                </div>
            </div>

            {/* Panel de filtros */}
            {showFilters && (
                <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">Filtrar por Estado</h3>
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

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
                {/* Panel principal */}
                <div className="min-h-auto bg-gray-50 py-8">

                    {viewMode === "calendar" ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">Vista Calendario</h2>
                                {selectedDate && (
                                    <button
                                        onClick={() => {
                                            setSelectedDate(undefined);
                                            setDailyBookings([]);
                                        }}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        Ver todas las reservas
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Reservas del {format(selectedDate, "dd/MM/yyyy")}
                                    </h3>
                                    {dailyBookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">No hay reservas para este día</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {dailyBookings.map((booking) => (
                                                <div key={booking.id} className="bg-gray-50 p-4 rounded-xl border">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Clock className="w-4 h-4 text-gray-600" />
                                                                <span className="font-semibold text-gray-800">
                                                                    {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Users className="w-4 h-4 text-gray-600" />
                                                                <span className="text-gray-700">{booking.user?.name || 'Usuario'}</span>
                                                            </div>
                                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {booking.status}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openModal(booking)}
                                                                className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600"
                                                            >
                                                                Ver
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBooking(booking.id)}
                                                                className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        Selecciona un día del calendario
                                    </h3>
                                    <p className="text-gray-500">
                                        Haz clic en cualquier día para ver sus reservas
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">Todas las Reservas</h2>
                                <div className="text-sm text-gray-500">
                                    {bookingsToShow.length} reservas {filter !== 'all' ? 'filtradas' : 'totales'}
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                        </div>
                    )}

                    {/* Lista de reservas agrupadas por fecha */}
                    {viewMode === "list" && (
                        <div className="space-y-6">
                            {Object.keys(bookingsByDate).length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No hay reservas
                                    </h3>
                                    <p className="text-gray-500">
                                        {filter !== 'all'
                                            ? "No se encontraron reservas con el filtro seleccionado"
                                            : "No hay reservas registradas"}
                                    </p>
                                </div>
                            ) : (
                                Object.entries(bookingsByDate)
                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                    .map(([date, dayBookings]) => (
                                        <div key={date} className="bg-white rounded-xl shadow-lg p-6">
                                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                {format(new Date(date), "EEEE, dd/MM/yyyy")}
                                                <span className="text-sm font-normal text-gray-500">
                                                    ({dayBookings.length} reserva{dayBookings.length !== 1 ? 's' : ''})
                                                </span>
                                            </h3>
                                            <div className="space-y-3">
                                                {dayBookings.map((booking) => (
                                                    <div key={booking.id} className="bg-gray-50 p-4 rounded-xl border">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Clock className="w-4 h-4 text-gray-600" />
                                                                    <span className="font-semibold text-gray-800">
                                                                        {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <Users className="w-4 h-4 text-gray-600" />
                                                                    <span className="text-gray-700">{booking.user?.name || 'Usuario'}</span>
                                                                </div>
                                                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {booking.status}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => openModal(booking)}
                                                                    className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600"
                                                                >
                                                                    Ver
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteBooking(booking.id)}
                                                                    className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    )}
                </div>

                {/* Calendario */}
                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={availableDaysDB}
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                            const dayBookings = bookings.filter(b => {
                                const bookingDate = new Date(b.startTime);
                                return bookingDate.getFullYear() === date.getFullYear() &&
                                    bookingDate.getMonth() === date.getMonth() &&
                                    bookingDate.getDate() === date.getDate();
                            });
                            setDailyBookings(dayBookings);
                        }}
                        bookedDaysDB={bookedDays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                    />

                    {/* Estadísticas del mes */}
                    <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">Estadísticas del Mes</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Días con reservas:</span>
                                <span className="font-medium">{bookedDays.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total reservas:</span>
                                <span className="font-medium">{bookings.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Confirmadas:</span>
                                <span className="font-medium text-green-600">{stats.CONFIRMED}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Canceladas:</span>
                                <span className="font-medium text-red-600">{stats.CANCELLED}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
