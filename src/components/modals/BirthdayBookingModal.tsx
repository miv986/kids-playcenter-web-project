import React, { useState, useEffect } from 'react';
import { BirthdayBooking, Package, BirthdaySlot } from '../../types/auth';
import { formatDateTime } from '../../lib/formatDate';
import { CalendarComponent } from '../shared/Calendar';	
import { format } from 'date-fns';
import { Calendar, X, Clock, User, Mail, Phone, Users, Package as PackageIcon, MessageSquare, Edit, Save, Trash2 } from 'lucide-react';
import { Spinner } from '../shared/Spinner';
import { showToast } from '../../lib/toast';
import { useTranslation } from '../../contexts/TranslationContext';
import { useConfirm } from '../../hooks/useConfirm';
import { useSlots } from '../../contexts/SlotContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BirthdayBooking | null;
    updateBookingStatus: (id: number, status: BirthdayBooking['status']) => void;
    deleteBooking: (id: number) => void;
    updateBooking: (id: number, bookingData: Partial<BirthdayBooking>) => Promise<void>;
}

export function BirthdayBookingModal({
    isOpen,
    onClose,
    booking,
    updateBookingStatus,
    deleteBooking,
    updateBooking
}: AuthModalProps) {
    const { t } = useTranslation('BirthdayBookingModal');
    const { confirm, ConfirmComponent } = useConfirm();
    const { fetchSlotsByDay } = useSlots();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<BirthdayBooking>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(formData.slot?.date ? new Date(formData.slot.date) : null);
    const [isSaving, setIsSaving] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<BirthdaySlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

    // Inicializar formData al abrir modal
    useEffect(() => {
        if (booking) {
            setFormData({ ...booking });
            setIsEditing(false);
            setSelectedDate(booking.slot?.date ? new Date(booking.slot.date) : null);
            setSelectedSlotId(booking.slot?.id || null);
        }
    }, [booking]);

    // Cargar slots disponibles cuando se cambia la fecha
    useEffect(() => {
        const loadAvailableSlots = async () => {
            if (selectedDate && isEditing) {
                setIsLoadingSlots(true);
                try {
                    const slots = await fetchSlotsByDay(selectedDate);
                    // Filtrar solo slots disponibles (OPEN)
                    const available = slots.filter(slot => slot.status === 'OPEN');
                    
                    // Si el slot actual existe y está en la misma fecha, incluirlo siempre
                    if (booking?.slot && selectedDate) {
                        const slotDate = new Date(booking.slot.date);
                        const isSameDate = slotDate.toDateString() === selectedDate.toDateString();
                        if (isSameDate && !available.find(s => s.id === booking.slot!.id)) {
                            available.push(booking.slot as BirthdaySlot);
                        }
                    }
                    
                    setAvailableSlots(available);
                    
                    // Si hay un slot seleccionado y está en la lista, mantenerlo
                    if (booking?.slot && available.find(s => s.id === booking.slot!.id)) {
                        setSelectedSlotId(booking.slot.id);
                    } else if (available.length > 0) {
                        // Si no está el slot actual, seleccionar el primero disponible
                        setSelectedSlotId(null);
                    } else {
                        setSelectedSlotId(null);
                    }
                } catch (error) {
                    console.error('Error loading slots:', error);
                    showToast.error(t('errorLoadingSlots'));
                } finally {
                    setIsLoadingSlots(false);
                }
            }
        };
        loadAvailableSlots();
    }, [selectedDate, isEditing, booking]);

    // Sincronizar formData con booking cuando se desactiva la edición
    useEffect(() => {
        if (!isEditing && booking) {
            setFormData({ ...booking });
        }
    }, [isEditing, booking]);


    if (!isOpen || !booking) return null;

    const handleChange = (field: keyof BirthdayBooking, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        // Preparar solo los campos actualizables en el formato que espera el backend
        const backendData: any = {};
        
        // Solo incluir campos que han cambiado y que se pueden actualizar
        if (formData.guest !== undefined && formData.guest !== booking.guest) {
            backendData.guest = formData.guest;
        }
        if (formData.contact_number !== undefined && formData.contact_number !== booking.contact_number) {
            backendData.phone = formData.contact_number;
        }
        if (formData.number_of_kids !== undefined && formData.number_of_kids !== booking.number_of_kids) {
            backendData.number_of_kids = formData.number_of_kids;
        }
        if (formData.comments !== undefined && formData.comments !== booking.comments) {
            backendData.comments = formData.comments;
        }
        if (formData.packageType !== undefined && formData.packageType !== booking.packageType) {
            backendData.pack = formData.packageType;
        }
        // Si se cambió la fecha, validar que se haya seleccionado un slot
        if (selectedDate && booking?.slot) {
            const bookingDate = new Date(booking.slot.date);
            const isDateChanged = bookingDate.toDateString() !== selectedDate.toDateString();
            
            if (isDateChanged) {
                if (!selectedSlotId) {
                    showToast.error(t('selectSlotRequired'));
                    return;
                }
                backendData.slotId = selectedSlotId;
            } else if (selectedSlotId !== null && selectedSlotId !== booking.slot.id) {
                // Misma fecha pero slot diferente
                backendData.slotId = selectedSlotId;
            }
        }

        // Si no hay cambios, no hacer nada
        if (Object.keys(backendData).length === 0) {
            showToast.info(t('noChanges'));
            setIsEditing(false);
            return;
        }

        setIsSaving(true);
        try {
            await updateBooking(booking.id, backendData);
            setIsEditing(false);
            showToast.success(t('updateSuccess'));
            // El useEffect se encargará de sincronizar formData con booking cuando isEditing cambie
        } catch (error) {
            console.error('Error saving booking:', error);
            showToast.error(t('updateError'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = async () => {
        const hasChanges = Object.keys(formData).some(
            key => (formData as any)[key] !== (booking as any)[key]
        );
        if (hasChanges) {
            const confirmed = await confirm({ 
                message: t('unsavedChanges'),
                variant: 'warning'
            });
            if (!confirmed) {
                return;
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="relative">
                    {/* Header mejorado */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-3xl">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">{t('details')} #{booking.id}</h3>
                                    <p className="text-gray-600 text-xs">{t('createdAt')} {formatDateTime(booking.createdAt)}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                            </button>
                        </div>
                        {/* Botón de editar/guardar - Deshabilitado si está cancelada */}
                        <div className="flex justify-end">
                            {!isEditing ? (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    disabled={booking.status === 'CANCELLED'}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Edit className="w-4 h-4" />
                                    <span>{t('edit')}</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || booking.status === 'CANCELLED'}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Spinner size="sm" />
                                            <span>{t('saving')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            <span>{t('save')}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contenido del modal */}
                    <div className="p-6">

                        {/* Información de la reserva */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            {/* Fecha de reserva */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('bookingDate')}</label>
                                </div>
                                {isEditing && booking.status !== 'CANCELLED' ? (
                                    <div className="space-y-2">
                                        <input
                                            type="date"
                                            value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ''}
                                            onChange={e => {
                                                const newDate = e.target.value ? new Date(e.target.value) : null;
                                                setSelectedDate(newDate);
                                                if (newDate) {
                                                    setSelectedSlotId(null);
                                                }
                                            }}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {selectedDate && (
                                            <div className="mt-2">
                                                {isLoadingSlots ? (
                                                    <div className="flex items-center justify-center py-2">
                                                        <Spinner size="sm" />
                                                        <span className="ml-2 text-xs text-gray-500">{t('loadingSlots')}</span>
                                                    </div>
                                                ) : availableSlots.length > 0 ? (
                                                    <select
                                                        value={selectedSlotId || ''}
                                                        onChange={e => setSelectedSlotId(Number(e.target.value))}
                                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    >
                                                        <option value="">{t('selectSlot')}</option>
                                                        {availableSlots.map((slot) => (
                                                            <option key={slot.id} value={slot.id}>
                                                                {format(new Date(slot.startTime), "HH:mm")} - {format(new Date(slot.endTime), "HH:mm")} 
                                                                {slot.id === booking.slot?.id ? ` (${t('current')})` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <p className="text-xs text-red-500">{t('noSlotsAvailable')}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-700">
                                        {formData?.slot?.date 
                                            ? format(new Date(formData.slot.date), "dd-MM-yyyy")
                                            : formData?.originalSlotDate 
                                                ? format(new Date(formData.originalSlotDate), "dd-MM-yyyy")
                                                : ''}
                                        {(formData?.slot?.startTime && formData?.slot?.endTime) ? (
                                            <span className="ml-2 text-gray-500">
                                                {format(new Date(formData.slot.startTime), "HH:mm")} - {format(new Date(formData.slot.endTime), "HH:mm")}
                                            </span>
                                        ) : (formData?.originalSlotStartTime && formData?.originalSlotEndTime) ? (
                                            <span className="ml-2 text-gray-500">
                                                {format(new Date(formData.originalSlotStartTime), "HH:mm")} - {format(new Date(formData.originalSlotEndTime), "HH:mm")}
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </div>

                            {/* Nombre del huésped */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <User className="w-4 h-4 text-green-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('reservationName')}</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.guest || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('guest', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Email */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Mail className="w-4 h-4 text-purple-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('email')}</label>
                                </div>
                                <input
                                    type="email"
                                    value={formData.guestEmail || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('guestEmail', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Teléfono */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Phone className="w-4 h-4 text-orange-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('phone')}</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.contact_number || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('contact_number', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Número de niños */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Users className="w-4 h-4 text-pink-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('numberOfKids')}</label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.number_of_kids || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('number_of_kids', Number(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Estado */}
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('status')}</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.status || ''}
                                    disabled
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Pack elegido */}
                        <div className="mb-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <PackageIcon className="w-4 h-4 text-blue-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('selectedPack')}</label>
                                </div>
                                <select
                                    value={formData.packageType || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('packageType', e.target.value as Package)}
                                    className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-100 bg-white"
                                >
                                    <option value="">{t('selectPack')}</option>
                                    <option value="ALEGRIA">{t('packAlegria')}</option>
                                    <option value="FIESTA">{t('packFiesta')}</option>
                                    <option value="ESPECIAL">{t('packEspecial')}</option>
                                </select>
                            </div>
                        </div>

                        {/* Comentarios */}
                        <div className="mb-4">
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center space-x-2 mb-2">
                                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                                    <label className="font-semibold text-sm text-gray-700">{t('comments')}</label>
                                </div>
                                <textarea
                                    value={formData.comments || ''}
                                    disabled={!isEditing || booking.status === 'CANCELLED'}
                                    onChange={e => handleChange('comments', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-yellow-100"
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-200 -mx-6 px-6 py-4 mt-6 space-y-3">
                            {/* Botones de cambio de estado - Ocultos si está cancelada */}
                            {booking.status !== 'CANCELLED' && (
                                <div className="flex gap-3">
                                    {(() => {
                                        const actions: { label: string; status?: BirthdayBooking['status']; color: string; bgColor: string; hoverColor: string }[] = [];

                                        if (booking.status === "PENDING") {
                                            actions.push(
                                                { label: t('confirm'), status: "CONFIRMED", color: "emerald", bgColor: "bg-emerald-500", hoverColor: "hover:bg-emerald-600" },
                                                { label: t('cancel'), status: "CANCELLED", color: "orange", bgColor: "bg-orange-500", hoverColor: "hover:bg-orange-600" }
                                            );
                                        } else if (booking.status === "CONFIRMED") {
                                            actions.push(
                                                { label: t('pending'), status: "PENDING", color: "amber", bgColor: "bg-amber-500", hoverColor: "hover:bg-amber-600" },
                                                { label: t('cancel'), status: "CANCELLED", color: "orange", bgColor: "bg-orange-500", hoverColor: "hover:bg-orange-600" }
                                            );
                                        }

                                        return actions.map((action) => (
                                            <button
                                                key={action.label}
                                                onClick={async () => {
                                                    if (action.status) {
                                                        let confirmMessage = '';
                                                        let variant: 'danger' | 'warning' | 'info' = 'info';
                                                        
                                                        if (action.status === 'CONFIRMED') {
                                                            confirmMessage = t('confirmReservationQuestion');
                                                            variant = 'info';
                                                        } else if (action.status === 'CANCELLED') {
                                                            confirmMessage = t('cancelReservationQuestion');
                                                            variant = 'warning';
                                                        } else if (action.status === 'PENDING') {
                                                            confirmMessage = t('setPendingQuestion');
                                                            variant = 'warning';
                                                        }
                                                        
                                                        const confirmed = await confirm({ 
                                                            message: confirmMessage,
                                                            variant
                                                        });
                                                        if (confirmed) {
                                                            updateBookingStatus(booking.id, action.status);
                                                        }
                                                    } else {
                                                        deleteBooking(booking.id);
                                                    }
                                                }}
                                                className={`${action.bgColor} ${action.hoverColor} text-white px-4 py-2 rounded-xl font-medium transition-all duration-200 flex-1`}
                                            >
                                                {action.label}
                                            </button>
                                        ));
                                    })()}
                                </div>
                            )}
                            
                            {/* Mensaje informativo si está cancelada */}
                            {booking.status === 'CANCELLED' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                                    <p className="text-sm text-orange-800 font-medium">
                                        {t('cancelledReservationInfo') || 'Esta reserva está cancelada y no se puede modificar. Solo se puede consultar como información.'}
                                    </p>
                                </div>
                            )}

                            {/* Botón de eliminación - Menos accesible */}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2 text-center">{t('destructiveAction')}</p>
                                <button
                                    onClick={async () => {
                                        const confirmed = await confirm({ 
                                            message: t('confirmDelete'),
                                            variant: 'danger'
                                        });
                                        if (confirmed) {
                                            const doubleConfirm = await confirm({ 
                                                message: t('doubleConfirmDelete'),
                                                variant: 'danger'
                                            });
                                            if (doubleConfirm) {
                                                deleteBooking(booking.id);
                                            }
                                        }
                                    }}
                                    className="w-full bg-gray-600 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>{t('deleteReservation')}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {ConfirmComponent}
        </div>
    );
}
