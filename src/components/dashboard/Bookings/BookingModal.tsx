import React, { useState } from 'react';
import { CalendarIcon, X } from 'lucide-react';
import { Playcenter } from '../../sections/PlaycenterForm';


interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function BookingModal({ isOpen, onClose }: AuthModalProps) {

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-fit max-w-4xl sm:w-fit w-full max-h-[90vh] overflow-y-auto">
                <div className="relative p-8">
                    <div className="flex items-center justify-center space-x-3 mb-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
                            <CalendarIcon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800">Hacer Reserva</h3>
                    </div>
                    <Playcenter></Playcenter>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors duration-200"
                    >
                        <X className="w-5 h-5 text-gray-600" />
                    </button>


                </div>
            </div>
        </div>
    );
}