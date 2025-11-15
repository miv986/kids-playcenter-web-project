import React, { useEffect, useState } from 'react';
import { Users, User, Mail, Phone, Copy, Check } from 'lucide-react';
import { useHttp } from '../../contexts/HttpContext';
import { useAuth } from '../../contexts/AuthContext';
import { es, ca } from 'date-fns/locale';
import { useTranslation } from '../../contexts/TranslationContext';
import { showToast } from '../../lib/toast';
import { ChildNote } from '../../types/auth';
import { useConfirm } from '../../hooks/useConfirm';
import { Spinner } from '../shared/Spinner';
import { ChildNoteModal } from '../modals/ChildNoteModal';
import { SearchBar } from '../shared/SearchBar';
import { Pagination } from '../shared/Pagination';
import { ImageViewerModal } from '../shared/ImageViewerModal';
import { ChildCard } from '../shared/ChildCard';

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
  const t = useTranslation('AdminTutors');
  const locale = t.locale;
  const dateFnsLocale = locale === 'ca' ? ca : es;
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
  const [editingNote, setEditingNote] = useState<ChildNote | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  
  // Estados para ver notas existentes
  const [childNotes, setChildNotes] = useState<Record<number, ChildNote[]>>({});
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});
  const [loadingNotes, setLoadingNotes] = useState<Record<number, boolean>>({});
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [viewingImageName, setViewingImageName] = useState<string>('');
  const { confirm, ConfirmComponent } = useConfirm();

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

  const handleOpenNoteModal = (child: Child, note?: ChildNote) => {
    setSelectedChild(child);
    setEditingNote(note || null);
    setShowNoteModal(true);
  };

  const handleCloseNoteModal = () => {
    setShowNoteModal(false);
    setSelectedChild(null);
    setEditingNote(null);
  };

  const handleSaveNote = async (data: { content: string; images: string[] }) => {
    if (!selectedChild) return;

    try {
      if (editingNote) {
        // Actualizar nota existente
        await http.put(`/api/childNote/${editingNote.id}`, {
          content: data.content,
          images: data.images
        });
        showToast.success(t.t('noteUpdated'));
        // Refrescar notas del hijo
        if (childNotes[selectedChild.id]) {
          await fetchChildNotes(selectedChild.id);
        }
      } else {
        // Crear nueva nota
        await http.post('/api/childNote', {
          childId: selectedChild.id,
          content: data.content,
          images: data.images
        });
        showToast.success(t.t('noteCreated'));
        // Refrescar notas del hijo
        if (childNotes[selectedChild.id]) {
          await fetchChildNotes(selectedChild.id);
        }
      }
      handleCloseNoteModal();
    } catch (err) {
      console.error('Error guardando nota:', err);
      showToast.error(t.t('noteError'));
      throw err; // Re-lanzar para que el modal maneje el error
    }
  };

  // Función para obtener las notas de un hijo
  const fetchChildNotes = async (childId: number) => {
    if (loadingNotes[childId]) return;
    
    setLoadingNotes(prev => ({ ...prev, [childId]: true }));
    try {
      const notes = await http.get(`/api/childNote/child/${childId}`);
      // Filtrar solo las notas del admin actual
      const adminNotes = notes.filter((note: ChildNote) => note.adminId === user?.id);
      setChildNotes(prev => ({ ...prev, [childId]: adminNotes }));
    } catch (error) {
      console.error("Error fetching child notes:", error);
      showToast.error(t.t('errorLoadingNotes'));
    } finally {
      setLoadingNotes(prev => ({ ...prev, [childId]: false }));
    }
  };

  // Toggle para expandir/colapsar notas de un hijo
  const toggleChildNotes = (childId: number) => {
    setExpandedNotes(prev => ({ ...prev, [childId]: !prev[childId] }));
    // Cargar notas si no están cargadas
    if (!childNotes[childId] && !loadingNotes[childId]) {
      fetchChildNotes(childId);
    }
  };

  // Función para eliminar nota
  const handleDeleteNote = async (noteId: number, childId: number) => {
    const confirmed = await confirm({ 
      message: t.t('confirmDeleteNote') || '¿Estás seguro de que quieres eliminar esta nota?',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      await http.delete(`/api/childNote/${noteId}`);
      showToast.success(t.t('noteDeleted'));
      // Actualizar estado local
      setChildNotes(prev => ({
        ...prev,
        [childId]: prev[childId]?.filter(note => note.id !== noteId) || []
      }));
    } catch (error) {
      console.error("Error eliminando nota:", error);
      showToast.error(t.t('errorDeletingNote'));
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
        <div className="text-gray-500">{t.t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pb-8">
      <div className="mb-4 lg:mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-1">{t.t('title')}</h1>
        <p className="text-sm text-gray-600">{t.t('subtitle')}</p>
      </div>

      {/* Barra de búsqueda sticky */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        total={total}
        resultsLabel={t.t('results')}
        resultsPluralLabel={t.t('resultsPlural')}
        placeholder={t.t('searchPlaceholder')}
        clearLabel={t.t('clear')}
        sticky={true}
      />

      {tutors.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center">
          <Users className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-600 mb-1.5">{t.t('noTutors')}</h3>
          <p className="text-sm lg:text-base text-gray-500">{t.t('noTutorsDesc')}</p>
        </div>
      ) : total === 0 && searchQuery && !loading ? (
        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8 text-center">
          <Users className="w-12 h-12 lg:w-16 lg:h-16 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg lg:text-xl font-semibold text-gray-600 mb-1.5">{t.t('noResults')}</h3>
          <p className="text-sm lg:text-base text-gray-500 mb-3">
            {t.t('noResultsDesc')} "<strong>{debouncedSearch || searchQuery}</strong>"
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            {t.t('clearSearch')}
          </button>
        </div>
      ) : (
        <>
        <div className="space-y-4 lg:space-y-3">
          {tutors.map((tutor) => {
            const isExpanded = expandedTutors.has(tutor.id);
            return (
              <div key={tutor.id} className={`bg-white ${isExpanded ? 'rounded-t-xl rounded-b-xl border-2 border-blue-500 shadow-md' : 'rounded-xl shadow-sm hover:shadow-md mb-2'} overflow-hidden transition-all`}>
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
                              title={t.t('copyEmail')}
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
                              title={t.t('copyPhone')}
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
                      <div className="text-[0.85rem] text-gray-500">{t.t('children')}</div>
                      <div className="text-2xl lg:text-xl font-bold text-blue-600">{tutor.children.length}</div>
                    </div>
                  </div>
                </div>

                {/* Lista de hijos (expandible) */}
                {expandedTutors.has(tutor.id) && (
                  <div className="border-t bg-gray-50">
                    <div className="p-3 space-y-2">
                      {tutor.children.map((child) => (
                        <ChildCard
                          key={child.id}
                          child={child}
                          dateFnsLocale={dateFnsLocale}
                          expandedNotes={expandedNotes[child.id] || false}
                          notes={childNotes[child.id]}
                          isLoadingNotes={loadingNotes[child.id] || false}
                          notesCount={childNotes[child.id]?.length || 0}
                          copiedPhone={copiedPhone}
                          onToggleNotes={() => toggleChildNotes(child.id)}
                          onAddNote={() => handleOpenNoteModal(child)}
                          onEditNote={(note) => handleOpenNoteModal(child, note)}
                          onDeleteNote={(noteId) => handleDeleteNote(noteId, child.id)}
                          onImageClick={(url, childName) => {
                            setViewingImageUrl(url);
                            setViewingImageName(childName);
                          }}
                          onCopyPhone={handleCopyPhone}
                          translations={{
                            birthDate: t.t('birthDate'),
                            emergency1: t.t('emergency1'),
                            emergency2: t.t('emergency2'),
                            allergies: t.t('allergies'),
                            notes: t.t('notes'),
                            medicalNotes: t.t('medicalNotes'),
                            notRegistered: t.t('notRegistered'),
                            noPhone: t.t('noPhone'),
                            noAllergies: t.t('noAllergies'),
                            noNotes: t.t('noNotes'),
                            noMedicalNotes: t.t('noMedicalNotes'),
                            viewNotes: t.t('viewNotes'),
                            addNote: t.t('addNote'),
                            copyPhone: t.t('copyPhone'),
                            loadingNotes: t.t('loadingNotes'),
                            noNotesYet: t.t('noNotesYet')
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>


        {/* Paginación */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
        </>
      )}

      {/* Modal para dejar notas */}
      <ChildNoteModal
        isOpen={showNoteModal}
        onClose={handleCloseNoteModal}
        child={selectedChild}
        note={editingNote}
        onSave={handleSaveNote}
      />

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

      {ConfirmComponent}
    </div>
  );
}

