import { useState, useEffect } from "react";
import { useAuth } from '../../contexts/AuthContext';
import { useBookings } from "../../contexts/BookingContext";
import { useChildren } from "../../contexts/ChildrenContext";
import { Child } from "../../types/auth";
import { showToast } from '../../lib/toast';
import { useTranslation } from '../../contexts/TranslationContext';


export function Playcenter() {
    const { t } = useTranslation('PlaycenterForm');
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
            showToast.error(t('mustLogin'));
            setLoading(false);
            return;
        }
        try {


            showToast.success(t('bookingCreated'));
            // limpiar
            setName("");
            setContactNumber("");
            setKids([]);
            setPack("");
            setComments("");
        } catch (err: any) {
            showToast.error(err.message || t('errorCreating'));
        } finally {
            setLoading(false);
        }
    };
    return (

        <div className="w-full flex flex-col sm:flex-row gap-4">
            <form className="w-full p-6 sm:p-8 space-y-6">
                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {t('responsibleName')}
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder={t('namePlaceholder')} />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {t('contactPhone')}
                    </label>
                    <input
                        type="tel"
                        value={contact_number}
                        onChange={e => setContactNumber(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        placeholder={t('phonePlaceholder')} />
                </div>

                <div>
                    <label className="block text-gray-700 font-medium mb-2">
                        {t('selectChildren')}
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
                        {t('additionalComments')}
                    </label>
                    <textarea
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 transition-all duration-200"
                        value={comments}
                        onChange={e => setComments(e.target.value)}
                        placeholder={t('celebrationComments')}
                    ></textarea>
                </div>


                <button
                    onClick={handleSubmit}
                    type="submit"
                    className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white py-4 rounded-xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                    {loading ? t('processing') : t('confirmBooking')}
                </button>
            </form>
        </div>
    );
}