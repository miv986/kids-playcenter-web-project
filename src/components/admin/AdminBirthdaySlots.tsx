import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3, CalendarDays, Clock } from "lucide-react";
import { BirthdaySlot } from "../../types/auth";
import { useAuth } from "../../contexts/AuthContext";
import { useSlots } from "../../contexts/SlotContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SlotModal } from "../modals/SlotModal";
import { CalendarComponent } from "../shared/Calendar";


export function AdminBirthdaySlots() {
    const { user } = useAuth();
    const { fetchSlots, createSlot, updateSlot, deleteSlot, fetchSlotsByDay, } = useSlots();

    const [slots, setSlots] = useState([] as Array<BirthdaySlot>);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailySlots, setDailySlots] = useState<BirthdaySlot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<BirthdaySlot | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

    console.log("CURRENT MONTH", currentMonth);

    const openModal = (slot?: BirthdaySlot) => {
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
            fetchSlots().then((slots) => setSlots(slots));
        }
    }, [user]);

    const slotsLength = slots.length;

    console.log(slotsLength);

    // Filtrado de slots por día
    const slotsToShow = selectedDate ? (dailySlots || []) : (slots || []);


    // Calcular días con slots para el calendario con información detallada
    const calendarData = useMemo(() => {
        if (!slots) return { bookedDays: [], dayStats: {} };

        const bookedDays: number[] = [];
        const dayStats: Record<number, { total: number; available: number; status: string }> = {};

        slots.forEach((slot) => {
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
    }, [slots, currentMonth]);

    // Crear slot (optimista)
    const handleCreateSlot = async (data: Partial<BirthdaySlot>) => {
        if (!data.date || !data.startTime || !data.endTime) {
            alert("Debes rellenar fecha, hora de inicio y hora de fin");
            return;
        }

        const start = new Date(data.startTime);
        const end = new Date(data.endTime);

        if (end <= start) {
            alert("La hora de fin debe ser posterior a la de inicio");
            return;
        }
        try {
            const newSlot = await createSlot(data);
            if (!newSlot) return;
            setSlots((prev) => [...prev, newSlot]);
            alert("Slot creado correctamente");
        } catch (err) {
            console.error("Error manejando la creación del slot", err);
        }

    };

    // Actualizar slot (optimista)
    const handleUpdateSlot = async (id: number, data: Partial<BirthdaySlot>) => {
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
        const slotToUpdate = await updateSlot(id, data);
        if (!slotToUpdate) return;
        alert("Slot actualizado correctamente");
    };

    // Eliminar slot
    const handleDeleteSlot = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres eliminar este slot?")) return;
        setSlots((prev) => prev.filter((s) => s.id !== id));
        if (selectedDate) {
            setDailySlots((prev) => prev.filter((s) => s.id !== id));
        }
        await deleteSlot(id);
        alert("Slot eliminado");
    };

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">
                    Panel de Slots
                </h1>
                <p className="text-gray-600">
                    Gestiona los slots disponibles para reservas de cumpleaños
                </p>
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
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Slot
                    </button>
                </div>
            </div>


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
                                            setDailySlots([]);
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
                                        Slots del {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
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
                                                    className="bg-gray-50 p-4 rounded-lg border"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <p className="font-semibold text-gray-800">
                                                                {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                                            </p>
                                                            <p className="text-sm text-gray-600">Estado: {slot.status}</p>
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
                                    {slots.length} slots totales
                                </div>
                            </div>

                            {slots.length === 0 ? (
                                <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                        No hay slots
                                    </h3>
                                    <p className="text-gray-500">
                                        Crea tu primer slot para comenzar
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {slots.map((slot) => (
                                        <div
                                            key={slot.id}
                                            className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className="text-sm font-medium text-gray-600">
                                                        {format(new Date(slot.date), "dd")}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {format(new Date(slot.date), "MMM", { locale: es })}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-800">
                                                        {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {format(new Date(slot.date), "EEEE, dd/MM/yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                                <div className={`px-2 py-1 rounded-full text-xs font-medium ${slot.status === 'OPEN'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {slot.status}
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
                    />
                </div>

                {/* Calendario mejorado */}
                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={Array.from({ length: 31 }, (_, i) => i + 1).filter(
                            (d) => !calendarData.bookedDays.includes(d)
                        )}
                        bookedDaysDB={calendarData.bookedDays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        onSelectDate={async (date) => {
                            console.log("CLICKED DAY", date);
                            setSelectedDate(date);
                            const data = await fetchSlotsByDay(date);
                            setDailySlots(data || []);
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
                                <span className="font-medium">{slots.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Disponibles:</span>
                                <span className="font-medium text-green-600">
                                    {slots.filter(s => s.status === 'OPEN').length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
