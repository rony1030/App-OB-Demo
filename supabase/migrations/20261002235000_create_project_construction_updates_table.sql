-- Migration: Crear tabla project_construction_updates para bitácora y avances de obra mensual
CREATE TABLE IF NOT EXISTS public.project_construction_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  project_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  report_date DATE DEFAULT CURRENT_DATE,
  overall_progress_percentage NUMERIC(5,2) DEFAULT 0,
  stage_name TEXT DEFAULT 'En Construcción',
  summary TEXT,
  description TEXT,
  drone_video_url TEXT,
  drone_video_thumbnail TEXT,
  photos JSONB DEFAULT '[]'::jsonb, -- Array de { url: string, caption?: string, sort_order?: number }
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para lectura eficiente
CREATE INDEX IF NOT EXISTS idx_construction_updates_project_slug ON public.project_construction_updates(project_slug);
CREATE INDEX IF NOT EXISTS idx_construction_updates_date ON public.project_construction_updates(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_construction_updates_published ON public.project_construction_updates(is_published);

-- Habilitar RLS
ALTER TABLE public.project_construction_updates ENABLE ROW LEVEL SECURITY;

-- Política de lectura: pública para actualizaciones publicadas o para usuarios autenticados
CREATE POLICY "Public read for published construction updates"
  ON public.project_construction_updates
  FOR SELECT
  USING (is_published = true OR auth.role() = 'authenticated');

-- Política de escritura completa para usuarios autenticados
CREATE POLICY "Authenticated users full access to construction updates"
  ON public.project_construction_updates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
