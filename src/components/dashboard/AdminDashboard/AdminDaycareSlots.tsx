import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../../../contexts/AuthContext";
import { useDaycareSlots } from "../../../contexts/DaycareSlotContext";
import { DaycareSlot } from "../../../types/auth";
import { SlotModal } from "../../ui/SlotModal";
import { CalendarComponent } from "../Bookings/Calendar";

export function AdminDaycareSlots() {
    const { user } = useAuth();
    const { fetchSlots, fetchAvailableSlotsByDate, generateSlots, updateSlot, deleteSlot } = useDaycareSlots();
    const fetchSlotsByDay = fetchAvailableSlotsByDate;


    const [slots, setSlots] = useState<DaycareSlot[]>([]);
    const [dailySlots, setDailySlots] = useState<DaycareSlot[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<DaycareSlot | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();


    const openModal = (slot?: DaycareSlot) => {
        setSelectedSlot(slot || null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedSlot(null);
        setIsModalOpen(false);
    };

    // Fetch all slots for current month on mount
    useEffect(() => {
        if (!user) return;
        const fetchAllSlots = async () => {
            const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            const slotsByMonth: DaycareSlot[] = [];
            for (let i = 0; i <= lastDay.getDate() - 1; i++) {
                const day = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
                const daySlots = await fetchAvailableSlotsByDate(day);
                slotsByMonth.push(...(Array.isArray(daySlots) ? daySlots : []));

            }

        };
        fetchAllSlots();
    }, [user, currentMonth]);


    // Fetch all slots
    useEffect(() => {
        if (!!user) {
            fetchSlots().then(
                (slots) => setSlots(slots),

            );

        }
    }, [user]);

    const slotsToShow: DaycareSlot[] = Array.isArray(selectedDate ? dailySlots : slots)
        ? (selectedDate ? dailySlots : slots)
        : [];


    useEffect(() => {
        setDailySlots([]);
        setSelectedDate(undefined);
    }, [currentMonth]);


    const bookedDays = useMemo(() => {
        return slots
            .map((s) => new Date(s.date))
            .filter(
                (d) =>
                    d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
            )
            .map((d) => d.getDate());
    }, [slots, currentMonth]);

    // Crear slot
    const handleCreateSlot = async (data: Partial<DaycareSlot> & { openHour?: number; closeHour?: number }) => {
        console.log("🟢 DATA EN HANDLECREATESLOT:", data);

        if (!data.date || data.openHour === undefined || data.closeHour === undefined || !data.capacity) {
            alert("Debes rellenar fecha, hora de inicio, hora de fin y capacidad");
            return;
        }

        try {
            await generateSlots({
                openHour: data.openHour,
                closeHour: data.closeHour,
                capacity: data.capacity,
            });

            const newSlots = await fetchAvailableSlotsByDate(new Date(data.date));
            setSlots((prev) => [...prev, ...(Array.isArray(newSlots) ? newSlots : [])]);
            alert("✅ Slot creado correctamente");
        } catch (err) {
            console.error("❌ Error creando slot:", err);
        }
    };


    // Actualizar slot
    const handleUpdateSlot = async (id: number, data: Partial<DaycareSlot>) => {
        await updateSlot(id, data);
        setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
        if (selectedDate) setDailySlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
        if (selectedSlot?.id === id) setSelectedSlot((prev) => (prev ? { ...prev, ...data } : prev));
        alert("Slot actualizado correctamente");
    };

    // Eliminar slot
    const handleDeleteSlot = async (id: number) => {
        if (!window.confirm("¿Seguro que quieres eliminar este slot?")) return;
        await deleteSlot(id);
        setSlots((prev) => prev.filter((s) => s.id !== id));
        if (selectedDate) setDailySlots((prev) => prev.filter((s) => s.id !== id));
        alert("Slot eliminado");
    };

    return (
        <div className="container mx-auto px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Panel de Slots Ludoteca</h1>
                <p className="text-gray-600">Gestiona los slots disponibles para reservas de ludoteca</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 items-start">
                <div className="min-h-auto bg-gray-50 py-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Slots</h2>
                        <button
                            onClick={() => openModal()}
                            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Slot
                        </button>
                    </div>

                    {selectedDate && (
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setSelectedDate(undefined);
                                    setDailySlots([]);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200"
                            >
                                Mostrar todos los slots
                            </button>
                        </div>
                    )}

                    {slotsToShow.length === 0 ? (
                        <div className="bg-white p-12 rounded-2xl shadow-lg text-center">
                            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                {selectedDate ? "No hay slots para este día" : "No hay slots"}
                            </h3>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slotsToShow.map((slot) => (
                                <div
                                    key={slot.id}
                                    className="bg-white p-4 rounded-xl shadow flex justify-between items-center"
                                >
                                    <div>
                                        {selectedDate ? (
                                            <p className="font-semibold">
                                                {format(new Date(slot.date), "dd/MM/yyyy")} - {slot.hour}:00
                                            </p>
                                        ) : ("")

                                        }
                                        <p className="text-sm text-gray-500">
                                            Plazas: {slot.availableSpots}/{slot.capacity} - Estado: {slot.status}
                                        </p>
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

                    <SlotModal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        slot={selectedSlot}
                        createSlot={handleCreateSlot}
                        updateSlot={handleUpdateSlot}
                        isDaycare={true}
                    />
                </div>

                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={Array.from({ length: daysInMonth }, (_, i) => i + 1).filter((d) => !bookedDays.includes(d))}
                        bookedDaysDB={bookedDays}
                        currentMonth={currentMonth}
                        setCurrentMonth={setCurrentMonth}
                        selectedDate={selectedDate}
                        onSelectDate={async (date) => {
                            setSelectedDate(date);
                            const data = await fetchSlotsByDay(date);
                            setDailySlots(data || []);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
