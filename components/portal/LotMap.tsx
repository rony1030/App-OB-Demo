'use client';

import { useEffect, useRef } from 'react';
import type { PortalLot } from '@/lib/portal-projects';

const STATUS_COLORS: Record<PortalLot['status'], string> = {
  Disponible: '#16a34a',
  Separada: '#f59e0b',
  Vendida: '#64748b',
  Bloqueada: '#94a3b8',
};

export default function LotMap({
  lots,
  selectedLotId,
  onSelectLot,
}: {
  lots: PortalLot[];
  selectedLotId: string | null;
  onSelectLot: (lot: PortalLot) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectLotRef = useRef(onSelectLot);

  useEffect(() => {
    onSelectLotRef.current = onSelectLot;
  }, [onSelectLot]);

  useEffect(() => {
    if (!containerRef.current || lots.length === 0) return;
    let cancelled = false;
    let map: import('leaflet').Map | null = null;

    void import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return;

      const points = lots.flatMap((lot) => lot.polygon.map((p) => [p.lat, p.lng] as [number, number]));
      const centerLat = points.reduce((sum, p) => sum + p[0], 0) / points.length;
      const centerLng = points.reduce((sum, p) => sum + p[1], 0) / points.length;

      map = L.map(containerRef.current, { center: [centerLat, centerLng], zoom: 19, scrollWheelZoom: false });

      const satellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: 'Imagery &copy; Esri', maxZoom: 21 }
      ).addTo(map);
      const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      });
      L.control.layers({ 'Vista satélite': satellite, 'Mapa vial': streets }, undefined, { position: 'topright' }).addTo(map);

      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [24, 24] });

      for (const lot of lots) {
        const ring = lot.polygon.map((p) => [p.lat, p.lng] as [number, number]);
        const color = STATUS_COLORS[lot.status] ?? STATUS_COLORS.Bloqueada;
        const polygon = L.polygon(ring, {
          color,
          weight: lot.id === selectedLotId ? 3 : 1.5,
          fillColor: color,
          fillOpacity: lot.id === selectedLotId ? 0.55 : 0.32,
        }).addTo(map!);
        polygon.bindTooltip(`${lot.code} · ${lot.areaSqm} m² · ${lot.status}`, { sticky: true });
        polygon.on('click', () => onSelectLotRef.current(lot));
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [lots, selectedLotId]);

  return <div ref={containerRef} className="h-full w-full overflow-hidden rounded-2xl" />;
}
