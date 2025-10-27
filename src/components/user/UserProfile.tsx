import { User, Mail, Phone, Users, Baby, Calendar, Edit, FileText, Trash2, Plus } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useChildren } from "../../contexts/ChildrenContext";
import { Child } from "../../types/auth";

export function UserProfile() {
    const { user } = useAuth();
    const { fetchMyChildren, updateChild, addChild, deleteChild } = useChildren();
    const [children, setChildren] = useState([] as Array<Child>)

    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
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
        setIsAddingNew(false);
    };

    const handleAddNew = () => {
        setEditingChild(null);
        setIsAddingNew(true);
        setFormData({});
    };

    const handleSave = async () => {
        try {
            // Validar que los campos requeridos estén presentes
            if (!formData.name || !formData.surname || !formData.dateOfBirth) {
                alert("Por favor, completa todos los campos requeridos (Nombre, Apellidos, Fecha de Nacimiento)");
                return;
            }

            if (isAddingNew) {
                const newChild = await addChild(formData as Omit<Child, "id">);
                setChildren((prev) => [...prev, newChild]);
                setIsAddingNew(false);
            } else if (editingChild) {
                const updated = await updateChild(editingChild.id, formData);
                setChildren((prev) =>
                    prev.map((c) => (c.id === updated.id ? updated : c))
                );
                setEditingChild(null);
            }
            setFormData({});
        } catch (err) {
            console.error("Error guardando hijo:", err);
            alert("Error al guardar el hijo. Por favor, inténtalo de nuevo.");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este hijo?')) {
            try {
                await deleteChild(id);
                setChildren(prev => prev.filter(c => c.id !== id));
            } catch (err) {
                console.error("Error eliminando hijo:", err);
                alert("Error al eliminar el hijo.");
            }
        }
    };

    const handleCancel = () => {
        setEditingChild(null);
        setIsAddingNew(false);
        setFormData({});
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
                <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
                    <div className="mb-6 border-b border-gray-200 pb-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Información del Usuario
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Nombre</p>
                                <p className="font-semibold text-gray-800">{user.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border border-green-100">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Mail className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Correo</p>
                                <p className="font-semibold text-gray-800">{user.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                                <Phone className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Teléfono</p>
                                <p className="font-semibold text-gray-800">{user.phone_number || "No registrado"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Datos de los hijos */}
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Hijos Registrados
                        </h2>
                        {!isAddingNew && !editingChild && (
                            <button
                                onClick={handleAddNew}
                                className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg flex items-center space-x-2 font-medium"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Añadir Hijo</span>
                            </button>
                        )}
                    </div>

                    {isAddingNew && (
                        <div className="mb-6 bg-gradient-to-br from-white to-green-50 border-2 border-green-200 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Nuevo Hijo</h3>
                            <div className="space-y-4">
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                            <input
                                                type="text"
                                                value={formData.name || ""}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                                            <input
                                                type="text"
                                                value={formData.surname || ""}
                                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth || ""}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
                                        <textarea
                                            value={formData.allergies || ""}
                                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contacto Emergencia 1 - Nombre</label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_name_1 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name_1: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Emergencia 1</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_phone_1 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Contacto Emergencia 2 - Nombre</label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_name_2 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name_2: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Emergencia 2</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_phone_2 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_phone_2: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                                            <textarea
                                                value={formData.notes || ""}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Notas médicas</label>
                                            <textarea
                                                value={formData.medicalNotes || ""}
                                                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex space-x-3 pt-4">
                                        <button
                                            onClick={handleSave}
                                            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg font-medium"
                                        >
                                            Guardar
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-400 transition-all shadow-md hover:shadow-lg font-medium"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                            </div>
                        </div>
                    )}

                    {children.length > 0 ? (
                        <div className="space-y-4">
                            {children.map((child) => (
                                <div
                                    key={child.id}
                                    className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300"
                                >
                                    {editingChild?.id === child.id ? (
                                        // 🔹 Formulario de edición
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={formData.name || ""}
                                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
                                                    <input
                                                        type="text"
                                                        value={formData.surname || ""}
                                                        onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Alergias</label>
                                                <textarea
                                                    value={formData.allergies || ""}
                                                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                            {/* TELEFONOS DE EMERGENCIA*/}
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contacto Emergencia 1 - Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={formData.emergency_contact_name_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_contact_name_1: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Emergencia 1</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.emergency_phone_1 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Contacto Emergencia 2 - Nombre</label>
                                                    <input
                                                        type="text"
                                                        value={formData.emergency_contact_name_2 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_contact_name_2: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono Emergencia 2</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.emergency_phone_2 || ""}
                                                        onChange={(e) => setFormData({ ...formData, emergency_phone_2: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                                                    <textarea
                                                        value={formData.notes || ""}
                                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Notas médicas</label>
                                                    <textarea
                                                        value={formData.medicalNotes || ""}
                                                        onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex space-x-3 pt-4">
                                                <button
                                                    onClick={handleSave}
                                                    className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all shadow-md hover:shadow-lg font-medium"
                                                >
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={() => setEditingChild(null)}
                                                    className="bg-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-400 transition-all shadow-md hover:shadow-lg font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // 🔹 Vista normal
                                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="flex items-start space-x-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                                                    <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                                                        <Baby className="w-5 h-5 text-pink-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Nombre</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {child.name} {child.surname}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <Calendar className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Fecha Nac.</p>
                                                        <p className="font-semibold text-gray-800">
                                                            {new Date(child.dateOfBirth).toLocaleDateString("es-ES")}
                                                        </p>
                                                    </div>
                                                </div>
                                                {child.allergies && (
                                                    <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                            <FileText className="w-5 h-5 text-red-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Alergias</p>
                                                            <p className="font-semibold text-red-700">{child.allergies}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {child.emergency_phone_1 && (
                                                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                            <Phone className="w-5 h-5 text-green-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Emergencia 1</p>
                                                            <p className="font-semibold text-gray-800">
                                                                {child.emergency_contact_name_1} ({child.emergency_phone_1})
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {child.emergency_phone_2 && (
                                                    <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                            <Phone className="w-5 h-5 text-yellow-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500 mb-1">Emergencia 2</p>
                                                            <p className="font-semibold text-gray-800">
                                                                {child.emergency_contact_name_2} ({child.emergency_phone_2})
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex md:flex-col space-y-2 md:space-y-2 space-x-2 md:space-x-0">
                                                <button
                                                    onClick={() => handleEditClick(child)}
                                                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                    <span>Editar</span>
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(child.id)}
                                                    className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2 font-medium"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    <span>Eliminar</span>
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
