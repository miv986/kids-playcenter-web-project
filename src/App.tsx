'use client';

import React from 'react';
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { BookingProvider } from './contexts/BookingContext';
import { useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { Services } from './components/Services';
import { PackagesAndPrices } from './components/PackagesAndPrices';
import { Calendar } from './components/Calendar';
import { Gallery } from './components/Gallery';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard/Dashboard';

function AppContent() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');

  // If user is logged in and viewing dashboard
  if (user && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        <main>
          <Dashboard />
        </main>
        <Footer />
      </div>
    );
  }

  // Otherwise show the main website
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50">
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main>
        <Hero />
        <AboutUs />
        <Services />
        <PackagesAndPrices />
        <Calendar />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <AppContent />
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;