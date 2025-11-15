import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Image as ImageIcon, FileText, Save, Loader2, Upload, Trash2 } from 'lucide-react';
import { ChildNote } from '../../types/auth';
import { useTranslation } from '../../contexts/TranslationContext';
import { showToast } from '../../lib/toast';

interface Child {
  id: number;
  name: string;
  surname: string;
}

interface ChildNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  child: Child | null;
  note?: ChildNote | null;
  onSave: (data: { content: string; images: string[] }) => Promise<void>;
  isLoading?: boolean;
}

interface ImageFile {
  id: string;
  file: File | null;
  preview: string;
}

export function ChildNoteModal({
  isOpen,
  onClose,
  child,
  note,
  onSave,
  isLoading = false
}: ChildNoteModalProps) {
  const t = useTranslation('AdminTutors');
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializar formulario cuando se abre el modal o cambia la nota
  useEffect(() => {
    if (isOpen) {
      if (note) {
        setContent(note.content);
        // Si hay imágenes existentes (URLs), las convertimos a formato de preview
        if (note.images && note.images.length > 0) {
          setImageFiles(note.images.map((url, idx) => ({
            id: `existing-${idx}`,
            file: null as any,
            preview: url
          })));
        } else {
          setImageFiles([]);
        }
      } else {
        setContent('');
        setImageFiles([]);
      }
    }
  }, [isOpen, note]);

  // Limpiar previews cuando se cierra el modal
  useEffect(() => {
    return () => {
      imageFiles.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [imageFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    // Validar que sean imágenes
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      showToast.error(t.t('onlyImagesAllowed'));
    }

    // Validar tamaño (max 10MB por imagen - se comprimirá después)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = imageFiles.filter(file => {
      if (file.size > maxSize) {
        showToast.error(`${file.name} es demasiado grande. Máximo 10MB por imagen.`);
        return false;
      }
      return true;
    });

    // Crear previews
    const newImageFiles: ImageFile[] = validFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file)
    }));

    setImageFiles(prev => [...prev, ...newImageFiles]);
    
    // Resetear input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove && imageToRemove.preview.startsWith('blob:')) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  // Función para comprimir imagen con mejor optimización
  const compressImage = (file: File, maxWidth: number = 1200, maxHeight: number = 1200, quality: number = 0.7): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calcular nuevas dimensiones manteniendo aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }

          // Mejorar calidad de renderizado
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Intentar diferentes niveles de calidad si el resultado es muy grande
          const tryCompress = (q: number): string => {
            const result = canvas.toDataURL('image/jpeg', q);
            // Si el base64 es mayor a 1MB, reducir calidad
            if (result.length > 1000000 && q > 0.5) {
              return tryCompress(q - 0.1);
            }
            return result;
          };

          const base64 = tryCompress(quality);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const convertImagesToBase64 = async (): Promise<string[]> => {
    const base64Images: string[] = [];
    
    for (const imageFile of imageFiles) {
      if (imageFile.preview.startsWith('blob:') || imageFile.file) {
        // Nueva imagen: comprimir y convertir a base64
        const file = imageFile.file;
        if (file) {
          try {
            const compressedBase64 = await compressImage(file);
            base64Images.push(compressedBase64);
          } catch (error) {
            console.error('Error comprimiendo imagen:', error);
            showToast.error(t.t('imageCompressionError'));
            throw error;
          }
        }
      } else {
        // Imagen existente (URL o base64): mantenerla
        base64Images.push(imageFile.preview);
      }
    }
    
    return base64Images;
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showToast.error(t.t('fillNoteContent'));
      return;
    }

    setIsSaving(true);
    try {
      const imagesToSend = await convertImagesToBase64();
      await onSave({
        content: content.trim(),
        images: imagesToSend
      });
      // Limpiar previews
      imageFiles.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      // El componente padre maneja el cierre y los toasts
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      // Limpiar previews
      imageFiles.forEach(img => {
        if (img.preview.startsWith('blob:')) {
          URL.revokeObjectURL(img.preview);
        }
      });
      setContent('');
      setImageFiles([]);
      onClose();
    }
  };

  if (!isOpen || !child) return null;

  const isEditing = !!note;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header mejorado */}
        <div className="sticky top-0 bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {isEditing ? t.t('editNote') : t.t('noteTitle')}
              </h3>
              <p className="text-sm text-white/90">
                {child.name} {child.surname}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Campo de contenido */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              {t.t('noteContent')}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none text-gray-800 placeholder-gray-400"
              placeholder={t.t('noteContentPlaceholder')}
              disabled={isSaving}
            />
            <p className={`text-xs mt-2 ${content.length > 900 ? 'text-amber-600' : 'text-gray-500'}`}>
              {content.length} {t.t('characters')}
            </p>
          </div>

          {/* Campo de imágenes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-green-600" />
              {t.t('images')} <span className="text-gray-500 text-xs font-normal">(opcional)</span>
            </label>
            
            {/* Input de archivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={isSaving}
              className="hidden"
            />

            {/* Botón para seleccionar imágenes */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isSaving}
              className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed border-2 border-dashed border-green-300 mb-4"
            >
              <Upload className="w-5 h-5" />
              <span>{t.t('selectImages')}</span>
            </button>

            {/* Preview de imágenes */}
            {imageFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {imageFiles.map((imageFile) => (
                  <div
                    key={imageFile.id}
                    className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-green-400 transition-all"
                  >
                    <img
                      src={imageFile.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(imageFile.id)}
                      disabled={isSaving}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                      title={t.t('removeImage')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {imageFile.file && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                        {imageFile.file.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {imageFiles.length > 0 && (
              <p className="text-xs text-gray-500 mt-3">
                {imageFiles.length} {imageFiles.length === 1 ? t.t('image') : t.t('images')} {t.t('selected')} • {t.t('maxSize')}
              </p>
            )}
          </div>
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {t.t('UserProfile.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t.t('saving')}</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>{isEditing ? t.t('updateNote') : t.t('saveNote')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

