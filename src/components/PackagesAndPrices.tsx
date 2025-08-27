import React from 'react';
import { Check, Star, Crown, Heart } from 'lucide-react';

export function PackagesAndPrices() {
  const packages = [
    {
      name: 'Pack Alegría',
      duration: '2 horas',
      price: '15€',
      icon: Heart,
      color: 'from-pink-400 to-purple-500',
      bgColor: 'from-pink-50 to-purple-50',
      popular: false,
      features: [
        'Acceso a zona de juegos',
        'Actividades supervisadas',
        'Material incluido',
        'Merienda saludable'
      ]
    },
    {
      name: 'Pack Fiesta',
      duration: '3 horas',
      price: '25€',
      icon: Star,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      popular: true,
      features: [
        'Todo lo del Pack Alegría',
        'Animación especializada',
        'Taller de manualidades',
        'Decoración temática',
        'Fotografías del evento'
      ]
    },
    {
      name: 'Pack Especial',
      duration: '4 horas',
      price: '35€',
      icon: Crown,
      color: 'from-green-400 to-blue-500',
      bgColor: 'from-green-50 to-blue-50',
      popular: false,
      features: [
        'Todo lo del Pack Fiesta',
        'Espectáculo de magia',
        'Tarta personalizada',
        'Regalos sorpresa',
        'Servicio de limpieza',
        'Coordinador personal'
      ]
    }
  ];

  return (
    <section id="precios" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Packs y Precios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Elige el pack perfecto para tu celebración. Todos nuestros paquetes incluyen 
            diversión garantizada y momentos inolvidables para los pequeños.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {packages.map((pack, index) => {
            const IconComponent = pack.icon;
            return (
              <div
                key={index}
                className={`relative p-8 bg-gradient-to-br ${pack.bgColor} rounded-3xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 ${
                  pack.popular ? 'ring-4 ring-yellow-300 ring-opacity-50' : ''
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                      ¡Más Popular!
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-20 h-20 bg-gradient-to-br ${pack.color} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {pack.name}
                  </h3>
                  
                  <div className="text-gray-600 mb-4">
                    {pack.duration}
                  </div>
                  
                  <div className="text-5xl font-bold text-gray-800 mb-2">
                    {pack.price}
                  </div>
                  
                  <div className="text-gray-600">
                    por niño
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {pack.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 bg-gradient-to-br ${pack.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <button className={`w-full bg-gradient-to-r ${pack.color} text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300`}>
                  Reservar Ahora
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl p-8 shadow-lg max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Descuentos Especiales
            </h3>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">10%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Grupos de 10+ niños</div>
                  <div className="text-gray-600">Descuento automático</div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">15%</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800">Reservas anticipadas</div>
                  <div className="text-gray-600">Con 2 semanas de antelación</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}