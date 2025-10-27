import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, CheckCircle, XCircle, Trash2, Phone, Clock, CalendarDays, Filter, Mail, MessageSquare, X, Copy, Check } from 'lucide-react';
import { useDaycareBookings } from '../../contexts/DaycareBookingContext';
import { DaycareBooking } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarComponent } from '../shared/Calendar';

export function AdminDaycareBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([] as Array<DaycareBooking>);
    const { fetchBookings, updateBooking, deleteBooking, cancelBooking } = useDaycareBookings();
    const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<DaycareBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<DaycareBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

    const openModal = (booking: DaycareBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    const handleCopyPhone = async (phone: string) => {
        try {
            await navigator.clipboard.writeText(phone);
            setCopiedPhone(phone);
            setTimeout(() => setCopiedPhone(null), 2000);
        } catch (err) {
            console.error('Error copiando teléfono:', err);
        }
    };

    const handleCopyEmail = async (email: string) => {
        try {
            await navigator.clipboard.writeText(email);
            setCopiedPhone(email);
            setTimeout(() => setCopiedPhone(null), 2000);
        } catch (err) {
            console.error('Error copiando email:', err);
        }
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

    const handleCancelBooking = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres cancelar esta reserva?")) return;

        try {
            await cancelBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
            if (selectedDate) {
                setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
            }
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'CANCELLED' as any } : prev);
            }
            alert(`Reserva ${id} cancelada`);
        } catch (err) {
            console.error(err);
            alert("Error al cancelar la reserva");
        }
    };

    const handleConfirmBooking = async (id: number) => {
        try {
            await updateBooking(id, { status: 'CONFIRMED' as any });
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' as any } : b));
            if (selectedDate) {
                setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' as any } : b));
            }
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'CONFIRMED' as any } : prev);
            }
            alert(`Reserva ${id} confirmada`);
        } catch (err) {
            console.error(err);
            alert("Error al confirmar la reserva");
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
                                        Reservas del {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
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
                                                {format(new Date(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
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

            {/* Modal de detalles */}
            {isModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-gray-800">Detalles de la Reserva #{selectedBooking.id}</h3>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Información del usuario */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Datos del Usuario
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">Nombre:</span>
                                        <span>{selectedBooking.user?.name || 'N/A'}</span>
                                    </div>
                                    {selectedBooking.user?.phone_number && (
                                        <button
                                            onClick={() => handleCopyPhone(selectedBooking.user!.phone_number)}
                                            className="flex items-center gap-2 hover:text-blue-600 transition-colors group"
                                        >
                                            <Phone className="w-4 h-4" />
                                            <span>{selectedBooking.user.phone_number}</span>
                                            {copiedPhone === selectedBooking.user.phone_number ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    )}
                                    {selectedBooking.user?.email && (
                                        <button
                                            onClick={() => handleCopyEmail(selectedBooking.user!.email)}
                                            className="flex items-center gap-2 hover:text-blue-600 transition-colors group"
                                        >
                                            <Mail className="w-4 h-4" />
                                            <span>{selectedBooking.user.email}</span>
                                            {copiedPhone === selectedBooking.user.email ? (
                                                <Check className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Fecha y horario */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-600">Fecha</span>
                                    </div>
                                    <p className="font-semibold text-gray-800">
                                        {format(new Date(selectedBooking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-600">Horario</span>
                                    </div>
                                    <p className="font-semibold text-gray-800">
                                        {format(new Date(selectedBooking.startTime), "HH:mm")} - {format(new Date(selectedBooking.endTime), "HH:mm")}
                                    </p>
                                </div>
                            </div>

                            {/* Hijos */}
                            {selectedBooking.children && selectedBooking.children.length > 0 && (
                                <div className="bg-purple-50 p-4 rounded-xl">
                                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                        <Users className="w-5 h-5" />
                                        Niños ({selectedBooking.children.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedBooking.children.map((child, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-800">{child.name} {child.surname}</p>
                                                {(child as any).dateOfBirth && (
                                                    <p className="text-sm text-gray-600">
                                                        Fecha de nacimiento: {format(new Date((child as any).dateOfBirth), "dd/MM/yyyy")}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Estado */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="font-medium text-gray-700">Estado:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedBooking.status === 'CONFIRMED' 
                                        ? 'bg-green-100 text-green-800'
                                        : selectedBooking.status === 'CANCELLED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {selectedBooking.status === 'CONFIRMED' ? 'Confirmada' : 
                                     selectedBooking.status === 'CANCELLED' ? 'Cancelada' : 
                                     'Pendiente'}
                                </span>
                            </div>

                            {/* Comentarios */}
                            {selectedBooking.comments && (
                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-800 mb-1">Comentarios</p>
                                            <p className="text-sm text-yellow-700">{selectedBooking.comments}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción */}
                        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
                            {selectedBooking.status !== 'CONFIRMED' && (
                                <button
                                    onClick={() => {
                                        handleConfirmBooking(selectedBooking.id);
                                        closeModal();
                                    }}
                                    className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
                                >
                                    Confirmar Reserva
                                </button>
                            )}
                            {selectedBooking.status !== 'CANCELLED' && (
                                <button
                                    onClick={() => {
                                        handleCancelBooking(selectedBooking.id);
                                        closeModal();
                                    }}
                                    className="flex-1 bg-yellow-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-yellow-600 transition-colors"
                                >
                                    Cancelar Reserva
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (window.confirm("¿Seguro que quieres eliminar esta reserva?")) {
                                        handleDeleteBooking(selectedBooking.id);
                                        closeModal();
                                    }
                                }}
                                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={closeModal}
                                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-600 transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
