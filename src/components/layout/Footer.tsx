"use client";

import React from 'react';
import Image from 'next/image';
import { Mail, MapPin, Clock, Instagram, Heart } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { useTranslation } from '../../contexts/TranslationContext';
import Link from 'next/link';

export function Footer() {
  const t = useTranslation('Footer');

  return (
    <footer className="bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                <Image src="/logo.png" alt="Logo" width={80} height={80} />
              </div>
              <div>
                <h3 className="text-2xl font-bold">Somriures & Colors</h3>
                <p className="text-gray-300">{t.t('tagline')}</p>
              </div>
            </div>

            <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
              {t.t('description')}
            </p>

            <div className="flex space-x-4">
              <a href="https://wa.me/+34627644212" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center hover:bg-green-700 transition-colors duration-200">
                <FaWhatsapp className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/somriuresicolors?igsh=MXZlZmdkYmRqejFzYw==" target='_blank' rel="noopener noreferrer" className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors duration-200">
                <Instagram className="w-5 h-5" />
              </a>
              {/*}
              <a href="#" className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              */}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-xl font-bold mb-6">{t.t('contact')}</h4>
            <div className="space-y-4">
              {/*}
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-green-400" />
                <span className="text-gray-300">+34 123 456 789</span>
              </div>
              */}
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">somriuresicolors@gmail.com</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-pink-400 mt-1" />
                <Link href="https://maps.app.goo.gl/Y4gPW6CjivbZBDMr5" target="_blank" rel="noopener noreferrer" className="hover:text-pink-500 transition-colors">
                  Avenida Blasco Ibañez, 37, Canals, Valencia
                </Link>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-xl font-bold mb-6">{t.t('hours')}</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium">{t.t('mondayThursday')}</div>
                  <div className="text-gray-300 text-sm">17:00 - 21:00</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-400" />
                <div>
                  <div className="font-medium">{t.t('fridaySunday')}</div>
                  <div className="text-gray-300 text-sm">10:00 - 22:00</div>

                </div>

              </div>
              <div className="mt-4 p-3 bg-orange-600/20 rounded-lg">
                <div className="text-orange-400 font-medium text-sm">
                  {t.t('availableBirthdayParties')}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-300 text-sm mb-4 md:mb-0">
              {t.t('rights')}
            </div>

            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span>{t.t('madeWith')}</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>{t.t('forKids')}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}