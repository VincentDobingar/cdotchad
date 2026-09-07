// 📁 src/pages/public/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import HomeServices from "@/components/HomeServices";
import HomeObjectifs from "@/components/HomeObjectifs";
import HomePourquoi from "@/components/HomePourquoi";
import HomeActivites from "@/components/HomeActivites";
import Testimonials from "@/components/Testimonials";
import HomePartenaires from "@/components/HomePartenaires";
import HomeCTA from '@/components/HomeCTA';
import HomeGalerie from "@/components/HomeGalerie";
import HomeHero from "@/components/HomeHero";
import Footer from "@/components/Footer"; 
import ScrollToTop from "@/components/ScrollToTop";
import HomeActualites from "@/components/HomeActualites";
import HomeClients from "@/components/HomeClients";


export default function Home() {
  const [showModal, setShowModal] = useState(true); 

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowModal(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="w-screen overflow-x-hidden">
      {/* HERO */}
        <HomeHero />

      {/* SERVICES */}
          <HomeServices />

      {/* POURQUOI NOUS CHOISIR */}
        <HomePourquoi />

      {/* OBJECTIFS */}
        <HomeObjectifs />

      {/* ACTUALITES */}
        <HomeActualites />

      {/* ACTIVITÉS */}
        <HomeActivites />
      
      {/* Section Galeries */}
        <HomeGalerie />

      {/* Section Partenaires */}
      <HomePartenaires />

      {/* Section Clients */}
      <HomeClients />

      {/* Section Témoignages */}
        <Testimonials />      

      {/* CTA FINAL */}
          <HomeCTA />

      {/* Section Footer */}          
          <Footer />
          
      <ScrollToTop />
    </main>
  );
}
