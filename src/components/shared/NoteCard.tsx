import React from 'react';
import { Clock, Edit, Trash2, Image as ImageIcon, UserCircle } from 'lucide-react';
import { ChildNote } from '../../types/auth';
import { format } from 'date-fns';
import { Locale } from 'date-fns';
import { useTranslation } from '../../contexts/TranslationContext';

interface NoteCardProps {
  note: ChildNote;
  dateFnsLocale: Locale;
  onEdit?: () => void;
  onDelete?: () => void;
  onImageClick?: (url: string) => void;
  showActions?: boolean;
  isRead?: boolean;
  onMarkAsRead?: () => void;
  showAdminName?: boolean;
}

export function NoteCard({
  note,
  dateFnsLocale,
  onEdit,
  onDelete,
  onImageClick,
  showActions = true,
  isRead,
  onMarkAsRead,
  showAdminName = false
}: NoteCardProps) {
  const { t } = useTranslation('AdminTutors');
  const tUserProfile = useTranslation('UserProfile');
  const noteIsRead = isRead !== undefined ? isRead : note.isRead;

  return (
    <div
      className={`bg-white rounded-lg border-2 p-3 transition-all duration-200 ${
        !noteIsRead
          ? 'border-blue-300 bg-blue-50/30 shadow-md hover:border-blue-400'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onMarkAsRead && !noteIsRead ? onMarkAsRead : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`${showAdminName ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm`}>
            {showAdminName ? <UserCircle className="w-5 h-5 text-white" /> : <Clock className="w-4 h-4 text-white" />}
          </div>
          <div>
            {showAdminName && note.admin && (
              <p className="font-semibold text-gray-800 text-sm mb-1">
                {note.admin.name} {note.admin.surname}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>
                {format(new Date(note.noteDate), "dd/MM/yyyy HH:mm", { locale: dateFnsLocale })}
              </span>
            </div>
          </div>
        </div>
        {showActions && (onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title={t('editNote')}
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title={t('deleteNote')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        {!noteIsRead && (
          <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full font-medium">
            {tUserProfile.t('new')}
          </span>
        )}
      </div>
      <p className="text-gray-700 text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
      {note.images && note.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {note.images.map((imageUrl, idx) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-gray-100 aspect-square"
              onClick={(e) => {
                e.stopPropagation();
                if (onImageClick) {
                  onImageClick(imageUrl);
                }
              }}
            >
              <img
                src={imageUrl}
                alt={`${t('image')} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

