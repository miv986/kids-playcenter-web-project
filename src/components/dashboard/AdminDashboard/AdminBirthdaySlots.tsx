import React, { useEffect, useState, useMemo } from "react";
import { Calendar, Plus, Trash2, Edit3 } from "lucide-react";
import { BirthdaySlot } from "../../../types/auth";
import { useAuth } from "../../../contexts/AuthContext";
import { useSlots } from "../../../contexts/SlotContext";
import { format } from "date-fns";
import { SlotModal } from "../../ui/SlotModal";
import { CalendarComponent } from "../Bookings/Calendar";


export function AdminBirthdaySlots() {
    const { user } = useAuth();
    const { fetchSlots, createSlot, updateSlot, deleteSlot, fetchSlotsByDay, } = useSlots();

    const [slots, setSlots] = useState([] as Array<BirthdaySlot>);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [dailySlots, setDailySlots] = useState<BirthdaySlot[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<BirthdaySlot | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);


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


    // Calcular días con slots para el calendario
    const bookedDays = useMemo(() => {
        if (!slots) return [];
        return slots
            .map((s) => {
                const d = new Date(s.date);
                return isNaN(d.getTime()) ? null : d;
            })
            .filter((d): d is Date =>
                d?.getMonth() === currentMonth.getMonth()
                && d.getFullYear() === currentMonth.getFullYear())

            .map((date) => date.getDate());
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
        await updateSlot(id, data);
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

                    {/* Botón para mostrar todas las reservas */}
                    {selectedDate && (
                        <div className="mb-4">
                            <button
                                onClick={() => {
                                    setSelectedDate(undefined);
                                    setDailySlots([]); // limpio las de ese día
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
                                        <p className="font-semibold">
                                            {format(new Date(slot.date), "dd/MM/yyyy")} -{" "}
                                            {format(new Date(slot.startTime), "HH:mm")} a{" "}
                                            {format(new Date(slot.endTime), "HH:mm")}
                                        </p>
                                        <p className="text-sm text-gray-500">Estado: {slot.status}</p>
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
                    />
                </div>

                <div className="relative">
                    <CalendarComponent
                        availableDaysDB={Array.from({ length: 31 }, (_, i) => i + 1).filter(
                            (d) => !bookedDays.includes(d)
                        )}
                        bookedDaysDB={bookedDays}
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
                </div>
            </div>
        </div>
    );
}
