import { CalendarIcon, Phone } from "lucide-react"
import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from "../../contexts/BookingContext";
import { useSlots } from "../../contexts/SlotContext";
import { BirthdayBooking, BirthdaySlot } from "../../types/auth";
import { format } from "date-fns";


export function PacksForm({
    data,
    selectedDay,
    onBookingCreated,
}:
    {
        data: BirthdaySlot[];
        selectedDay: Date | undefined;
        onBookingCreated?: () => void;
    }) {


    const { addBooking } = useBookings();
    const [formData, setFormData] = useState({
        selectedSlot: "",
        name: "",
        contact_number: "",
        email: "",
        kids: 0,
        pack: "",
        comments: ""

    });

    const [loading, setLoading] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [slots, setSlots] = useState<BirthdaySlot[]>([]);


    // obtenemos al usuario autenticado
    const { user } = useAuth();
    //funcion de añadir reserva
    const { fetchSlotsByDay } = useSlots();


    useEffect(() => {
        if (data && selectedDay) {
            const filtered = data.filter(slot =>
                new Date(slot.date).toDateString() === selectedDay.toDateString()
            );
            setSlots(filtered);
        } else {
            setSlots(data);
        }
    }, [data, selectedDay]);

    useEffect(() => {
        if (user?.email) {
            setFormData(prev => ({ ...prev, email: user.email || '' }));
        }
    }, [user?.email]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

    };


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        /*
        if (!user?.id) {
            alert("Debes iniciar sesión para reservar");
            setLoading(false);
            return;
        }
            */
        try {

            if (!selectedSlot) {
                alert("Selecciona un horario antes de reservar");
                setLoading(false);
                return;
            }
            const bookingData: Omit<BirthdayBooking, "id" | "createdAt" | "updatedAt" | "status" | "slot"> = {
                guest: formData.name,
                guestEmail: formData.email,
                number_of_kids: Number(formData.kids),
                contact_number: formData.contact_number,
                comments: formData.comments,
                packageType: formData.pack as any, // si Package es un enum (Alegria, Fiesta, etc.)
                slotId: Number(selectedSlot),
            };

            await addBooking(bookingData);
            onBookingCreated?.();

            // 🔥 Refresca los slots disponibles para ese día
            if (selectedDay) {
                const updatedSlots = await fetchSlotsByDay(selectedDay);
                setSlots(updatedSlots);
            }

            alert("✅ Reserva creada con éxito. En breve recibirás un correo con los datos.");
            // limpiar
            setFormData({
                selectedSlot: "",
                name: "",
                contact_number: "",
                email: "",
                kids: 0,
                pack: "",
                comments: "",
            });
        } catch (err: any) {
            alert("❌ " + err.message);
        } finally {
            setLoading(false);
        }
    };
    return (

        <><div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">Hacer Reserva</h3>
        </div>
            <form className="space-y-6"
                onSubmit={handleSubmit}>
                <div>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={selectedSlot}
                        onChange={e => setSelectedSlot(e.target.value)}
                        required>
                        <option value="">Selecciona una fecha</option>
                        {(slots) && slots.length > 0 ?
                            (slots
                                .filter(slot => slot.status === 'OPEN')
                                .map(slot => (
                                <option key={slot.id} value={slot.id}>
                                    {format(new Date(slot.date), "dd/MM/yyyy")} -{" "}
                                    {format(new Date(slot.startTime), "HH:mm")} a{" "}
                                    {format(new Date(slot.endTime), "HH:mm")}
                                </option>
                            ))
                            ) : (
                                <option disabled>No hay horarios disponibles</option>
                            )

                        }

                    </select>
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Nombre del responsable
                    </label>
                    <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder="Tu nombre completo" />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Teléfono de contacto
                    </label>
                    <input
                        name="contact_number"
                        type="tel"
                        value={formData.contact_number}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder="+34 123 456 789" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Correo electrónico
                    </label>
                    <input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={!!user?.email}
                        className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200 ${user?.email ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        placeholder="email@here.com" />
                </div>
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Número de niños
                    </label>
                    <input
                        name="kids"
                        type="number"
                        value={formData.kids}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder="Indica cantidad">
                    </input>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Pack elegido
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={formData.pack}
                        name="pack"
                        onChange={handleChange}
                        required>
                        <option value={"ALEGRIA"}>Pack Alegría - 15€</option>
                        <option value={"FIESTA"}>Pack Fiesta - 25€</option>
                        <option value={"ESPECIAL"}>Pack Especial - 35€</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Comentarios adicionales
                    </label>
                    <textarea
                        name="comments"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={formData.comments}
                        onChange={handleChange}
                        placeholder="Cuéntanos sobre la celebración..."
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    {loading ? "Procesando..." : "Confirmar Reserva"}
                </button>
            </form></>

    );
}