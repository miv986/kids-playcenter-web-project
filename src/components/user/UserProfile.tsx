import { User, Mail, Phone, Baby, Calendar, Edit, FileText, Trash2, Plus, MessageSquare, ChevronDown, ChevronUp, UserCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useEffect, useState } from "react";
import { useChildren } from "../../contexts/ChildrenContext";
import { Child, ChildNote } from "../../types/auth";
import { useTranslation } from "../../contexts/TranslationContext";
import { Spinner } from "../shared/Spinner";
import { showToast } from "../../lib/toast";
import { useConfirm } from "../../hooks/useConfirm";
import { useHttp } from "../../contexts/HttpContext";
import { es, ca } from "date-fns/locale";
import { ChildNotesSection } from "../shared/ChildNotesSection";
import { ImageViewerModal } from "../shared/ImageViewerModal";

export function UserProfile() {
    const { user } = useAuth();
    const { fetchMyChildren, updateChild, addChild, deleteChild } = useChildren();
    const http = useHttp();
    const t = useTranslation('UserProfile');
    const locale = t.locale;
    const { confirm, ConfirmComponent } = useConfirm();
    const [children, setChildren] = useState([] as Array<Child>)

    const [editingChild, setEditingChild] = useState<Child | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [formData, setFormData] = useState<Partial<Child>>({});
    const [isLoadingChildren, setIsLoadingChildren] = useState(true);

    // Estado para las notas del admin
    const [childNotes, setChildNotes] = useState<Record<number, ChildNote[]>>({});
    const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set());
    const [loadingNotes, setLoadingNotes] = useState<Record<number, boolean>>({});
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [viewingImageName, setViewingImageName] = useState<string>('');

    const dateFnsLocale = locale === 'ca' ? ca : es;

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                {t.t('loading')}
            </div>
        );
    }

    useEffect(() => {
        if (!!user) {
            setIsLoadingChildren(true);
            fetchMyChildren().then((children) => {
                setChildren(children);
                setIsLoadingChildren(false);
                // Cargar notas de todos los hijos para mostrar contadores
                children.forEach((child) => {
                    fetchChildNotes(child.id);
                });
            }).catch(() => {
                setIsLoadingChildren(false);
            });
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
                showToast.error(t.t('fillRequired'));
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
            showToast.success(isAddingNew ? t.t('childAdded') : t.t('childUpdated'));
        } catch (err) {
            console.error("Error guardando hijo:", err);
            showToast.error(t.t('errorSaving'));
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await confirm({
            message: t.t('confirmDelete'),
            variant: 'danger'
        });
        if (!confirmed) return;

        try {
            await deleteChild(id);
            setChildren(prev => prev.filter(c => c.id !== id));
            showToast.success(t.t('childDeleted'));
        } catch (err) {
            console.error("Error eliminando hijo:", err);
            showToast.error(t.t('errorDeleting'));
        }
    };

    const handleCancel = () => {
        setEditingChild(null);
        setIsAddingNew(false);
        setFormData({});
    };

    // Función para obtener las notas de un hijo
    const fetchChildNotes = async (childId: number) => {
        if (loadingNotes[childId]) return;

        setLoadingNotes(prev => ({ ...prev, [childId]: true }));
        try {
            const notes = await http.get(`/api/childNote/child/${childId}`);
            setChildNotes(prev => ({ ...prev, [childId]: notes }));
        } catch (error) {
            console.error("Error fetching child notes:", error);
            showToast.error(t.t('errorLoadingNotes') || 'Error cargando notas');
        } finally {
            setLoadingNotes(prev => ({ ...prev, [childId]: false }));
        }
    };

    // Función para marcar nota como leída
    const markNoteAsRead = async (noteId: number, childId: number) => {
        try {
            await http.put(`/api/childNote/${noteId}/read`);
            setChildNotes(prev => ({
                ...prev,
                [childId]: prev[childId]?.map(note =>
                    note.id === noteId ? { ...note, isRead: true } : note
                ) || []
            }));
        } catch (error) {
            console.error("Error marking note as read:", error);
        }
    };

    // Toggle para expandir/colapsar notas de un hijo
    const toggleChildNotes = (childId: number) => {
        const newExpanded = new Set(expandedChildren);
        if (newExpanded.has(childId)) {
            newExpanded.delete(childId);
        } else {
            newExpanded.add(childId);
            // Cargar notas si no están cargadas
            if (!childNotes[childId]) {
                fetchChildNotes(childId);
            }
        }
        setExpandedChildren(newExpanded);
    };

    // Contar notas no leídas de un hijo
    const getUnreadCount = (childId: number) => {
        return childNotes[childId]?.filter(note => !note.isRead).length || 0;
    };


    return (
        <div className="min-h-screen bg-gray-50 py-6">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-1">
                        {t.t('title')}
                    </h1>
                    <p className="text-gray-600 text-sm">
                        {t.t('subtitle')}
                    </p>
                </div>

                {/* Datos del usuario - Diseño amigable */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100 p-6 mb-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {t.t('userInfo')}
                            </h2>
                            <p className="text-sm text-gray-600">{user.name}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.t('email')}</p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 ml-12">{user.email}</p>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-white/50 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t.t('phone')}</p>
                                </div>
                            </div>
                            <p className="text-sm font-semibold text-gray-800 ml-12">{user.phone_number || t.t('notRegistered')}</p>
                        </div>
                    </div>
                </div>

                {/* Datos de los hijos */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-5 border-b border-gray-200 flex justify-between items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            {t.t('children')}
                        </h2>
                        {!isAddingNew && !editingChild && (
                            <button
                                onClick={handleAddNew}
                                className="bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 flex items-center justify-center gap-2 text-sm font-medium min-w-[48px] sm:min-w-0"
                            >
                                <Plus className="w-4 h-4 flex-shrink-0" />
                                <span className="hidden sm:inline">{t.t('addChild')}</span>
                            </button>
                        )}
                    </div>
                    <div className="p-5">

                        {isAddingNew && (
                            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-5">
                                <h3 className="text-base font-semibold text-gray-800 mb-4">{t.t('newChild')}</h3>
                                <div className="space-y-3">
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('name')}</label>
                                            <input
                                                type="text"
                                                value={formData.name || ""}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('surname')}</label>
                                            <input
                                                type="text"
                                                value={formData.surname || ""}
                                                onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('dateOfBirth')}</label>
                                        <input
                                            type="date"
                                            value={formData.dateOfBirth || ""}
                                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('allergies')}</label>
                                        <textarea
                                            value={formData.allergies || ""}
                                            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyContact1Name')}</label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_name_1 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name_1: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyPhone1')}</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_phone_1 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyContact2Name')}</label>
                                            <input
                                                type="text"
                                                value={formData.emergency_contact_name_2 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_contact_name_2: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyPhone2')}</label>
                                            <input
                                                type="tel"
                                                value={formData.emergency_phone_2 || ""}
                                                onChange={(e) => setFormData({ ...formData, emergency_phone_2: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('notes')}</label>
                                            <textarea
                                                value={formData.notes || ""}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                rows={2}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('medicalNotes')}</label>
                                            <textarea
                                                value={formData.medicalNotes || ""}
                                                onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                rows={2}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-3">
                                        <button
                                            onClick={handleSave}
                                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
                                        >
                                            {t.t('save')}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm font-medium"
                                        >
                                            {t.t('cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isLoadingChildren ? (
                            <div className="flex items-center justify-center py-12">
                                <Spinner size="lg" text={t.t('loading')} />
                            </div>
                        ) : children.length > 0 ? (
                            <div className="space-y-3">
                                {children.map((child) => (
                                    <div
                                        key={child.id}
                                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                                    >
                                        {editingChild?.id === child.id ? (
                                            // 🔹 Formulario de edición
                                            <div className="space-y-3">
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('name')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.name || ""}
                                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('surname')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.surname || ""}
                                                            onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('allergies')}</label>
                                                    <textarea
                                                        value={formData.allergies || ""}
                                                        onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                        rows={2}
                                                    />
                                                </div>
                                                {/* TELEFONOS DE EMERGENCIA*/}
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyContact1Name')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.emergency_contact_name_1 || ""}
                                                            onChange={(e) => setFormData({ ...formData, emergency_contact_name_1: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyPhone1')}</label>
                                                        <input
                                                            type="tel"
                                                            value={formData.emergency_phone_1 || ""}
                                                            onChange={(e) => setFormData({ ...formData, emergency_phone_1: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyContact2Name')}</label>
                                                        <input
                                                            type="text"
                                                            value={formData.emergency_contact_name_2 || ""}
                                                            onChange={(e) => setFormData({ ...formData, emergency_contact_name_2: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('emergencyPhone2')}</label>
                                                        <input
                                                            type="tel"
                                                            value={formData.emergency_phone_2 || ""}
                                                            onChange={(e) => setFormData({ ...formData, emergency_phone_2: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid md:grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('notes')}</label>
                                                        <textarea
                                                            value={formData.notes || ""}
                                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1.5">{t.t('medicalNotes')}</label>
                                                        <textarea
                                                            value={formData.medicalNotes || ""}
                                                            onChange={(e) => setFormData({ ...formData, medicalNotes: e.target.value })}
                                                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-2">
                                                    <button
                                                        onClick={handleSave}
                                                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 text-sm font-medium"
                                                    >
                                                        {t.t('save')}
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingChild(null)}
                                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all duration-200 text-sm font-medium"
                                                    >
                                                        {t.t('cancel')}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            // 🔹 Vista normal
                                            <>
                                                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Baby className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-gray-500 mb-0.5">{t.t('name')}</p>
                                                                <p className="font-medium text-gray-800 text-sm truncate">
                                                                    {child.name} {child.surname}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
                                                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                <Calendar className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs text-gray-500 mb-0.5">{t.t('dateOfBirthShort')}</p>
                                                                <p className="font-medium text-gray-800 text-sm">
                                                                    {new Date(child.dateOfBirth).toLocaleDateString(locale === 'ca' ? 'ca-ES' : 'es-ES')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {child.allergies && (
                                                            <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-red-200">
                                                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <FileText className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 mb-0.5">{t.t('allergies')}</p>
                                                                    <p className="font-medium text-red-700 text-sm truncate">{child.allergies}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {child.emergency_phone_1 && (
                                                            <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
                                                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Phone className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 mb-0.5">{t.t('emergency1')}</p>
                                                                    <p className="font-medium text-gray-800 text-sm truncate">
                                                                        {child.emergency_contact_name_1} ({child.emergency_phone_1})
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {child.emergency_phone_2 && (
                                                            <div className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-gray-200">
                                                                <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <Phone className="w-4 h-4 text-white" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs text-gray-500 mb-0.5">{t.t('emergency2')}</p>
                                                                    <p className="font-medium text-gray-800 text-sm truncate">
                                                                        {child.emergency_contact_name_2} ({child.emergency_phone_2})
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => toggleChildNotes(child.id)}
                                                            className={`relative px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium ${expandedChildren.has(child.id)
                                                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                                                }`}
                                                            title={t.t('adminNotes') || 'Notas del administrador'}
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span className="hidden sm:inline">{t.t('adminNotes') || 'Notas'}</span>
                                                            {getUnreadCount(child.id) > 0 && (
                                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                                                    {getUnreadCount(child.id)}
                                                                </span>
                                                            )}
                                                            {expandedChildren.has(child.id) ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditClick(child)}
                                                            className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                                                            title={t.t('edit')}
                                                        >
                                                            <Edit className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(child.id)}
                                                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                                                            title={t.t('delete')}
                                                        >
                                                            <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Sección de notas del admin */}
                                                {expandedChildren.has(child.id) && (
                                                    <ChildNotesSection
                                                        childId={child.id}
                                                        notes={childNotes[child.id]}
                                                        isLoading={loadingNotes[child.id] || false}
                                                        dateFnsLocale={dateFnsLocale}
                                                        onImageClick={(url) => {
                                                            setViewingImageUrl(url);
                                                            setViewingImageName(`${child.name} ${child.surname}`);
                                                        }}
                                                        childName={`${child.name} ${child.surname}`}
                                                        showActions={false}
                                                        onMarkAsRead={(noteId) => markNoteAsRead(noteId, child.id)}
                                                        noNotesText={t.t('noNotes') || 'No hay notas del administrador'}
                                                        loadingText={t.t('loadingNotes') || 'Cargando notas...'}
                                                        showAdminName={true}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h3 className="text-base font-semibold text-gray-600 mb-1">
                                    {t.t('noChildren')}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    {t.t('canAddChildren')}
                                </p>
                                <button onClick={handleAddNew} className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-all duration-200 text-sm flex items-center justify-center gap-2 min-w-[48px]">
                                    <Plus className="w-4 h-4 flex-shrink-0" />
                                    <span className="hidden sm:inline">{t.t('addChild')}</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {ConfirmComponent}

            {/* Modal para ver imagen en grande */}
            <ImageViewerModal
                isOpen={!!viewingImageUrl}
                onClose={() => {
                    setViewingImageUrl(null);
                    setViewingImageName('');
                }}
                imageUrl={viewingImageUrl || ''}
                imageName={viewingImageName}
            />
        </div>
    );
}      
