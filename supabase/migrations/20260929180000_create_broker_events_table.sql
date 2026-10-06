-- Migration: Crear tabla broker_events para gestión de eventos con brokers y recorridos in situ
CREATE TABLE IF NOT EXISTS public.broker_events (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Tour Inmobiliario',
  project_name TEXT DEFAULT '',
  project_slug TEXT,
  location TEXT DEFAULT '',
  event_date DATE DEFAULT CURRENT_DATE,
  formatted_date TEXT,
  read_time TEXT DEFAULT '3 min de lectura',
  attendees_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  cover_image TEXT,
  video_type TEXT DEFAULT 'mp4',
  video_url TEXT,
  video_duration TEXT DEFAULT '02:00',
  video_thumbnail TEXT,
  summary TEXT,
  description TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  gallery JSONB DEFAULT '[]'::jsonb,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_broker_events_slug ON public.broker_events(slug);
CREATE INDEX IF NOT EXISTS idx_broker_events_featured ON public.broker_events(is_featured);
CREATE INDEX IF NOT EXISTS idx_broker_events_published ON public.broker_events(is_published);
CREATE INDEX IF NOT EXISTS idx_broker_events_date ON public.broker_events(event_date DESC);

-- Enable RLS
ALTER TABLE public.broker_events ENABLE ROW LEVEL SECURITY;

-- Public read for published events
CREATE POLICY "Public read for published broker events"
  ON public.broker_events
  FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

-- Full control for authenticated service / admin roles
CREATE POLICY "Authenticated users full access to broker events"
  ON public.broker_events
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
