import fs from 'node:fs';
import path from 'node:path';
import { createAdminClient } from '@/lib/supabase/admin';
import { type BrokerEvent, INITIAL_BROKER_EVENTS } from '@/types/events';
import type { Json } from '@/types/database';

type BrokerEventRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: string;
  project_name: string | null;
  project_slug: string | null;
  location: string | null;
  event_date: string | null;
  formatted_date: string | null;
  read_time: string | null;
  attendees_count: number | null;
  is_featured: boolean | null;
  is_published: boolean | null;
  cover_image: string | null;
  video_type: string | null;
  video_url: string | null;
  video_duration: string | null;
  video_thumbnail: string | null;
  summary: string | null;
  description: string | null;
  highlights: Json | null;
  gallery: Json | null;
  tags: Json | null;
  created_at: string | null;
  updated_at: string | null;
};

function jsonStringArray(value: Json | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function brokerEventVideoType(value: string | null): BrokerEvent['video']['type'] {
  return value === 'youtube' || value === 'vimeo' ? value : 'mp4';
}

// broker_events is created by a project migration but is not present in the
// generated Supabase Database type yet. Keep the untyped boundary limited to
// this table while retaining typed payloads and row mapping above.
function brokerEventsTable() {
  return (createAdminClient() as unknown as {
    from: (table: 'broker_events') => {
      select: (columns: '*') => {
        order: (column: 'is_featured' | 'event_date', options: { ascending: boolean }) => {
          order: (column: 'event_date', options: { ascending: boolean }) => {
            eq: (column: 'is_published', value: boolean) => Promise<{ data: BrokerEventRow[] | null; error: unknown }>;
            then: (resolve: (result: { data: BrokerEventRow[] | null; error: unknown }) => unknown) => unknown;
          };
        };
      };
      upsert: (values: Record<string, unknown>) => Promise<unknown>;
      delete: () => { eq: (column: 'id', value: string) => Promise<unknown> };
      update: (values: Record<string, unknown>) => {
        neq: (column: 'id', value: string) => Promise<unknown>;
        eq: (column: 'id', value: string) => Promise<unknown>;
      };
    };
  }).from('broker_events');
}

export type { BrokerEvent, BrokerEventVideo } from '@/types/events';
export { INITIAL_BROKER_EVENTS } from '@/types/events';

// Archivo persistente en disco para entornos locales y fallback de alta disponibilidad
const DATA_FILE_PATH = path.join(process.cwd(), 'storage-export', 'broker-events.json');

// Cache en memoria para rendimiento ultra-rápido en SSR
let memoryEvents: BrokerEvent[] | null = null;

function readFromFile(): BrokerEvent[] | null {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[events] Error leyendo archivo persistente de eventos:', err);
  }
  return null;
}

function writeToFile(events: BrokerEvent[]) {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(events, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[events] Error guardando archivo persistente de eventos:', err);
  }
}

export async function getBrokerEvents(includeUnpublished = false): Promise<BrokerEvent[]> {
  // 1. Intentar cargar desde Supabase si la tabla broker_events existe
  try {
    const query = brokerEventsTable()
      .select('*')
      .order('is_featured', { ascending: false })
      .order('event_date', { ascending: false });

    if (!includeUnpublished) {
      query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      const dbEvents: BrokerEvent[] = data.map((row) => ({
        id: String(row.id),
        slug: row.slug,
        title: row.title,
        subtitle: row.subtitle || '',
        category: row.category as BrokerEvent['category'] || 'Tour Inmobiliario',
        projectName: row.project_name || '',
        projectSlug: row.project_slug || undefined,
        location: row.location || '',
        date: row.event_date || new Date().toISOString().split('T')[0],
        formattedDate: row.formatted_date || row.event_date || '',
        readTime: row.read_time || '3 min',
        attendeesCount: Number(row.attendees_count) || 0,
        featured: !!row.is_featured,
        isPublished: row.is_published !== false,
        coverImage: row.cover_image || '',
        video: {
          type: brokerEventVideoType(row.video_type),
          url: row.video_url || '',
          duration: row.video_duration || '02:00',
          thumbnailUrl: row.video_thumbnail || row.cover_image || undefined,
        },
        summary: row.summary || '',
        description: row.description || '',
        highlights: jsonStringArray(row.highlights),
        gallery: jsonStringArray(row.gallery),
        tags: jsonStringArray(row.tags),
        createdAt: row.created_at || undefined,
        updatedAt: row.updated_at || undefined,
      }));

      memoryEvents = dbEvents;
      writeToFile(dbEvents);
      return includeUnpublished ? dbEvents : dbEvents.filter((e) => e.isPublished !== false);
    }
  } catch {
    // Si la tabla no está creada en Supabase, pasamos fluidamente al archivo o defaults
  }

  // 2. Fallback a archivo persistente o memoria
  if (!memoryEvents) {
    const fromFile = readFromFile();
    memoryEvents = fromFile && fromFile.length > 0 ? fromFile : [...INITIAL_BROKER_EVENTS];
  }

  return includeUnpublished
    ? memoryEvents
    : memoryEvents.filter((e) => e.isPublished !== false);
}

