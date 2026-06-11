/**
 * App.tsx — Landing page institucional/comercial da marca **bewild**.
 *
 * Rota "home" da SPA (ver src/router.tsx). Página única, mobile-first,
 * composta por seções modulares em src/components/landing/.
 *
 * Conteúdo editável em: src/components/landing/content.ts
 */
import { useEffect } from "react";
import { useSeo } from "./lib/useSeo";
import Header from "./components/landing/Header";
import HeroSection from "./components/landing/HeroSection";
import ProblemSection from "./components/landing/ProblemSection";
import ServicesSection from "./components/landing/ServicesSection";
import ProcessTimeline from "./components/landing/ProcessTimeline";
import StackedShowcase from "./components/landing/StackedShowcase";
import CasesGallery from "./components/landing/CasesGallery";
import TestimonialSection from "./components/landing/TestimonialSection";
import TechnologySection from "./components/landing/TechnologySection";
import ComparisonSection from "./components/landing/ComparisonSection";
import AudienceSection from "./components/landing/AudienceSection";
import FAQSection from "./components/landing/FAQSection";
import FinalCTA from "./components/landing/FinalCTA";
import Footer from "./components/landing/Footer";

import FloatingWhatsAppButton from "./components/landing/FloatingWhatsAppButton";
import { FAQS } from "./components/landing/content";

const SITE_URL = "https://bewild.com.br"; // TODO: confirmar domínio oficial

export default function App() {
  useSeo({
    title: "bewild — Reformas turn-key para studios, short-stay e imóveis compactos",
    description:
      "A bewild transforma studios e apartamentos compactos em imóveis prontos para rentabilizar, com projeto de arquitetura personalizado, reforma turn-key, mobiliário, tecnologia e gestão ponta-a-ponta.",
    canonicalPath: "/",
    ogType: "website",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "bewild",
        alternateName: "BWild",
        url: SITE_URL,
        description:
          "Reformas turn-key, interiores e tecnologia aplicada à gestão de obras para studios compactos e imóveis para renda.",
        areaServed: "São Paulo, Brasil",
      },
      {
        "@context": "https://schema.org",
        "@type": "Service",
        serviceType: "Reforma turn-key de studios e imóveis compactos",
        provider: { "@type": "Organization", name: "bewild" },
        areaServed: "São Paulo, Brasil",
        description:
          "Projeto de arquitetura personalizado, obra, marcenaria, mobiliário, tecnologia e gestão ponta-a-ponta para imóveis compactos e short-stay.",
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  // Smooth scroll para âncoras internas (respeita prefers-reduced-motion).
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="bewild min-h-screen bg-bewild-ink font-body text-bewild-ink antialiased">
      <Header />
      <main>
        <HeroSection />
        <ProblemSection />
        <ServicesSection />
        <ProcessTimeline />
        <ArchitectureSection />
        <DifferentialsSection />
        <CredibilitySection />
        <CasesGallery />
        <TechnologySection />
        <ComparisonSection />
        <AudienceSection />
        <FAQSection />
        <FinalCTA />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </div>
  );
}
