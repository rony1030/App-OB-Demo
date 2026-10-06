/**
 * Bitácora de obra de ejemplo para los clientes de demostración, con fotografías reales
 * del material de cada proyecto. Solo se usa cuando el cliente es de demostración y el
 * proyecto aún no tiene reportes en la base de datos.
 */
import type { ProjectConstructionUpdate } from '@/lib/data/construction-updates';

const SAMPLE: Record<string, { name: string; photos: string[]; progress: [number, number, number] }> = {
  'cana-rock-star': {
    name: 'Cana Rock Star',
    photos: ['/projects/cana-rock/drone-golf-course.jpg', '/projects/cana-rock-stelar/stelar-aerial-bg.jpg', '/projects/cana-rock-stelar/stelar-golf-bg.jpg'],
    progress: [100, 94, 86],
  },
  'cipres-residences': {
    name: 'Ciprés Residences',
    photos: [
      '/projects/cipres-residences/gallery/cipres_06.jpeg',
      '/projects/cipres-residences/gallery/cipres_07.jpeg',
      '/projects/cipres-residences/gallery/cipres_08.jpeg',
      '/projects/cipres-residences/gallery/cipres_09.jpeg',
    ],
    progress: [58, 47, 36],
  },
  'palm-view': {
    name: 'Palm View Golf & Residences',
    photos: [
      '/projects/palm-view/gallery/amenidades-casa-club-aerea.jpg',
      '/projects/palm-view/gallery/amenidades-piscina-torre-1.jpg',
      '/projects/palm-view/gallery/amenidades-lobby-central.jpg',
      '/projects/palm-view/gallery/amenidades-gimnasio-01.jpg',
    ],
    progress: [64, 52, 41],
  },
  'uve-residences': {
    name: 'UVE Residences',
    photos: ['/projects/uve-residences/exterior-cover.jpg', '/projects/uve-residences/pool.jpeg', '/projects/uve-residences/gym.png', '/projects/uve-residences/aerial.png'],
    progress: [100, 91, 78],
  },
};

const STAGES = ['Terminaciones y entrega', 'Acabados interiores', 'Estructura y mampostería'];

export function getDemoConstructionUpdates(slug: string, asOf: Date = new Date()): ProjectConstructionUpdate[] {
  const sample = SAMPLE[slug];
  if (!sample) return [];
  return sample.progress.map((progress, i) => {
    const date = new Date(asOf.getFullYear(), asOf.getMonth() - i, 5);
    const iso = date.toISOString().slice(0, 10);
    const done = progress >= 100;
    return {
      id: `demo-${slug}-${i}`,
      project_slug: slug,
      title: i === 0 ? (done ? 'Obra concluida e inspeccionada' : 'Avance mensual de construcción') : `Avance mensual de construcción`,
      report_date: iso,
      overall_progress_percentage: progress,
      stage_name: done && i === 0 ? 'Concluida' : STAGES[Math.min(i, STAGES.length - 1)],
      summary: done && i === 0
        ? `${sample.name}: la obra está terminada y pasó la inspección. Se coordina la entrega de unidades.`
        : `${sample.name}: ejecución al ${progress}%. Se avanza según el cronograma aprobado.`,
      description: null,
      drone_video_url: null,
      drone_video_thumbnail: null,
      photos: sample.photos.slice(0, 3).map((url, n) => ({ url, caption: `Vista ${n + 1} · ${sample.name}`, sort_order: n })),
      is_published: true,
      created_at: iso,
      updated_at: iso,
    };
  });
}
