import React, { useState, useEffect } from 'react';
import { BirthdayBooking } from '../../types/auth';
import { formatDateTime } from '../../lib/formatDate';
import { CalendarComponent } from '../dashboard/Bookings/Calendar';
import { format } from 'date-fns';
import { Calendar, X, Clock, User, Mail, Phone, Users, Package, MessageSquare, Edit, Save, Trash2 } from 'lucide-react';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: BirthdayBooking | null;
    updateBookingStatus: (id: number, status: BirthdayBooking['status']) => void;
    deleteBooking: (id: number) => void;
    updateBooking: (id: number, bookingData: Partial<BirthdayBooking>) => void;
}

export function BirthdayBookingModal({
    isOpen,
    onClose,
    booking,
    updateBookingStatus,
    deleteBooking,
    updateBooking
}: AuthModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<Partial<BirthdayBooking>>({});
    const [selectedDate, setSelectedDate] = useState<Date | null>(formData.slot?.date ? new Date(formData.slot.date) : null);

    // Inicializar formData al abrir modal
    useEffect(() => {
        if (booking) {
            setFormData({ ...booking });
            setIsEditing(false);
        }
    }, [booking]);


    if (!isOpen || !booking) return null;

    const handleChange = (field: keyof BirthdayBooking, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Comparar cambios
        const hasChanges = Object.keys(formData).some(
            key => (formData as any)[key] !== (booking as any)[key]
        );

        if (!hasChanges) {
            alert("No se han realizado cambios");
            return;
        }

        updateBooking(booking.id, formData);
        setIsEditing(false);
    };

    const handleClose = () => {
        const hasChanges = Object.keys(formData).some(
            key => (formData as any)[key] !== (booking as any)[key]
        );
        if (hasChanges && !window.confirm("Hay cambios sin guardar. ¿Deseas salir sin guardar?")) {
            return;
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                <div className="relative">
                    {/* Header mejorado */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">Detalles de Reserva #{booking.id}</h3>
                                    <p className="text-gray-600 text-sm">Fecha de creación: {formatDateTime(booking.createdAt)}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido del modal */}
                    <div className="p-8">

                        {/* Información de la reserva */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Fecha de reserva */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    <label className="font-semibold text-gray-700">Fecha de reserva</label>
                                </div>
                                <input
                                    type='datetime'
                                    value={formData?.slot?.date ? format(new Date(formData.slot.date), "dd-MM-yyyy HH:mm") : ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('guest', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Nombre del huésped */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <User className="w-5 h-5 text-green-600" />
                                    <label className="font-semibold text-gray-700">Nombre del huésped</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.guest || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('guest', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Email */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Mail className="w-5 h-5 text-purple-600" />
                                    <label className="font-semibold text-gray-700">Email</label>
                                </div>
                                <input
                                    type="email"
                                    value={formData.guestEmail || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('guestEmail', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Teléfono */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Phone className="w-5 h-5 text-orange-600" />
                                    <label className="font-semibold text-gray-700">Teléfono</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.contact_number || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('contact_number', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Número de niños */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Users className="w-5 h-5 text-pink-600" />
                                    <label className="font-semibold text-gray-700">Número de niños</label>
                                </div>
                                <input
                                    type="number"
                                    value={formData.number_of_kids || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('number_of_kids', Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                />
                            </div>

                            {/* Estado */}
                            <div className="p-4 bg-gray-50 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Clock className="w-5 h-5 text-indigo-600" />
                                    <label className="font-semibold text-gray-700">Estado</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.status || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                                />
                            </div>
                        </div>

                        {/* Pack elegido */}
                        <div className="mb-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <Package className="w-5 h-5 text-blue-600" />
                                    <label className="font-semibold text-gray-700">Pack elegido</label>
                                </div>
                                <input
                                    type="text"
                                    value={formData.packageType || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('packageType', e.target.value)}
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-100"
                                />
                            </div>
                        </div>

                        {/* Comentarios */}
                        <div className="mb-6">
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <div className="flex items-center space-x-3 mb-2">
                                    <MessageSquare className="w-5 h-5 text-yellow-600" />
                                    <label className="font-semibold text-gray-700">Comentarios</label>
                                </div>
                                <textarea
                                    value={formData.comments || ''}
                                    disabled={!isEditing}
                                    onChange={e => handleChange('comments', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-yellow-100"
                                />
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="space-y-4">
                            {/* Botones de cambio de estado */}
                            <div className="flex gap-3">
                                {(() => {
                                    const actions: { label: string; status?: BirthdayBooking['status']; color: string; bgColor: string; hoverColor: string }[] = [];

                                    if (booking.status === "PENDING") {
                                        actions.push(
                                            { label: "Confirmar", status: "CONFIRMED", color: "green", bgColor: "bg-green-500", hoverColor: "hover:bg-green-600" },
                                            { label: "Cancelar", status: "CANCELLED", color: "red", bgColor: "bg-red-500", hoverColor: "hover:bg-red-600" }
                                        );
                                    } else if (booking.status === "CONFIRMED") {
                                        actions.push(
                                            { label: "Pendiente", status: "PENDING", color: "yellow", bgColor: "bg-yellow-500", hoverColor: "hover:bg-yellow-600" },
                                            { label: "Cancelar", status: "CANCELLED", color: "red", bgColor: "bg-red-500", hoverColor: "hover:bg-red-600" }
                                        );
                                    } else if (booking.status === "CANCELLED") {
                                        actions.push(
                                            { label: "Pendiente", status: "PENDING", color: "yellow", bgColor: "bg-yellow-500", hoverColor: "hover:bg-yellow-600" },
                                            { label: "Confirmar", status: "CONFIRMED", color: "green", bgColor: "bg-green-500", hoverColor: "hover:bg-green-600" }
                                        );
                                    }

                                    return actions.map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={() => {
                                                if (action.status) {
                                                    updateBookingStatus(booking.id, action.status);
                                                } else {
                                                    deleteBooking(booking.id);
                                                }
                                            }}
                                            className={`${action.bgColor} ${action.hoverColor} text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex-1 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl`}
                                        >
                                            <span>{action.label}</span>
                                        </button>
                                    ));
                                })()}
                            </div>

                            {/* Botones de edición y eliminación */}
                            <div className="flex gap-3">
                                {!isEditing ? (
                                    <button 
                                        onClick={() => setIsEditing(true)}
                                        className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex-1 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>Editar</span>
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            handleSave();
                                            setIsEditing(false);
                                        }}
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex-1 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>Guardar</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => {
                                        if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
                                            deleteBooking(booking.id);
                                        }
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex-1 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Eliminar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
