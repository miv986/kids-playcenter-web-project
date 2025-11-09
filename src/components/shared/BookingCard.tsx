import React from "react";
import { BirthdayBooking } from "../../types/auth";
import { formatDateTime } from "../../lib/formatDate";
import { Phone, Users, Glasses, Calendar, Clock, Package, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "../../contexts/TranslationContext";

interface BookingCardProps {
    booking: BirthdayBooking;
    openModal: (booking: BirthdayBooking) => void;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, openModal }) => {
    const { t } = useTranslation('BookingCard');
    
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
            case 'PENDING': return t('pending');
            case 'CONFIRMED': return t('confirmed');
            case 'CANCELLED': return t('cancelled');
            default: return status;
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                    {/* Header con ID y estado */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                        <h3 className="text-lg font-bold text-gray-800">#{booking.id}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {getStatusText(booking.status)}
                        </span>
                    </div>

                    {/* Información principal - Compacta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">{t('date')}</p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {format(new Date(booking.slot!.startTime), "dd/MM/yyyy")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">{t('schedule')}</p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {format(new Date(booking.slot!.startTime), "HH:mm")} - {format(new Date(booking.slot!.endTime), "HH:mm")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">{t('contact')}</p>
                                <p className="text-sm font-semibold text-gray-800">{booking.contact_number}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <div>
                                <p className="text-xs text-gray-500">{t('children')}</p>
                                <p className="text-sm font-semibold text-gray-800">{booking.number_of_kids}</p>
                            </div>
                        </div>
                    </div>

                    {/* Pack y comentarios en línea */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">{booking.packageType}</span>
                        </div>
                        {booking.comments && (
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-yellow-600" />
                                <span className="text-xs text-gray-600 truncate max-w-xs">{booking.comments}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Botón de acción */}
                <div className="lg:w-auto">
                    <button
                        onClick={() => openModal(booking)}
                        className="w-full lg:w-auto bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        <Glasses className="w-4 h-4" />
                        <span>{t('viewDetails')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
