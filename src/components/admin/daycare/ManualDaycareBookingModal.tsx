import { Calendar, X, Clock, Users, User, Phone, FileText, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDaycareSlots } from '../../../contexts/DaycareSlotContext';
import { DaycareSlot, DaycareBooking } from '../../../types/auth';
import { CalendarComponent } from '../../shared/Calendar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { Spinner } from '../../shared/Spinner';
import { showToast } from '../../../lib/toast';
import { useHttp } from '../../../contexts/HttpContext';
import { 
    validateManualBooking, 
    formatDateAsLocalISO, 
    calculateBookingTimes 
} from '../../../lib/daycareBookingHelpers';

interface ManualDaycareBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (updatedBooking?: DaycareBooking) => void;
    existingBooking?: DaycareBooking | null;
}

export function ManualDaycareBookingModal({ isOpen, onClose, onSuccess, existingBooking }: ManualDaycareBookingModalProps) {
    const t = useTranslation('ManualDaycareBookingModal');
    const tCommon = useTranslation('Common');
    const http = useHttp();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [slots, setSlots] = useState<DaycareSlot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [monthSlotsCache, setMonthSlotsCache] = useState<Map<string, DaycareSlot[]>>(new Map());
    const [allDaysData, setAllDaysData] = useState<Map<string, { available: number, total: number }>>(new Map());

    // Campos del formulario
    const [clientName, setClientName] = useState(''); // manualClientName
    const [childName, setChildName] = useState(''); // manualChildName - nombres de los niños
    const [parent1Name, setParent1Name] = useState(''); // manualParent1Name
    const [parent1Phone, setParent1Phone] = useState(''); // manualParent1Phone
    const [parent2Name, setParent2Name] = useState(''); // manualParent2Name
    const [parent2Phone, setParent2Phone] = useState(''); // manualParent2Phone
    const [notes, setNotes] = useState(''); // comments
    const [numberOfChildren, setNumberOfChildren] = useState(1); // manualNumberOfChildren

    const { fetchAvailableSlotsByDate, fetchAvailableSlotsByDateRange } = useDaycareSlots();

    useEffect(() => {
        if (isOpen) {
            if (existingBooking) {
                // Cargar datos de la reserva existente
                setClientName(existingBooking.manualClientName || '');
                setChildName(existingBooking.manualChildName || '');
                setParent1Name(existingBooking.manualParent1Name || '');
                setParent1Phone(existingBooking.manualParent1Phone || '');
                setParent2Name(existingBooking.manualParent2Name || '');
                setParent2Phone(existingBooking.manualParent2Phone || '');
                setNotes(existingBooking.comments || '');
                setNumberOfChildren(existingBooking.manualNumberOfChildren || 1);
                
                // Cargar fecha y slots
                const startDate = new Date(existingBooking.startTime);
                // Normalizar la fecha para evitar problemas de timezone
                const normalizedDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
                setSelectedDate(normalizedDate);
                setCurrentMonth(normalizedDate);
                
                // Cargar slots del día seleccionado de forma asíncrona
                const loadSlotsForEdit = async () => {
                    try {
                        // Primero cargar los slots del día
                        setIsLoadingSlots(true);
                        const daySlots = await fetchAvailableSlotsByDate(normalizedDate);
                        setSlots(daySlots);
                        setIsLoadingSlots(false);
                        
                        // Después de cargar los slots, seleccionar los que corresponden a la reserva
                        if (existingBooking.slots && existingBooking.slots.length > 0) {
                            const slotIds = existingBooking.slots.map((slot: DaycareSlot) => slot.id);
                            // Filtrar solo los slots que existen en los slots cargados
                            const validSlotIds = slotIds.filter(id => daySlots.some(s => s.id === id));
                            setSelectedSlots(new Set(validSlotIds));
                        }
                    } catch (error) {
                        console.error('Error cargando slots para edición:', error);
                        setIsLoadingSlots(false);
                    }
                };
                
                // Cargar datos del mes para el calendario primero, luego los slots del día
                const loadData = async () => {
                    await loadMonthData();
                    await loadSlotsForEdit();
                };
                loadData();
            } else {
                // Resetear formulario al crear nueva
                setClientName('');
                setChildName('');
                setParent1Name('');
                setParent1Phone('');
                setParent2Name('');
                setParent2Phone('');
                setNotes('');
                setNumberOfChildren(1);
                setSelectedDate(null);
                setSelectedSlots(new Set());
                loadMonthData();
            }
        } else {
            // Resetear formulario al cerrar
            setClientName('');
            setChildName('');
            setParent1Name('');
            setParent1Phone('');
            setParent2Name('');
            setParent2Phone('');
            setNotes('');
            setNumberOfChildren(1);
            setSelectedDate(null);
            setSelectedSlots(new Set());
            setMonthSlotsCache(new Map());
            setAllDaysData(new Map());
        }
    }, [isOpen, existingBooking]);

    const loadMonthData = async () => {
        if (isLoadingSlots) return;
        
        const monthKey = `${currentMonth.getFullYear()}-${currentMonth.getMonth()}`;
        if (monthSlotsCache.has(monthKey)) {
            const cachedSlots = monthSlotsCache.get(monthKey)!;
            // Solo actualizar los slots si no hay una fecha seleccionada (para no sobrescribir los slots del día)
            if (!selectedDate) {
                setSlots(cachedSlots);
            }
            updateDaysData(cachedSlots);
            return;
        }

        setIsLoadingSlots(true);
        try {
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
            
            const monthSlots = await fetchAvailableSlotsByDateRange(
                startOfMonth,
                endOfMonth
            );
            
            setMonthSlotsCache(prev => new Map(prev).set(monthKey, monthSlots));
            // Solo actualizar los slots si no hay una fecha seleccionada (para no sobrescribir los slots del día)
            if (!selectedDate) {
                setSlots(monthSlots);
            }
            updateDaysData(monthSlots);
        } catch (error) {
            console.error('Error cargando slots:', error);
            showToast.error('Error al cargar los slots disponibles');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const updateDaysData = (slotsData: DaycareSlot[]) => {
        const daysMap = new Map<string, { available: number, total: number }>();
        
        slotsData.forEach(slot => {
            const date = new Date(slot.date);
            const dayKey = date.toDateString();
            
            if (!daysMap.has(dayKey)) {
                daysMap.set(dayKey, { available: 0, total: 0 });
            }
            
            const dayData = daysMap.get(dayKey)!;
            dayData.total++;
            if (slot.availableSpots > 0 && slot.status === 'OPEN') {
                dayData.available++;
            }
        });
        
        setAllDaysData(daysMap);
    };

    useEffect(() => {
        // Cargar datos del mes cuando cambia el mes actual
        // loadMonthData ya tiene protección para no sobrescribir slots cuando hay fecha seleccionada
        loadMonthData();
    }, [currentMonth]);

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date);
        setIsLoadingSlots(true);
        try {
            const daySlots = await fetchAvailableSlotsByDate(date);
            setSlots(daySlots);
        } catch (error) {
            console.error('Error cargando slots del día:', error);
            showToast.error('Error al cargar los slots del día');
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const handleSlotToggle = (slotId: number) => {
        setSelectedSlots(prev => {
            const newSet = new Set(prev);
            if (newSet.has(slotId)) {
                newSet.delete(slotId);
            } else {
                newSet.add(slotId);
            }
            return newSet;
        });
    };

    const handleSubmit = async () => {
        if (loading) return;

        // Validar datos usando helper
        const validation = validateManualBooking({
            clientName,
            childName,
            parent1Name,
            parent1Phone,
            numberOfChildren,
            selectedDate,
            selectedSlotsCount: selectedSlots.size,
            notes
        });

        if (!validation.isValid) {
            showToast.error(validation.error!);
            return;
        }

        // Ordenar slots seleccionados
        const sortedSlots = slots
            .filter(s => selectedSlots.has(s.id))
            .sort((a, b) => a.hour - b.hour);

        if (sortedSlots.length === 0) {
            showToast.error('No hay slots seleccionados');
            return;
        }

        // Calcular tiempos usando helper
        const { startTime, endTime } = calculateBookingTimes(
            sortedSlots.map(s => ({ date: s.date, hour: s.hour }))
        );

        setLoading(true);
        try {
            const bookingData = {
                startTime: formatDateAsLocalISO(startTime),
                endTime: formatDateAsLocalISO(endTime),
                slotId: sortedSlots[0].id,
                numberOfChildren,
                clientName,
                childName,
                parent1Name,
                parent1Phone,
                parent2Name: parent2Name || undefined,
                parent2Phone: parent2Phone || undefined,
                comments: notes || undefined
            };

            const response = existingBooking
                ? await http.put(`/api/daycareBookings/${existingBooking.id}`, bookingData)
                : await http.post('/api/daycareBookings/manual', bookingData);

            showToast.success(
                existingBooking 
                    ? 'Reserva manual actualizada correctamente'
                    : 'Reserva manual creada correctamente'
            );

            // Llamar a onSuccess ANTES de cerrar para que se actualice el estado
            if (onSuccess) {
                onSuccess(response.booking);
            }
            onClose();
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 
                (existingBooking ? 'Error al actualizar la reserva manual' : 'Error al crear la reserva manual');
            showToast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const availableDays: number[] = [];
    const bookedDays: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dayData = allDaysData.get(date.toDateString());

        if (!dayData) continue;

        if (dayData.available > 0) {
            availableDays.push(day);
        } else if (dayData.total > 0) {
            bookedDays.push(day);
        }
    }

    const selectedSlotsArray = slots.filter(s => selectedSlots.has(s.id)).sort((a, b) => 
        a.openHour.localeCompare(b.openHour)
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Users className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {existingBooking ? 'Editar Reserva Manual' : 'Añadir Reserva Manual'}
                                </h3>
                                <p className="text-gray-600 text-sm">Reserva para cliente no registrado</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6">
                        {/* Formulario a la izquierda */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Información del Cliente
                            </h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre del cliente <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Nombre del cliente"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombres de los niños <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={childName}
                                        onChange={(e) => setChildName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Ej: Pepe, Juan, Marto"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Separa los nombres con comas</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Número de niños <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={numberOfChildren}
                                        onChange={(e) => setNumberOfChildren(parseInt(e.target.value) || 1)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="border-t pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Padre/Madre 1</h5>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={parent1Name}
                                                onChange={(e) => setParent1Name(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Nombre completo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="tel"
                                                value={parent1Phone}
                                                onChange={(e) => setParent1Phone(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Teléfono de contacto"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Padre/Madre 2 (Opcional)</h5>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nombre
                                            </label>
                                            <input
                                                type="text"
                                                value={parent2Name}
                                                onChange={(e) => setParent2Name(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Nombre completo"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Teléfono
                                            </label>
                                            <input
                                                type="tel"
                                                value={parent2Phone}
                                                onChange={(e) => setParent2Phone(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                                placeholder="Teléfono de contacto"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notas
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Notas adicionales sobre la reserva..."
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{notes.length}/500 caracteres</p>
                                </div>
                            </div>
                        </div>

                        {/* Calendario y slots a la derecha */}
                        <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                            <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Seleccionar Fecha y Horario
                            </h4>

                            <div className="space-y-4">
                                {/* Calendario */}
                                <div>
                                    <CalendarComponent
                                        availableDaysDB={availableDays}
                                        bookedDaysDB={bookedDays}
                                        currentMonth={currentMonth}
                                        setCurrentMonth={setCurrentMonth}
                                        selectedDate={selectedDate || undefined}
                                        onSelectDate={handleDateSelect}
                                    />
                                    {isLoadingSlots && (
                                        <div className="flex justify-center mt-4">
                                            <Spinner />
                                        </div>
                                    )}
                                </div>

                                {/* Slots disponibles */}
                                <div>
                                    {selectedDate ? (
                                        <div>
                                            <h5 className="text-sm font-semibold text-gray-700 mb-3">
                                                Horarios disponibles - {selectedDate.toLocaleDateString('es-ES', { 
                                                    weekday: 'long', 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric' 
                                                })}
                                            </h5>
                                            {slots.length === 0 ? (
                                                <p className="text-gray-500 text-sm">No hay slots disponibles para este día</p>
                                            ) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                    {slots.map(slot => (
                                                        <button
                                                            key={slot.id}
                                                            onClick={() => handleSlotToggle(slot.id)}
                                                            disabled={slot.availableSpots < numberOfChildren || slot.status !== 'OPEN'}
                                                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                                                selectedSlots.has(slot.id)
                                                                    ? 'border-purple-500 bg-purple-50'
                                                                    : slot.availableSpots >= numberOfChildren && slot.status === 'OPEN'
                                                                    ? 'border-gray-200 hover:border-purple-300 bg-white'
                                                                    : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-gray-600" />
                                                                    <span className="font-medium">
                                                                        {slot.openHour} - {slot.closeHour}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-gray-600">
                                                                    {slot.availableSpots} plazas
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 text-gray-500">
                                            <p className="text-sm">Selecciona una fecha en el calendario</p>
                                        </div>
                                    )}

                                    {selectedSlotsArray.length > 0 && (
                                        <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                                            <p className="text-sm font-semibold text-purple-800 mb-2">Horarios seleccionados:</p>
                                            <div className="space-y-1">
                                                {selectedSlotsArray.map(slot => (
                                                    <div key={slot.id} className="text-sm text-purple-700">
                                                        {slot.openHour} - {slot.closeHour}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer con botones */}
                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 rounded-b-2xl">
                    <div className="flex justify-end gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Spinner size="sm" />
                                    {existingBooking ? 'Actualizando...' : 'Creando...'}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-4 h-4" />
                                    {existingBooking ? 'Actualizar Reserva' : 'Crear Reserva'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

