import React, { useState } from 'react';
import { Menu, X, Phone, MapPin, Clock, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './Auth/AuthModal';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { user, logout } = useAuth();

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <>
      <header className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top bar with contact info */}
        <div className="hidden md:flex justify-between items-center py-2 text-sm text-gray-600 border-b border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-green-500" />
              <span>+34 123 456 789</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-pink-500" />
              <span>Calle Diversión 123, Madrid</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span>Lun-Dom: 10:00 - 20:00</span>
            </div>
          </div>
        </div>

        {/* Main navigation */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">🎪</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Ludoteca Arcoíris</h1>
              <p className="text-sm text-gray-600">Diversión y aprendizaje</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <a href="#inicio" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Inicio
            </a>
            <a href="#nosotros" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Nosotros
            </a>
            <a href="#servicios" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Servicios
            </a>
            <a href="#precios" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Precios
            </a>
            <a href="#calendario" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Calendario
            </a>
            <a href="#galeria" className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200">
              Galería
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 font-medium">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleAuthClick('login')}
                  className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => handleAuthClick('register')}
                  className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="flex flex-col space-y-4">
              <a href="#inicio" className="text-gray-700 hover:text-green-500 font-medium">
                Inicio
              </a>
              <a href="#nosotros" className="text-gray-700 hover:text-green-500 font-medium">
                Nosotros
              </a>
              <a href="#servicios" className="text-gray-700 hover:text-green-500 font-medium">
                Servicios
              </a>
              <a href="#precios" className="text-gray-700 hover:text-green-500 font-medium">
                Precios
              </a>
              <a href="#calendario" className="text-gray-700 hover:text-green-500 font-medium">
                Calendario
              </a>
              <a href="#galeria" className="text-gray-700 hover:text-green-500 font-medium">
                Galería
              </a>
              
              {user ? (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-red-500 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="w-full text-gray-700 hover:text-green-500 font-medium text-left"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => handleAuthClick('register')}
                    className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-2 rounded-full font-medium"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
      </header>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}