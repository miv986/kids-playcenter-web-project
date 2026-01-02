import React, { useState } from 'react';
import { Star, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import Link from 'next/link';
import Image from 'next/image';
import { VisitBookingModal } from '../modals/VisitBookingModal';

export function Hero() {
  const t = useTranslation('Hero');
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  return (
    <section id="inicio" className="relative py-20 overflow-hidden animate-fade-in">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce blur-sm"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse blur-sm"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-300 rounded-full opacity-20 animate-bounce delay-300 blur-sm"></div>
        <div className="absolute top-60 right-1/3 w-8 h-8 bg-purple-300 rounded-full opacity-20 animate-pulse delay-500 blur-sm"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left animate-slide-up">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <Star className="w-6 h-6 text-yellow-400 fill-current animate-pulse" />
              <span className="text-lg font-medium text-gray-600">{t.t('welcome')}</span>
              <Star className="w-6 h-6 text-yellow-400 fill-current animate-pulse" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              {t.t('title', { dreams: t.t('dreams') }).split(t.t('dreams')).map((part, i) =>
                i === 0 ? (
                  <React.Fragment key={i}>
                    {part}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{t.t('dreams')}</span>
                  </React.Fragment>
                ) : part
              )}
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              {t.t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <button
                onClick={() => setIsVisitModalOpen(true)}
                className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg hover:shadow-colored hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto"
              >
                <Heart className="w-5 h-5 flex-shrink-0" />
                <span className="whitespace-nowrap">{t.t('bookVisit')}</span>
              </button>
              <button className="bg-white text-gray-700 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg border-2 border-gray-200 hover:border-pink-300 hover:text-pink-500 hover:bg-pink-50 active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 w-full sm:w-auto shadow-soft hover:shadow-soft-lg">
                <Sparkles className="w-5 h-5 flex-shrink-0" />
                <Link href={'/servicios'} className="whitespace-nowrap">{t.t('viewActivities')}</Link>
              </button>
            </div>

            {    /*        <div className="mt-12 grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-green-500 mb-2">500+</div>
                <div className="text-gray-600">{t.t('happyKids')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-pink-500 mb-2">15+</div>
                <div className="text-gray-600">{t.t('activities')}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-yellow-500 mb-2">5</div>
                <div className="text-gray-600">{t.t('yearsExperience')}</div>
              </div>
            </div>
            */}
          </div>

          <div className="relative animate-scale-in">
            <div className="relative bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-3xl p-8 shadow-soft-lg hover:shadow-2xl transition-shadow duration-300">
              <div className="aspect-square rounded-2xl shadow-soft overflow-hidden relative bg-[#fef8e8]">
                <Image
                  src="/portada5.jpeg"
                  alt="Bienvenidos a Somriures & Colors"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  priority
                />
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-soft-lg animate-bounce hover:scale-110 transition-transform">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center shadow-soft-lg animate-pulse hover:scale-110 transition-transform">
                <span className="text-xl">🎈</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <VisitBookingModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
      />
    </section>
  );
}