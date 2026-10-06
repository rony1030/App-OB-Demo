'use client';

import { useState } from 'react';
import type { PortalProject } from '@/lib/portal-projects';
import type { MarketingStats } from '@/lib/data/marketing';
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import MarqueeTicker from '@/components/landing/MarqueeTicker';
import HowItWorks from '@/components/landing/HowItWorks';
import ProjectCatalog from '@/components/landing/ProjectCatalog';
import ValuePillars from '@/components/landing/ValuePillars';
import Commissions from '@/components/landing/Commissions';
import CtaBanner from '@/components/landing/CtaBanner';
import AccessSection from '@/components/landing/AccessSection';
import Footer from '@/components/landing/Footer';

function scrollToAccess() {
  document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function LandingPage({
  projects,
  stats,
  sessionUser,
}: {
  projects: PortalProject[];
  stats: MarketingStats;
  sessionUser?: { displayName: string } | null;
}) {
  const [selectedProject, setSelectedProject] = useState('');

  const requestDossier = (projectName: string) => {
    setSelectedProject(projectName);
    scrollToAccess();
  };

  const requestAccess = () => {
    setSelectedProject('');
    scrollToAccess();
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      <Navbar onRequestAccess={requestAccess} sessionUser={sessionUser} />
      <Hero stats={stats} projects={projects} onRequestAccess={requestAccess} />
      <MarqueeTicker projects={projects} />
      <ProjectCatalog projects={projects} onRequestDossier={requestDossier} />
      <ValuePillars />
      <HowItWorks />
      <Commissions onRequestAccess={requestAccess} />
      <CtaBanner onRequestAccess={requestAccess} backgroundImage={projects.find((p) => p.image)?.image} />
      <AccessSection selectedProject={selectedProject} />
      <Footer />
    </div>
  );
}
