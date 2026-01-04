import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Calendar, Trash2, Phone, Clock, CalendarDays, ChevronDown, ChevronRight, Edit3, MessageCircle, X } from 'lucide-react';
import { CalendarComponent } from '../../shared/Calendar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useMeetingBookings } from '../../../contexts/MeetingBookingContext';
import { useMeetingSlots } from '../../../contexts/MeetingSlotContext';
import { Spinner } from '../../shared/Spinner';
import { showToast } from '../../../lib/toast';
import { useConfirm } from '../../../hooks/useConfirm';
import { SearchBar } from '../../shared/SearchBar';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es, ca } from "date-fns/locale";
import { useAuth } from '../../../contexts/AuthContext';
import { MeetingBooking } from '../../../types/auth';
import { useMonthLoading, useWeekPagination } from '../../../hooks/useMonthWeekGrouping';
import { Pagination } from '../../shared/Pagination';

export function AdminVisitBookings() {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const t = useTranslation('AdminVisitBookings');
    const tCommon = useTranslation('Common');
    const locale = t.locale;
    const { confirm, ConfirmComponent } = useConfirm();
    const { user } = useAuth();
    const { fetchBookings, fetchBookingsByMonth, fetchBookingsByDate, updateBooking, updateBookingStatus, deleteBooking } = useMeetingBookings();
    const { fetchSlots } = useMeetingSlots();

    const [bookings, setBookings] = useState<MeetingBooking[]>([]);
    const [slots, setSlots] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all');
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailyBookings, setDailyBookings] = useState<MeetingBooking[]>([]);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [selectedBooking, setSelectedBooking] = useState<MeetingBooking | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const [searchQuery, setSearchQuery] = useState("");

    // Usar hooks helper para meses y semanas
    const monthLoading = useMonthLoading();
    const weekPagination = useWeekPagination();

    // Cargar todas las reservas al inicio (24 meses de rango)
    useEffect(() => {
        if (!!user) {
            const loadAllBookings = async () => {
                setIsLoadingBookings(true);
                try {
                    // fetchBookings sin parámetros carga 12 meses atrás y 12 adelante automáticamente
                    const allBookings = await fetchBookings();
                    setBookings(allBookings);
                    
                    // Marcar todos los meses como cargados
                    const uniqueMonths = new Set<string>();
                    allBookings.forEach(booking => {
                        const bookingDate = booking.slot ? new Date(booking.slot.startTime) : new Date(booking.createdAt || new Date());
                        const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth()}`;
                        uniqueMonths.add(monthKey);
                    });
                    monthLoading.setLoadedMonths(uniqueMonths);
                    
                    // Expandir el mes actual por defecto
                    const now = new Date();
                    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
                    monthLoading.setExpandedMonths(new Set([currentMonthKey]));
                } catch (error) {
                    console.error("Error cargando reservas:", error);
                } finally {
                    setIsLoadingBookings(false);
                }
            };
            loadAllBookings();
        }
    }, [user, fetchBookings]);

    useEffect(() => {
        const loadDailyBookings = async () => {
            if (selectedDate) {
                try {
                    const bookingsForDay = await fetchBookingsByDate(selectedDate);
                    // Ordenar por hora ascendente
                    const sorted = (bookingsForDay || []).sort((a, b) => {
                        const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                        const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                        return timeA - timeB;
                    });
                    setDailyBookings(sorted);
                } catch (error) {
                    console.error('Error loading daily bookings:', error);
                    setDailyBookings([]);
                }
            } else {
                setDailyBookings([]);
            }
        };
        loadDailyBookings();
    }, [selectedDate, fetchBookingsByDate]);

    // Cargar slots del mes actual
    useEffect(() => {
        if (!!user) {
            loadSlots();
        }
    }, [user, refreshTrigger]);

    const loadSlots = async () => {
        try {
            const fetchedSlots = await fetchSlots();
            setSlots(fetchedSlots || []);
        } catch (error) {
            console.error('Error loading slots:', error);
        }
    };

    const filteredBookings = useMemo(() => {
        let result = bookings.filter(booking =>
            filter === 'all' || booking.status === filter
        );

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(booking => {
                const bookingId = booking.id.toString();
                const email = booking.email?.toLowerCase() || "";
                const phone = booking.phone?.toLowerCase() || "";
                const slotDate = booking.slot ? format(new Date(booking.slot.startTime), "dd/MM/yyyy", { locale: dateFnsLocale }) : "";
                const slotTime = booking.slot ? format(new Date(booking.slot.startTime), "HH:mm") : "";
                const status = booking.status.toLowerCase();
                
                return bookingId.includes(query) ||
                       email.includes(query) ||
                       phone.includes(query) ||
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

        // Siempre mostrar al menos el mes actual y algunos meses anteriores
        const now = new Date();
        const months: Date[] = [];
        
        // Mostrar los últimos 12 meses (mes actual + 11 anteriores)
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthDate);
        }
        
        // Si hay reservas, añadir también los meses que contienen esas reservas
        if (filteredBookings.length > 0) {
            const uniqueDates = Array.from(
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
        return monthsData.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    }, [filteredBookings, selectedDate, monthLoading.loadedMonths, monthLoading.loadingMonths]);

    const calendarData = useMemo(() => {
        const bookedDays: number[] = [];
        const availableDays: number[] = [];
        const dayStats: Record<number, { totalSlots: number; availableSlots: number; totalBookings: number; status: string }> = {};

        // Procesar slots para calcular días disponibles
        slots.forEach(slot => {
            const slotDate = new Date(slot.startTime || slot.date);
            if (
                slotDate.getFullYear() === currentMonth.getFullYear() &&
                slotDate.getMonth() === currentMonth.getMonth()
            ) {
                const day = slotDate.getDate();
                
                if (!dayStats[day]) {
                    dayStats[day] = { totalSlots: 0, availableSlots: 0, totalBookings: 0, status: 'empty' };
                }
                
                dayStats[day].totalSlots++;
                if (slot.status === 'OPEN' && slot.availableSpots > 0) {
                    dayStats[day].availableSlots++;
                    if (!availableDays.includes(day)) {
                        availableDays.push(day);
                    }
                }
            }
        });

        // Procesar reservas para calcular días con reservas
        bookings.forEach(booking => {
            if (booking.slot) {
                const bookingDate = new Date(booking.slot.startTime);
                if (
                    bookingDate.getFullYear() === currentMonth.getFullYear() &&
                    bookingDate.getMonth() === currentMonth.getMonth()
                ) {
                    const day = bookingDate.getDate();
                    
                    if (!dayStats[day]) {
                        dayStats[day] = { totalSlots: 0, availableSlots: 0, totalBookings: 0, status: 'empty' };
                    }
                    
                    dayStats[day].totalBookings++;
                    if (!bookedDays.includes(day)) {
                        bookedDays.push(day);
                    }
                }
            }
        });

        // Determinar estado de cada día
        Object.keys(dayStats).forEach(dayStr => {
            const day = Number(dayStr);
            const stats = dayStats[day];
            
            if (stats.totalSlots === 0) {
                // Sin slots, solo reservas
                stats.status = stats.totalBookings > 0 ? 'full' : 'empty';
            } else if (stats.availableSlots === 0 && stats.totalBookings > 0) {
                // Todos los slots están llenos y hay reservas
                stats.status = 'full';
            } else if (stats.availableSlots === stats.totalSlots && stats.totalBookings === 0) {
                // Todos los slots disponibles, sin reservas
                stats.status = 'available';
            } else {
                // Parcial: hay slots disponibles y reservas
                stats.status = 'partial';
            }
        });

        return { bookedDays, availableDays, dayStats };
    }, [bookings, slots, currentMonth]);

    const handleUpdateBookingStatus = async (id: number, status: MeetingBooking['status']) => {
        const booking = bookings.find(b => b.id === id) || dailyBookings.find(b => b.id === id);
        let confirmMessage = '';
        let confirmTitle = '';
        let variant: 'danger' | 'warning' | 'info' = 'info';
        let confirmText = '';
        
        if (status === 'CONFIRMED') {
            confirmTitle = t.t('confirmReservationTitle') || 'Confirmar Reserva';
            confirmMessage = t.t('confirmReservationQuestion') || `¿Estás seguro de que deseas confirmar la reserva #${id}?`;
            confirmText = t.t('confirm') || 'Confirmar';
            variant = 'info';
        } else if (status === 'CANCELLED') {
            confirmTitle = t.t('cancelReservationTitle') || 'Cancelar Reserva';
            confirmMessage = t.t('cancelReservationQuestion') || `¿Estás seguro de que deseas cancelar la reserva #${id}? Esta acción enviará un email de cancelación al usuario.`;
            confirmText = t.t('cancel') || 'Cancelar';
            variant = 'warning';
        } else if (status === 'PENDING') {
            confirmTitle = t.t('setPendingTitle') || 'Establecer como Pendiente';
            confirmMessage = t.t('setPendingQuestion') || `¿Estás seguro de que deseas establecer la reserva #${id} como pendiente?`;
            confirmText = t.t('setPending') || 'Establecer';
            variant = 'warning';
        }
        
        const confirmed = await confirm({ 
            title: confirmTitle,
            message: confirmMessage, 
            variant,
            confirmText,
            cancelText: t.t('cancel') || 'Cancelar'
        });
        if (!confirmed) return;
        
        try {
            await updateBookingStatus(id, status);
            setRefreshTrigger(prev => prev + 1);
            if (selectedDate) {
                const bookingsForDay = await fetchBookingsByDate(selectedDate);
                // Ordenar por hora ascendente
                const sorted = (bookingsForDay || []).sort((a, b) => {
                    const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                    const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                    return timeA - timeB;
                });
                setDailyBookings(sorted);
            }
            
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
            showToast.error(t.t('updateError'));
        }
    };

    const handleDeleteBooking = async (id: number) => {
        const booking = bookings.find(b => b.id === id) || dailyBookings.find(b => b.id === id);
        const bookingInfo = booking?.name || booking?.email || `#${id}`;
        
        const confirmed = await confirm({ 
            title: t.t('deleteReservationTitle') || 'Eliminar Reserva',
            message: t.t('confirmDelete') || `¿Estás seguro de que deseas eliminar permanentemente la reserva ${bookingInfo}? Esta acción no se puede deshacer.`,
            variant: 'danger',
            confirmText: t.t('delete') || 'Eliminar',
            cancelText: t.t('cancel') || 'Cancelar'
        });
        if (!confirmed) return;

        try {
            await deleteBooking(id);
            setRefreshTrigger(prev => prev + 1);
            if (selectedDate) {
                const bookingsForDay = await fetchBookingsByDate(selectedDate);
                // Ordenar por hora ascendente
                const sorted = (bookingsForDay || []).sort((a, b) => {
                    const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                    const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                    return timeA - timeB;
                });
                setDailyBookings(sorted);
            }
            showToast.success(tCommon.t('deleteSuccessWithEmail'));
        } catch (err) {
            showToast.error(t.t('deleteError'));
        }
    };

    const openModal = (booking: MeetingBooking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    const handleUpdateBooking = async (id: number, data: Partial<MeetingBooking>): Promise<void> => {
        try {
            await updateBooking(id, data);
            setRefreshTrigger(prev => prev + 1);
            if (selectedDate) {
                const bookingsForDay = await fetchBookingsByDate(selectedDate);
                // Ordenar por hora ascendente
                const sorted = (bookingsForDay || []).sort((a, b) => {
                    const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
                    const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
                    return timeA - timeB;
                });
                setDailyBookings(sorted);
            }
            if (selectedBooking?.id === id) {
                setSelectedBooking(prev => prev ? { ...prev, ...data } : prev);
            }
            if (data.slotId !== undefined) {
                setRefreshTrigger(prev => prev + 1);
            }
            showToast.success(tCommon.t('modifySuccessWithEmail'));
            closeModal();
        } catch (err) {
            showToast.error(t.t('updateError'));
            setRefreshTrigger(prev => prev + 1);
        }
    };

    const filteredDailyBookings = useMemo(() => {
        if (!selectedDate) return [];
        
        let result = dailyBookings.filter(booking =>
            filter === 'all' || booking.status === filter
        );

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            result = result.filter(booking => {
                const bookingId = booking.id.toString();
                const email = booking.email?.toLowerCase() || "";
                const phone = booking.phone?.toLowerCase() || "";
                const slotDate = booking.slot ? format(new Date(booking.slot.startTime), "dd/MM/yyyy", { locale: dateFnsLocale }) : "";
                const slotTime = booking.slot ? format(new Date(booking.slot.startTime), "HH:mm") : "";
                const status = booking.status.toLowerCase();
                
                return bookingId.includes(query) ||
                       email.includes(query) ||
                       phone.includes(query) ||
                       slotDate.includes(query) ||
                       slotTime.includes(query) ||
                       status.includes(query);
            });
        }

        // Ordenar por hora ascendente
        return result.sort((a, b) => {
            const timeA = a.slot ? new Date(a.slot.startTime).getTime() : new Date(a.createdAt || new Date()).getTime();
            const timeB = b.slot ? new Date(b.slot.startTime).getTime() : new Date(b.createdAt || new Date()).getTime();
            return timeA - timeB;
        });
    }, [dailyBookings, filter, searchQuery, dateFnsLocale, selectedDate]);

    const stats = {
        total: bookings.length,
        PENDING: bookings.filter(b => b.status === 'PENDING').length,
        CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length
    };
    const bookingsToShow = selectedDate ? filteredDailyBookings : filteredBookings;

    if (isLoadingBookings) {
        return (
            <div className="container mx-auto px-4 flex justify-center items-center min-h-[400px]">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t.t('title')}</h1>
                <p className="text-sm sm:text-base text-gray-600">{t.t('subtitle')}</p>
            </div>

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
                <div className="min-h-auto bg-gray-50 py-8">
                    {viewMode === "calendar" ? (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">{t.t('calendarView')}</h2>
                                {selectedDate && (
                                    <button
                                        onClick={() => setSelectedDate(undefined)}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        {t.t('viewAllBookings')}
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        {t.t('bookingsOf')} {format(selectedDate, "dd/MM/yyyy")}
                                    </h3>
                                    {filteredDailyBookings.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">{t.t('noBookingsDay')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredDailyBookings.map((booking) => (
                                                <div
                                                    key={booking.id}
                                                    className="bg-gray-50 p-4 rounded-lg border"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            {booking.name && (
                                                                <p className="font-semibold text-gray-800">
                                                                    {booking.name}
                                                                </p>
                                                            )}
                                                            <p className="font-semibold text-gray-800">
                                                                {booking.email}
                                                            </p>
                                                            {booking.phone && (
                                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                                    <Phone className="w-4 h-4" />
                                                                    {booking.phone}
                                                                </p>
                                                            )}
                                                            {booking.slot && (
                                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                    <Clock className="w-4 h-4" />
                                                                    {format(new Date(booking.slot.startTime), "HH:mm")} - {format(new Date(booking.slot.endTime), "HH:mm")}
                                                                </p>
                                                            )}
                                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                                                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {booking.status === 'CONFIRMED' ? t.t('statusConfirmed') : 
                                                                 booking.status === 'CANCELLED' ? t.t('statusCancelled') : 
                                                                 booking.status === 'PENDING' ? t.t('statusPending') : 
                                                                 booking.status}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => openModal(booking)}
                                                                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                                                title={t.t('edit')}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteBooking(booking.id)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
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
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">
                                    {selectedDate ? `${t.t('bookingsOf')} ${format(selectedDate, "dd/MM/yyyy", { locale: dateFnsLocale })}` : t.t('allBookings')}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {selectedDate && (
                                        <button
                                            onClick={() => setSelectedDate(undefined)}
                                            className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                                        >
                                            {t.t('viewAllBookings')}
                                        </button>
                                    )}
                                    <div className="text-sm text-gray-500">
                                        {bookingsToShow.length} {t.t('reservations')}
                                    </div>
                                </div>
                            </div>

                            {bookingsToShow.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {selectedDate ? t.t('noBookingsDay') : t.t('noBookings')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {selectedDate ? '' : t.t('noBookingsDescription')}
                                    </p>
                                </div>
                            ) : selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="space-y-3">
                                        {filteredDailyBookings.map((booking) => (
                                            <div
                                                key={booking.id}
                                                className="bg-gray-50 p-4 rounded-lg border"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        {booking.name && (
                                                            <p className="font-semibold text-gray-800">
                                                                {booking.name}
                                                            </p>
                                                        )}
                                                        <p className="font-semibold text-gray-800">
                                                            {booking.email}
                                                        </p>
                                                        {booking.phone && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                <Phone className="w-4 h-4" />
                                                                {booking.phone}
                                                            </p>
                                                        )}
                                                        {booking.comments && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                <MessageCircle className="w-4 h-4" />
                                                                {booking.comments}
                                                            </p>
                                                        )}
                                                        {booking.slot && (
                                                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                <Clock className="w-4 h-4" />
                                                                {format(new Date(booking.slot.startTime), "HH:mm", { locale: dateFnsLocale })} - {format(new Date(booking.slot.endTime), "HH:mm", { locale: dateFnsLocale })}
                                                            </p>
                                                        )}
                                                        <div className="flex gap-2 mt-2">
                                                            <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                                                booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                                booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {booking.status === 'CONFIRMED' ? t.t('statusConfirmed') : 
                                                                 booking.status === 'CANCELLED' ? t.t('statusCancelled') : 
                                                                 booking.status === 'PENDING' ? t.t('statusPending') : 
                                                                 booking.status}
                                                            </div>
                                                            {booking.status !== 'CONFIRMED' && (
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                                                    className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                                >
                                                                    {t.t('confirm')}
                                                                </button>
                                                            )}
                                                            {booking.status !== 'CANCELLED' && (
                                                                <button
                                                                    onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                                >
                                                                    {t.t('cancel')}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 ml-4">
                                                        <button
                                                            onClick={() => openModal(booking)}
                                                            className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition-colors"
                                                            title={t.t('edit')}
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteBooking(booking.id)}
                                                            className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 transition-colors"
                                                            title={t.t('delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : bookingsByMonth.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
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
                                                                                            {week.totalBookings} {t.t('reservations')} • {week.pendingBookings} {t.t('pending')} • {week.confirmedBookings} {t.t('confirmed')} • {week.cancelledBookings} {t.t('cancelled')}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                                                            {isWeekExpanded && (() => {
                                                                                const paginatedBookings = weekPagination.getPaginatedItems(week.bookings, weekKey);
                                                                                const totalPages = weekPagination.getTotalPages(week.bookings);
                                                                                const currentPage = weekPagination.getWeekPage(weekKey);

                                                                                return (
                                                                                    <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                                                        <div className="space-y-2 mb-4">
                                                                                            {paginatedBookings.map((booking: MeetingBooking) => (
                                                                <div
                                                                    key={booking.id}
                                                                    className="bg-white p-3 rounded-lg border"
                                                                >
                                                                    <div className="flex justify-between items-start">
                                                                        <div className="flex-1">
                                                                            {booking.name && (
                                                                                <p className="font-semibold text-gray-800">
                                                                                    {booking.name}
                                                                                </p>
                                                                            )}
                                                                            <p className="font-semibold text-gray-600">
                                                                                {booking.email}
                                                                            </p>
                                                                            {booking.phone && (
                                                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                                    <Phone className="w-4 h-4" />
                                                                                    {booking.phone}
                                                                                </p>
                                                                            )}
                                                                            {booking.comments && (
                                                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                                                    <MessageCircle className="w-4 h-4" />
                                                                                    {booking.comments}
                                                                                </p>
                                                                            )}
                                                                            {booking.slot && (
                                                                                <p className="text-sm text-gray-500 mt-1">
                                                                                    {format(new Date(booking.slot.startTime), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })} • {format(new Date(booking.slot.startTime), "HH:mm")} - {format(new Date(booking.slot.endTime), "HH:mm")}
                                                                                </p>
                                                                            )}
                                                                            <div className="flex gap-2 mt-2">
                                                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                                    booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                                                    booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                    {booking.status === 'CONFIRMED' ? t.t('statusConfirmed') : 
                                                                 booking.status === 'CANCELLED' ? t.t('statusCancelled') : 
                                                                 booking.status === 'PENDING' ? t.t('statusPending') : 
                                                                 booking.status}
                                                                                </div>
                                                                                {booking.status !== 'CONFIRMED' && (
                                                                                    <button
                                                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CONFIRMED')}
                                                                                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                                                                    >
                                                                                        {t.t('confirm')}
                                                                                    </button>
                                                                                )}
                                                                                {booking.status !== 'CANCELLED' && (
                                                                                    <button
                                                                                        onClick={() => handleUpdateBookingStatus(booking.id, 'CANCELLED')}
                                                                                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                                                                    >
                                                                                        {t.t('cancel')}
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-2 ml-4">
                                                                            <button
                                                                                onClick={() => openModal(booking)}
                                                                                className="bg-blue-500 text-white px-3 py-1 rounded-xl hover:bg-blue-600 transition-colors"
                                                                                title={t.t('edit')}
                                                                            >
                                                                                <Edit3 className="w-4 h-4" />
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteBooking(booking.id)}
                                                                                className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 transition-colors"
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
                </div>

                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={Object.keys(calendarData.dayStats)
                            .map(Number)
                            .filter(day => {
                                const stats = calendarData.dayStats[day];
                                return stats.status === 'available' || stats.status === 'partial';
                            })}
                        bookedDaysDB={Object.keys(calendarData.dayStats)
                            .map(Number)
                            .filter(day => {
                                const stats = calendarData.dayStats[day];
                                return stats.status === 'full' || stats.status === 'partial';
                            })}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                        }}
                    />
                </div>
            </div>
            {ConfirmComponent}

            {/* Modal de edición */}
            {isModalOpen && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800">{t.t('edit') || 'Editar'} #{selectedBooking.id}</h3>
                            <button
                                onClick={closeModal}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <EditBookingForm
                            booking={selectedBooking}
                            onSave={(data) => handleUpdateBooking(selectedBooking.id, data)}
                            onCancel={closeModal}
                            t={t}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function EditBookingForm({ 
    booking, 
    onSave, 
    onCancel,
    t 
}: { 
    booking: MeetingBooking; 
    onSave: (data: Partial<MeetingBooking>) => void; 
    onCancel: () => void;
    t: any;
}) {
    const tCommon = useTranslation('Common');
    const tVisit = useTranslation('VisitBookingModal');
    const tAuth = useTranslation('Auth');

    const [formData, setFormData] = useState({
        name: booking.name || '',
        email: booking.email || '',
        phone: booking.phone || '',
        comments: booking.comments || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data: Partial<MeetingBooking> = {};
        if (formData.name !== booking.name) data.name = formData.name;
        if (formData.email !== booking.email) data.email = formData.email;
        if (formData.phone !== booking.phone) data.phone = formData.phone;
        if (formData.comments !== booking.comments) data.comments = formData.comments;
        
        if (Object.keys(data).length > 0) {
            onSave(data);
        } else {
            onCancel();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tAuth.t('name')}</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tVisit.t('email')}</label>
                <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tVisit.t('phone')}</label>
                <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{tVisit.t('comments')}</label>
                <textarea
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={3}
                />
            </div>
            <div className="flex gap-2 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                    {tCommon.t('cancel')}
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                    {tCommon.t('save')}
                </button>
            </div>
        </form>
    );
}

