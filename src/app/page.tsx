"use client";

import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { AboutUs } from "../components/sections/AboutUs";
import { Services } from "../components/sections/Services";
import { PackagesAndPrices } from "../components/sections/PackagesAndPrices";
import { Calendar } from "../components/sections/Calendar";
import { Gallery } from "../components/sections/Gallery";
import { Dashboard } from "../components/dashboard/Dashboard";

export default function HomePage() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"home" | "dashboard">("home");

  return (
    <div>
      <Header currentView={currentView} setCurrentView={setCurrentView} />
      <main>
        {user && currentView === "dashboard" ? (
          <Dashboard />
        ) : (
          <>
            <Hero />
            <AboutUs />
            <Services />
            <PackagesAndPrices />
            <Calendar />
            <Gallery />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
