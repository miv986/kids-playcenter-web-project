import React from "react";
import { BirthdayBooking } from "../../../types/auth";
import { formatDateTime } from "../../../lib/formatDate";
import { Phone, Users, Glasses } from "lucide-react";
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
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                        <h3 className="text-xl font-bold text-gray-800">ID Reserva: {booking.id}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                        </span>
                        <p className='text-lg font-bold text-gray-600'>
                            {format(new Date(booking.slot!.startTime), "dd/MM/yyyy")}
                        </p>
                        <p className='text-lg font-bold text-green-600'>[
                            {format(new Date(booking.slot!.startTime), "HH:mm")} {"-"}
                            {format(new Date(booking.slot!.endTime), "HH:mm")}
                        ]
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>Teléfono reserva: {booking.contact_number}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4" />
                            <span>{booking.number_of_kids} niños</span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <span className="font-medium">Pack elegido: {booking.packageType}</span>
                        </div>
                    </div>

                    {booking.comments && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            Comentarios:
                            <p className="text-gray-700 text-sm">{booking.comments}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col space-y-3 lg:w-48">
                    <button
                        onClick={() => openModal(booking)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                        <Glasses className="w-4 h-4" />
                        <span>Ver Detalles</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
