import { User, Mail, Phone, Users, Baby, Calendar, Edit, FileText, Trash2 } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useChildren } from "../../../contexts/ChildrenContext";
import { Child } from "../../../types/auth";

export function UserProfile() {
    const { user } = useAuth();
    const { fetchMyChildren, updateChild } = useChildren();
    const [children, setChildren] = useState([] as Array<Child>)

    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [formData, setFormData] = useState<Partial<Child>>({});

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                Cargando información del usuario...
            </div>
        );
    }

    useEffect(() => {
        if (!!user) {
            fetchMyChildren().then((children) => setChildren(children));
        }
    }, [user]);

    const handleEditClick = (child: Child) => {
        setEditingChild(child);
        setFormData(child);
    };

    const handleSave = async () => {
        if (!editingChild) return;
        try {
            const updated = await updateChild(editingChild.id, formData);
            setChildren((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c))
            );
            setEditingChild(null);
        } catch (err) {
            console.error("Error actualizando hijo:", err);
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 mb-2">
                        Mis Datos
                    </h1>
                    <p className="text-gray-600">
                        Aquí puedes ver tu información personal y la de tus hijos.
                    </p>
                </div>

                {/* Datos del usuario */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Información del Usuario
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6 text-gray-700">
                        <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-blue-500" />
                            <span className="font-medium">Nombre:</span>
                            <span>{user.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-green-500" />
                            <span className="font-medium">Correo:</span>
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium">Teléfono:</span>
                            <span>{user.phone || "No registrado"}</span>
                        </div>
                    </div>
                </div>

                {/* Datos de los hijos */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">
                        Hijos Registrados
                    </h2>

                    {children.length > 0 ? (
                        <div className="space-y-4">
                            {children.map((child) => (
                                <div
                                    key={child.id}
                                    className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-300"
                                >
                                    {editingChild?.id === child.id ? (
                                        // 🔹 Formulario de edición
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                                                <input
                                                    type="text"
                                                    value={formData.name || ""}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full border rounded-xl p-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                                                <input
                                                    type="text"
                                                    value={formData.surname || ""}
                                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                    className="w-full border rounded-xl p-2"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Alergias</label>
                                                <textarea
                                                    value={formData.allergies || ""}
                                                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                                    className="w-full border rounded-xl p-2"
                                                />
                                            </div>
                                            {/* TELEFONOS DE EMERGENCIA*/}
                                            <div className="flex flex-col ">
                                                <div className="w-full flex flex-row mb-2">
                                                    <label className="w-1/2 block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia 1</label>
                                                    <input
                                                        value={formData.emergency_contact_name_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_contact_name_1: e.target.value })}
                                                        className="w-full border rounded-xl p-2"
                                                    />
                                                    <label className="w-1/2 block text-sm font-medium text-gray-700 mb-1">Teléfono de emergencia 1</label>
                                                    <input
                                                        value={formData.emergency_phone_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                        className="w-full border rounded-xl p-2"
                                                    />
                                                </div>
                                                <div className="w-full flex flex-row mb-2">
                                                    <label className="w-1/2 block text-sm font-medium text-gray-700 mb-1">Contacto de emergencia 1</label>
                                                    <input
                                                        value={formData.emergency_phone_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                        className="w-full border rounded-xl p-2"
                                                    />
                                                    <label className="w-1/2 block text-sm font-medium text-gray-700 mb-1">Teléfono de emergencia 2</label>
                                                    <input
                                                        value={formData.emergency_phone_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                        className="w-full border rounded-xl p-2"
                                                    />
                                                </div>

                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                                <textarea
                                                    value={formData.notes || ""}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    className="w-full border rounded-xl p-2"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas médicas</label>
                                                <textarea
                                                    value={formData.medicalNotes || ""}
                                                    onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                    className="w-full border rounded-xl p-2"
                                                />
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={handleSave}
                                                    className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => setEditingChild(null)}
                                                    className="bg-gray-300 px-4 py-2 rounded-xl hover:bg-gray-400"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // 🔹 Vista normal
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2 text-gray-800">
                                                    <Baby className="w-5 h-5 text-pink-500" />
                                                    <span className="font-medium">
                                                        {child.name} {child.surname}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-gray-600">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>
                                                        Fecha Nac.:{" "}
                                                        {new Date(child.dateOfBirth).toLocaleDateString("es-ES")}
                                                    </span>
                                                </div>
                                                {child.allergies && (
                                                    <div className="flex items-center space-x-2 text-red-600">
                                                        <FileText className="w-4 h-4" />
                                                        <span>Alergias: {child.allergies}</span>
                                                    </div>
                                                )}
                                                {child.emergency_phone_1 || (
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>
                                                            Contacto de emergencia 1: {child.emergency_contact_name_1} (
                                                            {child.emergency_phone_1})
                                                        </span>
                                                    </div>
                                                )}
                                                {child.emergency_phone_2 || (
                                                    <div className="flex items-center space-x-2 text-gray-600">
                                                        <Phone className="w-4 h-4" />
                                                        <span>
                                                            Contacto de emergencia 2: {child.emergency_contact_name_2} (
                                                            {child.emergency_phone_2})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex self-end space-x-2 mt-4 md:mt-0">
                                                <button
                                                    onClick={() => handleEditClick(child)}
                                                    className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 flex items-center space-x-2"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Editar</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">
                                No tienes hijos registrados
                            </h3>
                            <p className="text-gray-500 mb-6">
                                Puedes añadirlos en el área de configuración de tu cuenta.
                            </p>
                            <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                                Añadir Hijo
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}      
