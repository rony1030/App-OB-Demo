'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search, Globe, Sparkles, ExternalLink, CheckCircle2,
  AlertTriangle, Copy, Check, Eye, Compass, BarChart3,
  Layers, ShieldAlert, ArrowRight, RefreshCw, KeyRound
} from 'lucide-react';

interface ProjectSeoItem {
  id: string;
  name: string;
  slug: string;
  phase: string;
  officialTitle: string;
  blindTitle: string;
  officialMetaDesc: string;
  blindMetaDesc: string;
  keywords: string[];
  canonicalUrl: string;
  schemaType: string;
  priceFrom: string;
}

const PARIDERA_PROJECTS: ProjectSeoItem[] = [
  {
    id: '123',
    name: 'Sunrise Bonita Beach',
    slug: 'sunrise-bonita-beach',
    phase: 'Fase 1',
    officialTitle: 'Sunrise Bonita Beach | Apartamentos Frente a Laguna Cristalina en Cap Cana',
    blindTitle: 'Apartamentos de Lujo frente a Laguna Cristalina de 15,000 m² en Cap Cana',
    officialMetaDesc: 'Sunrise Bonita Beach en Cap Cana: Apartamentos de 1, 2 y 3 habitaciones frente a la laguna de 15,000 m². Amenidades de resort, playa privada y Confotur.',
    blindMetaDesc: 'Exclusivos apartamentos de 1, 2 y 3 habitaciones frente a la laguna cristalina navegable más grande de Cap Cana. Playa privada de arena blanca y exención Confotur.',
    keywords: ['apartamentos cap cana', 'crystal lagoon cap cana', 'bonita beach cap cana', 'confotur punta cana', 'inversion inmobiliaria cap cana'],
    canonicalUrl: 'https://brokers.osvaldobello.com/proyectos/sunrise-bonita-beach',
    schemaType: 'RealEstateListing / ApartmentComplex',
    priceFrom: 'US$ 195,000'
  },
  {
    id: '124',
    name: 'Sunset Bonita Beach',
    slug: 'sunset-bonita-beach',
    phase: 'Fase 2',
    officialTitle: 'Sunset Bonita Beach | Condos con Vistas al Atardecer y Golf en Cap Cana',
    blindTitle: 'Condos de Lujo con Vistas al Atardecer sobre Crystal Lagoon y Campo de Golf en Cap Cana',
    officialMetaDesc: 'Sunset Bonita Beach: Condos de lujo con vistas panorámicas a la laguna cristalina y campo de golf en Cap Cana. Unidades swim-up y ley Confotur.',
    blindMetaDesc: 'Condos premium en Cap Cana con espectaculares atardeceres sobre la laguna navegable de 15,000 m² y campo de golf. Swim-up y exención fiscal Confotur.',
    keywords: ['condos cap cana', 'sunset bonita beach', 'swim up punta cana', 'golf cap cana', 'confotur'],
    canonicalUrl: 'https://brokers.osvaldobello.com/proyectos/sunset-bonita-beach',
    schemaType: 'RealEstateListing / ApartmentComplex',
    priceFrom: 'US$ 215,000'
  },
  {
    id: '125',
    name: 'Beach Bonita Beach',
    slug: 'beach-bonita-beach',
    phase: 'Fase 3',
    officialTitle: 'Beach Bonita Beach | Residencias con Beach Club Privado en Cap Cana',
    blindTitle: 'Residencias Exclusivas con Beach Club Privado y Playa de Arena Blanca en Cap Cana',
    officialMetaDesc: 'Beach Bonita Beach: Residencias exclusivas a pasos del beach club privado con arena blanca en Cap Cana. Infinity pool, cabañas y máxima rentabilidad.',
    blindMetaDesc: 'Descubra residencias exclusivas a pasos del club de playa privado con arenas blancas y aguas caribeñas en Cap Cana. Acabados de lujo y Confotur.',
    keywords: ['beach club cap cana', 'residencias de playa cap cana', 'bonita beach club', 'inversion turistica punta cana'],
    canonicalUrl: 'https://brokers.osvaldobello.com/proyectos/beach-bonita-beach',
    schemaType: 'RealEstateListing / ApartmentComplex',
    priceFrom: 'US$ 230,000'
  },
  {
    id: '126',
    name: 'Villas Bonita Beach',
    slug: 'villas-bonita-beach',
    phase: 'Villas Exclusivas',
    officialTitle: 'Villas Bonita Beach | Signature Luxury Villas con Piscina en Cap Cana',
    blindTitle: 'Villas de Lujo Contemporáneas con Piscina Privada y Doble Altura en Cap Cana',
    officialMetaDesc: 'Colección de villas unifamiliares de 4 y 5 habitaciones con piscina privada, doble altura y amplios jardines en Cap Cana. Confotur y máxima exclusividad.',
    blindMetaDesc: 'Espectaculares villas unifamiliares con piscina privada, amplios jardines y techos de doble altura en Cap Cana. Máxima privacidad y exención Confotur.',
    keywords: ['villas en venta cap cana', 'villas de lujo punta cana', 'villa con piscina privada cap cana', 'confotur villas'],
    canonicalUrl: 'https://brokers.osvaldobello.com/proyectos/villas-bonita-beach',
    schemaType: 'SingleFamilyResidence',
    priceFrom: 'US$ 650,000'
  },
  {
    id: '127',
    name: 'Bonita Golf',
    slug: 'bonita-golf',
    phase: 'Golf Residences',
    officialTitle: 'Bonita Golf Residences | Apartamentos Frente al Campo a 400m de Juanillo',
    blindTitle: 'Apartamentos Frente al Campo de Golf a 400 m de Playa Juanillo, Cap Cana',
    officialMetaDesc: 'Bonita Golf en Cap Cana: Apartamentos de 1 y 2 habitaciones en primera línea del campo de golf Las Iguanas y a 400m de Playa Juanillo. Confotur.',
    blindMetaDesc: 'Invierta en apartamentos de lujo frente al hoyo de golf en Cap Cana, a solo 400 metros de la paradisíaca Playa Juanillo. Alta rentabilidad turística.',
    keywords: ['apartamentos golf cap cana', 'playa juanillo apartamentos', 'las iguanas golf', 'confotur cap cana'],
    canonicalUrl: 'https://brokers.osvaldobello.com/proyectos/bonita-golf',
    schemaType: 'RealEstateListing / ApartmentComplex',
    priceFrom: 'US$ 189,000'
  }
];

