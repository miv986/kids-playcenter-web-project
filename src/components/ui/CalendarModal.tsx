import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CalendarComponent } from '../dashboard/Bookings/Calendar';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: AuthModalProps) {



    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="relative p-8">
                    <CalendarComponent
                        availableDaysDB={[]}
                        onSelectDate={function (date: Date): void {
                            throw new Error('Function not implemented.');
                        } } bookedDaysDB={[]} currentMonth={undefined} setCurrentMonth={function (value: React.SetStateAction<Date>): void {
                            throw new Error('Function not implemented.');
                        } }></CalendarComponent>
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