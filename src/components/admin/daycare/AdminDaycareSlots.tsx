import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Calendar, Plus, Trash2, Edit3, CalendarDays, Clock, Settings, Filter, CheckSquare, Square, ChevronDown, ChevronRight } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { es, ca } from "date-fns/locale";
import { useAuth } from "../../../contexts/AuthContext";
import { useDaycareSlots } from "../../../contexts/DaycareSlotContext";
import { DaycareSlot } from "../../../types/auth";
import {SlotModal} from "../../modals/SlotModal";
import { CalendarComponent } from "../../shared/Calendar";
import { useTranslation } from "../../../contexts/TranslationContext";
import { showToast } from "../../../lib/toast";
import { useConfirm } from "../../../hooks/useConfirm";
import { Pagination } from "../../shared/Pagination";

export function AdminDaycareSlots() {
    const { user } = useAuth();
    const { fetchSlots, fetchSlotsByMonth, generateSlots, updateSlot, deleteSlot } = useDaycareSlots();
    const t = useTranslation('AdminDaycareSlots');
    const tCommon = useTranslation('Common');
    const locale = t.locale;
    const dateFnsLocale = locale === 'ca' ? ca : es;
    const { confirm, ConfirmComponent } = useConfirm();

    const [slots, setSlots] = useState([] as Array<DaycareSlot>);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<DaycareSlot | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("list");
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
    const [dateFilter, setDateFilter] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set()); // Track qué meses están cargados
    const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set()); // Track qué meses están expandidos
    const [loadingMonths, setLoadingMonths] = useState<Set<string>>(new Set()); // Track qué meses se están cargando
    const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set()); // Track qué semanas están expandidas
    const [weekPages, setWeekPages] = useState<Record<string, number>>({}); // Paginación por semana
    const ITEMS_PER_PAGE = 20;

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    const openModal = (slot?: DaycareSlot) => {
        setSelectedSlot(slot || undefined);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedSlot(undefined);
        setIsModalOpen(false);
    };

    // Función para cargar un mes específico
    const loadMonth = useCallback(async (year: number, month: number, isInitial = false) => {
        const monthKey = `${year}-${month}`;
        
        // Si ya está cargado, no hacer nada
        if (loadedMonths.has(monthKey)) return;
        
        // Marcar como cargando
        setLoadingMonths(prev => new Set(prev).add(monthKey));
        
        try {
            const monthSlots = await fetchSlotsByMonth(year, month);
            setSlots(prev => {
                // Combinar slots existentes con los nuevos, evitando duplicados
                const existingIds = new Set(prev.map(s => s.id));
                const newSlots = monthSlots.filter(s => !existingIds.has(s.id));
                return [...prev, ...newSlots];
            });
            setLoadedMonths(prev => new Set(prev).add(monthKey));
            if (isInitial) {
                setExpandedMonths(prev => new Set(prev).add(monthKey));
            }
        } catch (error) {
            console.error("Error cargando mes:", error);
        } finally {
            setLoadingMonths(prev => {
                const next = new Set(prev);
                next.delete(monthKey);
                return next;
            });
        }
    }, [fetchSlotsByMonth, loadedMonths]);

    // Cargar todos los slots al inicio (24 meses de rango)
    useEffect(() => {
        if (!!user) {
            const loadAllSlots = async () => {
                try {
                    // fetchSlots sin parámetros carga 12 meses atrás y 12 adelante automáticamente
                    const allSlots = await fetchSlots();
                    setSlots(allSlots);
                    
                    // Marcar todos los meses como cargados para evitar cargas redundantes
                    const uniqueMonths = new Set<string>();
                    allSlots.forEach(slot => {
                        const slotDate = new Date(slot.date);
                        const monthKey = `${slotDate.getFullYear()}-${slotDate.getMonth()}`;
                        uniqueMonths.add(monthKey);
                    });
                    setLoadedMonths(uniqueMonths);
                    
                    // Expandir el mes actual por defecto
                    const now = new Date();
                    const currentMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
                    setExpandedMonths(new Set([currentMonthKey]));
                } catch (error) {
                    console.error("Error cargando slots:", error);
                }
            };
            loadAllSlots();
        }
    }, [user, fetchSlots]);


    // Filtrar slots del día seleccionado desde todos los slots cargados
    const dailySlots = useMemo(() => {
        if (!selectedDate) return [];
        
        const filtered = slots.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate.getFullYear() === selectedDate.getFullYear() &&
                slotDate.getMonth() === selectedDate.getMonth() &&
                slotDate.getDate() === selectedDate.getDate();
        });
        
        // Ordenar por hora ascendente (09:00, 10:00, etc.)
        return filtered.sort((a, b) => {
            // openHour puede ser string o DateTime, convertir a Date para comparar
            const timeA = typeof a.openHour === 'string' ? new Date(a.openHour).getTime() : new Date(a.openHour).getTime();
            const timeB = typeof b.openHour === 'string' ? new Date(b.openHour).getTime() : new Date(b.openHour).getTime();
            return timeA - timeB;
        });
    }, [slots, selectedDate]);

    // Filtrar slots por fechas si hay filtro activo
    const filteredSlots = useMemo(() => {
        if (!dateFilter.start || !dateFilter.end) return slots;

        return slots.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate >= dateFilter.start! && slotDate <= dateFilter.end!;
        });
    }, [slots, dateFilter]);

    // Aplicar filtro de fechas también a los slots diarios si hay filtro activo
    const filteredDailySlots = useMemo(() => {
        if (!dateFilter.start || !dateFilter.end) return dailySlots;

        return dailySlots.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate >= dateFilter.start! && slotDate <= dateFilter.end!;
        });
    }, [dailySlots, dateFilter]);

    const slotsToShow = selectedDate ? (filteredDailySlots || []) : (filteredSlots || []);

    // Agrupar slots por mes y luego por semanas dentro de cada mes
    const slotsByMonth = useMemo(() => {
        // Si hay una fecha seleccionada, no mostrar agrupación por meses
        if (selectedDate) return [];

        // Siempre mostrar al menos el mes actual y algunos meses anteriores
        const now = new Date();
        const months: Date[] = [];
        
        // Mostrar los últimos 12 meses (mes actual + 11 anteriores)
        for (let i = 0; i < 12; i++) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(monthDate);
        }
        
        // Si hay slots, añadir también los meses que contienen esos slots
        if (slotsToShow.length > 0) {
            const uniqueDates = Array.from(
                new Set(slotsToShow.map(slot => {
                    const date = new Date(slot.date);
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

        // Agrupar slots por mes y luego por semanas
        const monthsData = months.map(monthStart => {
            const monthEnd = endOfMonth(monthStart);
            const monthSlots = slotsToShow.filter(slot => {
                const slotDate = new Date(slot.date);
                slotDate.setHours(0, 0, 0, 0);
                return slotDate >= startOfMonth(monthStart) && slotDate <= monthEnd;
            });

            // Obtener todas las semanas en el mes
            const weeks = eachWeekOfInterval(
                { start: startOfMonth(monthStart), end: monthEnd },
                { weekStartsOn: 1 } // Lunes
            );

            // Agrupar slots por semana dentro del mes
            const weeksData = weeks.map(weekStart => {
                const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                const weekSlots = monthSlots.filter(slot => {
                    const slotDate = new Date(slot.date);
                    slotDate.setHours(0, 0, 0, 0);
                    return isWithinInterval(slotDate, { start: weekStart, end: weekEnd });
                });

                // Ordenar slots por fecha ascendente y luego por hora ascendente
                const sortedSlots = weekSlots.sort((a, b) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (dateA !== dateB) {
                        return dateA - dateB; // Fecha ascendente
                    }
                    // Si es la misma fecha, ordenar por hora ascendente
                    const timeA = typeof a.openHour === 'string' ? new Date(a.openHour).getTime() : new Date(a.openHour).getTime();
                    const timeB = typeof b.openHour === 'string' ? new Date(b.openHour).getTime() : new Date(b.openHour).getTime();
                    return timeA - timeB;
                });

                return {
                    weekStart,
                    weekEnd,
                    slots: sortedSlots,
                    totalSlots: weekSlots.length,
                    availableSlots: weekSlots.filter(s => s.status === 'OPEN').length,
                    totalCapacity: weekSlots.reduce((acc, s) => acc + s.capacity, 0),
                    availableCapacity: weekSlots.reduce((acc, s) => acc + s.availableSpots, 0)
                };
            }).filter(week => week.totalSlots > 0); // Solo semanas con slots

            // Ordenar semanas por fecha ascendente
            weeksData.sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

            const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
            return {
                monthStart,
                monthEnd,
                monthKey,
                weeks: weeksData,
                totalSlots: monthSlots.length,
                availableSlots: monthSlots.filter(s => s.status === 'OPEN').length,
                totalCapacity: monthSlots.reduce((acc, s) => acc + s.capacity, 0),
                availableCapacity: monthSlots.reduce((acc, s) => acc + s.availableSpots, 0),
                isLoaded: loadedMonths.has(monthKey),
                isLoading: loadingMonths.has(monthKey)
            };
        }); // Mostrar todos los meses, incluso sin slots

        // Ordenar por fecha descendente (más recientes primero)
        return monthsData.sort((a, b) => b.monthStart.getTime() - a.monthStart.getTime());
    }, [slotsToShow, selectedDate, loadedMonths, loadingMonths]);

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

    // Función para expandir/colapsar una semana
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

    const getPaginatedSlots = (slots: DaycareSlot[], weekKey: string) => {
        const page = getWeekPage(weekKey);
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return slots.slice(startIndex, endIndex);
    };

    const getTotalPages = (slots: DaycareSlot[]) => {
        return Math.ceil(slots.length / ITEMS_PER_PAGE);
    };

    // Calcular días con slots para el calendario con información detallada
    const calendarData = useMemo(() => {
        // Usar slots filtrados si hay filtro activo, sino usar todos los slots
        const slotsToUse = (dateFilter.start && dateFilter.end) ? filteredSlots : slots;

        if (!slotsToUse) return { bookedDays: [], dayStats: {} };

        const bookedDays: number[] = [];
        const dayStats: Record<number, { total: number; available: number; status: string }> = {};

        // Primero, contar slots por día
        slotsToUse.forEach((slot) => {
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
            }
        });

        // Luego, determinar el estado de cada día basándose en reservas y disponibilidad
        Object.keys(dayStats).forEach(dayStr => {
            const day = Number(dayStr);
            const daySlots = slotsToUse.filter(s => {
                const slotDate = new Date(s.date);
                return slotDate.getDate() === day &&
                       slotDate.getMonth() === currentMonth.getMonth() &&
                       slotDate.getFullYear() === currentMonth.getFullYear();
            });

            // Contar slots con reservas (availableSpots < capacity significa que hay reservas)
            const slotsWithBookings = daySlots.filter(s => s.availableSpots < s.capacity).length;
            
            // Contar slots completamente disponibles (sin reservas, completamente libres)
            const slotsFullyAvailable = daySlots.filter(s => 
                s.status === 'OPEN' && s.availableSpots === s.capacity
            ).length;
            
            // Contar slots totalmente reservados (sin disponibilidad)
            const slotsFullyBooked = daySlots.filter(s => 
                s.availableSpots === 0
            ).length;

            // Determinar estado del día
            if (slotsWithBookings === 0 && slotsFullyAvailable === dayStats[day].total) {
                // Todos los slots están completamente disponibles (sin reservas) → verde
                dayStats[day].status = 'available';
            } else if (slotsFullyBooked === dayStats[day].total) {
                // Todos los slots están totalmente reservados → rojo
                dayStats[day].status = 'full';
            } else {
                // Hay mezcla: algunos con reservas, algunos disponibles, o slots parcialmente reservados → parcial
                dayStats[day].status = 'partial';
            }
        });

        return { bookedDays, dayStats };
    }, [slots, filteredSlots, currentMonth, dateFilter]);

    // Crear slot
    const handleCreateSlot = async (data: Partial<DaycareSlot> & { openHour?: string; closeHour?: string; customDates?: string[] }) => {
        if (!data.date || data.openHour === undefined || data.closeHour === undefined || !data.capacity) {
            showToast.error(t.t('fillRequired'));
            return;
        }

        try {
            // Convertir la fecha al formato YYYY-MM-DD usando hora local
            const d = new Date(data.date);
            const startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            await generateSlots({
                startDate: startDate,
                openHour: data.openHour,
                closeHour: data.closeHour,
                capacity: data.capacity,
                customDates: data.customDates,
            });

            // Recargar todos los slots en lugar de solo los del día
            const updatedSlots = await fetchSlots();
            setSlots(updatedSlots || []);
            showToast.success(t.t('createSuccess'));
        } catch (err) {
            console.error("❌ Error creando slot:", err);
            showToast.error(t.t('createError'));
        }
    };

    // Actualizar slot
    const handleUpdateSlot = async (id: number, data: Partial<DaycareSlot>) => {
        try {
            const updatedSlot = await updateSlot(id, data);

            // Actualizar estados locales con el slot actualizado del backend
            if (updatedSlot) {
                setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedSlot } : s)));
                if (selectedSlot?.id === id) setSelectedSlot(updatedSlot);
            }

            showToast.success(t.t('updateSuccess'));
        } catch (error) {
            console.error("❌ Error actualizando slot:", error);
            showToast.error(t.t('updateError'));
        }
    };

    // Eliminar slot
    const handleDeleteSlot = async (id: number) => {
        const confirmed = await confirm({ message: t.t('confirmDelete'), variant: 'danger' });
        if (!confirmed) return;
        await deleteSlot(id);
        setSlots((prev) => prev.filter((s) => s.id !== id));

        // Remover de selección si estaba seleccionado
        setSelectedSlots(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        showToast.success(t.t('deleteSuccess'));
    };

    // Eliminar múltiples slots
    const handleDeleteMultipleSlots = async () => {
        if (selectedSlots.size === 0) {
            showToast.error(t.t('selectAtLeastOne'));
            return;
        }

        const confirmed = await confirm({ 
            message: `${t.t('confirmDeleteMultiple')} ${selectedSlots.size} ${t.t('slotsQ')}`,
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            const deletePromises = Array.from(selectedSlots).map(id => deleteSlot(id));
            await Promise.all(deletePromises);

            const deletedCount = selectedSlots.size;
            setSlots((prev) => prev.filter((s) => !selectedSlots.has(s.id)));
            setSelectedSlots(new Set());
            showToast.success(`${deletedCount} ${t.t('deleteMultipleSuccess')}`);

            // Refrescar slots para actualizar el calendario
            const updatedSlots = await fetchSlots();
            setSlots(updatedSlots);
        } catch (error) {
            console.error("Error eliminando slots:", error);
            showToast.error(t.t('deleteError'));
        }
    };

    // Seleccionar/deseleccionar slot
    const toggleSlotSelection = (id: number) => {
        setSelectedSlots(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Seleccionar todos los slots visibles
    const selectAllSlots = () => {
        const allIds = slotsToShow.map(slot => slot.id);
        setSelectedSlots(new Set(allIds));
    };

    // Deseleccionar todos
    const deselectAllSlots = () => {
        setSelectedSlots(new Set());
    };

    // Limpiar selección cuando se cierra el panel de acciones masivas
    useEffect(() => {
        if (!showBulkActions) {
            setSelectedSlots(new Set());
        }
    }, [showBulkActions]);

    // Generar slots para rango de fechas
    const handleGenerateSlotsForRange = async (openHour: string, closeHour: string, capacity: number) => {
        if (!dateFilter.start || !dateFilter.end) {
            showToast.error(t.t('selectDateRange'));
            return;
        }

        try {
            // Usar la fecha de inicio del filtro para generar 2 semanas
            const startDate = new Date(dateFilter.start).toISOString().split('T')[0];

            await generateSlots({
                startDate: startDate,
                openHour,
                closeHour,
                capacity
            });

            // Refrescar slots
            const updatedSlots = await fetchSlots();
            setSlots(updatedSlots);
            showToast.success(t.t('generateSuccess'));
        } catch (error) {
            console.error("Error generando slots:", error);
            showToast.error(t.t('generateError'));
        }
    };

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">{t.t('title')}</h1>
                <p className="text-sm sm:text-base text-gray-600">{t.t('subtitle')}</p>
            </div>

            {/* Controles superiores */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => {
                            setViewMode("calendar");
                            if (viewMode === "list") {
                                setSelectedDate(undefined);
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

                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center justify-center gap-2 bg-purple-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-purple-600 flex-1 sm:flex-none min-w-[48px]"
                    >
                        <Filter className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('filterDates')}</span>
                    </button>
                    <button
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="flex items-center justify-center gap-2 bg-orange-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-orange-600 flex-1 sm:flex-none min-w-[48px]"
                    >
                        <Settings className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('bulkActions')}</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center justify-center gap-2 bg-green-500 text-white px-3 sm:px-4 py-2 rounded-xl hover:bg-green-600 flex-1 sm:flex-none min-w-[48px]"
                    >
                        <Plus className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('generateSlots')}</span>
                    </button>
                </div>
            </div>

            {/* Filtro de fechas */}
            {showDateFilter && (
                <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-3">{t.t('filterByDates')}</h3>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-none">
                            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">{t.t('from')}</label>
                            <input
                                type="date"
                                value={dateFilter.start ? dateFilter.start.toISOString().split('T')[0] : ''}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                                className="px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 sm:flex-none">
                            <label className="text-xs sm:text-sm font-medium whitespace-nowrap">{t.t('to')}</label>
                            <input
                                type="date"
                                value={dateFilter.end ? dateFilter.end.toISOString().split('T')[0] : ''}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                                className="px-3 py-1.5 sm:py-1 border border-gray-300 rounded-lg text-sm w-full sm:w-auto"
                            />
                        </div>
                        <button
                            onClick={() => setDateFilter({ start: null, end: null })}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600 w-full sm:w-auto min-w-[48px]"
                        >
                            {t.t('clearFilter')}
                        </button>
                    </div>
                </div>
            )}

            {/* Acciones masivas */}
            {showBulkActions && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-3 sm:p-4">
                    <h3 className="text-base sm:text-lg font-semibold text-orange-800 mb-3">{t.t('bulkActions')}</h3>
                    <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 items-start sm:items-center">
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={selectAllSlots}
                                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-sm hover:bg-blue-600 flex-1 sm:flex-none min-w-[48px]"
                            >
                                <CheckSquare className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{t.t('selectAll')}</span>
                            </button>
                            <button
                                onClick={deselectAllSlots}
                                className="flex items-center justify-center gap-2 bg-gray-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-sm hover:bg-gray-600 flex-1 sm:flex-none min-w-[48px]"
                            >
                                <Square className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{t.t('deselect')}</span>
                            </button>
                        </div>
                        <div className="text-sm text-gray-600 w-full sm:w-auto">
                            {selectedSlots.size} {t.t('selected')}
                        </div>
                        {selectedSlots.size > 0 && (
                            <button
                                onClick={handleDeleteMultipleSlots}
                                className="flex items-center justify-center gap-2 bg-red-500 text-white px-3 py-1.5 sm:py-1 rounded-lg text-sm hover:bg-red-600 w-full sm:w-auto min-w-[48px]"
                            >
                                <Trash2 className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{t.t('deleteSelected')} ({selectedSlots.size})</span>
                                <span className="sm:hidden">{t.t('deleteSelected')}</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

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
                                        }}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        {t.t('viewAllSlots')}
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        {t.t('slotsOf')} {format(selectedDate, "dd/MM/yyyy")}
                                    </h3>
                                    {dailySlots.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">{t.t('noSlotsDay')}</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {dailySlots.map((slot) => (
                                                <div
                                                    key={slot.id}
                                                    className={`bg-gray-50 p-4 rounded-lg border ${selectedSlots.has(slot.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-start gap-3">
                                                            {showBulkActions && (
                                                                <button
                                                                    onClick={() => toggleSlotSelection(slot.id)}
                                                                    className="text-blue-500 hover:text-blue-700 mt-1"
                                                                >
                                                                    {selectedSlots.has(slot.id) ? (
                                                                        <CheckSquare className="w-5 h-5" />
                                                                    ) : (
                                                                        <Square className="w-5 h-5" />
                                                                    )}
                                                                </button>
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-gray-800">
                                                                    {slot.openHour} - {slot.closeHour}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {t.t('spots')}: {slot.availableSpots}/{slot.capacity}
                                                                </p>
                                                                <p className="text-sm text-gray-600">{t.t('status')}: {slot.status === 'OPEN' ? t.t('statusOpen') : t.t('statusClosed')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => openModal(slot)}
                                                                disabled={slot.date < new Date().toISOString()}
                                                                className="p-1 text-yellow-600 hover:bg-yellow-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSlot(slot.id)}
                                                                className="p-1 text-red-600 hover:bg-red-100 rounded"
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
                                <h2 className="text-2xl font-semibold">{t.t('allSlots')}</h2>
                                <div className="text-sm text-gray-500">
                                    {slotsToShow.length} {t.t('slots')} {dateFilter.start && dateFilter.end ? t.t('filtered') : t.t('total')}
                                </div>
                            </div>

                            {slotsToShow.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {dateFilter.start && dateFilter.end ? t.t('noSlotsInRange') : t.t('noSlots')}
                                    </h3>
                                    <p className="text-gray-500">
                                        {dateFilter.start && dateFilter.end ? t.t('tryAnotherRange') : t.t('createFirst')}
                                    </p>
                                </div>
                            ) : selectedDate ? (
                                <div className="space-y-3">
                                    {slotsToShow.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`bg-white p-4 rounded-xl shadow flex justify-between items-center ${selectedSlots.has(slot.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {showBulkActions && (
                                                    <button
                                                        onClick={() => toggleSlotSelection(slot.id)}
                                                        className="text-blue-500 hover:text-blue-700"
                                                    >
                                                        {selectedSlots.has(slot.id) ? (
                                                            <CheckSquare className="w-5 h-5" />
                                                        ) : (
                                                            <Square className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                )}
                                                <div className="text-center">
                                                    <div className="text-sm font-medium text-gray-600">
                                                        {format(new Date(slot.date), "dd")}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(slot.date), "MMM", { locale: dateFnsLocale })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {slot.openHour} - {slot.closeHour}
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
                                                        {slot.status === 'OPEN' ? t.t('statusOpen') : t.t('statusClosed')}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {slot.availableSpots}/{slot.capacity} {t.t('spots')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(slot)}
                                                    disabled={slot.date < new Date().toISOString()}
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteSlot(slot.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {slotsByMonth.map((month) => {
                                        const isExpanded = expandedMonths.has(month.monthKey);

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
                                                            {isExpanded ? (
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
                                                                {month.totalSlots} {t.t('slots')} • {month.availableSlots} {t.t('available')} • {month.availableCapacity}/{month.totalCapacity} {t.t('spots')}
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
                                                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                            month.availableSlots === 0 
                                                                ? 'bg-red-100 text-red-800'
                                                                : month.availableSlots === month.totalSlots
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {month.availableSlots === 0 
                                                                ? t.t('full')
                                                                : month.availableSlots === month.totalSlots
                                                                ? t.t('available')
                                                                : t.t('partial')
                                                            }
                                                        </div>
                                                    </div>
                                                </button>

                                                {/* Semanas del mes (expandible) */}
                                                {isExpanded && month.isLoaded && (
                                                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                                                        {month.weeks.length === 0 ? (
                                                            <div className="text-center py-8">
                                                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                                <p className="text-gray-500">{t.t('noSlotsMonth')}</p>
                                                            </div>
                                                        ) : (
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
                                                                                        {week.totalSlots} {t.t('slots')} • {week.availableSlots} {t.t('available')} • {week.availableCapacity}/{week.totalCapacity} {t.t('spots')}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                                                                        {isWeekExpanded && (() => {
                                                                            const paginatedSlots = getPaginatedSlots(week.slots, weekKey);
                                                                            const totalPages = getTotalPages(week.slots);
                                                                            const currentPage = getWeekPage(weekKey);

                                                                            return (
                                                                                <div className="border-t border-gray-200 bg-gray-50 p-3">
                                                                                    <div className="space-y-2 mb-4">
                                                                                        {paginatedSlots.map((slot) => (
                                                            <div
                                                                key={slot.id}
                                                                className={`bg-white p-3 rounded-lg border flex justify-between items-center ${selectedSlots.has(slot.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                                                    }`}
                                                            >
                                                                <div className="flex items-center gap-4 flex-1">
                                                                    {showBulkActions && (
                                                                        <button
                                                                            onClick={() => toggleSlotSelection(slot.id)}
                                                                            className="text-blue-500 hover:text-blue-700"
                                                                        >
                                                                            {selectedSlots.has(slot.id) ? (
                                                                                <CheckSquare className="w-5 h-5" />
                                                                            ) : (
                                                                                <Square className="w-5 h-5" />
                                                                            )}
                                                                        </button>
                                                                    )}
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
                                                                            {slot.openHour} - {slot.closeHour}
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
                                                                            {slot.status === 'OPEN' ? t.t('statusOpen') : t.t('statusClosed')}
                                                                        </div>
                                                                        <div className="text-sm text-gray-600">
                                                                            {slot.availableSpots}/{slot.capacity} {t.t('spots')}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2 ml-4">
                                                                    <button
                                                                        onClick={() => openModal(slot)}
                                                                        disabled={slot.date < new Date().toISOString()}
                                                                        className="bg-yellow-500 text-white px-3 py-1 rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                        title={t.t('edit')}
                                                                    >
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                                        className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 transition-colors"
                                                                        title={t.t('delete')}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                                                        ))}
                                                                                    </div>

                                                                                    {/* Paginación */}
                                                                                    {totalPages > 1 && (
                                                                                        <div className="pt-3 border-t border-gray-300">
                                                                                            <div className="text-sm text-gray-600 mb-2 text-center">
                                                                                                {t.t('showing')} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, week.slots.length)} {t.t('of')} {week.slots.length}
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

                    <SlotModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        slot={selectedSlot}
                        createSlot={handleCreateSlot}
                        updateSlot={handleUpdateSlot}
                        isDaycare={true}
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
                        onSelectDate={(date) => {
                            setSelectedDate(date);
                            // dailySlots se calcula automáticamente con useMemo
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
                                <span className="text-gray-600">{t.t('totalSlots')}</span>
                                <span className="font-medium">{slotsToShow.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('available')}</span>
                                <span className="font-medium text-green-600">
                                    {slotsToShow.filter(s => s.status === 'OPEN').length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t.t('totalSpots')}</span>
                                <span className="font-medium">
                                    {slotsToShow.reduce((acc, s) => acc + s.capacity, 0)}
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
