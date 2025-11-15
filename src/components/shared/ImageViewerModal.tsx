import React from 'react';
import { X } from 'lucide-react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName?: string;
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, imageName }: ImageViewerModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={imageUrl}
          alt={imageName || 'Image'}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
        />
        {imageName && (
          <p className="text-white text-center mt-3 text-sm bg-black/50 rounded-lg px-3 py-1 inline-block">
            {imageName}
          </p>
        )}
      </div>
    </div>
  );
}

