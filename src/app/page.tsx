"use client";

import { Hero } from "../components/sections/Hero";
import { AboutUs } from "../components/sections/AboutUs";
import { Services } from "../components/sections/Services";
import { PackagesAndPrices } from "../components/sections/PackagesAndPrices";
import { CalendarSection } from "../components/sections/CalendarSection";
import { Gallery } from "../components/sections/Gallery";

export default function HomePage() {
  return (
    <>
      <Hero />
      <AboutUs />
      <Services />
      <PackagesAndPrices />
      <CalendarSection />
      <Gallery />
    </>
  );
}
