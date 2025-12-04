import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

export function Gallery() {
  const t = useTranslation('Gallery');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const images = [
    {
      src: 'gallery/image-2.jpeg',
      alt: 'Peluqueria',
      category: t.t('hairSalon')
    },
    {
      src: 'gallery/image-3.jpeg',
      alt: 'Peluquería',
      category: t.t('hairSalon')
    },
    {
      src: 'gallery/image-4.jpeg',
      alt: 'Instalaciones',
      category: t.t('facilities')
    },
    {
      src: 'gallery/image-5.jpeg',
      alt: 'Cafeteria',
      category: t.t('parkCafeteria')
    },
    {
      src: 'gallery/image-6.jpeg',
      alt: 'Parque/Cafetería',
      category: t.t('parkCafeteria')
    },
    {
      src: 'gallery/image-7.jpeg',
      alt: 'Cocina',
      category: t.t('parkCafeteria')
    },
    {
      src: 'gallery/image-8.jpeg',
      alt: 'Mercado',
      category: t.t('market')
    },
    {
      src: 'gallery/image-9.jpeg',
      alt: 'Instalaciones',
      category: t.t('facilities')
    },
    {
      src: 'gallery/image-11.jpeg',
      alt: 'Hospital',
      category: t.t('hospital')
    },
    {
      src: 'gallery/image-12.jpeg',
      alt: 'Hospital',
      category: t.t('hospital')
    },
    {
      src: 'gallery/image-13.jpeg',
      alt: 'Estación de Policía',
      category: t.t('policeStation')
    },
    {
      src: 'gallery/image-14.jpeg',
      alt: 'Mercado',
      category: t.t('market')
    },
    {
      src: 'gallery/image-16.jpeg',
      alt: 'Mercado',
      category: t.t('market')
    },
  ];

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    }
  };

  return (
    <section id="galeria" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            {t.t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(showAll ? images : images.slice(0, 3)).map((image, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-3xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => {
                const actualIndex = showAll ? index : images.findIndex(img => img.src === image.src);
                setSelectedImage(actualIndex);
              }}
            >
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/20 backdrop-blur-glass rounded-full px-3 py-1 text-white text-sm font-medium mb-2 inline-block">
                    {image.category}
                  </div>
                  <p className="text-white font-medium">{image.alt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!showAll && images.length > 3 && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-colored hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300"
            >
              {t.t('viewMore') || 'Ver más'}
            </button>
          </div>
        )}

        {/* Modal */}
        {selectedImage !== null && (
          <div
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-4xl max-h-full animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={images[selectedImage].src}
                alt={images[selectedImage].alt}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-soft-lg"
                onClick={(e) => e.stopPropagation()}
              />

              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-glass rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>

              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-glass rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-glass rounded-full flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 active:scale-95 transition-all duration-200"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-glass rounded-full px-4 py-2 text-white">
                {selectedImage + 1} / {images.length}
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              {t.t('visitTitle')}
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              {t.t('visitDescription')}
            </p>
            <Link href="/calendario" className="inline-block bg-gradient-to-r from-pink-400 to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-colored hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-300">
              {t.t('scheduleVisit')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}