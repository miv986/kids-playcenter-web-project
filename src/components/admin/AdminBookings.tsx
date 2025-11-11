import React, { useEffect, useState } from 'react';
import { Calendar, Users, Trash2, Phone, Clock, Glasses, CalendarDays, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { BirthdayBooking } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';
import { BirthdayBookingModal } from '../modals/BirthdayBookingModal';
import { CalendarComponent } from '../shared/Calendar';
import { useMemo } from "react";
import { BookingCard } from '../shared/BookingCard';
import { useTranslation } from '../../contexts/TranslationContext';
import { Spinner } from '../shared/Spinner';
import { showToast } from '../../lib/toast';
import { useConfirm } from '../../hooks/useConfirm';
import { SearchBar } from '../shared/SearchBar';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from "date-fns";
import { es, ca } from "date-fns/locale";

export function AdminBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date()); // empieza en mes actual
    const t = useTranslation('AdminBookings');
    const locale = t.locale;
    const { confirm, ConfirmComponent } = useConfirm();

    const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
    const { fetchBookings, updateBookingStatus, deleteBooking, updateBooking, fetchBookingByDate } = useBookings();
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<BirthdayBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

    const [bookedDaysDB, setBookedDaysDB] = useState<number[]>([]);

    const [selectedBooking, setSelectedBooking] = useState<BirthdayBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const [searchQuery, setSearchQuery] = useState("");

    const openModal = (booking: BirthdayBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    // Cargar reservas inicialmente y cuando se actualiza
    useEffect(() => {
        if (!!user) {
            setIsLoadingBookings(true);
            fetchBookings().then((bookings) => {
                setBookings(bookings || []);
                setIsLoadingBookings(false);
            }).catch(() => {
                setIsLoadingBookings(false);
            });
        }
    }, [user, refreshTrigger]);

    // Recargar reservas del día si hay fecha seleccionada
    useEffect(() => {
        const reloadDailyBookings = async () => {
            if (selectedDate && refreshTrigger > 0) {
                try {
                    const bookingsForDay = await fetchBookingByDate(selectedDate);
                    setDailyBookings(bookingsForDay || []);
                } catch (error) {
                    console.error('Error reloading daily bookings:', error);
                }
            }
        };
        reloadDailyBookings();
    }, [selectedDate, refreshTrigger]);

    const filteredBookings = useMemo(() => {
        let result = bookings.filter(booking =>
            filter === 'all' || booking.status === filter
        );

        // Aplicar búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(booking => {
                const bookingId = booking.id.toString();
                const guest = booking.guest?.toLowerCase() || "";
                const guestEmail = booking.guestEmail?.toLowerCase() || "";
                const contactNumber = booking.contact_number?.toLowerCase() || "";
                const slotDate = booking.slot ? format(new Date(booking.slot.startTime), "dd/MM/yyyy", { locale: dateFnsLocale }) : "";
                const slotTime = booking.slot ? format(new Date(booking.slot.startTime), "HH:mm") : "";
                const status = booking.status.toLowerCase();
                
                return bookingId.includes(query) ||
                       guest.includes(query) ||
                       guestEmail.includes(query) ||
                       contactNumber.includes(query) ||
                       slotDate.includes(query) ||
                       slotTime.includes(query) ||
                       status.includes(query);
            });
        }

        return result;
    }, [bookings, filter, searchQuery, dateFnsLocale]);

    // Agrupar reservas por semanas para la vista de lista
    const bookingsByWeek = useMemo(() => {
        if (!filteredBookings || filteredBookings.length === 0 || selectedDate) return [];

        // Obtener todas las fechas únicas de las reservas
        const uniqueDates = Array.from(
            new Set(filteredBookings
                .filter(booking => booking.slot) // Filtrar reservas sin slot
                .map(booking => {
                    const date = new Date(booking.slot!.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime();
                }))
        ).map(timestamp => new Date(timestamp));

        if (uniqueDates.length === 0) return [];

        // Encontrar el rango de fechas
        const minDate = new Date(Math.min(...uniqueDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...uniqueDates.map(d => d.getTime())));

        // Obtener todas las semanas en el rango
        const weeks = eachWeekOfInterval(
            { start: minDate, end: maxDate },
            { weekStartsOn: 1 } // Lunes
        );

        // Agrupar reservas por semana
        const weeksData = weeks.map(weekStart => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekBookings = filteredBookings.filter(booking => {
                if (!booking.slot) return false;
                const bookingDate = new Date(booking.slot.startTime);
                bookingDate.setHours(0, 0, 0, 0);
                return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd });
            });

            // Ordenar reservas por fecha descendente (más recientes primero)
            const sortedBookings = weekBookings.sort((a, b) => {
                const dateA = a.slot ? new Date(a.slot.startTime).getTime() : 0;
                const dateB = b.slot ? new Date(b.slot.startTime).getTime() : 0;
                return dateB - dateA;
            });

            return {
                weekStart,
                weekEnd,
                bookings: sortedBookings,
                totalBookings: weekBookings.length,
                pendingBookings: weekBookings.filter(b => b.status === 'PENDING').length,
                confirmedBookings: weekBookings.filter(b => b.status === 'CONFIRMED').length,
                cancelledBookings: weekBookings.filter(b => b.status === 'CANCELLED').length,
            };
        }).filter(week => week.totalBookings > 0); // Solo semanas con reservas

        // Ordenar por fecha descendente (más recientes primero)
        return weeksData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    }, [filteredBookings, selectedDate]);

    const toggleWeek = (weekKey: string) => {
        setExpandedWeeks((prev) => {
            const next = new Set(prev);
            if (next.has(weekKey)) {
                next.delete(weekKey);
            } else {
                next.add(weekKey);
            }
            return next;
        });
    };


    const bookedDays = useMemo(() => {
        return bookings
            .filter(b => b.slot) // Filtrar reservas sin slot
            .map(b => new Date(b.slot!.startTime))
            .filter(date =>
                date.getFullYear() === currentMonth.getFullYear() &&
                date.getMonth() === currentMonth.getMonth()
            )
            .map(date => date.getUTCDate());
    }, [bookings, currentMonth]);


    const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const allDays = Array.from({ length: totalDaysInMonth }, (_, i) => i + 1);
    const availableDaysDB = allDays.filter(d => !bookedDays.includes(d));

    const handleUpdateBookingStatus = async (id: number, status: BirthdayBooking['status']) => {
        let confirmMessage = '';
        let variant: 'danger' | 'warning' | 'info' = 'info';
        
        if (status === 'CONFIRMED') {
            confirmMessage = t.t('confirmReservationQuestion') || `¿Confirmar la reserva #${id}?`;
            variant = 'info';
        } else if (status === 'CANCELLED') {
            confirmMessage = t.t('cancelReservationQuestion') || `¿Cancelar la reserva #${id}?`;
            variant = 'warning';
        } else if (status === 'PENDING') {
            confirmMessage = t.t('setPendingQuestion') || `¿Establecer la reserva #${id} como pendiente?`;
            variant = 'warning';
        }
        
        const confirmed = await confirm({ message: confirmMessage, variant });
        if (!confirmed) return;
        
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
            showToast.success(`${t.t('updateSuccess')} ${status}`);
        } catch (err) {
            console.error(err);
            showToast.error(t.t('updateError'));
        }
    };

    const handleDeleteBooking = async (id: number) => {
        const confirmed = await confirm({ message: t.t('confirmDelete'), variant: 'danger' });
        if (!confirmed) return;

        try {
            setBookings(prev => prev.filter(b => b.id !== id));

            if (selectedDate) {
                setDailyBookings(prev => prev.filter(b => b.id !== id));
            }

            deleteBooking(id);
            showToast.success(`${t.t('deleteSuccess')} ${id}`);
        } catch (err) {
            console.error(err);
            showToast.error(t.t('deleteError'));
        }
    };


    const handleUpdateBooking = async (id: number, data: Partial<BirthdayBooking>): Promise<void> => {
        try {
            await updateBooking(id, data); // Llamada al backend
            
            // Actualización optimista inmediata
            setBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));

            // Actualiza en dailyBookings si hay fecha seleccionada
            if (selectedDate) {
                setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
            }

            // Actualiza también el modal si está abierto
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, ...data } : prev);
            }

            // Si se cambió el slot (fecha), recargar todas las reservas para obtener datos actualizados
            if (data.slotId !== undefined) {
                setRefreshTrigger(prev => prev + 1);
            }

            showToast.success(t.t('updateSuccess').replace(' a', ''));
        } catch (err) {
            console.error(err);
            showToast.error(t.t('updateError'));
            // Recargar en caso de error para asegurar consistencia
            setRefreshTrigger(prev => prev + 1);
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
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.t('title')}</h1>
                <p className="text-gray-600">{t.t('subtitle')}</p>
            </div>

            {/* Controles superiores */}
            <div className="mb-4 flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                            viewMode === "calendar" 
                                ? "bg-blue-500 text-white" 
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <CalendarDays className="w-4 h-4" />
                        {t.t('calendarView')}
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${
                            viewMode === "list" 
                                ? "bg-blue-500 text-white" 
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        {t.t('listView')}
                    </button>
                </div>
            </div>

            {/* Barra de búsqueda */}
            {viewMode === "list" && !selectedDate && (
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    total={filteredBookings.length}
                    resultsLabel={t.t('reservation') || 'reserva'}
                    resultsPluralLabel={t.t('reservations') || 'reservas'}
                    placeholder={t.t('searchBookings') || "Buscar por ID, nombre, email, teléfono, fecha..."}
                />
            )}

            {/* Panel de filtros - Siempre visible y compacto */}
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{t.t('filterByStatus')}:</span>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('all')} ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'PENDING'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('pending')} ({stats.PENDING})
                    </button>
                    <button
                        onClick={() => setFilter('CONFIRMED')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'CONFIRMED'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('confirmed')} ({stats.CONFIRMED})
                    </button>
                    <button
                        onClick={() => setFilter('CANCELLED')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${filter === 'CANCELLED'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('cancelled')} ({stats.CANCELLED})
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start py-6 px-6">
                {/* Panel principal */}
                <div className="min-h-auto bg-gray-50 py-8">


                    {viewMode === "calendar" ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">{t.t('calendarView')}</h2>
                                {selectedDate && (
                                    <button
                                        onClick={() => {
                                            setSelectedDate(undefined);
                                            setDailyBookings([]);
                                        }}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        {t.t('viewAll')}
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        {t.t('reservationsOf')} {selectedDate.toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </h3>
                                    {dailyBookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">{t.t('noReservationsDay')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {dailyBookings.map((booking) => (
                                                <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {t.t('selectDay')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {t.t('clickDay')}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">{t.t('allReservations')}</h2>
                                <div className="text-sm text-gray-500">
                                    {bookingsToShow.length} {t.t('reservations')} {(filter !== 'all' || searchQuery) ? t.t('filtered') : t.t('total')}
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Lista de reservas para vista lista */}
                    {viewMode === "list" && (
                        <div className="space-y-6">
                            {isLoadingBookings ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size="lg" text={t.t('loading')} />
                                </div>
                            ) : bookingsToShow.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {searchQuery 
                                            ? (t.t('noResults') || 'No se encontraron resultados')
                                            : t.t('noReservations')
                                        }
                                    </h3>
                                    <p className="text-gray-500">
                                        {searchQuery 
                                            ? (t.t('tryDifferentSearch') || 'Intenta con otros términos de búsqueda')
                                            : (filter !== 'all' 
                                                ? t.t('noReservationsFilter')
                                                : t.t('noReservationsRegistered'))
                                        }
                                    </p>
                                </div>
                            ) : selectedDate ? (
                                bookingsToShow.map((booking) => (
                                    <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                                ))
                            ) : (
                                <div className="space-y-3">
                                    {bookingsByWeek.map((week) => {
                                        const weekKey = `${week.weekStart.getTime()}`;
                                        const isExpanded = expandedWeeks.has(weekKey);

                                        return (
                                            <div
                                                key={weekKey}
                                                className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
                                            >
                                                {/* Card de semana */}
                                                <button
                                                    onClick={() => toggleWeek(weekKey)}
                                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {isExpanded ? (
                                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                                            ) : (
                                                                <ChevronRight className="w-5 h-5 text-gray-500" />
                                                            )}
                                                            <CalendarDays className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold text-gray-800">
                                                                {format(week.weekStart, "dd 'de' MMMM", { locale: dateFnsLocale })} - {format(week.weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {week.totalBookings} {t.t('reservations')} • {week.pendingBookings} {t.t('pending')} • {week.confirmedBookings} {t.t('confirmed')} • {week.cancelledBookings} {t.t('cancelled')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            week.confirmedBookings === week.totalBookings 
                                                                ? 'bg-green-100 text-green-800'
                                                                : week.pendingBookings === week.totalBookings
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : week.cancelledBookings === week.totalBookings
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {week.confirmedBookings === week.totalBookings 
                                                                ? t.t('confirmed')
                                                                : week.pendingBookings === week.totalBookings
                                                                ? t.t('pending')
                                                                : week.cancelledBookings === week.totalBookings
                                                                ? t.t('cancelled')
                                                                : t.t('mixed')
                                                            }
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Reservas de la semana (expandible) */}
                                                {isExpanded && (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                        <div className="space-y-3">
                                                            {week.bookings.map((booking) => (
                                                                <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
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
                {/* Calendario mejorado */}
                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={availableDaysDB}
                        selectedDate={selectedDate}
                        onSelectDate={async (date) => {
                            setViewMode("calendar");
                            setSelectedDate(date);
                            const bookingsForDay = await fetchBookingByDate(date);
                            setDailyBookings(bookingsForDay || []);
                        }}
                        bookedDaysDB={bookedDays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                    />
                    
                    {/* Estadísticas del mes */}
                    <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">{t.t('monthStats')}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('daysWithReservations')}</span>
                                <span className="font-medium">{bookedDays.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('totalReservationsMonth')}</span>
                                <span className="font-medium">{bookings.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('pending')}:</span>
                                <span className="font-medium text-yellow-600">{stats.PENDING}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('confirmed')}:</span>
                                <span className="font-medium text-green-600">{stats.CONFIRMED}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {ConfirmComponent}
        </div>
    );
}