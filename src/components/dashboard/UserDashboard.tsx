import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Package, MessageSquare, Edit, Trash2, Phone, XCircle } from 'lucide-react';
import { useBookings } from '../../contexts/BookingContext';
import { Booking } from '../../types/auth';
import { useAuth } from '../../contexts/AuthContext';

export function UserDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([] as Array<Booking>)
  const { fetchMyBookings, updateBookingStatus, deleteBooking } = useBookings();
  const [, setEditingBooking] = useState<number | null>(null);

  useEffect(() => {
    if (!!user) {
      fetchMyBookings().then((bookings) => setBookings(bookings))
    }
  }, [user])

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: Booking['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente de confirmación';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
      updateBookingStatus(bookingId, 'cancelled');
    }
  };

  const handleDeleteBooking = (bookingId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.')) {
      deleteBooking(bookingId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Mi Panel</h1>
          <p className="text-gray-600">Bienvenido/a, {user?.name}. Aquí puedes gestionar tus reservas.</p>
        </div>

        {/* Stats */}
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

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {bookings.filter(b => b.status === 'confirmed').length}
                </div>
                <div className="text-gray-600">Confirmadas</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {bookings.filter(b => b.status === 'pending').length}
                </div>
                <div className="text-gray-600">Pendientes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bookings List */}
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
                <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                  Hacer Reserva
                </button>
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
                            <Users className="w-4 h-4" />
                            <span>{booking.number_of_kinds}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Package className="w-4 h-4" />
                            <span>{booking.type_of_package}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{booking.contact_number}</span>
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
                        {booking.status === 'pending' && (
                          <button
                            onClick={() => setEditingBooking(booking.id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Modificar</span>
                          </button>
                        )}

                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="bg-yellow-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Cancelar</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteBooking(booking.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded-xl font-medium hover:bg-red-600 transition-colors duration-200 flex items-center justify-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Nueva Reserva
            </button>
            <button className="bg-white text-gray-700 px-6 py-3 rounded-xl font-medium border border-gray-200 hover:border-green-300 hover:text-green-600 transition-all duration-300">
              Contactar Soporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}