import React from 'react';
import { Users, Award, Shield, Heart } from 'lucide-react';

export function AboutUs() {
  return (
    <section id="nosotros" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Quiénes Somos
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Somos un equipo apasionado dedicado a crear experiencias mágicas para los niños. 
            Nuestra ludoteca es más que un lugar de juegos: es un espacio donde la imaginación 
            y el aprendizaje van de la mano.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-16">
          <div>
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8 shadow-lg">
              <div className="aspect-video bg-white rounded-2xl shadow-md flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
                  <p className="text-gray-600 font-medium">Nuestro equipo profesional</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Nuestra Misión</h3>
              <p className="text-gray-600 leading-relaxed">
                Proporcionar un ambiente seguro, divertido y educativo donde los niños puedan 
                desarrollar sus habilidades sociales, creativas y cognitivas a través del juego 
                y actividades estructuradas.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Nuestra Visión</h3>
              <p className="text-gray-600 leading-relaxed">
                Ser la ludoteca de referencia en la comunidad, reconocida por la calidad de 
                nuestros servicios, la calidez de nuestro trato y el impacto positivo en el 
                desarrollo infantil.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Equipo Profesional</h3>
            <p className="text-gray-600">
              Educadores especializados en desarrollo infantil y recreación
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Award className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Calidad Garantizada</h3>
            <p className="text-gray-600">
              Certificados en seguridad infantil y primeros auxilios
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Ambiente Seguro</h3>
            <p className="text-gray-600">
              Instalaciones adaptadas y supervisión constante
            </p>
          </div>

          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Con Amor</h3>
            <p className="text-gray-600">
              Cada actividad está diseñada con cariño y dedicación
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}