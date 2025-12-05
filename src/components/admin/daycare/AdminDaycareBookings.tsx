import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, Users, Trash2, Phone, Clock, CalendarDays, Mail, MessageSquare, X, Copy, Check, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { useDaycareBookings } from '../../../contexts/DaycareBookingContext';
import { DaycareBooking } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval } from 'date-fns';
import { es, ca } from 'date-fns/locale';
import { CalendarComponent } from '../../shared/Calendar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Spinner } from '../../shared/Spinner';
import { showToast } from '../../../lib/toast';
import { useConfirm } from '../../../hooks/useConfirm';
import { Pagination } from '../../shared/Pagination';
import { SearchBar } from '../../shared/SearchBar';

export function AdminDaycareBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [bookings, setBookings] = useState([] as Array<DaycareBooking>);
    const { fetchBookings, updateBooking, deleteBooking, cancelBooking, markAttendance } = useDaycareBookings();
    const [filter, setFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');
    const { user } = useAuth();
    const t = useTranslation('AdminDaycareBookings');
    const tCommon = useTranslation('Common');
    const locale = t.locale;
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const { confirm, ConfirmComponent } = useConfirm();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<DaycareBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [selectedBooking, setSelectedBooking] = useState<DaycareBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

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
            setIsLoadingBookings(true);
            fetchBookings().then((bookings) => {
                setBookings(bookings);
                setIsLoadingBookings(false);
            }).catch(() => {
                setIsLoadingBookings(false);
            });
        }
    }, [user]);

    const filteredBookings = useMemo(() => {
        let result = bookings.filter(booking =>
            filter === 'all' || booking.status === filter
        );

        // Aplicar búsqueda
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(booking => {
                const bookingId = booking.id.toString();
                const userName = booking.user?.name?.toLowerCase() || "";
                const userEmail = booking.user?.email?.toLowerCase() || "";
                const comments = booking.comments?.toLowerCase() || "";
                const startTime = booking.startTime ? format(new Date(booking.startTime), "dd/MM/yyyy HH:mm", { locale: dateFnsLocale }) : "";
                const endTime = booking.endTime ? format(new Date(booking.endTime), "HH:mm", { locale: dateFnsLocale }) : "";
                const status = booking.status.toLowerCase();
                const childrenNames = booking.children?.map(c => `${c.name} ${c.surname}`).join(" ").toLowerCase() || "";
                
                return bookingId.includes(query) ||
                       userName.includes(query) ||
                       userEmail.includes(query) ||
                       comments.includes(query) ||
                       startTime.includes(query) ||
                       endTime.includes(query) ||
                       status.includes(query) ||
                       childrenNames.includes(query);
            });
        }

        return result;
    }, [bookings, filter, searchQuery, dateFnsLocale]);

    const bookedDays = useMemo(() => {
        return bookings
            .map(b => new Date(b.startTime))
            .filter(date =>
                date.getFullYear() === currentMonth.getFullYear() &&
                date.getMonth() === currentMonth.getMonth()
            )
            .map(date => date.getDate());
    }, [bookings, currentMonth]);

    // Para bookings, mostramos días con reservas como parcialmente reservados
    // (mitad rojo/mitad verde) ya que no tenemos información de disponibilidad de slots
    const availableDaysDB = bookedDays; // Días con reservas también en available para mostrar como parcial

    const handleDeleteBooking = async (id: number) => {
        const confirmed = await confirm({ message: t.t('confirmDelete'), variant: 'danger' });
        if (!confirmed) return;

        try {
            setBookings(prev => prev.filter(b => b.id !== id));
            if (selectedDate) {
                setDailyBookings(prev => prev.filter(b => b.id !== id));
            }
            await deleteBooking(id);
            showToast.success(tCommon.t('deleteSuccessWithEmail'));
        } catch (err) {
            console.error(err);
            showToast.error(t.t('deleteError'));
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
            showToast.success(tCommon.t('modifySuccessWithEmail'));
        } catch (err) {
            console.error(err);
            showToast.error(t.t('updateError'));
        }
    };

    const handleCancelBooking = async (id: number) => {
        const confirmed = await confirm({ 
            message: t.t('cancelReservationQuestion') || t.t('confirmCancel'), 
            variant: 'warning' 
        });
        if (!confirmed) return;

        try {
            await cancelBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
            if (selectedDate) {
                setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
            }
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'CANCELLED' as any } : prev);
            }
            showToast.success(tCommon.t('cancelSuccessWithEmail'));
        } catch (err) {
            console.error(err);
            showToast.error(t.t('cancelError'));
        }
    };

    const handleConfirmBooking = async (id: number) => {
        const confirmed = await confirm({ 
            message: t.t('confirmReservationQuestion') || t.t('confirmSuccess'), 
            variant: 'info' 
        });
        if (!confirmed) return;
        
        try {
            await updateBooking(id, { status: 'CONFIRMED' as any });
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' as any } : b));
            if (selectedDate) {
                setDailyBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' as any } : b));
            }
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, status: 'CONFIRMED' as any } : prev);
            }
            showToast.success(tCommon.t('confirmSuccessWithEmail'));
        } catch (err) {
            console.error(err);
            showToast.error(t.t('confirmError'));
        }
    };

    const stats = {
        total: bookings.length,
        CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length
    };

    // Aplicar filtro de búsqueda también a dailyBookings si hay una fecha seleccionada
    const filteredDailyBookings = useMemo(() => {
        if (!searchQuery.trim()) return dailyBookings;
        const query = searchQuery.toLowerCase().trim();
        return dailyBookings.filter(booking => {
            const bookingId = booking.id.toString();
            const userName = booking.user?.name?.toLowerCase() || "";
            const userEmail = booking.user?.email?.toLowerCase() || "";
            const comments = booking.comments?.toLowerCase() || "";
            const startTime = booking.startTime ? format(new Date(booking.startTime), "dd/MM/yyyy HH:mm", { locale: dateFnsLocale }) : "";
            const endTime = booking.endTime ? format(new Date(booking.endTime), "HH:mm", { locale: dateFnsLocale }) : "";
            const status = booking.status.toLowerCase();
            const childrenNames = booking.children?.map(c => `${c.name} ${c.surname}`).join(" ").toLowerCase() || "";
            
            return bookingId.includes(query) ||
                   userName.includes(query) ||
                   userEmail.includes(query) ||
                   comments.includes(query) ||
                   startTime.includes(query) ||
                   endTime.includes(query) ||
                   status.includes(query) ||
                   childrenNames.includes(query);
        });
    }, [dailyBookings, searchQuery, dateFnsLocale]);

    const bookingsToShow = selectedDate ? filteredDailyBookings : filteredBookings;

    // Agrupar reservas por semana
    const bookingsByWeek = useMemo(() => {
        if (bookingsToShow.length === 0 || selectedDate) return [];

        // Obtener todas las fechas únicas de las reservas
        const uniqueDates = Array.from(
            new Set(bookingsToShow.map(booking => {
                const date = new Date(booking.startTime);
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
            const weekBookings = bookingsToShow.filter(booking => {
                const bookingDate = new Date(booking.startTime);
                bookingDate.setHours(0, 0, 0, 0);
                return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd });
            });

            // Ordenar reservas por fecha descendente (más recientes primero)
            const sortedBookings = weekBookings.sort((a, b) => {
                const dateA = new Date(a.startTime).getTime();
                const dateB = new Date(b.startTime).getTime();
                return dateB - dateA;
            });

            return {
                weekStart,
                weekEnd,
                bookings: sortedBookings,
                totalBookings: weekBookings.length,
                confirmedBookings: weekBookings.filter(b => b.status === 'CONFIRMED').length,
                cancelledBookings: weekBookings.filter(b => b.status === 'CANCELLED').length
            };
        }).filter(week => week.totalBookings > 0); // Solo semanas con reservas

        // Ordenar por fecha descendente (más recientes primero)
        return weeksData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    }, [bookingsToShow, selectedDate]);

    // Agrupar reservas por día (para compatibilidad con vista de calendario)
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

    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [weekPages, setWeekPages] = useState<Record<string, number>>({});
    const ITEMS_PER_PAGE = 20;

    const toggleWeek = (weekKey: string) => {
        setExpandedWeeks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(weekKey)) {
                newSet.delete(weekKey);
            } else {
                newSet.add(weekKey);
                // Resetear página cuando se expande
                if (!weekPages[weekKey]) {
                    setWeekPages(prev => ({ ...prev, [weekKey]: 1 }));
                }
            }
            return newSet;
        });
    };

    const getWeekPage = (weekKey: string) => weekPages[weekKey] || 1;

    const setWeekPage = (weekKey: string, page: number) => {
        setWeekPages(prev => ({ ...prev, [weekKey]: page }));
    };

    const getPaginatedBookings = (bookings: DaycareBooking[], weekKey: string) => {
        const page = getWeekPage(weekKey);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return bookings.slice(startIndex, endIndex);
    };

    const getTotalPages = (bookings: DaycareBooking[]) => {
        return Math.ceil(bookings.length / ITEMS_PER_PAGE);
    };


    console.log(bookingsToShow.map(b => b.user?.children?.map(child => child.name).join(', ')));

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
                        onClick={() => setViewMode("calendar")}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition flex-1 sm:flex-none min-w-[48px] ${viewMode === "calendar"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('calendarView')}</span>
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition flex-1 sm:flex-none min-w-[48px] ${viewMode === "list"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('listView')}</span>
                    </button>
                </div>
            </div>

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
                                        {t.t('reservationsOf')} {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                    </h3>
                                    <SearchBar
                                        searchQuery={searchQuery}
                                        onSearchChange={setSearchQuery}
                                        total={filteredDailyBookings.length}
                                        resultsLabel={t.t('reservation')}
                                        resultsPluralLabel={t.t('reservations')}
                                        placeholder={t.t('searchBookings')}
                                        clearLabel={t.t('clearSearch')}
                                    />
                                    {filteredDailyBookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">
                                                {searchQuery 
                                                    ? t.t('noResults')
                                                    : t.t('noReservationsDay')}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {filteredDailyBookings.map((booking) => (
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
                                                                <span className="text-gray-700">{booking.user?.children?.map(child => child.name).join(', ') || t.t('user')}</span>
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
                                                                className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-blue-600 text-xs sm:text-sm min-w-[48px] flex items-center justify-center"
                                                            >
                                                                <span className="hidden sm:inline">{t.t('view')}</span>
                                                                <span className="sm:hidden">👁</span>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBooking(booking.id)}
                                                                className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-red-600 min-w-[48px] flex items-center justify-center"
                                                                title={t.t('delete')}
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
                            <SearchBar
                                searchQuery={searchQuery}
                                onSearchChange={setSearchQuery}
                                total={bookingsToShow.length}
                                resultsLabel={t.t('reservation')}
                                resultsPluralLabel={t.t('reservations')}
                                placeholder={t.t('searchBookings')}
                                clearLabel={t.t('clearSearch')}
                            />
                        </div>
                    )}

                    {/* Lista de reservas agrupadas por semana */}
                    {viewMode === "list" && (
                        <div className="space-y-3">
                            {isLoadingBookings ? (
                                <div className="flex items-center justify-center py-12">
                                    <Spinner size="lg" text={t.t('loading')} />
                                </div>
                            ) : bookingsByWeek.length === 0 ? (
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
                                bookingsByWeek.map((week) => {
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
                                                            {week.totalBookings} {week.totalBookings !== 1 ? t.t('reservations') : t.t('reservation')} • 
                                                            {' '}{week.confirmedBookings} {t.t('confirmed')} • 
                                                            {' '}{week.cancelledBookings} {t.t('cancelled')}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>

                                            {/* Reservas de la semana (expandible) */}
                                            {isExpanded && (() => {
                                                const paginatedBookings = getPaginatedBookings(week.bookings, weekKey);
                                                const totalPages = getTotalPages(week.bookings);
                                                const currentPage = getWeekPage(weekKey);

                                                return (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                        <div className="space-y-3 mb-4">
                                                            {paginatedBookings.map((booking) => (
                                                        <div
                                                            key={booking.id}
                                                            className="bg-white p-4 rounded-lg border"
                                                        >
                                                            <div className="flex justify-between items-start">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Calendar className="w-4 h-4 text-gray-600" />
                                                                        <span className="text-sm font-medium text-gray-700">
                                                                            {format(new Date(booking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Clock className="w-4 h-4 text-gray-600" />
                                                                        <span className="font-semibold text-gray-800">
                                                                            {format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Users className="w-4 h-4 text-gray-600" />
                                                                        <span className="text-gray-700">{booking.children?.map(child => child.name).join(', ') || t.t('user')}</span>
                                                                    </div>
                                                                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : booking.status === 'CANCELLED'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                        {booking.status === 'CONFIRMED' ? t.t('confirmed') : 
                                                                         booking.status === 'CANCELLED' ? t.t('cancelled') : 
                                                                         t.t('pending')}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 ml-2 sm:ml-4">
                                                                    <button
                                                                        onClick={() => openModal(booking)}
                                                                        className="bg-blue-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-blue-600 transition-colors text-xs sm:text-sm min-w-[48px] flex items-center justify-center"
                                                                        title={t.t('view')}
                                                                    >
                                                                        <span className="hidden sm:inline">{t.t('view')}</span>
                                                                        <span className="sm:hidden">👁</span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteBooking(booking.id)}
                                                                        className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-red-600 transition-colors min-w-[48px] flex items-center justify-center"
                                                                        title={t.t('delete')}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                        </div>

                                                        {/* Paginación */}
                                                        <div className="pt-4 border-t border-gray-300">
                                                            <div className="text-sm text-gray-600 mb-3 text-center">
                                                                {t.t('showing')} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, week.bookings.length)} {t.t('of')} {week.bookings.length}
                                                            </div>
                                                            <Pagination
                                                                currentPage={currentPage}
                                                                totalPages={totalPages}
                                                                onPageChange={(page) => setWeekPage(weekKey, page)}
                                                                className="mt-0 mb-0"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    );
                                })
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
                                <span className="text-gray-600">{t.t('confirmed')}:</span>
                                <span className="font-medium text-green-600">{stats.CONFIRMED}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('cancelled')}:</span>
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
                        <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center gap-4">
                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">{t.t('reservationDetails')} #{selectedBooking.id}</h3>
                            <button
                                onClick={closeModal}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0 min-w-[48px]"
                                title={t.t('close')}
                            >
                                <X className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Información del usuario */}
                            <div className="bg-blue-50 p-4 rounded-xl">
                                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    {t.t('userData')}
                                </h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{t.t('name')}:</span>
                                        <span>{selectedBooking.user?.name || t.t('notAvailable')}</span>
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
                                        <span className="text-sm text-gray-600">{t.t('date')}</span>
                                    </div>
                                    <p className="font-semibold text-gray-800">
                                        {format(new Date(selectedBooking.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-gray-600" />
                                        <span className="text-sm text-gray-600">{t.t('schedule')}</span>
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
                                        {t.t('children')} ({selectedBooking.children.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedBooking.children.map((child, idx) => (
                                            <div key={idx} className="bg-white p-3 rounded-lg">
                                                <p className="font-medium text-gray-800">{child.name} {child.surname}</p>
                                                {(child as any).dateOfBirth && (
                                                    <p className="text-sm text-gray-600">
                                                        {t.t('birthDate')}: {format(new Date((child as any).dateOfBirth), "dd/MM/yyyy")}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Estado */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <span className="font-medium text-gray-700">{t.t('status')}:</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    selectedBooking.status === 'CONFIRMED' 
                                        ? 'bg-green-100 text-green-800'
                                        : selectedBooking.status === 'CANCELLED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {selectedBooking.status === 'CONFIRMED' ? t.t('confirmed') : 
                                     selectedBooking.status === 'CANCELLED' ? t.t('cancelled') : 
                                     t.t('pending')}
                                </span>
                            </div>

                            {/* Comentarios */}
                            {selectedBooking.comments && (
                                <div className="bg-yellow-50 p-4 rounded-xl">
                                    <div className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-800 mb-1">{t.t('comments')}</p>
                                            <p className="text-sm text-yellow-700">{selectedBooking.comments}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botones de acción */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 mt-4 space-y-3">
                            {/* Checkboxes de asistencia (solo si está confirmada) */}
                            {selectedBooking.status === 'CONFIRMED' && (
                                <div className="bg-gray-50 p-4 rounded-xl mb-3">
                                    <h4 className="font-semibold text-gray-700 mb-3">{t.t('attendance')}:</h4>
                                    <div className="flex gap-6">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBooking.attendanceStatus === 'ATTENDED'}
                                                    onChange={async (e) => {
                                                        if (e.target.checked) {
                                                            try {
                                                                const updated = await markAttendance(selectedBooking.id, 'ATTENDED');
                                                                setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                                setSelectedBooking(updated);
                                                                showToast.success(t.t('attendanceMarked'));
                                                            } catch (err: any) {
                                                                showToast.error(err.message || t.t('errorMarkingAttendance'));
                                                            }
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded border-2 border-gray-300 appearance-none checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all cursor-pointer relative"
                                                    style={{
                                                        backgroundImage: selectedBooking.attendanceStatus === 'ATTENDED' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\'/%3E%3C/svg%3E")' : 'none',
                                                        backgroundSize: 'contain',
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'center'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className={`w-5 h-5 transition-colors ${selectedBooking.attendanceStatus === 'ATTENDED' ? 'text-green-600' : 'text-gray-400'}`} />
                                                <span className={`font-medium transition-colors ${selectedBooking.attendanceStatus === 'ATTENDED' ? 'text-green-700' : 'text-gray-600'}`}>
                                                    {t.t('attended')}
                                                </span>
                                            </div>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedBooking.attendanceStatus === 'NOT_ATTENDED'}
                                                    onChange={async (e) => {
                                                        if (e.target.checked) {
                                                            try {
                                                                const updated = await markAttendance(selectedBooking.id, 'NOT_ATTENDED');
                                                                setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                                setSelectedBooking(updated);
                                                                showToast.success(t.t('attendanceMarked'));
                                                            } catch (err: any) {
                                                                showToast.error(err.message || t.t('errorMarkingAttendance'));
                                                            }
                                                        }
                                                    }}
                                                    className="w-6 h-6 rounded border-2 border-gray-300 appearance-none checked:bg-red-500 checked:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all cursor-pointer relative"
                                                    style={{
                                                        backgroundImage: selectedBooking.attendanceStatus === 'NOT_ATTENDED' ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\'/%3E%3C/svg%3E")' : 'none',
                                                        backgroundSize: 'contain',
                                                        backgroundRepeat: 'no-repeat',
                                                        backgroundPosition: 'center'
                                                    }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <XCircle className={`w-5 h-5 transition-colors ${selectedBooking.attendanceStatus === 'NOT_ATTENDED' ? 'text-red-600' : 'text-gray-400'}`} />
                                                <span className={`font-medium transition-colors ${selectedBooking.attendanceStatus === 'NOT_ATTENDED' ? 'text-red-700' : 'text-gray-600'}`}>
                                                    {t.t('notAttended')}
                                                </span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            )}
                            {/* Botones de cambio de estado */}
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                {selectedBooking.status !== 'CONFIRMED' && (
                                    <button
                                        onClick={async () => {
                                            const confirmed = await confirm({ 
                                                message: t.t('confirmReservationQuestion') || t.t('confirmReservation'),
                                                variant: 'info'
                                            });
                                            if (confirmed) {
                                                handleConfirmBooking(selectedBooking.id);
                                                closeModal();
                                            }
                                        }}
                                        className="flex-1 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-green-600 transition-all duration-200 text-sm sm:text-base min-w-[48px]"
                                    >
                                        {t.t('confirmReservation')}
                                    </button>
                                )}
                                {selectedBooking.status !== 'CANCELLED' && (
                                    <button
                                        onClick={async () => {
                                            const confirmed = await confirm({ 
                                                message: t.t('cancelReservationQuestion') || t.t('cancelReservation'),
                                                variant: 'warning'
                                            });
                                            if (confirmed) {
                                                handleCancelBooking(selectedBooking.id);
                                                closeModal();
                                            }
                                        }}
                                        className="flex-1 bg-yellow-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-yellow-600 transition-all duration-200 text-sm sm:text-base min-w-[48px]"
                                    >
                                        {t.t('cancelReservation')}
                                    </button>
                                )}
                                <button
                                    onClick={closeModal}
                                    className="flex-1 bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-gray-300 transition-all duration-200 text-sm sm:text-base min-w-[48px]"
                                >
                                    {t.t('close')}
                                </button>
                            </div>
                            {/* Botón de eliminación - Menos accesible */}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2 text-center">{t.t('destructiveAction')}</p>
                                <button
                                    onClick={async () => {
                                        const confirmed = await confirm({ 
                                            message: t.t('confirmDelete'),
                                            variant: 'danger'
                                        });
                                        if (confirmed) {
                                            const doubleConfirm = await confirm({ 
                                                message: t.t('doubleConfirmDelete'),
                                                variant: 'danger'
                                            });
                                            if (doubleConfirm) {
                                                handleDeleteBooking(selectedBooking.id);
                                                closeModal();
                                            }
                                        }
                                    }}
                                    className="w-full bg-gray-600 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{t.t('delete')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {ConfirmComponent}
        </div>
    );
}
