import React from 'react';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🎪</span>
              </div>
              <div>
                <h3 className="text-2xl font-bold">Ludoteca Arcoíris</h3>
                <p className="text-gray-300">Diversión y aprendizaje</p>
              </div>
            </div>
            
            <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
              Creamos experiencias mágicas donde los niños pueden jugar, aprender y crecer 
              en un ambiente seguro y divertido. Cada día es una nueva aventura llena de 
              sonrisas y descubrimientos.
            </p>
            
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6">Contacto</h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">+34 123 456 789</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">info@ludotecaarcoiris.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-pink-400 mt-1" />
                <span className="text-gray-300">
                  Calle Diversión 123<br />
                  28001 Madrid, España
                </span>
              </div>
            </div>
          </div>
          
          {/* Hours */}
          <div>
            <h4 className="text-xl font-bold mb-6">Horarios</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium">Lunes - Viernes</div>
                  <div className="text-gray-300 text-sm">10:00 - 20:00</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium">Sábados - Domingos</div>
                  <div className="text-gray-300 text-sm">10:00 - 21:00</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-green-600/20 rounded-lg">
                <div className="text-green-400 font-medium text-sm">
                  ¡Abierto todos los días del año!
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              © 2024 Ludoteca Arcoíris. Todos los derechos reservados.
            </div>
            
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span>Hecho con</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>para los niños de Madrid</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}