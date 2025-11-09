import React from 'react';
import { MessageSquare } from 'lucide-react';
import { ChildNote } from '../../types/auth';
import { Locale } from 'date-fns';
import { Spinner } from './Spinner';
import { NoteCard } from './NoteCard';

interface ChildNotesSectionProps {
  childId: number;
  notes: ChildNote[] | undefined;
  isLoading: boolean;
  dateFnsLocale: Locale;
  onEditNote?: (note: ChildNote) => void;
  onDeleteNote?: (noteId: number) => void;
  onImageClick?: (url: string, childName: string) => void;
  childName?: string;
  showActions?: boolean;
  onMarkAsRead?: (noteId: number) => void;
  noNotesText?: string;
  loadingText?: string;
  showAdminName?: boolean;
}

export function ChildNotesSection({
  childId,
  notes,
  isLoading,
  dateFnsLocale,
  onEditNote,
  onDeleteNote,
  onImageClick,
  childName = '',
  showActions = true,
  onMarkAsRead,
  noNotesText = 'No hay notas aún',
  loadingText = 'Cargando notas...',
  showAdminName = false
}: ChildNotesSectionProps) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Spinner size="sm" text={loadingText} />
        </div>
      ) : !notes || notes.length === 0 ? (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-xs">{noNotesText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              dateFnsLocale={dateFnsLocale}
              onEdit={onEditNote ? () => onEditNote(note) : undefined}
              onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
              onImageClick={onImageClick ? (url) => onImageClick(url, childName) : undefined}
              showActions={showActions}
              onMarkAsRead={onMarkAsRead ? () => onMarkAsRead(note.id) : undefined}
              showAdminName={showAdminName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

