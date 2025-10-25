import React from "react";
import { BirthdayBooking } from "../../../types/auth";
import { formatDateTime } from "../../../lib/formatDate";
import { Phone, Users, Glasses, Calendar, Clock, Package, MessageSquare } from "lucide-react";
import { format } from "date-fns";

interface BookingCardProps {
    booking: BirthdayBooking;
    openModal: (booking: BirthdayBooking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, openModal }) => {
    const getStatusColor = (status: BirthdayBooking['status']) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: BirthdayBooking['status']) => {
        switch (status) {
            case 'PENDING': return 'Pendiente';
            case 'CONFIRMED': return 'Confirmada';
            case 'CANCELLED': return 'Cancelada';
            default: return status;
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                    {/* Header con ID y estado */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">#{booking.id}</h3>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                        </span>
                    </div>

                    {/* Información principal */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Calendar className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm text-gray-500">Fecha</p>
                                <p className="font-semibold text-gray-800">
                                    {format(new Date(booking.slot!.startTime), "dd/MM/yyyy")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm text-gray-500">Horario</p>
                                <p className="font-semibold text-gray-800">
                                    {format(new Date(booking.slot!.startTime), "HH:mm")} - {format(new Date(booking.slot!.endTime), "HH:mm")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Phone className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm text-gray-500">Contacto</p>
                                <p className="font-semibold text-gray-800">{booking.contact_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <Users className="w-5 h-5 text-gray-600" />
                            <div>
                                <p className="text-sm text-gray-500">Niños</p>
                                <p className="font-semibold text-gray-800">{booking.number_of_kids}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pack elegido */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg mb-4">
                        <Package className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Pack elegido</p>
                            <p className="font-semibold text-blue-800">{booking.packageType}</p>
                        </div>
                    </div>

                    {/* Comentarios */}
                    {booking.comments && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <MessageSquare className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="text-sm text-yellow-700 font-medium mb-1">Comentarios</p>
                                    <p className="text-yellow-800 text-sm">{booking.comments}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón de acción */}
                <div className="flex flex-col space-y-3 lg:w-48">
                    <button
                        onClick={() => openModal(booking)}
                        className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                    >
                        <Glasses className="w-4 h-4" />
                        <span>Ver Detalles</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
