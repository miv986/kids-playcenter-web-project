"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Phone, MapPin, Clock, User, LogOut, LayoutDashboard, Home, Globe } from 'lucide-react';
import { AuthModal } from '../auth/AuthModal';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';

export function Header() {
  const t = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);
  const { user, logout } = useAuth();
  
  const isDashboard = pathname === '/dashboard';
  const isHome = pathname === '/';

  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Escuchar cuando la sesión expira
  useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpiredMessage(t.t('Header.sessionExpired'));
      setAuthMode('login');
      setIsAuthModalOpen(true);
    };

    window.addEventListener('sessionExpired', handleSessionExpired);
    return () => window.removeEventListener('sessionExpired', handleSessionExpired);
  }, [t]);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-glass shadow-soft sticky top-0 z-50 transition-all duration-300 border-b border-gray-100/50">
        <div className="container mx-auto px-4">
          {/* Top bar with contact info */}
          <div className="hidden md:flex justify-between items-center py-2 text-sm text-gray-600 border-b border-gray-100">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {/*
              <Phone className="w-4 h-4 text-green-500" />
              <span>+34 123 456 789</span>
              */}
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-pink-500" />
                <Link href="https://maps.app.goo.gl/Y4gPW6CjivbZBDMr5" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                  Avenida Blasco Ibañez, 37, Canals, Valencia
                </Link>
              </div>
              <div className="flex items-center space-x-2">
                {/*}
                <Clock className="w-4 h-4 text-yellow-500" />
                <span>Lun-Dom: 10:00 - 20:00</span>
                */}
              </div>
            </div>
          </div>

          {/* Main navigation */}
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
                <Image src="/logo.png" alt="Logo" width={80} height={80} className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">{t.t('Header.title')}</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">{t.t('Header.subtitle')}</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {!isDashboard ? (
                <>
                  <Link href="/" className={`font-medium transition-colors duration-200 ${isHome ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.home')}
                  </Link>
                  <Link href="/nosotros" className={`font-medium transition-colors duration-200 ${pathname === '/nosotros' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.about')}
                  </Link>
                  <Link href="/servicios" className={`font-medium transition-colors duration-200 ${pathname === '/servicios' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.services')}
                  </Link>
                  <Link href="/precios" className={`font-medium transition-colors duration-200 ${pathname === '/precios' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.prices')}
                  </Link>
                  <Link href="/calendario" className={`font-medium transition-colors duration-200 ${pathname === '/calendario' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.calendar')}
                  </Link>
                  <Link href="/galeria" className={`font-medium transition-colors duration-200 ${pathname === '/galeria' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                    {t.t('Header.gallery')}
                  </Link>
                </>
              ) : (
                <div className="text-gray-700 font-medium">
                  {t.t('Header.dashboard')}
                </div>
              )}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {/* Language Selector */}
              <div className="flex items-center space-x-2 border-r border-gray-200 pr-4">
                <Globe className="w-4 h-4 text-gray-600" />
                <select
                  value={t.locale}
                  onChange={(e) => t.setLocale(e.target.value as 'es' | 'ca')}
                  className="text-sm text-gray-700 bg-transparent border-none cursor-pointer focus:outline-none"
                >
                  <option value="es">ES</option>
                  <option value="ca">VA</option>
                </select>
              </div>
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/"
                      className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${isHome
                        ? 'bg-green-100 text-green-600'
                        : 'text-gray-600 hover:text-green-500'
                        }`}
                    >
                      <Home className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{t.t('Header.home')}</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      className={`flex items-center space-x-2 px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors duration-200 text-sm sm:text-base ${isDashboard
                        ? 'bg-blue-100 text-blue-600'
                        : 'text-gray-600 hover:text-blue-500'
                        }`}
                    >
                      <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">{t.t('Header.myPanel')}</span>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700 font-medium">{user.name}</span>
                    {user.role === 'ADMIN' && (
                      <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs font-medium">
                        {t.t('Header.admin')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors duration-200 text-sm sm:text-base"
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t.t('Header.logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleAuthClick('login')}
                    className="text-gray-700 hover:text-green-500 font-medium transition-colors duration-200"
                  >
                    {t.t('Header.login')}
                  </button>
                  <button
                    onClick={() => handleAuthClick('register')}
                    className="bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:shadow-colored hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
                  >
                    {t.t('Header.register')}
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
                {!isDashboard ? (
                  <>
                    <Link href="/" className={`font-medium ${isHome ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.home')}
                    </Link>
                    <Link href="/nosotros" className={`font-medium ${pathname === '/nosotros' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.about')}
                    </Link>
                    <Link href="/servicios" className={`font-medium ${pathname === '/servicios' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.services')}
                    </Link>
                    <Link href="/precios" className={`font-medium ${pathname === '/precios' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.prices')}
                    </Link>
                    <Link href="/calendario" className={`font-medium ${pathname === '/calendario' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.calendar')}
                    </Link>
                    <Link href="/galeria" className={`font-medium ${pathname === '/galeria' ? 'text-green-500' : 'text-gray-700 hover:text-green-500'}`}>
                      {t.t('Header.gallery')}
                    </Link>
                  </>
                ) : (
                  <div className="text-gray-700 font-medium">
                    {t.t('Header.dashboard')}
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <Globe className="w-4 h-4 text-gray-600" />
                    <select
                      value={t.locale}
                      onChange={(e) => t.setLocale(e.target.value as 'es' | 'ca')}
                      className="text-sm text-gray-700 bg-transparent border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="es">ES</option>
                      <option value="ca">VA</option>
                    </select>
                  </div>
                </div>

                {user ? (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="space-y-3 mb-4">
                      <Link
                        href="/"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${isHome
                          ? 'bg-green-100 text-green-600'
                          : 'text-gray-600 hover:text-green-500'
                          }`}
                      >
                        <Home className="w-4 h-4" />
                        <span>{t.t('Header.home')}</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${isDashboard
                          ? 'bg-blue-100 text-blue-600'
                          : 'text-gray-600 hover:text-blue-500'
                          }`}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span>{t.t('Header.myPanel')}</span>
                      </Link>
                    </div>
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
                      <span>{t.t('Header.closeSession')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-200 space-y-3">
                    <button
                      onClick={() => handleAuthClick('login')}
                      className="w-full text-gray-700 hover:text-green-500 font-medium text-left"
                    >
                      {t.t('Header.login')}
                    </button>
                    <button
                      onClick={() => handleAuthClick('register')}
                      className="w-full bg-gradient-to-r from-pink-400 to-purple-500 text-white px-6 py-2 rounded-full font-medium"
                    >
                      {t.t('Header.register')}
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
        onClose={() => {
          setIsAuthModalOpen(false);
          setSessionExpiredMessage(null);
        }}
        initialMode={authMode}
        sessionExpiredMessage={sessionExpiredMessage}
      />
    </>
  );
}