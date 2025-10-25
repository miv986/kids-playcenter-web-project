import React, { useState } from 'react';
import { CalendarIcon, X, Calendar, Clock, Users } from 'lucide-react';
import { Playcenter } from '../../sections/PlaycenterForm';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: AuthModalProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto">
                <div className="relative">
                    {/* Header mejorado */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <Calendar className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800">Nueva Reserva</h3>
                                    <p className="text-gray-600 text-sm">Completa los datos para realizar tu reserva</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-all duration-200 group"
                            >
                                <X className="w-5 h-5 text-gray-600 group-hover:text-gray-800" />
                            </button>
                        </div>
                    </div>

                    {/* Contenido del modal */}
                    <div className="p-8">
                        <Playcenter />
                    </div>
                </div>
            </div>
        </div>
    );
}