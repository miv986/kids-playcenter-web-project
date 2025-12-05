import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3, CalendarDays, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { BirthdaySlot } from "../../../types/auth";
import { useAuth } from "../../../contexts/AuthContext";
import { useSlots } from "../../../contexts/SlotContext";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { es, ca } from "date-fns/locale";
import { SlotModal } from "../../modals/SlotModal";
import { CalendarComponent } from "../../shared/Calendar";
import { useTranslation } from "../../../contexts/TranslationContext";
import { showToast } from "../../../lib/toast";
import { useConfirm } from "../../../hooks/useConfirm";
import { Spinner } from "../../shared/Spinner";
import { SearchBar } from "../../shared/SearchBar";


export function AdminBirthdaySlots() {
    const { user } = useAuth();
    const { fetchSlots, createSlot, updateSlot, deleteSlot, fetchSlotsByDay, } = useSlots();
    const t = useTranslation('AdminBirthdaySlots');
    const locale = t.locale;
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const { confirm, ConfirmComponent } = useConfirm();

    const [slots, setSlots] = useState([] as Array<BirthdaySlot>);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailySlots, setDailySlots] = useState<BirthdaySlot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<BirthdaySlot | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingDaily, setIsLoadingDaily] = useState(false);
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState("");

    const openModal = (slot?: BirthdaySlot) => {
        console.log("slot", slot);
        setSelectedSlot(slot || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedSlot(null);
        setIsModalOpen(false);
    };

    // Fetch all slots
    useEffect(() => {
        if (!!user) {
            setIsLoading(true);
            fetchSlots().then((slots) => {
                setSlots(slots);
                setIsLoading(false);
            }).catch(() => {
                setIsLoading(false);
            });
        }
    }, [user]);

    // Filtrar slots por búsqueda
    const filteredSlots = useMemo(() => {
        if (!searchQuery.trim()) return slots;
        
        const query = searchQuery.toLowerCase().trim();
        return slots.filter(slot => {
            const slotId = slot.id.toString();
            const dateStr = format(new Date(slot.date), "dd/MM/yyyy", { locale: dateFnsLocale });
            const startTime = format(new Date(slot.startTime), "HH:mm");
            const endTime = format(new Date(slot.endTime), "HH:mm");
            const status = slot.status.toLowerCase();
            
            return slotId.includes(query) ||
                   dateStr.includes(query) ||
                   startTime.includes(query) ||
                   endTime.includes(query) ||
                   status.includes(query);
        });
    }, [slots, searchQuery, dateFnsLocale]);

    // Agrupar slots por semanas para la vista de lista
    const slotsByWeek = useMemo(() => {
        if (!filteredSlots || filteredSlots.length === 0 || selectedDate) return [];

        // Obtener todas las fechas únicas de los slots
        const uniqueDates = Array.from(
            new Set(filteredSlots.map(slot => {
                const date = new Date(slot.date);
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

        // Agrupar slots por semana
        const weeksData = weeks.map(weekStart => {
            const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
            const weekSlots = filteredSlots.filter(slot => {
                const slotDate = new Date(slot.date);
                slotDate.setHours(0, 0, 0, 0);
                return isWithinInterval(slotDate, { start: weekStart, end: weekEnd });
            });

            // Ordenar slots por fecha descendente (más recientes primero)
            const sortedSlots = weekSlots.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateB !== dateA) return dateB - dateA;
                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });

            return {
                weekStart,
                weekEnd,
                slots: sortedSlots,
                totalSlots: weekSlots.length,
                availableSlots: weekSlots.filter(s => s.status === 'OPEN').length,
            };
        }).filter(week => week.totalSlots > 0); // Solo semanas con slots

        // Ordenar por fecha descendente (más recientes primero)
        return weeksData.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
    }, [filteredSlots, selectedDate]);

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


    // Calcular días con slots para el calendario con información detallada
    const calendarData = useMemo(() => {
        if (!filteredSlots) return { bookedDays: [], dayStats: {} };

        const bookedDays: number[] = [];
        const dayStats: Record<number, { total: number; available: number; status: string }> = {};

        filteredSlots.forEach((slot) => {
            const d = new Date(slot.date);
            if (isNaN(d.getTime())) return;

            if (d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()) {
                const day = d.getDate();
                if (!bookedDays.includes(day)) {
                    bookedDays.push(day);
                }

                if (!dayStats[day]) {
                    dayStats[day] = { total: 0, available: 0, status: 'empty' };
                }

                dayStats[day].total++;
                if (slot.status === 'OPEN') {
                    dayStats[day].available++;
                }

                // Determinar estado del día
                if (dayStats[day].total > 0) {
                    if (dayStats[day].available === 0) {
                        dayStats[day].status = 'full';
                    } else if (dayStats[day].available === dayStats[day].total) {
                        dayStats[day].status = 'available';
                    } else {
                        dayStats[day].status = 'partial';
                    }
                }
            }
        });

        return { bookedDays, dayStats };
    }, [filteredSlots, currentMonth]);

    // Crear slot (optimista)
    const handleCreateSlot = async (data: Partial<BirthdaySlot>) => {
        if (!data.date || !data.startTime || !data.endTime) {
            showToast.error(t.t('fillRequired'));
            return;
        }

        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (end <= start) {
            showToast.error(t.t('endAfterStart'));
            return;
        }
        try {
            const newSlot = await createSlot(data);
            if (!newSlot) return;
            setSlots((prev) => [...prev, newSlot]);
            showToast.success(t.t('createSuccess'));
        } catch (err) {
            console.error("Error manejando la creación del slot", err);
            showToast.error(t.t('createError'));
        }

    };

    // Actualizar slot
    const handleUpdateSlot = async (id: number, data: Partial<BirthdaySlot>) => {
        // Guardar estado anterior para revertir si falla
        const previousSlots = [...slots];
        const previousDailySlots = selectedDate ? [...dailySlots] : null;
        const previousSelectedSlot = selectedSlot;

        // Actualización optimista
        setSlots((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...data } : s))
        );
        if (selectedDate) {
            setDailySlots((prev) =>
                prev.map((s) => (s.id === id ? { ...s, ...data } : s))
            );
        }
        if (selectedSlot?.id === id) {
            setSelectedSlot((prev) => (prev ? { ...prev, ...data } : prev));
        }

        try {
            const slotToUpdate = await updateSlot(id, data);
            if (!slotToUpdate) {
                // Revertir cambios si falla
                setSlots(previousSlots);
                if (previousDailySlots) {
                    setDailySlots(previousDailySlots);
                }
                if (previousSelectedSlot) {
                    setSelectedSlot(previousSelectedSlot);
                }
                return;
            }
            // Actualizar con los datos reales del servidor
            setSlots((prev) =>
                prev.map((s) => (s.id === id ? slotToUpdate : s))
            );
            if (selectedDate) {
                setDailySlots((prev) =>
                    prev.map((s) => (s.id === id ? slotToUpdate : s))
                );
            }
            if (selectedSlot?.id === id) {
                setSelectedSlot(slotToUpdate);
            }
            showToast.success(t.t('updateSuccess'));
        } catch (err) {
            // Revertir cambios si hay error
            setSlots(previousSlots);
            if (previousDailySlots) {
                setDailySlots(previousDailySlots);
            }
            if (previousSelectedSlot) {
                setSelectedSlot(previousSelectedSlot);
            }
            console.error("Error manejando la actualización del slot", err);
            showToast.error(t.t('updateError'));
        }
    };

    // Eliminar slot
    const handleDeleteSlot = async (id: number) => {
        const confirmed = await confirm({ message: t.t('confirmDelete'), variant: 'danger' });
        if (!confirmed) return;
        setSlots((prev) => prev.filter((s) => s.id !== id));
        if (selectedDate) {
            setDailySlots((prev) => prev.filter((s) => s.id !== id));
        }
        await deleteSlot(id);
        showToast.success(t.t('deleteSuccess'));
    };

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                    {t.t('title')}
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                    {t.t('subtitle')}
                </p>
            </div>

            {/* Controles superiores */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
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

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-green-600 flex-1 sm:flex-none min-w-[48px]"
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('newSlot')}</span>
                    </button>
                </div>
            </div>

            {/* Barra de búsqueda */}
            {viewMode === "list" && !selectedDate && (
                <SearchBar
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    total={filteredSlots.length}
                    resultsLabel={t.t('slot')}
                    resultsPluralLabel={t.t('slots')}
                    placeholder={t.t('searchSlots')}
                />
            )}


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
                                            setDailySlots([]);
                                        }}
                                        className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto min-w-[48px]"
                                    >
                                        {t.t('viewAllSlots')}
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        {t.t('slotsOf')} {format(selectedDate, locale === 'ca' ? "dd 'de' MMMM 'de' yyyy" : "dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                    </h3>
                                    {isLoadingDaily ? (
                                        <div className="py-8">
                                            <Spinner size="lg" text={t.t('loading')} />
                                        </div>
                                    ) : dailySlots.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">{t.t('noSlotsDay')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dailySlots.map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className="bg-gray-50 p-4 rounded-lg border"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                                            </p>
                                                            <p className="text-sm text-gray-600">{t.t('status')} {slot.status}</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => openModal(slot)}
                                                                className="p-2 text-yellow-600 hover:bg-yellow-100 rounded min-w-[48px] flex items-center justify-center"
                                                                title={t.t('edit')}
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded min-w-[48px] flex items-center justify-center"
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
                                <h2 className="text-xl sm:text-2xl font-semibold">{t.t('allSlots')}</h2>
                                <div className="text-xs sm:text-sm text-gray-500">
                                    {searchQuery ? filteredSlots.length : slots.length} {t.t('totalSlots')}
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg">
                                    <Spinner size="lg" text={t.t('loading')} />
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {t.t('noSlots')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {t.t('createFirst')}
                                    </p>
                                </div>
                            ) : searchQuery && slotsByWeek.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {t.t('noResults')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {t.t('tryDifferentSearch')}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {slotsByWeek.map((week) => {
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
                                                                {week.totalSlots} {t.t('slots')} • {week.availableSlots} {t.t('availableLabel')?.replace(':', '') || 'disponibles'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            week.availableSlots === 0 
                                                                ? 'bg-red-100 text-red-800'
                                                                : week.availableSlots === week.totalSlots
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {week.availableSlots === 0 
                                                                ? t.t('full')
                                                                : week.availableSlots === week.totalSlots
                                                                ? t.t('available')
                                                                : t.t('partial')
                                                            }
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Slots de la semana (expandible) */}
                                                {isExpanded && (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                        <div className="space-y-2">
                                                            {week.slots.map((slot) => (
                                                                <div
                                                                    key={slot.id}
                                                                    className="bg-white p-3 rounded-lg border flex justify-between items-center"
                                                                >
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        <div className="text-center min-w-[50px]">
                                                                            <div className="text-sm font-medium text-gray-600">
                                                                                {format(new Date(slot.date), "dd")}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">
                                                                                {format(new Date(slot.date), "MMM", { locale: dateFnsLocale })}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <p className="font-semibold text-gray-800">
                                                                                {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">
                                                                                {format(new Date(slot.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: dateFnsLocale })}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${slot.status === 'OPEN'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : 'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                {slot.status}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex gap-2 ml-2 sm:ml-4">
                                                                        <button
                                                                            onClick={() => openModal(slot)}
                                                                            disabled={slot.date < new Date().toISOString()}
                                                                            className="bg-yellow-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-yellow-600 transition-colors min-w-[48px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title={t.t('edit')}
                                                                        >
                                                                            <Edit3 className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSlot(slot.id)}
                                                                            className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-xl hover:bg-red-600 transition-colors min-w-[48px] flex items-center justify-center"
                                                                            title={t.t('delete')}
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
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

                    <SlotModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        slot={selectedSlot}
                        createSlot={handleCreateSlot}
                        updateSlot={handleUpdateSlot}
                    />
                </div>

                {/* Calendario mejorado */}
                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={Object.keys(calendarData.dayStats)
                            .map(Number)
                            .filter(day => {
                                const stats = calendarData.dayStats[day];
                                // Verde: disponible, Mixto: parcial (debe estar en ambos arrays)
                                return stats.status === 'available' || stats.status === 'partial';
                            })}
                        bookedDaysDB={Object.keys(calendarData.dayStats)
                            .map(Number)
                            .filter(day => {
                                const stats = calendarData.dayStats[day];
                                // Rojo: totalmente reservado, Mixto: parcial (debe estar en ambos arrays)
                                return stats.status === 'full' || stats.status === 'partial';
                            })}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        onSelectDate={async (date) => {
                            setViewMode("calendar");
                            setSelectedDate(date);
                            setIsLoadingDaily(true);
                            const data = await fetchSlotsByDay(date);
                            setDailySlots(data || []);
                            setIsLoadingDaily(false);
                        }}
                    />

                    {/* Estadísticas del mes */}
                    <div className="mt-4 bg-white rounded-xl shadow-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-3">{t.t('monthStats')}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('daysWithSlots')}</span>
                                <span className="font-medium">{calendarData.bookedDays.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('totalSlotsLabel')}</span>
                                <span className="font-medium">{searchQuery ? filteredSlots.length : slots.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('availableLabel')}</span>
                                <span className="font-medium text-green-600">
                                    {(searchQuery ? filteredSlots : slots).filter(s => s.status === 'OPEN').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {ConfirmComponent}
        </div>
    );
}
