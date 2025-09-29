import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from "../../contexts/BookingContext";
import { useChildren } from "../../contexts/ChildrenContext";
import { Child } from "../../types/auth";
import { Calendar } from "../dashboard/Bookings/Calendar";


export function Playcenter() {
    const [name, setName] = useState("");
    const [contact_number, setContactNumber] = useState("");
    const [kids, setKids] = useState<Child[]>([]);
    const [pack, setPack] = useState("Alegria");
    const [date, setDate] = useState();
    const [comments, setComments] = useState("");
    const [loading, setLoading] = useState(false);



    //obtenemos al usuario autenticado
    const { user } = useAuth();
    //obtenemos los hijos del usuario
    const { fetchMyChildren, addChild, updateChild, deleteChild } = useChildren();
    //funcion de añadir reserva
    const { addBooking } = useBookings();

    useEffect(() => {
        fetchMyChildren().then(setKids);
        console.log(kids.length);
    }, [fetchMyChildren]);

    console.log(kids.length);

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
                number_of_kinds: 0,
                type_of_package: pack,
                comments,
            });

            alert("✅ Reserva creada con éxito");
            // limpiar
            setName("");
            setContactNumber("");
            setKids([]);
            setPack("");
            setComments("");
        } catch (err: any) {
            alert("❌ " + err.message);
        } finally {
            setLoading(false);
        }
    };
    return (

        <div className="w-full flex flex-col sm:flex-row gap-4">
            <Calendar></Calendar>
            <form className="w-full p-6 sm:p-8 space-y-6">
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
                        Selecciona niño/os
                    </label>

                    {kids.map((kid) => (
                        <div key={kid.id} className="flex items-center px-4 py-3 !rounded-xl ps-4 border border-gray-200 rounded-sm dark:border-gray-700">
                            <input className="m-2 " id="kid" type="checkbox" key={kid.id} value={kid.name}></input>
                            <label htmlFor="kid">{kid.name}</label>
                        </div>
                    ))}
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
            </form>
        </div>
    );
}