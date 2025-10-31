import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3, CalendarDays, Clock, Settings, Filter, CheckSquare, Square } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../contexts/AuthContext";
import { useDaycareSlots } from "../../contexts/DaycareSlotContext";
import { DaycareSlot } from "../../types/auth";
import {SlotModal} from "../modals/SlotModal";
import { CalendarComponent } from "../shared/Calendar";
import { useTranslation } from "../../contexts/TranslationContext";

export function AdminDaycareSlots() {
    const { user } = useAuth();
    const { fetchSlots, generateSlots, updateSlot, deleteSlot } = useDaycareSlots();
    const t = useTranslation('AdminDaycareSlots');
    const locale = t.locale;

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

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    const openModal = (slot?: DaycareSlot) => {
        setSelectedSlot(slot || undefined);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedSlot(undefined);
        setIsModalOpen(false);
    };

    // Fetch all slots - UNA SOLA PETICIÓN
    useEffect(() => {
        if (!!user) {
            fetchSlots().then(
                (slots) => {
                    console.log("🔵 Slots cargados al inicio:", slots);
                    setSlots(slots || []);
                },
            );
        }
    }, [user]);

    // Filtrar slots del día seleccionado desde todos los slots cargados
    const dailySlots = useMemo(() => {
        if (!selectedDate) return [];
        
        return slots.filter(slot => {
            const slotDate = new Date(slot.date);
            return slotDate.getFullYear() === selectedDate.getFullYear() &&
                slotDate.getMonth() === selectedDate.getMonth() &&
                slotDate.getDate() === selectedDate.getDate();
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


    // Calcular días con slots para el calendario con información detallada
    const calendarData = useMemo(() => {
        // Usar slots filtrados si hay filtro activo, sino usar todos los slots
        const slotsToUse = (dateFilter.start && dateFilter.end) ? filteredSlots : slots;

        if (!slotsToUse) return { bookedDays: [], dayStats: {} };

        const bookedDays: number[] = [];
        const dayStats: Record<number, { total: number; available: number; status: string }> = {};

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
    }, [slots, filteredSlots, currentMonth, dateFilter]);

    // Crear slot
    const handleCreateSlot = async (data: Partial<DaycareSlot> & { openHour?: string; closeHour?: string }) => {
        console.log("🟢 DATA EN HANDLECREATESLOT:", data);

        if (!data.date || data.openHour === undefined || data.closeHour === undefined || !data.capacity) {
            alert(t.t('fillRequired'));
            return;
        }

        try {
            // Convertir la fecha al formato YYYY-MM-DD
            const startDate = new Date(data.date).toISOString().split('T')[0];

            await generateSlots({
                startDate: startDate,
                openHour: data.openHour,
                closeHour: data.closeHour,
                capacity: data.capacity,
            });

            // Recargar todos los slots en lugar de solo los del día
            const updatedSlots = await fetchSlots();
            setSlots(updatedSlots || []);
            alert(t.t('createSuccess'));
        } catch (err) {
            console.error("❌ Error creando slot:", err);
        }
    };

    // Actualizar slot
    const handleUpdateSlot = async (id: number, data: Partial<DaycareSlot>) => {
        try {
            console.log("🔄 Actualizando slot:", id, data);
            const updatedSlot = await updateSlot(id, data);

            // Actualizar estados locales con el slot actualizado del backend
            if (updatedSlot) {
                setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...updatedSlot } : s)));
                if (selectedSlot?.id === id) setSelectedSlot(updatedSlot);
            }

            alert(t.t('updateSuccess'));
        } catch (error) {
            console.error("❌ Error actualizando slot:", error);
            alert(t.t('updateError'));
        }
    };

    // Eliminar slot
    const handleDeleteSlot = async (id: number) => {
        if (!window.confirm(t.t('confirmDelete'))) return;
        await deleteSlot(id);
        setSlots((prev) => prev.filter((s) => s.id !== id));

        // Remover de selección si estaba seleccionado
        setSelectedSlots(prev => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
        });

        alert(t.t('deleteSuccess'));
    };

    // Eliminar múltiples slots
    const handleDeleteMultipleSlots = async () => {
        if (selectedSlots.size === 0) {
            alert(t.t('selectAtLeastOne'));
            return;
        }

        if (!window.confirm(`${t.t('confirmDeleteMultiple')} ${selectedSlots.size} ${t.t('slotsQ')}`)) return;

        try {
            const deletePromises = Array.from(selectedSlots).map(id => deleteSlot(id));
            await Promise.all(deletePromises);

            setSlots((prev) => prev.filter((s) => !selectedSlots.has(s.id)));
            setSelectedSlots(new Set());
            alert(`${selectedSlots.size} ${t.t('deleteMultipleSuccess')}`);

            // Refrescar slots para actualizar el calendario
            const updatedSlots = await fetchSlots();
            setSlots(updatedSlots);
        } catch (error) {
            console.error("Error eliminando slots:", error);
            alert(t.t('deleteError'));
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
            alert(t.t('selectDateRange'));
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
            alert(t.t('generateSuccess'));
        } catch (error) {
            console.error("Error generando slots:", error);
            alert(t.t('generateError'));
        }
    };

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">{t.t('title')}</h1>
                <p className="text-gray-600">{t.t('subtitle')}</p>
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
                        {t.t('calendarView')}
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${viewMode === "list"
                                ? "bg-blue-500 text-white"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        {t.t('listView')}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDateFilter(!showDateFilter)}
                        className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600"
                    >
                        <Filter className="w-4 h-4" />
                        {t.t('filterDates')}
                    </button>
                    <button
                        onClick={() => setShowBulkActions(!showBulkActions)}
                        className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600"
                    >
                        <Settings className="w-4 h-4" />
                        {t.t('bulkActions')}
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
                    >
                        <Plus className="w-4 h-4" />
                        {t.t('generateSlots')}
                    </button>
                </div>
            </div>

            {/* Filtro de fechas */}
            {showDateFilter && (
                <div className="mb-6 bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-purple-800 mb-3">{t.t('filterByDates')}</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">{t.t('from')}</label>
                            <input
                                type="date"
                                value={dateFilter.start ? dateFilter.start.toISOString().split('T')[0] : ''}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium">{t.t('to')}</label>
                            <input
                                type="date"
                                value={dateFilter.end ? dateFilter.end.toISOString().split('T')[0] : ''}
                                onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setDateFilter({ start: null, end: null })}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-600"
                        >
                            {t.t('clearFilter')}
                        </button>
                    </div>
                </div>
            )}

            {/* Acciones masivas */}
            {showBulkActions && (
                <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <h3 className="text-lg font-semibold text-orange-800 mb-3">{t.t('bulkActions')}</h3>
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex gap-2">
                            <button
                                onClick={selectAllSlots}
                                className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600"
                            >
                                <CheckSquare className="w-4 h-4" />
                                {t.t('selectAll')}
                            </button>
                            <button
                                onClick={deselectAllSlots}
                                className="flex items-center gap-2 bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600"
                            >
                                <Square className="w-4 h-4" />
                                {t.t('deselect')}
                            </button>
                        </div>
                        <div className="text-sm text-gray-600">
                            {selectedSlots.size} {t.t('selected')}
                        </div>
                        {selectedSlots.size > 0 && (
                            <button
                                onClick={handleDeleteMultipleSlots}
                                className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
                            >
                                <Trash2 className="w-4 h-4" />
                                {t.t('deleteSelected')} ({selectedSlots.size})
                            </button>
                        )}
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
                                        }}
                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                                    >
                                        Ver todos los slots
                                    </button>
                                )}
                            </div>

                            {selectedDate ? (
                                <div className="bg-white rounded-xl shadow-lg p-6">
                                    <h3 className="text-xl font-semibold mb-4">
                                        Slots del {format(selectedDate, "dd/MM/yyyy")}
                                    </h3>
                                    {dailySlots.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500">No hay slots para este día</p>
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
                                                                    Plazas: {slot.availableSpots}/{slot.capacity}
                                                                </p>
                                                                <p className="text-sm text-gray-600">Estado: {slot.status}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => openModal(slot)}
                                                                className="p-1 text-yellow-600 hover:bg-yellow-100 rounded"
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
                                        Selecciona un día del calendario
                                    </h3>
                                    <p className="text-gray-500">
                                        Haz clic en cualquier día para ver sus slots
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-semibold">Todos los Slots</h2>
                                <div className="text-sm text-gray-500">
                                    {slotsToShow.length} slots {dateFilter.start && dateFilter.end ? 'filtrados' : 'totales'}
                                </div>
                            </div>

                            {slotsToShow.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        {dateFilter.start && dateFilter.end ? "No hay slots en el rango seleccionado" : "No hay slots"}
                                    </h3>
                                    <p className="text-gray-500">
                                        {dateFilter.start && dateFilter.end ? "Prueba con otro rango de fechas" : "Genera tu primer slot para comenzar"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {slotsToShow.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className={`bg-white p-4 rounded-xl shadow flex justify-between items-center ${selectedSlots.has(slot.id) ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                {viewMode === "list" && (
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
                                                        {format(new Date(slot.date), "MMM")}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {slot.openHour} - {slot.closeHour}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(slot.date).toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${slot.status === 'OPEN'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {slot.status}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        {slot.availableSpots}/{slot.capacity} plazas
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => openModal(slot)}
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded-xl hover:bg-yellow-600"
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
                        availableDaysDB={Array.from({ length: daysInMonth }, (_, i) => i + 1).filter(
                            (d) => !calendarData.bookedDays.includes(d)
                        )}
                        bookedDaysDB={calendarData.bookedDays}
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
                        <h4 className="font-semibold text-gray-800 mb-3">Estadísticas del Mes</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Días con slots:</span>
                                <span className="font-medium">{calendarData.bookedDays.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total slots:</span>
                                <span className="font-medium">{slotsToShow.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponibles:</span>
                                <span className="font-medium text-green-600">
                                    {slotsToShow.filter(s => s.status === 'OPEN').length}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Plazas totales:</span>
                                <span className="font-medium">
                                    {slotsToShow.reduce((acc, s) => acc + s.capacity, 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
