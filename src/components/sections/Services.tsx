import React from 'react';
import { Palette, Music, BookOpen, Gamepad2, Users, Cake } from 'lucide-react';

export function Services() {
  const services = [
    {
      icon: Cake,
      title: 'Fiestas Infantiles',
      description: 'Celebraciones únicas con animación, decoración y diversión garantizada',
      color: 'from-pink-400 to-purple-500',
      bgColor: 'from-pink-50 to-purple-50'
    },
    {
      icon: Palette,
      title: 'Talleres de Arte',
      description: 'Pintura, manualidades y actividades creativas para desarrollar la imaginación',
      color: 'from-green-400 to-blue-500',
      bgColor: 'from-green-50 to-blue-50'
    },
    {
      icon: Music,
      title: 'Música y Baile',
      description: 'Clases de ritmo, canto y expresión corporal para los más pequeños',
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50'
    },
    {
      icon: BookOpen,
      title: 'Cuentacuentos',
      description: 'Sesiones de lectura interactiva que fomentan el amor por los libros',
      color: 'from-indigo-400 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50'
    },
    {
      icon: Gamepad2,
      title: 'Juegos Educativos',
      description: 'Actividades lúdicas que combinan diversión con aprendizaje',
      color: 'from-red-400 to-pink-500',
      bgColor: 'from-red-50 to-pink-50'
    },
    {
      icon: Users,
      title: 'Actividades Grupales',
      description: 'Dinámicas de equipo que fortalecen las habilidades sociales',
      color: 'from-teal-400 to-cyan-500',
      bgColor: 'from-teal-50 to-cyan-50'
    }
  ];

  return (
    <section id="servicios" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
            Nuestros Servicios
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Ofrecemos una amplia variedad de actividades diseñadas para estimular el desarrollo 
            integral de los niños mientras se divierten y hacen nuevos amigos.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={index}
                className={`p-8 bg-gradient-to-br ${service.bgColor} rounded-3xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 group`}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  {service.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {service.description}
                </p>
                
                <div className="mt-6">
                  <button className={`text-transparent bg-clip-text bg-gradient-to-r ${service.color} font-semibold hover:underline transition-all duration-200`}>
                    Más información →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-white rounded-3xl p-8 shadow-xl max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              ¿Necesitas algo especial?
            </h3>
            <p className="text-gray-600 mb-6 text-lg">
              También ofrecemos servicios personalizados para eventos especiales, 
              campamentos de verano y actividades extraescolares.
            </p>
            <button className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300">
              Contacta con Nosotros
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}