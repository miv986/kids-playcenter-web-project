import React, { useEffect, useState, useCallback } from 'react';
import { Calendar, Users, Trash2, Phone, Clock, Glasses, CalendarDays, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { useBookings } from '../../../contexts/BookingContext';
import { BirthdayBooking } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { useSlots } from '../../../contexts/SlotContext';
import { BirthdayBookingModal } from '../../modals/BirthdayBookingModal';
import { CalendarComponent } from '../../shared/Calendar';
import { useMemo } from "react";
import { BookingCard } from '../../shared/BookingCard';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Spinner } from '../../shared/Spinner';
import { showToast } from '../../../lib/toast';
import { useConfirm } from '../../../hooks/useConfirm';
import { SearchBar } from '../../shared/SearchBar';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es, ca } from "date-fns/locale";
import { useMonthWeekGrouping, useMonthLoading, useWeekPagination } from '../../../hooks/useMonthWeekGrouping';
import { Pagination } from '../../shared/Pagination';

export function AdminBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date()); // empieza en mes actual
    const t = useTranslation('AdminBookings');
    const tCommon = useTranslation('Common');
    const locale = t.locale;
    const { confirm, ConfirmComponent } = useConfirm();

    const [bookings, setBookings] = useState([] as Array<BirthdayBooking>)
    const { fetchBookings, fetchBookingsByMonth, updateBookingStatus, deleteBooking, updateBooking, fetchBookingByDate } = useBookings();
    const { fetchSlots } = useSlots();
    const [slots, setSlots] = useState([] as Array<any>);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<BirthdayBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");


    const [selectedBooking, setSelectedBooking] = useState<BirthdayBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const [searchQuery, setSearchQuery] = useState("");

    // Usar hooks helper para meses y semanas
    const monthLoading = useMonthLoading();
    const weekPagination = useWeekPagination();

    const openModal = (booking: BirthdayBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    // Cargar mes actual al inicio
    useEffect(() => {
        if (!!user) {
            const now = new Date();
            setIsLoadingBookings(true);
            monthLoading.loadMonth(
                now.getFullYear(),
                now.getMonth(),
                fetchBookingsByMonth,
                setBookings,
                true
            ).finally(() => {
                setIsLoadingBookings(false);
            });
        }
    }, [user, monthLoading.loadMonth, fetchBookingsByMonth]);

    // Cargar slots del mes actual
    useEffect(() => {
        if (!!user) {
            fetchSlots().then((slotsData) => {
                setSlots(slotsData || []);
            }).catch(() => {
                setSlots([]);
            });
        }
    }, [user, currentMonth, refreshTrigger]);

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

    // Agrupar reservas por meses y semanas
    const bookingsByMonth = useMemo(() => {
        // Si hay una fecha seleccionada, no mostrar agrupación por meses (mostrar vista diaria)
        if (selectedDate) return [];

        // Obtener todas las fechas únicas de las reservas
        const uniqueDates = filteredBookings.length > 0 ? Array.from(
            new Set(filteredBookings.map(booking => {
                let date: Date;
                if (booking.slot) {
                    date = new Date(booking.slot.startTime);
                } else {
                    date = new Date(booking.createdAt || new Date());
                }
                date.setHours(0, 0, 0, 0);
                return date.getTime();
            }))
        ).map(timestamp => new Date(timestamp)) : [];

        // Siempre mostrar al menos el mes actual y algunos meses anteriores
        const now = new Date();
        const months: Date[] = [];
        
        // Mostrar los últimos 3 meses (mes actual + 2 anteriores)
        for (let i = 0; i < 3; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthDate);
        }
        
        // Si hay fechas únicas, añadir también los meses que contienen esas fechas
        if (uniqueDates.length > 0) {
            const minDate = new Date(Math.min(...uniqueDates.map(d => d.getTime())));
            const maxDate = new Date(Math.max(...uniqueDates.map(d => d.getTime())));
            const monthsWithData = eachMonthOfInterval({ start: minDate, end: maxDate });
            
            // Añadir meses con datos que no estén ya en la lista
            const monthsSet = new Set(months.map(m => `${m.getFullYear()}-${m.getMonth()}`));
            monthsWithData.forEach(monthDate => {
                const monthKey = `${monthDate.getFullYear()}-${monthDate.getMonth()}`;
                if (!monthsSet.has(monthKey)) {
                    months.push(monthDate);
                }
            });
        }

        // Agrupar reservas por mes y luego por semanas
        const monthsData = months.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            const monthBookings = filteredBookings.filter(booking => {
                let bookingDate: Date;
                if (booking.slot) {
                    bookingDate = new Date(booking.slot.startTime);
                } else {
                    bookingDate = new Date(booking.createdAt || new Date());
                }
                bookingDate.setHours(0, 0, 0, 0);
                return bookingDate >= startOfMonth(monthStart) && bookingDate <= monthEnd;
            });

            // Obtener todas las semanas en el mes
            const weeks = eachWeekOfInterval(
                { start: startOfMonth(monthStart), end: monthEnd },
                { weekStartsOn: 1 } // Lunes
            );

            // Agrupar reservas por semana dentro del mes
            const weeksData = weeks.map(weekStart => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                const weekBookings = monthBookings.filter(booking => {
                    let bookingDate: Date;
                    if (booking.slot) {
                        bookingDate = new Date(booking.slot.startTime);
                    } else {
                        bookingDate = new Date(booking.createdAt || new Date());
                    }
                    bookingDate.setHours(0, 0, 0, 0);
                    return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd });
                });

                // Ordenar reservas por fecha ascendente y luego por hora ascendente
                const sortedBookings = weekBookings.sort((a, b) => {
                    const dateA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                    const dateB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                    if (dateA !== dateB) {
                        return dateA - dateB; // Fecha ascendente
                    }
                    return dateA - dateB; // Hora ascendente
                });

                return {
                    weekStart,
                    weekEnd,
                    bookings: sortedBookings,
                    totalBookings: weekBookings.length,
                    pendingBookings: weekBookings.filter(b => b.status === 'PENDING').length,
                    confirmedBookings: weekBookings.filter(b => b.status === 'CONFIRMED').length,
                    cancelledBookings: weekBookings.filter(b => b.status === 'CANCELLED').length
                };
            }).filter(week => week.totalBookings > 0); // Solo semanas con reservas

            // Ordenar semanas por fecha ascendente
            weeksData.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

            const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
            return {
                monthStart,
                monthEnd,
                monthKey,
                weeks: weeksData,
                totalBookings: monthBookings.length,
                pendingBookings: monthBookings.filter(b => b.status === 'PENDING').length,
                confirmedBookings: monthBookings.filter(b => b.status === 'CONFIRMED').length,
                cancelledBookings: monthBookings.filter(b => b.status === 'CANCELLED').length,
                isLoaded: monthLoading.loadedMonths.has(monthKey),
                isLoading: monthLoading.loadingMonths.has(monthKey)
            };
        });

        // Ordenar por fecha descendente (más recientes primero)
        // Mostrar todos los meses, incluso si no tienen reservas (para poder cargarlos)
        return monthsData.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    }, [filteredBookings, selectedDate, monthLoading.loadedMonths, monthLoading.loadingMonths]);


    const bookedDays = useMemo(() => {
        return bookings
            .filter(b => b.slot) // Filtrar reservas sin slot
            .map(b => new Date(b.slot!.startTime))
            .filter(date =>
                date.getFullYear() === currentMonth.getFullYear() &&
                date.getMonth() === currentMonth.getMonth()
            )
            .map(date => date.getDate());
    }, [bookings, currentMonth]);

    // Calcular días disponibles basándose en los slots del mes actual
    const availableDaysDB = useMemo(() => {
        return slots
            .filter(slot => slot.status === 'OPEN') // Solo slots disponibles
            .map(slot => new Date(slot.startTime))
            .filter(date =>
                date.getFullYear() === currentMonth.getFullYear() &&
                date.getMonth() === currentMonth.getMonth()
            )
            .map(date => date.getDate());
    }, [slots, currentMonth]);

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

            // Notificación con información de correo
            let successMessage = '';
            if (status === 'CONFIRMED') {
                successMessage = tCommon.t('confirmSuccessWithEmail');
            } else if (status === 'CANCELLED') {
                successMessage = tCommon.t('cancelSuccessWithEmail');
            } else {
                successMessage = tCommon.t('updateSuccessWithEmail');
            }
            showToast.success(successMessage);
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
            showToast.success(tCommon.t('deleteSuccessWithEmail'));
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

            showToast.success(tCommon.t('modifySuccessWithEmail'));
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
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t.t('title')}</h1>
                <p className="text-sm sm:text-base text-gray-600">{t.t('subtitle')}</p>
            </div>

            {/* Controles superiores */}
            <div className="mb-4 flex flex-wrap gap-2 sm:gap-4 items-center justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setViewMode("calendar");
                            if (viewMode === "list") {
                                setSelectedDate(undefined);
                                setDailyBookings([]);
                            }
                        }}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition flex-1 sm:flex-none min-w-[48px] ${
                            viewMode === "calendar" 
                                ? "bg-blue-500 text-white" 
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('calendarView')}</span>
                    </button>
                    <button
                        onClick={() => {
                            setViewMode("list");
                            setSelectedDate(undefined);
                            setDailyBookings([]);
                        }}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition flex-1 sm:flex-none min-w-[48px] ${
                            viewMode === "list" 
                                ? "bg-blue-500 text-white" 
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('listView')}</span>
                    </button>
                </div>
            </div>

            {/* Barra de búsqueda */}
            {viewMode === "list" && !selectedDate && (
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    total={filteredBookings.length}
                    resultsLabel={t.t('reservation')}
                    resultsPluralLabel={t.t('reservations')}
                    placeholder={t.t('searchBookings')}
                />
            )}

            {/* Panel de filtros - Siempre visible y compacto */}
            <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 w-full sm:w-auto mb-1 sm:mb-0">{t.t('filterByStatus')}:</span>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'all'
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('all')} ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilter('PENDING')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'PENDING'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('pending')} ({stats.PENDING})
                    </button>
                    <button
                        onClick={() => setFilter('CONFIRMED')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'CONFIRMED'
                            ? 'bg-green-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                            }`}
                    >
                        {t.t('confirmed')} ({stats.CONFIRMED})
                    </button>
                    <button
                        onClick={() => setFilter('CANCELLED')}
                        className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'CANCELLED'
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4">
                                <h2 className="text-xl sm:text-2xl font-semibold">{t.t('calendarView')}</h2>
                                {selectedDate && (
                                    <button
                                        onClick={() => {
                                            setSelectedDate(undefined);
                                            setDailyBookings([]);
                                        }}
                                        className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto min-w-[48px]"
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
                                <h2 className="text-xl sm:text-2xl font-semibold">{t.t('allReservations')}</h2>
                                <div className="text-xs sm:text-sm text-gray-500">
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
                            ) : selectedDate ? (
                                bookingsToShow.length === 0 ? (
                                    <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                            {t.t('noReservationsDay')}
                                        </h3>
                                    </div>
                                ) : (
                                    bookingsToShow.map((booking) => (
                                        <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                                    ))
                                )
                            ) : bookingsByMonth.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {searchQuery 
                                            ? t.t('noResults')
                                            : t.t('noReservations')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {searchQuery 
                                            ? t.t('tryDifferentSearch')
                                            : (filter !== 'all'
                                                ? t.t('noReservationsFilter')
                                                : t.t('noReservationsRegistered'))}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bookingsByMonth.map((month) => {
                                        const isMonthExpanded = monthLoading.expandedMonths.has(month.monthKey);

                                        return (
                                            <div
                                                key={month.monthKey}
                                                className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
                                            >
                                                {/* Card de mes */}
                                                <button
                                                    onClick={() => monthLoading.toggleMonth(month.monthKey, month.monthStart.getFullYear(), month.monthStart.getMonth(), fetchBookingsByMonth, setBookings)}
                                                    disabled={month.isLoading}
                                                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-wait"
                                                >
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            {isMonthExpanded ? (
                                                                <ChevronDown className="w-5 h-5 text-gray-500" />
                                                            ) : (
                                                                <ChevronRight className="w-5 h-5 text-gray-500" />
                                                            )}
                                                            <CalendarDays className="w-5 h-5 text-blue-500" />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-semibold text-gray-800">
                                                                {format(month.monthStart, "MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {month.totalBookings} {t.t('reservations')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {month.isLoading && (
                                                            <div className="text-sm text-gray-500">{tCommon.t('loading')}</div>
                                                        )}
                                                        {!month.isLoaded && !month.isLoading && (
                                                            <div className="text-xs text-gray-400">{tCommon.t('clickToLoad')}</div>
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Semanas del mes (expandible) */}
                                                {isMonthExpanded && month.isLoaded && (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                        {month.weeks.length === 0 ? (
                                                            <div className="text-center py-8 text-gray-500">
                                                                {t.t('noReservations')} {t.t('inThisMonth')}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-3">
                                                                {month.weeks.map((week) => {
                                                                const weekKey = `${month.monthKey}-${week.weekStart.getTime()}`;
                                                                const isWeekExpanded = weekPagination.expandedWeeks.has(weekKey);
                                                                
                                                                // Calcular estadísticas de la semana
                                                                const pendingBookings = week.bookings.filter((b: BirthdayBooking) => b.status === 'PENDING').length;
                                                                const confirmedBookings = week.bookings.filter((b: BirthdayBooking) => b.status === 'CONFIRMED').length;
                                                                const cancelledBookings = week.bookings.filter((b: BirthdayBooking) => b.status === 'CANCELLED').length;

                                                                return (
                                                                    <div
                                                                        key={weekKey}
                                                                        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                                                                    >
                                                                        {/* Card de semana */}
                                                                        <button
                                                                            onClick={() => weekPagination.toggleWeek(weekKey)}
                                                                            className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                                                        >
                                                                            <div className="flex items-center gap-4 flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    {isWeekExpanded ? (
                                                                                        <ChevronDown className="w-4 h-4 text-gray-500" />
                                                                                    ) : (
                                                                                        <ChevronRight className="w-4 h-4 text-gray-500" />
                                                                                    )}
                                                                                    <CalendarDays className="w-4 h-4 text-blue-500" />
                                                                                </div>
                                                                                <div className="text-left">
                                                                                    <div className="font-medium text-gray-800 text-sm">
                                                                                        {format(week.weekStart, "dd 'de' MMMM", { locale: dateFnsLocale })} - {format(week.weekEnd, "dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500">
                                                                                        {week.totalBookings} {t.t('reservations')} • {pendingBookings} {t.t('pending')} • {confirmedBookings} {t.t('confirmed')} • {cancelledBookings} {t.t('cancelled')}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                                    confirmedBookings === week.totalBookings 
                                                                                        ? 'bg-green-100 text-green-800'
                                                                                        : pendingBookings === week.totalBookings
                                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                                        : cancelledBookings === week.totalBookings
                                                                                        ? 'bg-red-100 text-red-800'
                                                                                        : 'bg-blue-100 text-blue-800'
                                                                                }`}>
                                                                                    {confirmedBookings === week.totalBookings 
                                                                                        ? t.t('confirmed')
                                                                                        : pendingBookings === week.totalBookings
                                                                                        ? t.t('pending')
                                                                                        : cancelledBookings === week.totalBookings
                                                                                        ? t.t('cancelled')
                                                                                        : t.t('mixed')
                                                                                    }
                                                                                </div>
                                                                            </div>
                                                                        </button>

                                                                        {/* Reservas de la semana (expandible) */}
                                                                        {isWeekExpanded && (() => {
                                                                            const paginatedBookings = weekPagination.getPaginatedItems(week.bookings, weekKey);
                                                                            const totalPages = weekPagination.getTotalPages(week.bookings);
                                                                            const currentPage = weekPagination.getWeekPage(weekKey);

                                                                            return (
                                                                                <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                                                    <div className="space-y-3 mb-4">
                                                                                        {paginatedBookings.map((booking: BirthdayBooking) => (
                                                                                            <BookingCard key={booking.id} booking={booking} openModal={openModal} />
                                                                                        ))}
                                                                                    </div>

                                                                                    {/* Paginación */}
                                                                                    {totalPages > 1 && (
                                                                                        <div className="pt-3 border-t border-gray-300">
                                                                                            <div className="text-sm text-gray-600 mb-2 text-center">
                                                                                                {t.t('showing')} {(currentPage - 1) * weekPagination.ITEMS_PER_PAGE + 1} - {Math.min(currentPage * weekPagination.ITEMS_PER_PAGE, week.bookings.length)} {t.t('of')} {week.bookings.length}
                                                                                            </div>
                                                                                            <Pagination
                                                                                                currentPage={currentPage}
                                                                                                totalPages={totalPages}
                                                                                                onPageChange={(page) => weekPagination.setWeekPage(weekKey, page)}
                                                                                                className="mt-0 mb-0"
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                );
                                                            })}
                                                            </div>
                                                        )}
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
                            // Ordenar por hora ascendente
                            const sorted = (bookingsForDay || []).sort((a, b) => {
                                const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                                const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                                return timeA - timeB;
                            });
                            setDailyBookings(sorted);
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