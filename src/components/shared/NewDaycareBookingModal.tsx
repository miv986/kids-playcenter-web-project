import { Calendar, X, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDaycareSlots } from '../../contexts/DaycareSlotContext';
import { useDaycareBookings } from '../../contexts/DaycareBookingContext';
import { useChildren } from '../../contexts/ChildrenContext';
import { DaycareSlot, Child, DaycareBooking } from '../../types/auth';
import { CalendarComponent } from './Calendar';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';

interface NewDaycareBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingBooking?: DaycareBooking | null;
}

export function NewDaycareBookingModal({ isOpen, onClose, existingBooking }: NewDaycareBookingModalProps) {
    const t = useTranslation('NewDaycareBookingModal');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [slots, setSlots] = useState<DaycareSlot[]>([]);
    const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
    const [kids, setKids] = useState<Child[]>([]);
    const [selectedKids, setSelectedKids] = useState<Set<number>>(new Set());
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [allDaysData, setAllDaysData] = useState<Map<string, { available: number, total: number }>>(new Map());
    const [hasExistingBookingError, setHasExistingBookingError] = useState(false);

    const { fetchAvailableSlotsByDate } = useDaycareSlots();
    const { addBooking, updateBooking, fetchMyBookings } = useDaycareBookings();
    const { fetchMyChildren } = useChildren();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchMyChildren().then(kidsList => {
                setKids(kidsList);
                // Pre-seleccionar los hijos de la reserva si estamos modificando
                if (existingBooking && existingBooking.children) {
                    const bookingKidIds = new Set(existingBooking.children.map(child => child.id));
                    setSelectedKids(bookingKidIds);
                }
            });
            if (existingBooking) {
                const startDate = new Date(existingBooking.startTime);
                setSelectedDate(startDate);
                setComments(existingBooking.comments || '');
                // Pre-seleccionar los slots existentes
                if (existingBooking.slots && existingBooking.slots.length > 0) {
                    const existingSlotIds = existingBooking.slots.map(slot => slot.id);
                    setSelectedSlots(new Set(existingSlotIds));
                }
            } else {
                // Intentar leer fecha desde localStorage
                const savedDateStr = localStorage.getItem('openDaycareBooking');
                if (savedDateStr) {
                    const savedDate = new Date(savedDateStr);
                    setSelectedDate(savedDate);
                    setCurrentMonth(savedDate);
                    localStorage.removeItem('openDaycareBooking');
                }
                setSelectedSlots(new Set());
                setSelectedKids(new Set());
                setComments('');
            }
            loadMonthData();
        }
    }, [isOpen, currentMonth, existingBooking]);

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlotsByDate(selectedDate).then(fetchedSlots => {
                setSlots(fetchedSlots);
            });
        }
    }, [selectedDate, fetchAvailableSlotsByDate]);

    const loadMonthData = async () => {
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const data = new Map<string, { available: number, total: number }>();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const slots = await fetchAvailableSlotsByDate(date);
            const available = slots.filter(s => s.availableSpots > 0).length;
            const total = slots.length;
            data.set(date.toDateString(), { available, total });
        }
        setAllDaysData(data);
    };

    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlotsByDate(selectedDate).then(setSlots);
        }
    }, [selectedDate, fetchAvailableSlotsByDate]);

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date);
        setSelectedSlots(new Set());
        setHasExistingBookingError(false);
        
        // Solo verificar si no estamos modificando una reserva existente
        if (!existingBooking) {
            try {
                const bookings = await fetchMyBookings();
                const sameDay = bookings.some(booking => {
                    const bookingDate = new Date(booking.startTime);
                    return bookingDate.getFullYear() === date.getFullYear() &&
                           bookingDate.getMonth() === date.getMonth() &&
                           bookingDate.getDate() === date.getDate() &&
                           booking.status !== 'CANCELLED';
                });
                
                if (sameDay) {
                    setHasExistingBookingError(true);
                }
            } catch (err) {
                console.error('Error verificando reservas:', err);
            }
        }
    };

    const toggleSlot = (slotId: number) => {
        setSelectedSlots(prev => {
            const next = new Set(prev);
            if (next.has(slotId)) {
                next.delete(slotId);
            } else {
                next.add(slotId);
            }
            return next;
        });
    };

    const toggleKid = (kidId: number) => {
        setSelectedKids(prev => {
            const next = new Set(prev);
            if (next.has(kidId)) {
                next.delete(kidId);
            } else {
                next.add(kidId);
            }
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!selectedDate || selectedSlots.size === 0) {
            alert(t.t('selectDateAndSlot'));
            return;
        }

        if (selectedKids.size === 0) {
            alert(t.t('selectAtLeastOneChild'));
            return;
        }

        if (comments.length > 500) {
            alert(t.t('commentTooLong'));
            return;
        }


        if (loading) {
            alert(t.t('processing'));
            return;
        }

        const sortedSlots = slots.filter(s => selectedSlots.has(s.id)).sort((a, b) => {
            const timeA = a.openHour;
            const timeB = b.openHour;
            return timeA.localeCompare(timeB);
        });

        if (sortedSlots.length === 0) {
            alert(t.t('noSlotsSelected'));
            return;
        }

        const slotDate = new Date(sortedSlots[0].date);
        const [sh, sm] = sortedSlots[0].openHour.split(':').map(Number);
        const lastSlot = sortedSlots[sortedSlots.length - 1];
        const [eh, em] = lastSlot.closeHour.split(':').map(Number);

        const startTime = new Date(slotDate);
        startTime.setHours(sh, sm, 0, 0);

        const endTime = new Date(slotDate);
        endTime.setHours(eh, em, 0, 0);

        if (!user?.id) {
            alert(t.t('mustLogin'));
            return;
        }

        setLoading(true);
        try {
            if (existingBooking) {
                // Comprobar si hay cambios
                const existingSlotIds = existingBooking.slots.map(s => s.id).sort();
                const newSlotIds = Array.from(selectedSlots).sort();
                const slotsChanged = JSON.stringify(existingSlotIds) !== JSON.stringify(newSlotIds);
                
                const existingChildrenIds = existingBooking.children.map(c => c.id).sort();
                const newChildrenIds = Array.from(selectedKids).sort();
                const childrenChanged = JSON.stringify(existingChildrenIds) !== JSON.stringify(newChildrenIds);
                
                const commentsChanged = (existingBooking.comments || '') !== comments;

                if (!slotsChanged && !commentsChanged && !childrenChanged) {
                    alert(t.t('noChanges'));
                    setLoading(false);
                    return;
                }

                await updateBooking(existingBooking.id, {
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    childrenIds: Array.from(selectedKids),
                    comments: comments || undefined
                } as any);
                alert(t.t('bookingModified'));
            } else {
                await addBooking({
                    userId: user.id,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    slotId: sortedSlots[0].id,
                    childrenIds: Array.from(selectedKids),
                    comments: comments || undefined
                });
                alert(t.t('bookingCreated'));
            }
            onClose();
            window.location.reload();
        } catch (err) {
            alert(existingBooking ? t.t('errorModify') : t.t('errorCreate'));
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

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl z-10">
                    <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Calendar className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{existingBooking ? t.t('modifyTitle') : t.t('newTitle')}</h3>
                                <p className="text-gray-600 text-sm">{t.t('selectDateAndTimes')}</p>
                                {existingBooking && (
                                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                                            {t.t('current')}: {new Date(existingBooking.startTime).toLocaleDateString(t.locale === 'ca' ? 'ca-ES' : 'es-ES')} {new Date(existingBooking.startTime).toLocaleTimeString(t.locale === 'ca' ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(existingBooking.endTime).toLocaleTimeString(t.locale === 'ca' ? 'ca-ES' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {existingBooking && selectedDate && selectedSlots.size > 0 && (() => {
                                            const existingSlotIds = existingBooking.slots.map(s => s.id).sort();
                                            const newSlotIds = Array.from(selectedSlots).sort();
                                            const hasChanges = JSON.stringify(existingSlotIds) !== JSON.stringify(newSlotIds);
                                            
                                            const firstSlot = slots.filter(s => selectedSlots.has(s.id)).sort((a, b) => a.openHour.localeCompare(b.openHour))[0];
                                            const lastSlot = slots.filter(s => selectedSlots.has(s.id)).sort((a, b) => a.closeHour.localeCompare(b.closeHour))[slots.filter(s => selectedSlots.has(s.id)).length - 1];
                                            
                                            return hasChanges && firstSlot && lastSlot && (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                                                    {t.t('new')}: {selectedDate.toLocaleDateString(t.locale === 'ca' ? 'ca-ES' : 'es-ES')} {firstSlot.openHour} - {lastSlot.closeHour}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all">
                            <X className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid lg:grid-cols-2 gap-8">
                        <div>
                            <CalendarComponent
                                currentMonth={currentMonth}
                                setCurrentMonth={setCurrentMonth}
                                selectedDate={selectedDate || undefined}
                                onSelectDate={handleDateSelect}
                                availableDaysDB={availableDays}
                                bookedDaysDB={bookedDays}
                            />
                        </div>

                        <div className="space-y-6">
                            {selectedDate && (
                                <>
                                    {hasExistingBookingError && !existingBooking && (
                                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                                            <p className="text-red-700 font-medium">{t.t('existingBookingError')}</p>
                                            <p className="text-red-600 text-sm mt-1">{t.t('existingBookingErrorDesc')}</p>
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800 mb-4">{t.t('availableSchedules')}</h4>
                                        {slots.length === 0 ? (
                                            <p className="text-gray-500">{t.t('noSchedulesAvailable')}</p>
                                        ) : (
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {slots.map(slot => {
                                                    const isExisting = existingBooking?.slots?.some(s => s.id === slot.id);
                                                    const isDisabled = hasExistingBookingError && !existingBooking;
                                                    return (
                                                        <label key={slot.id} className={`flex items-center p-4 border rounded-xl transition-all ${
                                                            isDisabled 
                                                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                                                                : isExisting 
                                                                    ? 'border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100' 
                                                                    : 'border-gray-200 cursor-pointer hover:bg-blue-50'
                                                        }`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSlots.has(slot.id)}
                                                                onChange={() => toggleSlot(slot.id)}
                                                                disabled={isDisabled}
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                                                            />
                                                            <div className="ml-3 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium text-gray-800">{slot.openHour} - {slot.closeHour}</p>
                                                                    {isExisting && (
                                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
                                                                            {t.t('current')}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500">{slot.availableSpots} {t.t('availableSpots')}</p>
                                                            </div>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {kids.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t.t('children')}</h4>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {kids.map(kid => {
                                                    const isDisabled = hasExistingBookingError && !existingBooking;
                                                    return (
                                                        <label key={kid.id} className={`flex items-center p-4 border rounded-xl transition-all ${
                                                            isDisabled 
                                                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50' 
                                                                : 'border-gray-200 cursor-pointer hover:bg-blue-50'
                                                        }`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedKids.has(kid.id)}
                                                                onChange={() => toggleKid(kid.id)}
                                                                disabled={isDisabled}
                                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                                                            />
                                                        <div className="ml-3 flex-1">
                                                            <p className="font-medium text-gray-800">{kid.name} {kid.surname}</p>
                                                        </div>
                                                    </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-gray-700 font-medium mb-2">{t.t('comments')}</label>
                                        <textarea
                                            value={comments}
                                            onChange={e => setComments(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                            rows={3}
                                            placeholder={t.t('additionalComments')}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || selectedSlots.size === 0 || (hasExistingBookingError && !existingBooking)}
                                        className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? t.t('processing') : (existingBooking ? t.t('modifyReservation') : t.t('confirmReservation'))}
                                    </button>
                                </>
                            )}

                            {!selectedDate && (
                                <div className="text-center py-12 text-gray-500">
                                    <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p>{t.t('selectDate')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

