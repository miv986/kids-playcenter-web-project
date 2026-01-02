import React from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  total?: number;
  resultsLabel?: string;
  resultsPluralLabel?: string;
  placeholder?: string;
  clearLabel?: string;
  sticky?: boolean;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  total,
  resultsLabel,
  resultsPluralLabel,
  placeholder,
  clearLabel,
  sticky = false
}: SearchBarProps) {
  const { t } = useTranslation('AdminTutors');
  const defaultResultsLabel = resultsLabel || t('results');
  const defaultResultsPluralLabel = resultsPluralLabel || t('resultsPlural');
  const defaultPlaceholder = placeholder || t('searchPlaceholder');
  const defaultClearLabel = clearLabel || t('clearSearch');
  return (
    <div className={`bg-white rounded-xl shadow-md p-3 mb-4 ${sticky ? 'sticky top-0 z-40' : ''}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder={defaultPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-100 text-red-600 p-1.5 rounded hover:bg-red-200 transition-colors"
            title={defaultClearLabel}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {searchQuery && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {total !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {total} {total === 1 ? defaultResultsLabel : defaultResultsPluralLabel}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg">
            <Search className="w-3.5 h-3.5 text-gray-600" />
            <span className="text-sm text-gray-700">"{searchQuery}"</span>
          </div>
          <button
            onClick={() => onSearchChange('')}
            className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1.5 text-sm font-medium"
          >
            <X className="w-3.5 h-3.5" />
            {defaultClearLabel}
          </button>
        </div>
      )}
    </div>
  );
}

