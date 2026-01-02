import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, Users, Trash2, Phone, Clock, CalendarDays, Mail, MessageSquare, X, Copy, Check, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { useDaycareBookings } from '../../../contexts/DaycareBookingContext';
import { DaycareBooking } from '../../../types/auth';
import { useAuth } from '../../../contexts/AuthContext';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
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
    const { fetchBookings, fetchBookingsByMonth, updateBooking, deleteBooking, cancelBooking, markAttendance } = useDaycareBookings();
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
    const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set()); // Track qué meses están cargados
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set()); // Track qué meses están expandidos
    const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set()); // Track qué meses se están cargando

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

    // Función para cargar un mes específico
    const loadMonth = useCallback(async (year: number, month: number, isInitial = false) => {
        const monthKey = `${year}-${month}`;
        
        // Si ya está cargado, no hacer nada
        if (loadedMonths.has(monthKey)) {
            if (isInitial) {
                setIsLoadingBookings(false);
            }
            return;
        }
        
        // Marcar como cargando
        setLoadingMonths(prev => new Set(prev).add(monthKey));
        if (isInitial) {
            setIsLoadingBookings(true);
        }
        
        try {
            const monthBookings = await fetchBookingsByMonth(year, month);
            setBookings(prev => {
                // Combinar bookings existentes con los nuevos, evitando duplicados
                const existingIds = new Set(prev.map(b => b.id));
                const newBookings = monthBookings.filter(b => !existingIds.has(b.id));
                return [...prev, ...newBookings];
            });
            setLoadedMonths(prev => new Set(prev).add(monthKey));
            if (isInitial) {
                setExpandedMonths(prev => new Set(prev).add(monthKey));
                setIsLoadingBookings(false);
            }
        } catch (error) {
            console.error("Error cargando mes:", error);
            if (isInitial) {
                setIsLoadingBookings(false);
            }
        } finally {
            setLoadingMonths(prev => {
                const next = new Set(prev);
                next.delete(monthKey);
                return next;
            });
        }
    }, [fetchBookingsByMonth, loadedMonths]);

    // Cargar mes actual al inicio
    useEffect(() => {
        if (!!user) {
            const now = new Date();
            loadMonth(now.getFullYear(), now.getMonth(), true);
        }
    }, [user, loadMonth]);

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
        let result = dailyBookings;
        
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = dailyBookings.filter(booking => {
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
        
        // Ordenar por hora ascendente (09:00, 10:00, etc.)
        return result.sort((a, b) => {
            const timeA = new Date(a.startTime).getTime();
            const timeB = new Date(b.startTime).getTime();
            return timeA - timeB;
        });
    }, [dailyBookings, searchQuery, dateFnsLocale]);

    const bookingsToShow = selectedDate ? filteredDailyBookings : filteredBookings;

    // Agrupar reservas por mes y luego por semanas dentro de cada mes
    const bookingsByMonth = useMemo(() => {
        if (bookingsToShow.length === 0) return [];

        // Si hay un día seleccionado, mostrar las reservas de ese día
        if (selectedDate) {
            const selectedDateStart = startOfMonth(selectedDate);
            const selectedDateEnd = endOfMonth(selectedDate);
            const monthKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}`;
            
            // Obtener la semana que contiene el día seleccionado
            const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
            
            // Ordenar reservas por hora ascendente
            const sortedBookings = [...bookingsToShow].sort((a, b) => {
                const timeA = new Date(a.startTime).getTime();
                const timeB = new Date(b.startTime).getTime();
                return timeA - timeB;
            });

            return [{
                monthStart: selectedDateStart,
                monthEnd: selectedDateEnd,
                monthKey,
                weeks: [{
                    weekStart,
                    weekEnd,
                    bookings: sortedBookings,
                    totalBookings: sortedBookings.length,
                    confirmedBookings: sortedBookings.filter(b => b.status === 'CONFIRMED').length,
                    cancelledBookings: sortedBookings.filter(b => b.status === 'CANCELLED').length
                }],
                totalBookings: sortedBookings.length,
                confirmedBookings: sortedBookings.filter(b => b.status === 'CONFIRMED').length,
                cancelledBookings: sortedBookings.filter(b => b.status === 'CANCELLED').length,
                isLoaded: loadedMonths.has(monthKey),
                isLoading: loadingMonths.has(monthKey)
            }];
        }

        // Siempre mostrar al menos el mes actual y algunos meses anteriores
        const now = new Date();
        const months: Date[] = [];
        
        // Mostrar los últimos 12 meses (mes actual + 11 anteriores)
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthDate);
        }
        
        // Si hay reservas, añadir también los meses que contienen esas reservas
        if (bookingsToShow.length > 0) {
            const uniqueDates = Array.from(
                new Set(bookingsToShow.map(booking => {
                    const date = new Date(booking.startTime);
                    date.setHours(0, 0, 0, 0);
                    return date.getTime();
                }))
            ).map(timestamp => new Date(timestamp));

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
        }

        // Agrupar reservas por mes y luego por semanas
        const monthsData = months.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            const monthBookings = bookingsToShow.filter(booking => {
                const bookingDate = new Date(booking.startTime);
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
                    const bookingDate = new Date(booking.startTime);
                    bookingDate.setHours(0, 0, 0, 0);
                    return isWithinInterval(bookingDate, { start: weekStart, end: weekEnd });
                });

                // Ordenar reservas por fecha ascendente y luego por hora ascendente
                const sortedBookings = weekBookings.sort((a, b) => {
                    const dateA = new Date(a.startTime).getTime();
                    const dateB = new Date(b.startTime).getTime();
                    if (dateA !== dateB) {
                        return dateA - dateB; // Fecha ascendente
                    }
                    // Si es la misma fecha, ordenar por hora ascendente
                    return dateA - dateB;
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

            // Ordenar semanas por fecha ascendente
            weeksData.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

            const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
            return {
                monthStart,
                monthEnd,
                monthKey,
                weeks: weeksData,
                totalBookings: monthBookings.length,
                confirmedBookings: monthBookings.filter(b => b.status === 'CONFIRMED').length,
                cancelledBookings: monthBookings.filter(b => b.status === 'CANCELLED').length,
                isLoaded: loadedMonths.has(monthKey),
                isLoading: loadingMonths.has(monthKey)
            };
        }).filter(month => month.totalBookings > 0); // Solo meses con reservas

        // Ordenar por fecha descendente (más recientes primero)
        return monthsData.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    }, [bookingsToShow, selectedDate, loadedMonths, loadingMonths]);

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

    // Función para expandir/colapsar un mes y cargarlo si es necesario
    const toggleMonth = async (monthKey: string, year: number, month: number) => {
        const isExpanded = expandedMonths.has(monthKey);
        
        if (!isExpanded && !loadedMonths.has(monthKey)) {
            // Si no está cargado, cargarlo primero
            await loadMonth(year, month);
        }
        
        setExpandedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(monthKey)) {
                newSet.delete(monthKey);
            } else {
                newSet.add(monthKey);
            }
            return newSet;
        });
    };

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
                        className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition flex-1 sm:flex-none min-w-[48px] ${viewMode === "calendar"
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
                                                            <div className="flex flex-wrap gap-2 items-center">
                                                                <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {booking.status === 'CONFIRMED' ? t.t('statusConfirmed') : 
                                                                     booking.status === 'CANCELLED' ? t.t('statusCancelled') : 
                                                                     t.t('statusPending')}
                                                                </div>
                                                                {booking.attendanceStatus && (
                                                                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                                        booking.attendanceStatus === 'ATTENDED'
                                                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                                                            : booking.attendanceStatus === 'NOT_ATTENDED'
                                                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                                                            : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                                    }`}>
                                                                        {booking.attendanceStatus === 'ATTENDED' ? (
                                                                            <>
                                                                                <CheckCircle2 className="w-3 h-3" />
                                                                                <span>{t.t('attended')}</span>
                                                                            </>
                                                                        ) : booking.attendanceStatus === 'NOT_ATTENDED' ? (
                                                                            <>
                                                                                <XCircle className="w-3 h-3" />
                                                                                <span>{t.t('notAttended')}</span>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <Clock className="w-3 h-3" />
                                                                                <span>{t.t('pending')}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                )}
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
                                bookingsByMonth.map((month) => {
                                    const isMonthExpanded = expandedMonths.has(month.monthKey);

                                    return (
                                        <div
                                            key={month.monthKey}
                                            className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden"
                                        >
                                            {/* Card de mes */}
                                            <button
                                                onClick={() => toggleMonth(month.monthKey, month.monthStart.getFullYear(), month.monthStart.getMonth())}
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
                                                            {month.totalBookings} {month.totalBookings !== 1 ? t.t('reservations') : t.t('reservation')} • 
                                                            {' '}{month.confirmedBookings} {t.t('confirmed')} • 
                                                            {' '}{month.cancelledBookings} {t.t('cancelled')}
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
                                                    <div className="space-y-3">
                                                        {month.weeks.map((week) => {
                                                            const weekKey = `${month.monthKey}-${week.weekStart.getTime()}`;
                                                            const isWeekExpanded = expandedWeeks.has(weekKey);

                                                            return (
                                                                <div
                                                                    key={weekKey}
                                                                    className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                                                                >
                                                                    {/* Card de semana */}
                                                                    <button
                                                                        onClick={() => toggleWeek(weekKey)}
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
                                                                                    {week.totalBookings} {week.totalBookings !== 1 ? t.t('reservations') : t.t('reservation')} • 
                                                                                    {' '}{week.confirmedBookings} {t.t('confirmed')} • 
                                                                                    {' '}{week.cancelledBookings} {t.t('cancelled')}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </button>

                                                                    {/* Reservas de la semana (expandible) */}
                                                                    {isWeekExpanded && (() => {
                                                                        const paginatedBookings = getPaginatedBookings(week.bookings, weekKey);
                                                                        const totalPages = getTotalPages(week.bookings);
                                                                        const currentPage = getWeekPage(weekKey);

                                                                        return (
                                                                            <div className="border-t border-gray-200 bg-gray-50 p-3">
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
                                                                    <div className="flex flex-wrap gap-2 items-center">
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
                                                                        {booking.attendanceStatus && (
                                                                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                                                                booking.attendanceStatus === 'ATTENDED'
                                                                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                                                                    : booking.attendanceStatus === 'NOT_ATTENDED'
                                                                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                                                                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                                                                            }`}>
                                                                                {booking.attendanceStatus === 'ATTENDED' ? (
                                                                                    <>
                                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                                        <span>{t.t('attended')}</span>
                                                                                    </>
                                                                                ) : booking.attendanceStatus === 'NOT_ATTENDED' ? (
                                                                                    <>
                                                                                        <XCircle className="w-3 h-3" />
                                                                                        <span>{t.t('notAttended')}</span>
                                                                                    </>
                                                                                ) : (
                                                                                    <>
                                                                                        <Clock className="w-3 h-3" />
                                                                                        <span>{t.t('pending')}</span>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )}
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
                                                                                {totalPages > 1 && (
                                                                                    <div className="pt-3 border-t border-gray-300">
                                                                                        <div className="text-sm text-gray-600 mb-2 text-center">
                                                                                            {t.t('showing')} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, week.bookings.length)} {t.t('of')} {week.bookings.length}
                                                                                        </div>
                                                                                        <Pagination
                                                                                            currentPage={currentPage}
                                                                                            totalPages={totalPages}
                                                                                            onPageChange={(page) => setWeekPage(weekKey, page)}
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
                                                </div>
                                            )}
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
                        onSelectDate={async (date) => {
                            setSelectedDate(date);
                            const dayBookings = bookings.filter(b => {
                                const bookingDate = new Date(b.startTime);
                                return bookingDate.getFullYear() === date.getFullYear() &&
                                    bookingDate.getMonth() === date.getMonth() &&
                                    bookingDate.getDate() === date.getDate();
                            });
                            // Ordenar por hora ascendente
                            const sorted = dayBookings.sort((a, b) => {
                                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                            });
                            setDailyBookings(sorted);
                            
                            // Expandir automáticamente el mes y la semana correspondientes
                            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
                            const weekKey = `${monthKey}-${startOfWeek(date, { weekStartsOn: 1 }).getTime()}`;
                            
                            // Cargar el mes si no está cargado
                            if (!loadedMonths.has(monthKey)) {
                                await loadMonth(date.getFullYear(), date.getMonth());
                            }
                            
                            // Expandir el mes
                            setExpandedMonths(prev => new Set(prev).add(monthKey));
                            
                            // Expandir la semana
                            setExpandedWeeks(prev => new Set(prev).add(weekKey));
                            
                            // Cambiar a vista de lista si está en vista de calendario
                            if (viewMode === "calendar") {
                                setViewMode("list");
                            }
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
                            {/* Radio buttons de asistencia (siempre visible) */}
                            <div className="bg-gray-50 p-4 rounded-xl mb-3">
                                <h4 className="font-semibold text-gray-700 mb-3">{t.t('attendance')}:</h4>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name={`attendance-${selectedBooking.id}`}
                                                checked={selectedBooking.attendanceStatus === 'ATTENDED'}
                                                onChange={async () => {
                                                    try {
                                                        const updated = await markAttendance(selectedBooking.id, 'ATTENDED');
                                                        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        if (selectedDate) {
                                                            setDailyBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        }
                                                        setSelectedBooking(updated);
                                                        showToast.success(t.t('attendanceMarked'));
                                                    } catch (err: any) {
                                                        showToast.error(err.message || t.t('errorMarkingAttendance'));
                                                    }
                                                }}
                                                className="w-5 h-5 border-2 border-gray-300 appearance-none rounded-full checked:bg-green-500 checked:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all cursor-pointer relative"
                                                style={{
                                                    backgroundImage: selectedBooking.attendanceStatus === 'ATTENDED' ? 'radial-gradient(circle, white 30%, transparent 30%)' : 'none',
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
                                                type="radio"
                                                name={`attendance-${selectedBooking.id}`}
                                                checked={selectedBooking.attendanceStatus === 'NOT_ATTENDED'}
                                                onChange={async () => {
                                                    try {
                                                        const updated = await markAttendance(selectedBooking.id, 'NOT_ATTENDED');
                                                        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        if (selectedDate) {
                                                            setDailyBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        }
                                                        setSelectedBooking(updated);
                                                        showToast.success(t.t('attendanceMarked'));
                                                    } catch (err: any) {
                                                        showToast.error(err.message || t.t('errorMarkingAttendance'));
                                                    }
                                                }}
                                                className="w-5 h-5 border-2 border-gray-300 appearance-none rounded-full checked:bg-red-500 checked:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all cursor-pointer relative"
                                                style={{
                                                    backgroundImage: selectedBooking.attendanceStatus === 'NOT_ATTENDED' ? 'radial-gradient(circle, white 30%, transparent 30%)' : 'none',
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
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative">
                                            <input
                                                type="radio"
                                                name={`attendance-${selectedBooking.id}`}
                                                checked={selectedBooking.attendanceStatus === 'PENDING' || !selectedBooking.attendanceStatus}
                                                onChange={async () => {
                                                    try {
                                                        const updated = await markAttendance(selectedBooking.id, 'PENDING');
                                                        setBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        if (selectedDate) {
                                                            setDailyBookings(prev => prev.map(b => b.id === selectedBooking.id ? updated : b));
                                                        }
                                                        setSelectedBooking(updated);
                                                        showToast.success(t.t('attendanceMarked'));
                                                    } catch (err: any) {
                                                        showToast.error(err.message || t.t('errorMarkingAttendance'));
                                                    }
                                                }}
                                                className="w-5 h-5 border-2 border-gray-300 appearance-none rounded-full checked:bg-gray-500 checked:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all cursor-pointer relative"
                                                style={{
                                                    backgroundImage: (selectedBooking.attendanceStatus === 'PENDING' || !selectedBooking.attendanceStatus) ? 'radial-gradient(circle, white 30%, transparent 30%)' : 'none',
                                                    backgroundSize: 'contain',
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center'
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className={`w-5 h-5 transition-colors ${(selectedBooking.attendanceStatus === 'PENDING' || !selectedBooking.attendanceStatus) ? 'text-gray-600' : 'text-gray-400'}`} />
                                            <span className={`font-medium transition-colors ${(selectedBooking.attendanceStatus === 'PENDING' || !selectedBooking.attendanceStatus) ? 'text-gray-700' : 'text-gray-600'}`}>
                                                {t.t('pending')}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>
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
