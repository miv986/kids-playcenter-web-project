import React from 'react';
import { Palette, Music, BookOpen, Gamepad2, Users, Cake } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

export function Services() {
  const t = useTranslation('Services');
  
  const services = [
    {
      icon: Cake,
      title: t.t('birthdayParties'),
      description: t.t('birthdayPartiesDesc'),
      color: 'from-pink-400 to-purple-500',
      bgColor: 'from-pink-50 to-purple-50'
    },
    {
      icon: Palette,
      title: t.t('artWorkshops'),
      description: t.t('artWorkshopsDesc'),
      color: 'from-green-400 to-blue-500',
      bgColor: 'from-green-50 to-blue-50'
    },
    {
      icon: Music,
      title: t.t('musicDance'),
      description: t.t('musicDanceDesc'),
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      icon: BookOpen,
      title: t.t('storytelling'),
      description: t.t('storytellingDesc'),
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50'
    },
    {
      icon: Gamepad2,
      title: t.t('educationalGames'),
      description: t.t('educationalGamesDesc'),
      color: 'from-red-400 to-pink-500',
      bgColor: 'from-red-50 to-pink-50'
    },
    {
      icon: Users,
      title: t.t('groupActivities'),
      description: t.t('groupActivitiesDesc'),
      color: 'from-teal-400 to-cyan-500',
      bgColor: 'from-teal-50 to-cyan-50'
    }
  ];

  return (
    <section id="servicios" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            {t.t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t.t('description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={index}
                className={`p-8 bg-gradient-to-br ${service.bgColor} rounded-3xl shadow-soft hover:shadow-soft-lg transform hover:scale-105 active:scale-95 transition-all duration-300 group animate-fade-in`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 shadow-soft group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                
                <div className="mt-6">
                  <button className={`text-transparent bg-clip-text bg-gradient-to-r ${service.color} font-semibold hover:underline transition-all duration-200 hover:scale-105 inline-block`}>
                    {t.t('moreInfo')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>


      </div>
    </section>
  );
}