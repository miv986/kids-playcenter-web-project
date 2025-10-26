import { Calendar, Users, Clock, Package, Phone, MessageSquare, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useDaycareBookings } from "../../../contexts/DaycareBookingContext";
import { DaycareBooking } from "../../../types/auth";
import { NewDaycareBookingModal } from "./NewDaycareBookingModal";

export function UserDaycareBookings() {
    const { user } = useAuth();
    const { fetchMyBookings, cancelBooking } = useDaycareBookings();
    const [bookings, setBookings] = useState<DaycareBooking[]>([]);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<DaycareBooking | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        const savedDate = localStorage.getItem('openDaycareBooking');
        const shouldOpen = localStorage.getItem('shouldOpenDaycareBooking');
        if (savedDate && shouldOpen) {
            setIsNewModalOpen(true);
            localStorage.removeItem('openDaycareBooking');
            localStorage.removeItem('shouldOpenDaycareBooking');
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchMyBookings().then(data => {
                console.log("📋 Bookings recibidas:", data);
                setBookings(data);
            });
        }
    }, [user]);

    const getStatusColor = (status: DaycareBooking['status']) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: DaycareBooking['status']) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'CONFIRMED': return 'Confirmada';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    };

    const handleCancel = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            try {
                await cancelBooking(id);
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
                alert('Reserva cancelada correctamente');
            } catch (err) {
                alert('Error al cancelar la reserva');
            }
        }
    };

    const handleEdit = (booking: DaycareBooking) => {
        setEditingBooking(booking);
        setIsEditModalOpen(true);
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingBooking(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Mis Reservas - Ludoteca</h1>
                        <p className="text-gray-600">Gestiona tus reservas de ludoteca</p>
                    </div>
                    <button onClick={() => setIsNewModalOpen(true)} className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 flex items-center gap-2">
                        <Plus className="w-5 h-5" />
                        Nueva Reserva
                    </button>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-800">{bookings.length}</div>
                                <div className="text-gray-600">Total Reservas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-2xl font-bold text-gray-800">Mis Reservas</h2>
                    </div>
                    <div className="p-6">
                        {bookings.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes reservas</h3>
                                <p className="text-gray-500 mb-6">¡Haz tu primera reserva y comienza la diversión!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow duration-300">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-4">
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                                                        {getStatusText(booking.status)}
                                                    </span>
                                                    <span className="text-gray-500 text-sm">
                                                        Reserva #{booking.id}
                                                    </span>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{new Date(booking.createdAt!).toLocaleDateString('es-ES')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{new Date(booking.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Users className="w-4 h-4" />
                                                        <span>{(() => {
                                                            console.log("🔍 Booking:", booking);
                                                            console.log("🔍 Booking.children:", booking?.children);
                                                            return booking?.children?.map(child => child.name).join(', ') || 'N/A';
                                                        })()}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Package className="w-4 h-4" />
                                                        <span>{booking.slots.length} slots</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{booking.user?.phone_number || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                {booking.comments && (
                                                    <div className="mt-3 flex items-start space-x-2">
                                                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                                                        <p className="text-gray-700 text-sm">{booking.comments}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col space-y-3 lg:w-48">
                                                {booking.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleEdit(booking)}
                                                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                        <span>Modificar</span>
                                                    </button>
                                                )}
                                                {booking.status !== 'CANCELLED' && (
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                                                    >
                                                        <Clock className="w-4 h-4" />
                                                        <span>Cancelar</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <NewDaycareBookingModal
                    isOpen={isNewModalOpen}
                    onClose={() => setIsNewModalOpen(false)}
                    existingBooking={null}
                />
                <NewDaycareBookingModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    existingBooking={editingBooking}
                />
            </div>
        </div>
    );
}

