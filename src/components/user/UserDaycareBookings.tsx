import { Calendar, Users, Clock, Package, Phone, MessageSquare, Plus, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useDaycareBookings } from "../../contexts/DaycareBookingContext";
import { useChildren } from "../../contexts/ChildrenContext";
import { DaycareBooking, Child } from "../../types/auth";
import {NewDaycareBookingModal} from "../shared/NewDaycareBookingModal";
import { useTranslation } from "../../contexts/TranslationContext";
import { Spinner } from "../shared/Spinner";
import { showToast } from "../../lib/toast";
import { useConfirm } from "../../hooks/useConfirm";
import { formatDateOnly, formatTimeOnly } from "../../lib/formatDate";

export function UserDaycareBookings() {
    const { user } = useAuth();
    const { fetchMyBookings, cancelBooking } = useDaycareBookings();
    const { fetchMyChildren } = useChildren();
    const t = useTranslation('UserDaycareBookings');
    const locale = t.locale;
    const { confirm, ConfirmComponent } = useConfirm();
    const [bookings, setBookings] = useState<DaycareBooking[]>([]);
    const [children, setChildren] = useState<Child[]>([]);
    const [isLoadingChildren, setIsLoadingChildren] = useState(true);
    const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'CLOSED'>('CONFIRMED');
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<DaycareBooking | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);

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
            setIsLoadingBookings(true);
            fetchMyBookings().then(data => {
                setBookings(data);
                setIsLoadingBookings(false);
            }).catch(() => {
                setIsLoadingBookings(false);
            });

            setIsLoadingChildren(true);
            fetchMyChildren().then(data => {
                setChildren(data);
                setIsLoadingChildren(false);
            }).catch(() => {
                setIsLoadingChildren(false);
            });
        }
    }, [user]);

    const getStatusColor = (status: DaycareBooking['status']) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            case 'CLOSED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: DaycareBooking['status']) => {
        switch (status) {
            case 'PENDING': return t.t('statusPending');
            case 'CONFIRMED': return t.t('statusConfirmed');
            case 'CANCELLED': return t.t('statusCancelled');
            case 'CLOSED': return t.t('statusClosed');
            default: return status;
        }
    };

    const handleCancel = async (id: number) => {
        const confirmed = await confirm({ 
            message: t.t('confirmCancel'),
            variant: 'warning'
        });
        if (!confirmed) return;
        
        try {
            await cancelBooking(id);
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' as any } : b));
            showToast.success(t.t('cancelledSuccess'));
        } catch (err) {
            showToast.error(t.t('errorCancelling'));
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

    const filteredBookings = bookings
        .filter(booking => {
            if (filter === 'CLOSED') {
                return booking.status === 'CLOSED';
            }
            if (filter === 'all') {
                return true;
            }
            return booking.status === filter;
        })
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const stats = {
        total: bookings.length,
        PENDING: bookings.filter(b => b.status === 'PENDING').length,
        CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
        CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
        CLOSED: bookings.filter(b => b.status === 'CLOSED').length
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-1">{t.t('title')}</h1>
                        <p className="text-gray-600 text-sm">{t.t('subtitle')}</p>
                    </div>
                    <button onClick={() => setIsNewModalOpen(true)} className="bg-blue-500 text-white px-4 sm:px-5 py-2.5 rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg w-full sm:w-auto min-w-[48px] sm:min-w-0">
                        <Plus className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden sm:inline">{t.t('newReservation')}</span>
                    </button>
                </div>

                {/* Panel de filtros - Siempre visible y compacto */}
                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg px-3 sm:px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 w-full sm:w-auto mb-1 sm:mb-0">{t.t('filterByStatus')}:</span>
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'all'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {t.t('all')} ({stats.total})
                        </button>
                        <button
                            onClick={() => setFilter('PENDING')}
                            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'PENDING'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {t.t('statusPending')} ({stats.PENDING})
                        </button>
                        <button
                            onClick={() => setFilter('CONFIRMED')}
                            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'CONFIRMED'
                                ? 'bg-green-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {t.t('statusConfirmed')} ({stats.CONFIRMED})
                        </button>
                        <button
                            onClick={() => setFilter('CANCELLED')}
                            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'CANCELLED'
                                ? 'bg-red-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {t.t('statusCancelled')} ({stats.CANCELLED})
                        </button>
                        <button
                            onClick={() => setFilter('CLOSED')}
                            className={`px-2 sm:px-3 py-1.5 sm:py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-[48px] ${filter === 'CLOSED'
                                ? 'bg-gray-500 text-white'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
                                }`}
                        >
                            {t.t('statusClosed')} ({stats.CLOSED})
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">{t.t('myReservations')}</h2>
                        <span className="text-sm text-gray-500">
                            {filteredBookings.length} {filteredBookings.length !== 1 ? t.t('reservations') : t.t('reservation')} {filter !== 'all' ? t.t('filtered') : t.t('total')}
                        </span>
                    </div>
                    <div className="p-4">
                        {isLoadingBookings ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner size="lg" text={t.t('loading')} />
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.t('noReservations')}</h3>
                                <p className="text-gray-500 mb-6">{t.t('firstReservation')}</p>
                                <button
                                    onClick={() => setIsNewModalOpen(true)}
                                    className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    {t.t('newReservation')}
                                </button>
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="text-center py-12">
                                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 mb-2">{t.t('noReservations')}</h3>
                                <p className="text-gray-500 mb-6">
                                    {filter !== 'all' ? t.t('noReservationsFilter') : t.t('firstReservation')}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredBookings.map((booking) => (
                                    <div key={booking.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gray-50">
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {getStatusText(booking.status)}
                                                    </span>
                                                    <span className="text-gray-500 text-xs">
                                                        #{booking.id}
                                                    </span>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-3 text-sm">
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>{formatDateOnly(booking.startTime, locale)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatTimeOnly(booking.startTime, locale)} - {formatTimeOnly(booking.endTime, locale)}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Users className="w-4 h-4" />
                                                        <span>{booking?.children?.map(child => child.name).join(', ') || t.t('notAvailable')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Package className="w-4 h-4" />
                                                        <span>{booking.slots.length} {t.t('slots')}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>{booking.user?.phone_number || t.t('notAvailable')}</span>
                                                    </div>
                                                </div>

                                                {booking.comments && (
                                                    <div className="mt-3 flex items-start space-x-2">
                                                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                                                        <p className="text-gray-700 text-sm">{booking.comments}</p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-row lg:flex-col gap-2 lg:w-40">
                                                {booking.status !== 'CANCELLED' && booking.status !== 'CLOSED' && (
                                                    <button
                                                        onClick={() => handleEdit(booking)}
                                                        className="flex-1 lg:flex-none bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[48px]"
                                                    >
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span className="hidden sm:inline">{t.t('modify')}</span>
                                                    </button>
                                                )}
                                                {booking.status !== 'CANCELLED' && booking.status !== 'CLOSED' && (
                                                    <button
                                                        onClick={() => handleCancel(booking.id)}
                                                        className="flex-1 lg:flex-none bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-all duration-200 flex items-center justify-center gap-1.5 min-w-[48px]"
                                                    >
                                                        <Clock className="w-4 h-4 flex-shrink-0" />
                                                        <span className="hidden sm:inline">{t.t('cancelReservation')}</span>
                                                    </button>
                                                )}
                                                {booking.status === 'CLOSED' && (
                                                    <div className="text-sm text-gray-500 italic">
                                                        {t.t('closedReservation')}
                                                    </div>
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
                    hasChildren={children.length > 0}
                />
                <NewDaycareBookingModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    existingBooking={editingBooking}
                    hasChildren={children.length > 0}
                />
                {ConfirmComponent}
            </div>
        </div>
    );
}

