import React from 'react';
import { Users, Award, Shield, Heart } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

export function AboutUs() {
  const t = useTranslation('AboutUs');
  
  return (
    <section id="nosotros" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            {t.t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.t('description')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8 shadow-lg">
              <div className="aspect-video bg-white rounded-2xl shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                  <p className="text-gray-600 font-medium">{t.t('teamCaption')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.t('mission')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t.t('missionText')}
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">{t.t('vision')}</h3>
              <p className="text-gray-600 leading-relaxed">
                {t.t('visionText')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 animate-fade-in">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft hover:scale-110 transition-transform duration-300">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.t('professionalTeam')}</h3>
            <p className="text-gray-600">
              {t.t('professionalTeamText')}
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft hover:scale-110 transition-transform duration-300">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.t('quality')}</h3>
            <p className="text-gray-600">
              {t.t('qualityText')}
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft hover:scale-110 transition-transform duration-300">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.t('safe')}</h3>
            <p className="text-gray-600">
              {t.t('safeText')}
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-soft hover:scale-110 transition-transform duration-300">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{t.t('withLove')}</h3>
            <p className="text-gray-600">
              {t.t('withLoveText')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}