export default function SeoIntelligenceDashboard() {
  const [selectedProject, setSelectedProject] = useState<ProjectSeoItem>(PARIDERA_PROJECTS[0]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'official' | 'blind'>('official');

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentTitle = viewMode === 'official' ? selectedProject.officialTitle : selectedProject.blindTitle;
  const currentDesc = viewMode === 'official' ? selectedProject.officialMetaDesc : selectedProject.blindMetaDesc;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SEO Intelligence & Google Search Console Suite</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Optimizador SEO & Posicionamiento en Buscadores
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 leading-relaxed">
              Herramienta estratégica para superar a la competencia en Google. Compara el SEO oficial de Master Broker frente al blind marketing de la agencia y sincroniza directamente con Google Search Console.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold shadow-lg transition-all"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir Search Console
            </a>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 text-sm font-semibold border border-white/20 transition-all"
            >
              <Globe className="h-4 w-4" />
              Ver Sitemap XML
            </a>
          </div>
        </div>
      </div>

      {/* GSC Quick Diagnostic & Verification Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Google Search Console</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verificación Lista
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
            Meta tag de verificación inyectado
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Soporta variable <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">NEXT_PUBLIC_GSC_VERIFICATION</code> o verificación por DNS en Hostinger.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sitemap & Robots</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Dinámico
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
            Sitemap automático con 5 fases Paridera
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Prioridad 1.0 para portafolio Paridera y desarrollador con frecuencia diaria.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Schema.org JSON-LD</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" /> Rich Snippets
            </span>
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-white">
            RealEstateListing & Place estructurado
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Datos estructurados para aparecer con precios, ubicación y carruseles en Google.
          </p>
        </div>
      </div>

      {/* Main Interactive Studio */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="h-5 w-5 text-indigo-600" />
              Simulador SERP & Comparativa de Estrategia
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Elige el proyecto para auditar su título, descripción y previsualizar cómo lo indexa Google.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('official')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'official'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Master Broker (Oficial)
            </button>
            <button
              onClick={() => setViewMode('blind')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'blind'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Agencia (Blind Marketing)
            </button>
          </div>
        </div>

        {/* Project Selector Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {PARIDERA_PROJECTS.map((p) => {
            const isSelected = selectedProject.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <span>{p.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-indigo-500/50 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600'
                }`}>
                  {p.phase}
                </span>
              </button>
            );
          })}
        </div>

        {/* Google SERP Preview Box */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider">Vista Previa en Resultados de Google (SERP)</span>
            <span>{currentTitle.length} caracteres / ~60 recomendado</span>
          </div>

          {/* Snippet Card */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 max-w-2xl font-sans">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mb-1">
              <div className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] text-white font-bold">
                OB
              </div>
              <span className="truncate">
                {viewMode === 'official' ? 'https://brokers.osvaldobello.com' : 'https://osvaldobello.com'} &rsaquo; {selectedProject.slug}
              </span>
            </div>
            <h3 className="text-blue-700 dark:text-blue-400 text-lg font-medium hover:underline cursor-pointer leading-snug">
              {currentTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {currentDesc}
            </p>
          </div>
        </div>

        {/* Comparison & Copy Helper */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Master Broker Side */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Estrategia Master Broker (App OB Brokers)
              </span>
              <span className="text-[11px] text-slate-400">Marca Oficial Transparente</span>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Título Indexado</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={selectedProject.officialTitle}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700"
                />
                <button
                  onClick={() => copyToClipboard(selectedProject.officialTitle, 'off-title')}
                  className="p-2 text-slate-500 hover:text-indigo-600"
                  title="Copiar"
                >
                  {copiedKey === 'off-title' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Meta Descripción</label>
              <textarea
                readOnly
                rows={3}
                value={selectedProject.officialMetaDesc}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              <strong>Objetivo:</strong> Posicionar por el nombre oficial del desarrollo (<em>Bonita Beach</em>, <em>Paridera</em>) para captar búsquedas directas de inversionistas y brokers internacionales.
            </div>
          </div>

          {/* Agency Side (Blind) */}
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 p-5 space-y-3 bg-amber-50/20 dark:bg-amber-950/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Estrategia Blind Agency (OsvaldoBello)
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-400">Protección Comercial</span>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Título Protegido</label>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={selectedProject.blindTitle}
                  className="w-full text-xs bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700"
                />
                <button
                  onClick={() => copyToClipboard(selectedProject.blindTitle, 'blind-title')}
                  className="p-2 text-slate-500 hover:text-amber-600"
                  title="Copiar"
                >
                  {copiedKey === 'blind-title' ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-500">Meta Descripción Protegida</label>
              <textarea
                readOnly
                rows={3}
                value={selectedProject.blindMetaDesc}
                className="w-full text-xs bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 resize-none"
              />
            </div>
            <div className="text-[11px] text-slate-500">
              <strong>Objetivo:</strong> Posicionar por <em>Cap Cana</em>, <em>Laguna Cristalina 15,000 m²</em>, <em>Confotur</em> sin revelar el nombre del constructor para que el cliente contacte a la agencia.
            </div>
          </div>
        </div>

        {/* High-Value Keywords Matrix */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Palabras Clave de Alto Valor para este Proyecto
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedProject.keywords.map((kw, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
              >
                <Search className="h-3 w-3" />
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Guide: How to index in Google Search Console under 15 minutes */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-emerald-600" />
          Guía Rápida: Cómo Indexar en Google Search Console en 15 Minutos
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          La mayoría de inmobiliarias esperan semanas a que Google descubra sus páginas por accidente. Siguiendo estos 3 pasos, tus nuevos proyectos quedan inspeccionados e indexados de inmediato:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">1</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Envía el Sitemap XML</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              En Search Console, entra a <strong>Sitemaps</strong> y envía la URL <code className="text-indigo-600">https://brokers.osvaldobello.com/sitemap.xml</code>. Google procesará todas las páginas de Paridera de una sola vez.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">2</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Inspección de URL</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Pega la URL del proyecto en la barra superior de Search Console (ej: <code className="text-indigo-600">/proyectos/sunrise-bonita-beach</code>). Google verificará que la página sea rastreable en vivo.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 space-y-2">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">3</div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Solicitar Indexación</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Haz clic en el botón <strong>«Solicitar indexación»</strong>. Esto pone tu página en la cola prioritaria de rastreo del Googlebot móvil, apareciendo en los índices en cuestión de horas o pocos días.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
