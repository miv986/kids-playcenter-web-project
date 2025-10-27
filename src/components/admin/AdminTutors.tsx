import React, { useEffect, useState } from 'react';
import { Users, User, Mail, Phone, FileText, Plus, X, Search, ChevronLeft, ChevronRight, Filter, Copy, Check } from 'lucide-react';
import { useHttp } from '../../contexts/HttpContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Tutor {
  id: number;
  name: string;
  surname: string;
  email: string;
  phone_number: string;
  children: Child[];
}

interface Child {
  id: number;
  name: string;
  surname: string;
  dateOfBirth: Date | null;
  notes: string | null;
  medicalNotes: string | null;
  allergies: string | null;
  emergency_contact_name_1: string | null;
  emergency_phone_1: string | null;
  emergency_contact_name_2: string | null;
  emergency_phone_2: string | null;
}

export function AdminTutors() {
  const http = useHttp();
  const { user } = useAuth();
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [expandedTutors, setExpandedTutors] = useState<Set<number>>(new Set());

  // Estados para búsqueda y paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;

  // Estados para notas del admin
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteForm, setNoteForm] = useState({ content: '', images: [''] as string[] });
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Debounce para la búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Resetear página solo cuando cambia la búsqueda debounced
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch cuando cambien la página o la búsqueda
  useEffect(() => {
    fetchTutors();
  }, [currentPage, debouncedSearch]);

  const fetchTutors = async () => {
    try {
      // Solo mostrar loading en la carga inicial
      if (isInitialLoad) {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const data = await http.get(`/api/admin/tutors?${params.toString()}`);
      
      setTutors(data.tutors || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error cargando tutores:', err);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      }
    }
  };

  const handleToggleExpanded = (tutorId: number) => {
    setExpandedTutors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tutorId)) {
        newSet.delete(tutorId);
      } else {
        newSet.add(tutorId);
      }
      return newSet;
    });
  };

  const handleOpenNoteModal = (child: Child) => {
    setSelectedChild(child);
    setShowNoteModal(true);
  };

  const handleCloseNoteModal = () => {
    setShowNoteModal(false);
    setSelectedChild(null);
    setNoteForm({ content: '', images: [''] });
  };

  const handleAddImageUrl = () => {
    setNoteForm({ ...noteForm, images: [...noteForm.images, ''] });
  };

  const handleImageUrlChange = (index: number, url: string) => {
    const newImages = [...noteForm.images];
    newImages[index] = url;
    setNoteForm({ ...noteForm, images: newImages });
  };

  const handleRemoveImageUrl = (index: number) => {
    const newImages = noteForm.images.filter((_, i) => i !== index);
    setNoteForm({ ...noteForm, images: newImages });
  };

  const handleSaveNote = async () => {
    if (!selectedChild || !noteForm.content.trim()) {
      alert('Por favor, completa el contenido de la nota');
      return;
    }

    try {
      const imagesToSend = noteForm.images.filter(img => img.trim() !== '');
      await http.post('/api/childNote', {
        childId: selectedChild.id,
        content: noteForm.content,
        images: imagesToSend
      });
      alert('Nota creada exitosamente');
      handleCloseNoteModal();
    } catch (err) {
      console.error('Error guardando nota:', err);
      alert('Error al guardar la nota');
    }
  };

  // Expandir automáticamente los tutores si hay búsqueda
  useEffect(() => {
    if (searchQuery && tutors.length > 0) {
      const newExpanded = new Set(tutors.map(t => t.id));
      setExpandedTutors(newExpanded);
    }
  }, [searchQuery, tutors]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyPhone = async (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (err) {
      console.error('Error copiando teléfono:', err);
    }
  };

  const handleCopyEmail = async (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopiedPhone(email);
      setTimeout(() => setCopiedPhone(null), 2000);
    } catch (err) {
      console.error('Error copiando email:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando tutores...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">Gestión de Tutores e Hijos</h1>
        <p className="text-sm text-gray-600">Visualiza y gestiona notas de los hijos registrados</p>
      </div>

      {/* Barra de búsqueda compacta */}
      <div className="bg-white rounded-xl shadow-md p-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, apellido, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-100 text-red-600 p-1.5 rounded hover:bg-red-200 transition-colors"
              title="Limpiar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {total} {total === 1 ? 'resultado' : 'resultados'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg">
              <Search className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-sm text-gray-700">"{debouncedSearch || searchQuery}"</span>
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        )}
      </div>

      {tutors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center">
          <Users className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-600 mb-1.5">No hay tutores registrados</h3>
          <p className="text-sm lg:text-base text-gray-500">Aún no se han registrado tutores con hijos en el sistema</p>
        </div>
      ) : total === 0 && searchQuery && !loading ? (
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center">
          <Search className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-600 mb-1.5">No se encontraron resultados</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-3">
            No hay tutores o hijos que coincidan con "<strong>{debouncedSearch || searchQuery}</strong>"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <>
        <div className="space-y-3 lg:space-y-2">
          {tutors.map((tutor) => {
            const isExpanded = expandedTutors.has(tutor.id);
            return (
              <div key={tutor.id} className={`bg-white ${isExpanded ? 'rounded-t-xl rounded-b-xl border-2 border-blue-500 shadow-md' : 'rounded-xl shadow-sm hover:shadow-md'} overflow-hidden transition-all`}>
                {/* Header del tutor */}
                <div
                  className={`p-4 lg:p-3 cursor-pointer transition-colors ${isExpanded ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleToggleExpanded(tutor.id)}
                >
                  <div className="flex flex-row lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-0">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 lg:w-5 lg:h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl lg:text-lg font-semibold text-gray-800 truncate">
                          {tutor.name} {tutor.surname}
                        </h3>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mt-1 text-[0.85rem] text-gray-600">
                          {tutor.email && (
                            <button
                              onClick={(e) => handleCopyEmail(tutor.email, e)}
                              className="flex items-center gap-1.5 lg:gap-1 truncate hover:text-blue-600 transition-colors cursor-pointer group"
                              title="Copiar email"
                            >
                              <Mail className="w-4 h-4 lg:w-3 lg:h-3 flex-shrink-0" />
                              <span className="truncate">{tutor.email}</span>
                              {copiedPhone === tutor.email ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          )}
                          {tutor.phone_number && (
                            <button
                              onClick={(e) => handleCopyPhone(tutor.phone_number, e)}
                              className="flex items-center gap-1.5 lg:gap-1 flex-shrink-0 hover:text-blue-600 transition-colors cursor-pointer"
                              title="Copiar teléfono"
                            >
                              <Phone className="w-4 h-4 lg:w-3 lg:h-3" />
                              <span>{tutor.phone_number}</span>
                              {copiedPhone === tutor.phone_number ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 lg:ml-2">
                      <div className="text-[0.85rem] text-gray-500">Hijos</div>
                      <div className="text-2xl lg:text-xl font-bold text-blue-600">{tutor.children.length}</div>
                    </div>
                  </div>
                </div>

                {/* Lista de hijos (expandible) */}
                {expandedTutors.has(tutor.id) && (
                  <div className="border-t bg-gray-50">
                    <div className="p-3 space-y-2">
                      {tutor.children.map((child) => (
                        <div key={child.id} className="bg-white rounded-lg p-3 lg:p-2 border border-gray-200">
                        <div className="flex justify-between items-center mb-2 lg:mb-1.5">
                          <div>
                            <h4 className="text-base lg:text-sm font-semibold text-gray-800">
                              {child.name} {child.surname}
                            </h4>
                          </div>
                          <button
                            onClick={() => handleOpenNoteModal(child)}
                            className="p-2 lg:p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200 transition-colors flex-shrink-0"
                            title="Dejar nota para el padre"
                          >
                            <Plus className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
                          </button>
                        </div>

                        {/* Información del hijo - Layout compacto */}
                        <div className="grid grid-cols-2 gap-2.5 lg:gap-2">
                          <div className="bg-gray-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-gray-200">
                            <p className="text-[0.85rem] font-semibold text-gray-800 mb-1">Fecha Nacimiento</p>
                            <p className="text-base text-gray-700">{child.dateOfBirth ? format(new Date(child.dateOfBirth), "dd/MM/yyyy", { locale: es }) : "No registrada"}</p>
                          </div>
                          <div className="bg-orange-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-orange-200">
                            <p className="text-[0.85rem] font-semibold text-orange-800 mb-1">Emergencia 1</p>
                            <p className="text-base text-gray-700 truncate">{child.emergency_contact_name_1 || "No registrado"}</p>
                            {child.emergency_phone_1 ? (
                              <button
                                onClick={(e) => handleCopyPhone(child.emergency_phone_1!, e)}
                                className="text-base text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                                title="Copiar teléfono"
                              >
                                {child.emergency_phone_1}
                                {copiedPhone === child.emergency_phone_1 ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            ) : (
                              <p className="text-base text-gray-600">Sin teléfono</p>
                            )}
                          </div>
                          <div className="bg-orange-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-orange-200">
                            <p className="text-[0.85rem] font-semibold text-orange-800 mb-1">Emergencia 2</p>
                            <p className="text-base text-gray-700 truncate">{child.emergency_contact_name_2 || "No registrado"}</p>
                            {child.emergency_phone_2 ? (
                              <button
                                onClick={(e) => handleCopyPhone(child.emergency_phone_2!, e)}
                                className="text-base text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1 group"
                                title="Copiar teléfono"
                              >
                                {child.emergency_phone_2}
                                {copiedPhone === child.emergency_phone_2 ? (
                                  <Check className="w-3 h-3 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </button>
                            ) : (
                              <p className="text-base text-gray-600">Sin teléfono</p>
                            )}
                          </div>
                          <div className="bg-red-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-red-200">
                            <p className="text-[0.85rem] font-semibold text-red-800 mb-1 flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Alergias
                            </p>
                            <p className="text-base text-red-700 line-clamp-2">{child.allergies || "Sin alergias"}</p>
                          </div>
                          <div className="bg-blue-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-blue-200">
                            <p className="text-[0.85rem] font-semibold text-blue-800 mb-1 flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Notas
                            </p>
                            <p className="text-base text-blue-700 line-clamp-2">{child.notes || "Sin notas"}</p>
                          </div>
                          <div className="bg-purple-50 px-3 py-2 lg:px-2 lg:py-1.5 rounded border border-purple-200">
                            <p className="text-[0.85rem] font-semibold text-purple-800 mb-1 flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Médicas
                            </p>
                            <p className="text-base text-purple-700 line-clamp-2">{child.medicalNotes || "Sin notas médicas"}</p>
                          </div>
                        </div>
                      </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 lg:gap-1.5 mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg ${
                      page === currentPage
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-1">...</span>;
              }
              return null;
            })}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        </>
      )}

      {/* Modal para dejar notas */}
      {showNoteModal && selectedChild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-2xl font-bold text-gray-800">
                Dejar nota para {selectedChild.name} {selectedChild.surname}
              </h3>
              <button
                onClick={handleCloseNoteModal}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contenido de la nota
                </label>
                <textarea
                  rows={8}
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Escribe la nota para el padre del niño..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs de imágenes (opcional)
                </label>
                <div className="space-y-3">
                  {noteForm.images.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleImageUrlChange(index, e.target.value)}
                        placeholder="https://..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      {noteForm.images.length > 1 && (
                        <button
                          onClick={() => handleRemoveImageUrl(index)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddImageUrl}
                    className="w-full px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar otra imagen
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex gap-3">
              <button
                onClick={handleSaveNote}
                className="flex-1 bg-green-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors"
              >
                Guardar Nota
              </button>
              <button
                onClick={handleCloseNoteModal}
                className="flex-1 bg-gray-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

