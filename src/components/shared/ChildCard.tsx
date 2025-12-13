import React, { useState } from 'react';
import { FileText, MessageSquare, Plus, ChevronDown, ChevronUp, Copy, Check, Phone, Calendar, User, AlertCircle, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';
import { Locale } from 'date-fns';
import { ChildNote } from '../../types/auth';
import { ChildNotesSection } from './ChildNotesSection';

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

interface ChildCardProps {
  child: Child;
  dateFnsLocale: Locale;
  expandedNotes: boolean;
  notes: ChildNote[] | undefined;
  isLoadingNotes: boolean;
  notesCount?: number;
  copiedPhone: string | null;
  onToggleNotes: () => void;
  onAddNote: () => void;
  onEditNote?: (note: ChildNote) => void;
  onDeleteNote?: (noteId: number) => void;
  onImageClick?: (url: string, childName: string) => void;
  onCopyPhone: (phone: string, e: React.MouseEvent) => void;
  translations: {
    birthDate: string;
    emergency1: string;
    emergency2: string;
    allergies: string;
    notes: string;
    medicalNotes: string;
    notRegistered: string;
    noPhone: string;
    noAllergies: string;
    noNotes: string;
    noMedicalNotes: string;
    viewNotes: string;
    addNote: string;
    copyPhone: string;
    loadingNotes: string;
    noNotesYet: string;
    clickToExpand: string;
    clickToCollapse: string;
  };
}

export function ChildCard({
  child,
  dateFnsLocale,
  expandedNotes,
  notes,
  isLoadingNotes,
  notesCount = 0,
  copiedPhone,
  onToggleNotes,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onImageClick,
  onCopyPhone,
  translations
}: ChildCardProps) {
  const [expandedTexts, setExpandedTexts] = useState<Set<string>>(new Set());

  const toggleText = (key: string) => {
    setExpandedTexts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isExpanded = (key: string) => expandedTexts.has(key);

  const getTooltipText = (key: string) => {
    return isExpanded(key) ? translations.clickToCollapse : translations.clickToExpand;
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-3 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
      {/* Header con nombre y acciones */}
      <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
          <h4 className="text-sm font-bold text-gray-800">
            {child.name} {child.surname}
          </h4>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleNotes}
            className={`relative px-2.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-xs font-medium shadow-sm ${
              expandedNotes
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                : 'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50'
            }`}
            title={translations.viewNotes}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {notesCount > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold min-w-[18px] text-center ${
                expandedNotes ? 'bg-white/30 text-white' : 'bg-purple-500 text-white'
              }`}>
                {notesCount}
              </span>
            )}
            {expandedNotes ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
          <button
            onClick={onAddNote}
            className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
            title={translations.addNote}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Información del hijo - Diseño moderno con iconos */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {/* Fecha de nacimiento */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.birthDate}</p>
          </div>
          <p className="text-sm font-medium text-gray-800 ml-8">
            {child.dateOfBirth ? format(new Date(child.dateOfBirth), "dd/MM/yyyy", { locale: dateFnsLocale }) : translations.notRegistered}
          </p>
        </div>

        {/* Contacto de emergencia 1 */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.emergency1}</p>
          </div>
          <div className="ml-8 space-y-0.5">
            <button
              onClick={() => toggleText('emergency1_name')}
              className={`text-xs text-gray-600 text-left w-full hover:text-gray-800 transition-colors cursor-pointer max-w-full ${isExpanded('emergency1_name') ? 'break-words' : 'truncate'}`}
              style={isExpanded('emergency1_name') ? { overflowWrap: 'anywhere', wordBreak: 'break-word', marginInline: '0' } : undefined}
              title={getTooltipText('emergency1_name')}
            >
              {child.emergency_contact_name_1 || translations.notRegistered}
            </button>
            {child.emergency_phone_1 ? (
              <button
                onClick={(e) => onCopyPhone(child.emergency_phone_1!, e)}
                className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-1 group w-full"
                title={translations.copyPhone}
              >
                <span className="truncate">{child.emergency_phone_1}</span>
                {copiedPhone === child.emergency_phone_1 ? (
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-blue-500" />
                )}
              </button>
            ) : (
              <p className="text-xs text-gray-400">{translations.noPhone}</p>
            )}
          </div>
        </div>

        {/* Contacto de emergencia 2 */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-orange-100 rounded-md flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-orange-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.emergency2}</p>
          </div>
          <div className="ml-8 space-y-0.5">
            <button
              onClick={() => toggleText('emergency2_name')}
              className={`text-xs text-gray-600 text-left w-full hover:text-gray-800 transition-colors cursor-pointer max-w-full ${isExpanded('emergency2_name') ? 'break-words' : 'truncate'}`}
              style={isExpanded('emergency2_name') ? { overflowWrap: 'anywhere', wordBreak: 'break-word', marginInline: '0' } : undefined}
              title={getTooltipText('emergency2_name')}
            >
              {child.emergency_contact_name_2 || translations.notRegistered}
            </button>
            {child.emergency_phone_2 ? (
              <button
                onClick={(e) => onCopyPhone(child.emergency_phone_2!, e)}
                className="text-sm font-medium text-gray-800 hover:text-blue-600 transition-colors flex items-center gap-1 group w-full"
                title={translations.copyPhone}
              >
                <span className="truncate">{child.emergency_phone_2}</span>
                {copiedPhone === child.emergency_phone_2 ? (
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-blue-500" />
                )}
              </button>
            ) : (
              <p className="text-xs text-gray-400">{translations.noPhone}</p>
            )}
          </div>
        </div>

        {/* Alergias */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-red-300 hover:shadow-sm transition-all overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-red-100 rounded-md flex items-center justify-center">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.allergies}</p>
          </div>
          {child.allergies ? (
            <button
              onClick={() => toggleText('allergies')}
              className={`text-sm text-gray-700 text-left w-full ml-8 hover:text-gray-900 transition-colors cursor-pointer max-w-full ${isExpanded('allergies') ? 'break-words' : 'line-clamp-2'}`}
              style={isExpanded('allergies') ? { overflowWrap: 'anywhere', wordBreak: 'break-word', marginInline: '0' } : undefined}
              title={getTooltipText('allergies')}
            >
              {child.allergies}
            </button>
          ) : (
            <p className="text-sm text-gray-400 ml-8">{translations.noAllergies}</p>
          )}
        </div>

        {/* Notas */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.notes}</p>
          </div>
          {child.notes ? (
            <button
              onClick={() => toggleText('notes')}
              className={`text-sm text-gray-700 text-left w-full ml-8 hover:text-gray-900 transition-colors cursor-pointer max-w-full ${isExpanded('notes') ? 'break-words' : 'line-clamp-2'}`}
              style={isExpanded('notes') ? { overflowWrap: 'anywhere', wordBreak: 'break-word', marginInline: '0' } : undefined}
              title={getTooltipText('notes')}
            >
              {child.notes}
            </button>
          ) : (
            <p className="text-sm text-gray-400 ml-8">{translations.noNotes}</p>
          )}
        </div>

        {/* Notas médicas */}
        <div className="bg-white rounded-lg p-2.5 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <p className="text-xs font-semibold text-gray-700">{translations.medicalNotes}</p>
          </div>
          {child.medicalNotes ? (
            <button
              onClick={() => toggleText('medicalNotes')}
              className={`text-sm text-gray-700 text-left w-full ml-8 hover:text-gray-900 transition-colors cursor-pointer max-w-full ${isExpanded('medicalNotes') ? 'break-words' : 'line-clamp-2'}`}
              style={isExpanded('medicalNotes') ? { overflowWrap: 'anywhere', wordBreak: 'break-word', marginInline: '0' } : undefined}
              title={getTooltipText('medicalNotes')}
            >
              {child.medicalNotes}
            </button>
          ) : (
            <p className="text-sm text-gray-400 ml-8">{translations.noMedicalNotes}</p>
          )}
        </div>
      </div>

      {/* Sección de notas del admin */}
      {expandedNotes && (
        <ChildNotesSection
          childId={child.id}
          notes={notes}
          isLoading={isLoadingNotes}
          dateFnsLocale={dateFnsLocale}
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
          onImageClick={onImageClick}
          childName={`${child.name} ${child.surname}`}
          showActions={true}
          noNotesText={translations.noNotesYet}
          loadingText={translations.loadingNotes}
        />
      )}
    </div>
  );
}

