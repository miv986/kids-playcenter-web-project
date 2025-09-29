import React, { useState, useEffect } from 'react';
import { BirthdayBooking } from '../../types/auth';
import { formatDateTime } from '../../lib/formatDate';
import { CalendarComponent } from '../dashboard/Bookings/Calendar';

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
            <div className="bg-white rounded-2xl p-6 shadow-xl z-50 max-w-lg w-full">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Reserva #{booking.id}
                </h3>
                <p className='text-xl font-bold text-gray-600'>
                    {formatDateTime(booking.createdAt)}
                </p>

                <div className="space-y-3 text-gray-700">
                    <div>
                        <label className="font-medium">Fecha de reserva:</label>
                        <input
                            type='text'
                            value={formatDateTime(formData.slot?.date) || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('guest', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />


                    </div>

                    <div>
                        <label className="font-medium">Nombre reserva:</label>
                        <input
                            type="text"
                            value={formData.guest || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('guest', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Email:</label>
                        <input
                            type="email"
                            value={formData.guestEmail || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('guestEmail', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Teléfono:</label>
                        <input
                            type="text"
                            value={formData.contact_number || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('contact_number', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Niños:</label>
                        <input
                            type="number"
                            value={formData.number_of_kids || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('number_of_kids', Number(e.target.value))}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Pack:</label>
                        <input
                            type="text"
                            value={formData.packageType || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('packageType', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Comentarios:</label>
                        <textarea
                            value={formData.comments || ''}
                            disabled={!isEditing}
                            onChange={e => handleChange('comments', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                        />
                    </div>

                    <div>
                        <label className="font-medium">Estado:</label>
                        <input
                            type="text"
                            value={formData.status || ''}
                            disabled
                            className="border rounded px-2 py-1 w-full bg-gray-100"
                        />
                    </div>
                </div>

                {/* Acciones */}
                <div className="mt-6 flex flex-col space-y-3">

                    <div className="flex gap-2">
                        {(() => {
                            const actions: { label: string; status?: BirthdayBooking['status']; color: string }[] = [];

                            // Dependiendo del estado, agregamos los botones de cambiar
                            if (booking.status === "PENDING") {
                                actions.push(
                                    { label: "Confirmar", status: "CONFIRMED", color: "green" },
                                    { label: "Cancelar", status: "CANCELLED", color: "red" }
                                );
                            } else if (booking.status === "CONFIRMED") {
                                actions.push(
                                    { label: "Pendiente", status: "PENDING", color: "yellow" },
                                    { label: "Cancelar", status: "CANCELLED", color: "red" }
                                );
                            } else if (booking.status === "CANCELLED") {
                                actions.push(
                                    { label: "Pendiente", status: "PENDING", color: "yellow" },
                                    { label: "Confirmar", status: "CONFIRMED", color: "green" }
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
                                    className={`bg-${action.color}-500 text-white px-4 py-2 rounded-xl hover:bg-${action.color}-600 flex-1`}
                                >
                                    {action.label}
                                </button>
                            ));
                        })()}
                    </div>





                    <div className="flex gap-2">
                        {!isEditing ? (<button onClick={() => setIsEditing(true)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 flex-1">Editar</button>
                        ) : (
                            <button
                                onClick={() => {
                                    handleSave();
                                    setIsEditing(false);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 flex-1"
                            >
                                Guardar
                            </button>
                        )}

                        <button
                            onClick={() => deleteBooking(booking.id)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl hover:bg-gray-600 flex-1"
                        >
                            Eliminar
                        </button>
                    </div>

                    <button
                        onClick={handleClose}
                        className="bg-white border px-4 py-2 rounded-xl hover:bg-gray-100 w-full"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
