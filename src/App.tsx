import React from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { AboutUs } from './components/AboutUs';
import { Services } from './components/Services';
import { PackagesAndPrices } from './components/PackagesAndPrices';
import { Calendar } from './components/Calendar';
import { Gallery } from './components/Gallery';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-green-50 to-yellow-50">
      <Header />
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

export default App;