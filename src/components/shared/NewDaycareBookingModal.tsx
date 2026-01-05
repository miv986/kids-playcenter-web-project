import { Calendar, X, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDaycareSlots } from '../../contexts/DaycareSlotContext';
import { useDaycareBookings } from '../../contexts/DaycareBookingContext';
import { useChildren } from '../../contexts/ChildrenContext';
import { DaycareSlot, Child, DaycareBooking } from '../../types/auth';
import { CalendarComponent } from './Calendar';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { Spinner } from './Spinner';
import { showToast } from '../../lib/toast';

interface NewDaycareBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    existingBooking?: DaycareBooking | null;
    hasChildren?: boolean;
}

export function NewDaycareBookingModal({ isOpen, onClose, existingBooking, hasChildren = true }: NewDaycareBookingModalProps) {
    const router = useRouter();
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
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isLoadingChildren, setIsLoadingChildren] = useState(false);
    const [monthSlotsCache, setMonthSlotsCache] = useState<Map<string, DaycareSlot[]>>(new Map());

    const { fetchAvailableSlotsByDate, fetchAvailableSlotsByDateRange } = useDaycareSlots();
    const { addBooking, updateBooking, fetchMyBookings } = useDaycareBookings();
    const { fetchMyChildren } = useChildren();
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            setIsLoadingChildren(true);
            fetchMyChildren().then(kidsList => {
                setKids(kidsList);
                // Pre-seleccionar los hijos de la reserva si estamos modificando
                if (existingBooking && existingBooking.children) {
                    const bookingKidIds = new Set(existingBooking.children.map(child => child.id));
                    setSelectedKids(bookingKidIds);
                }
                setIsLoadingChildren(false);
            }).catch(() => {
                setIsLoadingChildren(false);
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
        } else {
            setMonthSlotsCache(new Map());
            setAllDaysData(new Map());
        }
    }, [isOpen, currentMonth, existingBooking]);

    const loadMonthData = async () => {
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), daysInMonth);

        try {
            const allSlots = await fetchAvailableSlotsByDateRange(startDate, endDate);
            
            const cache = new Map<string, DaycareSlot[]>();
            const data = new Map<string, { available: number, total: number }>();

            allSlots.forEach(slot => {
                // ✅ Extraer solo la fecha (YYYY-MM-DD) del formato ISO que viene del backend
                const slotDate = new Date(slot.date);
                const dateKey = `${slotDate.getFullYear()}-${(slotDate.getMonth() + 1).toString().padStart(2, '0')}-${slotDate.getDate().toString().padStart(2, '0')}`;
                if (!cache.has(dateKey)) {
                    cache.set(dateKey, []);
                }
                cache.get(dateKey)!.push(slot);
            });

            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                const daySlots = cache.get(dateKey) || [];
                const available = daySlots.filter(s => s.availableSpots > 0).length;
                const total = daySlots.length;
                data.set(date.toDateString(), { available, total });
            }

            setMonthSlotsCache(cache);
            setAllDaysData(data);
        } catch (err) {
            console.error('Error loading month data:', err);
        }
    };

    useEffect(() => {
        if (selectedDate) {
            const dateKey = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${selectedDate.getDate().toString().padStart(2, '0')}`;
            const cachedSlots = monthSlotsCache.get(dateKey);
            
            if (cachedSlots) {
                setSlots(cachedSlots);
            } else {
                setIsLoadingSlots(true);
                fetchAvailableSlotsByDate(selectedDate).then(fetchedSlots => {
                    setSlots(fetchedSlots);
                    setIsLoadingSlots(false);
                }).catch(() => {
                    setIsLoadingSlots(false);
                });
            }
        }
    }, [selectedDate, monthSlotsCache, fetchAvailableSlotsByDate]);

    const handleDateSelect = async (date: Date) => {
        if (!hasChildren && !existingBooking) {
            showToast.error(t.t('mustAddChildFirst'));
            return;
        }
        
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
                console.error('Error checking bookings:', err);
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
            showToast.error(t.t('selectDateAndSlot'));
            return;
        }

        if (selectedKids.size === 0) {
            showToast.error(t.t('selectAtLeastOneChild'));
            return;
        }

        if (comments.length > 500) {
            showToast.error(t.t('commentTooLong'));
            return;
        }


        if (loading) {
            showToast.info(t.t('processing'));
            return;
        }

        const sortedSlots = slots.filter(s => selectedSlots.has(s.id)).sort((a, b) => {
            const timeA = a.openHour;
            const timeB = b.openHour;
            return timeA.localeCompare(timeB);
        });

        if (sortedSlots.length === 0) {
            showToast.error(t.t('noSlotsSelected'));
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
            showToast.error(t.t('mustLogin'));
            return;
        }

        // ✅ No permitir modificar reservas CLOSED
        if (existingBooking && existingBooking.status === 'CLOSED') {
            showToast.error(t.t('cannotModifyClosed'));
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
                    showToast.info(t.t('noChanges'));
                    setLoading(false);
                    return;
                }

                await updateBooking(existingBooking.id, {
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    slotId: sortedSlots[0].id,
                    childrenIds: Array.from(selectedKids),
                    comments: comments || undefined
                } as any);
                showToast.success(t.t('bookingModified'));
            } else {
                await addBooking({
                    userId: user.id,
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    slotId: sortedSlots[0].id,
                    childrenIds: Array.from(selectedKids),
                    comments: comments || undefined
                });
                showToast.success(t.t('bookingCreated'));
            }
            onClose();
            window.location.reload();
        } catch (err) {
            showToast.error(existingBooking ? t.t('errorModify') : t.t('errorCreate'));
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

    // Si la reserva está CLOSED, mostrar mensaje y deshabilitar edición
    const isClosed = existingBooking?.status === 'CLOSED';

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
                                {isClosed && (
                                    <div className="mt-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium">
                                        {t.t('closedReservation')}
                                    </div>
                                )}
                                {existingBooking && !isClosed && (
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
                            {!hasChildren && !existingBooking ? (
                                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
                                    <Users className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                    <h4 className="text-xl font-semibold text-gray-800 mb-2">{t.t('mustAddChildFirst')}</h4>
                                    <p className="text-gray-600 mb-4">{t.t('mustAddChildFirstDesc')}</p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            router.push('/dashboard?tab=profile');
                                        }}
                                        className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all"
                                    >
                                        {t.t('goToProfile')}
                                    </button>
                                </div>
                            ) : (
                                <CalendarComponent
                                    currentMonth={currentMonth}
                                    setCurrentMonth={setCurrentMonth}
                                    selectedDate={selectedDate || undefined}
                                    onSelectDate={handleDateSelect}
                                    availableDaysDB={availableDays}
                                    bookedDaysDB={bookedDays}
                                />
                            )}
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
                                        {isLoadingSlots ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Spinner size="md" text={t.t('loading')} />
                                            </div>
                                        ) : slots.length === 0 ? (
                                            <p className="text-gray-500">{t.t('noSchedulesAvailable')}</p>
                                        ) : (
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {slots.map(slot => {
                                                    const isExisting = existingBooking?.slots?.some(s => s.id === slot.id);
                                                    const isDisabled = (hasExistingBookingError && !existingBooking) || isClosed;
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

                                    {isLoadingChildren ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Spinner size="md" text={t.t('loading')} />
                                        </div>
                                    ) : kids.length > 0 && (
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800 mb-4">{t.t('children')}</h4>
                                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                                {kids.map(kid => {
                                                    const isDisabled = (hasExistingBookingError && !existingBooking) || isClosed;
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
                                            onChange={e => {
                                                if (e.target.value.length <= 500) {
                                                    setComments(e.target.value);
                                                }
                                            }}
                                            disabled={isClosed}
                                            maxLength={500}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            rows={3}
                                            placeholder={t.t('additionalComments')}
                                        />
                                        <p className={`text-xs mt-1 ${comments.length > 450 ? 'text-amber-600' : 'text-gray-500'}`}>
                                            {comments.length}/500 {t.t('characters')}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || isClosed || selectedSlots.size === 0 || (hasExistingBookingError && !existingBooking)}
                                        className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner size="sm" />
                                                <span>{t.t('processing')}</span>
                                            </>
                                        ) : (
                                            existingBooking ? t.t('modifyReservation') : t.t('confirmReservation')
                                        )}
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

