import { CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from "../../contexts/BookingContext";


export function PacksForm() {
    const [name, setName] = useState("");
    const [contact_number, setContactNumber] = useState("");
    const [kids, setKids] = useState(0);
    const [pack, setPack] = useState("Alegria");
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);

    // obtenemos al usuario autenticado
    const { user } = useAuth();
    //funcion de añadir reserva
    const { addBooking } = useBookings();

    useEffect(() => {
        console.warn(kids)
    }, [kids])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!user?.id) {
            alert("Debes iniciar sesión para reservar");
            setLoading(false);
            return;
        }
        try {
            addBooking({
                contact_number,
                number_of_kinds: kids,
                type_of_package: pack,
                comments,
            });

            alert("✅ Reserva creada con éxito");
            // limpiar
            setName("");
            setContactNumber("");
            setKids(0);
            setPack("");
            setComments("");
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
        </div><form className="space-y-6">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Nombre del responsable
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder="Tu nombre completo" />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Teléfono de contacto
                    </label>
                    <input
                        type="tel"
                        value={contact_number}
                        onChange={e => setContactNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder="+34 123 456 789" />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Número de niños
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={kids}
                        onChange={e => setKids(Number(e.target.value))}
                        required
                    >
                        <option value={0}>Selecciona cantidad</option>
                        <option value={5}>1-5 niños</option>
                        <option value={10}>6-10 niños</option>
                        <option value={15}>11-15 niños</option>
                        <option value={20}>Más de 15 niños</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Pack elegido
                    </label>
                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={pack}
                        onChange={e => setPack(e.target.value)}
                        required>
                        <option value={"Alegria"}>Pack Alegría - 15€</option>
                        <option value={"Fiesta"}>Pack Fiesta - 25€</option>
                        <option value={"Especial"}>Pack Especial - 35€</option>
                    </select>
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        Comentarios adicionales
                    </label>
                    <textarea
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder="Cuéntanos sobre la celebración..."
                    ></textarea>
                </div>

                <button
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    {loading ? "Procesando..." : "Confirmar Reserva"}
                </button>
            </form></>

    );
}