export async function getBrokerEventBySlug(slug: string): Promise<BrokerEvent | null> {
  const all = await getBrokerEvents(true);
  return all.find((e) => e.slug === slug) || null;
}

export async function upsertBrokerEvent(eventData: Partial<BrokerEvent> & { id?: string; title: string; slug: string }): Promise<{ success: boolean; event?: BrokerEvent; error?: string }> {
  const allEvents = await getBrokerEvents(true);
  const now = new Date().toISOString();

  const id = eventData.id || `evt-${Date.now()}`;
  const existingIndex = allEvents.findIndex((e) => e.id === id || e.slug === eventData.slug);

  const mergedEvent: BrokerEvent = {
    id,
    slug: eventData.slug,
    title: eventData.title,
    subtitle: eventData.subtitle || '',
    category: eventData.category || 'Tour Inmobiliario',
    projectName: eventData.projectName || 'Quebec Cana',
    projectSlug: eventData.projectSlug || undefined,
    location: eventData.location || 'Punta Cana, Rep. Dominicana',
    date: eventData.date || now.split('T')[0],
    formattedDate: eventData.formattedDate || new Date().toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' }),
    readTime: eventData.readTime || '3 min de lectura',
    attendeesCount: Number(eventData.attendeesCount) || 0,
    featured: !!eventData.featured,
    isPublished: eventData.isPublished !== false,
    coverImage: eventData.coverImage || 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
    video: {
      type: eventData.video?.type || 'mp4',
      url: eventData.video?.url || '',
      duration: eventData.video?.duration || '02:00',
      thumbnailUrl: eventData.video?.thumbnailUrl || eventData.coverImage,
    },
    summary: eventData.summary || '',
    description: eventData.description || '',
    highlights: Array.isArray(eventData.highlights) ? eventData.highlights : [],
    gallery: Array.isArray(eventData.gallery) ? eventData.gallery : [],
    tags: Array.isArray(eventData.tags) ? eventData.tags : [],
    createdAt: existingIndex >= 0 ? allEvents[existingIndex].createdAt : now,
    updatedAt: now,
  };

  // Si este evento se marca como featured, desmarcar los demás
  if (mergedEvent.featured) {
    allEvents.forEach((e) => {
      if (e.id !== mergedEvent.id) e.featured = false;
    });
  }

  if (existingIndex >= 0) {
    allEvents[existingIndex] = mergedEvent;
  } else {
    allEvents.unshift(mergedEvent);
  }

  memoryEvents = allEvents;
  writeToFile(allEvents);

  // Intentar guardar en Supabase si está disponible
  try {
    await brokerEventsTable().upsert({
      id: mergedEvent.id,
      slug: mergedEvent.slug,
      title: mergedEvent.title,
      subtitle: mergedEvent.subtitle,
      category: mergedEvent.category,
      project_name: mergedEvent.projectName,
      project_slug: mergedEvent.projectSlug,
      location: mergedEvent.location,
      event_date: mergedEvent.date,
      formatted_date: mergedEvent.formattedDate,
      read_time: mergedEvent.readTime,
      attendees_count: mergedEvent.attendeesCount,
      is_featured: mergedEvent.featured,
      is_published: mergedEvent.isPublished,
      cover_image: mergedEvent.coverImage,
      video_type: mergedEvent.video.type,
      video_url: mergedEvent.video.url,
      video_duration: mergedEvent.video.duration,
      video_thumbnail: mergedEvent.video.thumbnailUrl,
      summary: mergedEvent.summary,
      description: mergedEvent.description,
      highlights: mergedEvent.highlights,
      gallery: mergedEvent.gallery,
      tags: mergedEvent.tags,
      updated_at: now,
    });
  } catch {
    // Si la tabla Supabase aún no está disponible, el guardado local persistente ya surtió efecto
  }

  return { success: true, event: mergedEvent };
}

export async function deleteBrokerEvent(id: string): Promise<{ success: boolean; error?: string }> {
  const allEvents = await getBrokerEvents(true);
  const filtered = allEvents.filter((e) => e.id !== id);

  memoryEvents = filtered;
  writeToFile(filtered);

  try {
    await brokerEventsTable().delete().eq('id', id);
  } catch {
    // Fallback silencioso
  }

  return { success: true };
}

export async function toggleBrokerEventFeatured(id: string): Promise<{ success: boolean; error?: string }> {
  const allEvents = await getBrokerEvents(true);
  const target = allEvents.find((e) => e.id === id);
  if (!target) return { success: false, error: 'Evento no encontrado' };

  const willBeFeatured = !target.featured;

  allEvents.forEach((e) => {
    if (e.id === id) {
      e.featured = willBeFeatured;
    } else if (willBeFeatured) {
      e.featured = false;
    }
  });

  memoryEvents = allEvents;
  writeToFile(allEvents);

  try {
    await brokerEventsTable().update({ is_featured: false }).neq('id', id);
    await brokerEventsTable().update({ is_featured: willBeFeatured }).eq('id', id);
  } catch {
    // Fallback local
  }

  return { success: true };
}
