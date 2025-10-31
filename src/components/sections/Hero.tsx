import React from 'react';
import { Star, Heart, Sparkles } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import Link from 'next/link';

export function Hero() {
  const t = useTranslation('Hero');

  return (
    <section id="inicio" className="relative py-20 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-green-300 rounded-full opacity-20 animate-bounce delay-300"></div>
        <div className="absolute top-60 right-1/3 w-8 h-8 bg-purple-300 rounded-full opacity-20 animate-pulse delay-500"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start space-x-2 mb-4">
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <span className="text-lg font-medium text-gray-600">{t.t('welcome')}</span>
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 mb-6 leading-tight">
              {t.t('title', { dreams: t.t('dreams') }).split(t.t('dreams')).map((part, i) =>
                i === 0 ? (
                  <React.Fragment key={i}>
                    {part}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">{t.t('dreams')}</span>
                  </React.Fragment>
                ) : part
              )}
            </h1>

            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t.t('description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                <Heart className="w-5 h-5" />
                <Link href={'/calendario'}>{t.t('bookVisit')}</Link>
              </button>
              <button className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-pink-300 hover:text-pink-500 transition-all duration-300 flex items-center justify-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <Link href={'/servicios'}>{t.t('viewActivities')}</Link>
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

          <div className="relative">
            <div className="relative bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-3xl p-8 shadow-2xl">
              <div className="aspect-square bg-white rounded-2xl shadow-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🎨</div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{t.t('creativity')}</h3>
                  <p className="text-gray-600">{t.t('workshops')}</p>
                </div>
              </div>

              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <span className="text-xl">🎈</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}