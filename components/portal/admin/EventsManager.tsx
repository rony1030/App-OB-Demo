'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Check,
  Compass,
  Edit3,
  ExternalLink,
  Eye,
  Film,
  Globe,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Users,
  Video,
  X,
  AlertCircle,
  Play,
  Layers,
  Save
} from 'lucide-react';
import type { BrokerEvent } from '@/types/events';
import {
  saveBrokerEventAction,
  deleteBrokerEventAction,
  toggleBrokerEventFeaturedAction,
} from '@/app/portal/admin/eventos/actions';

interface EventsManagerProps {
  initialEvents: BrokerEvent[];
}

export default function EventsManager({ initialEvents }: EventsManagerProps) {
  const [events, setEvents] = useState<BrokerEvent[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  // Estado para el modal de edición/creación
  const [editingEvent, setEditingEvent] = useState<BrokerEvent | null>(null);
  const [isNewEvent, setIsNewEvent] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario local
  const [formValues, setFormValues] = useState<Partial<BrokerEvent>>({});
  const [newHighlight, setNewHighlight] = useState('');
  const [galleryText, setGalleryText] = useState('');
  const [tagsText, setTagsText] = useState('');

  // Filtrado
  const filteredEvents = events.filter((e) => {
    const matchesCat = filterCategory === 'all' || e.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.projectName.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Métricas
  const totalBrokers = events.reduce((acc, e) => acc + (e.attendeesCount || 0), 0);
  const featuredEvent = events.find((e) => e.featured);

  const openNewEventModal = () => {
    setIsNewEvent(true);
    const newId = `evt-${Date.now()}`;
    const initial: BrokerEvent = {
      id: newId,
      slug: '',
      title: '',
      subtitle: '',
      category: 'Tour Inmobiliario',
      projectName: 'Quebec Cana / Cana Rock',
      location: 'Cana Bay, Punta Cana, Rep. Dominicana',
      date: new Date().toISOString().split('T')[0],
      formattedDate: new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
      readTime: '3 min de lectura',
      attendeesCount: 25,
      featured: false,
      isPublished: true,
      coverImage: 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      video: {
        type: 'mp4',
        url: 'https://cdn.coverr.co/videos/coverr-waves-reaching-the-shore-5573/1080p.mp4',
        duration: '02:30',
        thumbnailUrl: '',
      },
      summary: '',
      description: '',
      highlights: [
        'Recorrido de obra e inspección de terminaciones',
        'Presentación del plan de pagos con comisiones preferenciales'
      ],
      gallery: [],
      tags: ['Tour Inmobiliario', 'Brókers'],
    };
    setFormValues(initial);
    setGalleryText('');
    setTagsText('Tour Inmobiliario, Brókers');
    setEditingEvent(initial);
    setFeedbackMessage(null);
  };

  const openEditModal = (event: BrokerEvent) => {
    setIsNewEvent(false);
    setFormValues({ ...event });
    setGalleryText((event.gallery || []).join('\n'));
    setTagsText((event.tags || []).join(', '));
    setEditingEvent(event);
    setFeedbackMessage(null);
  };

  const handleSlugify = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleTitleChange = (val: string) => {
    setFormValues((prev) => ({
      ...prev,
      title: val,
      slug: isNewEvent && !prev.slug ? handleSlugify(val) : prev.slug,
    }));
  };

  const addHighlight = () => {
    if (!newHighlight.trim()) return;
    setFormValues((prev) => ({
      ...prev,
      highlights: [...(prev.highlights || []), newHighlight.trim()],
    }));
    setNewHighlight('');
  };

  const removeHighlight = (index: number) => {
    setFormValues((prev) => ({
      ...prev,
      highlights: (prev.highlights || []).filter((_, i) => i !== index),
    }));
  };

  const handleSave = () => {
    if (!formValues.title?.trim() || !formValues.slug?.trim()) {
      setFeedbackMessage({ type: 'error', text: 'El título y el slug son requeridos.' });
      return;
    }

    const payload: Partial<BrokerEvent> & { title: string; slug: string } = {
      ...formValues,
      title: formValues.title.trim(),
      slug: formValues.slug.trim(),
      gallery: galleryText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    startTransition(async () => {
      const res = await saveBrokerEventAction(payload);
      if (res.success && res.event) {
        setEvents((prev) => {
          const idx = prev.findIndex((e) => e.id === res.event!.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = res.event!;
            return next;
          }
          return [res.event!, ...prev];
        });
        setFeedbackMessage({ type: 'success', text: 'Evento guardado correctamente.' });
        setTimeout(() => {
          setEditingEvent(null);
        }, 800);
      } else {
        setFeedbackMessage({ type: 'error', text: res.error || 'Error al guardar el evento.' });
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`¿Estás seguro de eliminar el evento "${title}"?`)) return;

    startTransition(async () => {
      const res = await deleteBrokerEventAction(id);
      if (res.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(res.error || 'No se pudo eliminar el evento.');
      }
    });
  };

  const handleToggleFeatured = (id: string) => {
    startTransition(async () => {
      const res = await toggleBrokerEventFeaturedAction(id);
      if (res.success) {
        setEvents((prev) =>
          prev.map((e) => {
            if (e.id === id) return { ...e, featured: !e.featured };
            return { ...e, featured: false };
          })
        );
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700">
            <Video className="w-4 h-4" />
            <span>Módulo de Contenido & Marketing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
            Gestión de Eventos & Tours con Brókers
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administra los tours en terreno (ej. Quebec Cana), sube videos, redacta crónicas para el blog y define cuál aparece en la portada principal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/eventos"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>Ver Blog Público</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            onClick={openNewEventModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* METRICAS RÁPIDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total de Eventos
            </span>
            <Film className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900 mt-2">{events.length}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            {events.filter((e) => e.isPublished !== false).length} publicados · {events.filter((e) => e.isPublished === false).length} borradores
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Destacado en Portada
            </span>
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <p className="text-base font-bold text-slate-900 mt-2 truncate">
            {featuredEvent ? featuredEvent.projectName : 'Ninguno'}
          </p>
          <span className="text-xs text-slate-500 mt-1 block truncate">
            {featuredEvent ? featuredEvent.title : 'Selecciona un evento para la home'}
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Brókers Convocados
            </span>
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-serif text-slate-900 mt-2">+{totalBrokers}</p>
          <span className="text-xs text-slate-500 mt-1 block">
            Asistencia acumulada en recorridos
          </span>
        </div>
      </div>

      {/* FILTROS Y BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['all', 'Tour Inmobiliario', 'Lanzamiento', 'Capacitación'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {cat === 'all' ? 'Todos los Tipos' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por proyecto o título..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          />
        </div>
      </div>

      {/* LISTA DE EVENTOS EN EL CRM */}
      <div className="space-y-4">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className={`p-5 rounded-3xl bg-white border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs hover:shadow-md ${
              evt.featured ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200'
            }`}
          >
            {/* Izquierda: Imagen y Datos Básicos */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
              <div className="relative w-36 h-24 rounded-2xl overflow-hidden bg-slate-900 shrink-0">
                <img
                  src={evt.coverImage}
                  alt={evt.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono flex items-center gap-1">
                  <Play className="w-2.5 h-2.5 fill-white" />
                  {evt.video.duration}
                </div>
                {evt.featured && (
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] uppercase tracking-wider shadow">
                    Home
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[11px] font-bold uppercase tracking-wider">
                    {evt.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500">{evt.formattedDate}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-600 font-medium">
                    +{evt.attendeesCount} Brókers
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 truncate max-w-xl">
                  {evt.title}
                </h3>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>{evt.location}</span>
                  <span className="text-slate-300 mx-1.5">|</span>
                  <span>Proyecto: <strong>{evt.projectName}</strong></span>
                </p>

                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      evt.isPublished !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${evt.isPublished !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {evt.isPublished !== false ? 'Publicado' : 'Borrador'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    /eventos/{evt.slug}
                  </span>
                </div>
              </div>
            </div>

            {/* Derecha: Botones de Acción */}
            <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
              <button
                onClick={() => handleToggleFeatured(evt.id)}
                disabled={isPending}
                title={evt.featured ? 'Quitar de la portada' : 'Destacar en la portada principal'}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  evt.featured
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Star className={`w-4 h-4 ${evt.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span className="hidden xl:inline">{evt.featured ? 'Destacado' : 'Destacar en Home'}</span>
              </button>

              <Link
                href={`/eventos/${evt.slug}`}
                target="_blank"
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                title="Ver página del evento"
              >
                <Eye className="w-4 h-4" />
              </Link>

              <button
                onClick={() => openEditModal(evt)}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-semibold transition-colors flex items-center gap-1.5"
                title="Editar evento"
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-xs">Editar</span>
              </button>

              <button
                onClick={() => handleDelete(evt.id, evt.title)}
                disabled={isPending}
                className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 transition-colors"
                title="Eliminar evento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DRAWER DE CREACIÓN / EDICIÓN */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto">
            {/* Header del Modal */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg">
                  {isNewEvent ? 'Crear Nuevo Evento con Brókers' : 'Editar Evento / Tour'}
                </h3>
              </div>
              <button
                onClick={() => setEditingEvent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Feedback alert */}
            {feedbackMessage && (
              <div
                className={`px-6 py-3 text-xs font-semibold flex items-center gap-2 ${
                  feedbackMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                    : 'bg-red-50 text-red-800 border-b border-red-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{feedbackMessage.text}</span>
              </div>
            )}

            {/* Contenido scrolleable del formulario */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-slate-800">
              {/* Título y Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Título del Evento *
                  </label>
                  <input
                    type="text"
                    value={formValues.title || ''}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="ej. Tour Exclusivo con Brókers: Recorrido Quebec Cana"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Slug (URL amigable) *
                  </label>
                  <input
                    type="text"
                    value={formValues.slug || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, slug: handleSlugify(e.target.value) }))}
                    placeholder="ej. tour-quebec-cana"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Se publicará en: /eventos/{formValues.slug || 'nombre-slug'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={formValues.category || 'Tour Inmobiliario'}
                    onChange={(e) => setFormValues((p) => ({ ...p, category: e.target.value as BrokerEvent['category'] }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 outline-none bg-white"
                  >
                    <option value="Tour Inmobiliario">Tour Inmobiliario</option>
                    <option value="Lanzamiento">Lanzamiento</option>
                    <option value="Capacitación">Capacitación</option>
                    <option value="Networking">Networking</option>
                  </select>
                </div>
              </div>

              {/* Proyecto, Ubicación, Fecha y Asistentes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Proyecto
                  </label>
                  <input
                    type="text"
                    value={formValues.projectName || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, projectName: e.target.value }))}
                    placeholder="ej. Quebec Cana"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    value={formValues.location || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, location: e.target.value }))}
                    placeholder="ej. Cana Bay, Punta Cana"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formValues.date || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Brókers Asistentes
                  </label>
                  <input
                    type="number"
                    value={formValues.attendeesCount || 0}
                    onChange={(e) => setFormValues((p) => ({ ...p, attendeesCount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>
              </div>

              {/* SECCIÓN VIDEO */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
                  <Play className="w-3.5 h-3.5 fill-blue-900" />
                  <span>Configuración del Video</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      URL del Video (MP4 o CDN)
                    </label>
                    <input
                      type="url"
                      value={formValues.video?.url || ''}
                      onChange={(e) =>
                        setFormValues((p) => ({
                          ...p,
                          video: { ...p.video!, url: e.target.value },
                        }))
                      }
                      placeholder="https://.../video.mp4"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:ring-2 focus:ring-blue-600/30 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Duración
                    </label>
                    <input
                      type="text"
                      value={formValues.video?.duration || ''}
                      onChange={(e) =>
                        setFormValues((p) => ({
                          ...p,
                          video: { ...p.video!, duration: e.target.value },
                        }))
                      }
                      placeholder="ej. 02:45"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Imagen de Portada */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  URL de Imagen de Portada (Poster)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="url"
                    value={formValues.coverImage || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, coverImage: e.target.value }))}
                    placeholder="https://.../imagen.jpg"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                  {formValues.coverImage && (
                    <img
                      src={formValues.coverImage}
                      alt="Preview"
                      className="w-16 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                    />
                  )}
                </div>
              </div>

              {/* Resumen y Descripción */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Resumen Breve (para tarjetas y vista previa)
                  </label>
                  <textarea
                    rows={2}
                    value={formValues.summary || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, summary: e.target.value }))}
                    placeholder="Breve párrafo que sintetice el tour o evento..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Descripción / Crónica Completa (para la página de blog)
                  </label>
                  <textarea
                    rows={4}
                    value={formValues.description || ''}
                    onChange={(e) => setFormValues((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Escribe la crónica detallada del evento, avances de obra observados, condiciones comerciales..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                </div>
              </div>

              {/* Puntos destacados / Highlights */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Puntos Clave del Recorrido (Highlights)
                </label>
                <div className="space-y-2 mb-2">
                  {(formValues.highlights || []).map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <span>• {h}</span>
                      <button
                        type="button"
                        onClick={() => removeHighlight(i)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={(e) => setNewHighlight(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHighlight();
                      }
                    }}
                    placeholder="Agregar punto clave..."
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-600/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Switches: Publicado y Destacado */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formValues.isPublished !== false}
                    onChange={(e) => setFormValues((p) => ({ ...p, isPublished: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Publicar Evento en la Web
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!formValues.featured}
                    onChange={(e) => setFormValues((p) => ({ ...p, featured: e.target.checked }))}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    Destacar en Portada Principal (Home)
                  </span>
                </label>
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-900 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isPending ? 'Guardando...' : 'Guardar y Publicar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
