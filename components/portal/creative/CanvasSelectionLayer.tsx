'use client';

import { useCallback, useRef, useState } from 'react';
import type { CanvasObjectLayout } from './types';
import { cn } from '@/lib/utils';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';
type DragMode = { kind: 'move' } | { kind: 'resize'; handle: ResizeHandle };

interface DragState {
  pointerId: number;
  mode: DragMode;
  startX: number;
  startY: number;
  startLayout: CanvasObjectLayout;
}

const MIN_WIDTH = 4;
const MIN_HEIGHT = 3;

interface CanvasSelectionLayerProps {
  objects: Record<string, CanvasObjectLayout>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBeginEdit: () => void;
  onLiveChange: (id: string, layout: CanvasObjectLayout) => void;
  onCommitEdit: () => void;
}

export function CanvasSelectionLayer({ objects, selectedId, onSelect, onBeginEdit, onLiveChange, onCommitEdit }: CanvasSelectionLayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [, setDragTick] = useState(0);

  const clamp = useCallback((layout: CanvasObjectLayout): CanvasObjectLayout => {
    const width = Math.min(100, Math.max(MIN_WIDTH, layout.width));
    const height = Math.min(100, Math.max(MIN_HEIGHT, layout.height));
    const x = Math.min(100 - width, Math.max(0, layout.x));
    const y = Math.min(100 - height, Math.max(0, layout.y));
    return { ...layout, x, y, width, height };
  }, []);

  const startDrag = useCallback(
    (event: React.PointerEvent, id: string, mode: DragMode) => {
      event.stopPropagation();
      const layer = layerRef.current;
      if (!layer) return;
      onSelect(id);
      onBeginEdit();
      (event.target as HTMLElement).setPointerCapture(event.pointerId);
      dragRef.current = {
        pointerId: event.pointerId,
        mode,
        startX: event.clientX,
        startY: event.clientY,
        startLayout: objects[id],
      };
      setDragTick((v) => v + 1);
    },
    [objects, onSelect, onBeginEdit]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent, id: string) => {
      const drag = dragRef.current;
      const layer = layerRef.current;
      if (!drag || !layer || drag.pointerId !== event.pointerId) return;
      const rect = layer.getBoundingClientRect();
      const deltaXPct = ((event.clientX - drag.startX) / rect.width) * 100;
      const deltaYPct = ((event.clientY - drag.startY) / rect.height) * 100;

      const start = drag.startLayout;
      const next: CanvasObjectLayout =
        drag.mode.kind === 'move'
          ? { ...start, x: start.x + deltaXPct, y: start.y + deltaYPct }
          : drag.mode.handle === 'se'
            ? { ...start, width: start.width + deltaXPct, height: start.height + deltaYPct }
            : drag.mode.handle === 'sw'
              ? { ...start, x: start.x + deltaXPct, width: start.width - deltaXPct, height: start.height + deltaYPct }
              : drag.mode.handle === 'ne'
                ? { ...start, y: start.y + deltaYPct, width: start.width + deltaXPct, height: start.height - deltaYPct }
                : { ...start, x: start.x + deltaXPct, y: start.y + deltaYPct, width: start.width - deltaXPct, height: start.height - deltaYPct };
      onLiveChange(id, clamp(next));
    },
    [clamp, onLiveChange]
  );

  const endDrag = useCallback(
    (event: React.PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      onCommitEdit();
      setDragTick((v) => v + 1);
    },
    [onCommitEdit]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, id: string) => {
      const step = event.shiftKey ? 5 : 1;
      let dx = 0;
      let dy = 0;
      if (event.key === 'ArrowLeft') dx = -step;
      else if (event.key === 'ArrowRight') dx = step;
      else if (event.key === 'ArrowUp') dy = -step;
      else if (event.key === 'ArrowDown') dy = step;
      else return;
      event.preventDefault();
      onBeginEdit();
      const layout = objects[id];
      onLiveChange(id, clamp({ ...layout, x: layout.x + dx, y: layout.y + dy }));
      onCommitEdit();
    },
    [objects, onBeginEdit, onLiveChange, onCommitEdit, clamp]
  );

  return (
    <div ref={layerRef} className="absolute inset-0 z-30" onPointerDown={() => onSelect(null)}>
      {Object.entries(objects).map(([id, layout]) => {
        if (layout.visible === false || layout.locked) return null;
        return (
          <SelectableObject
            key={id}
            id={id}
            layout={layout}
            isSelected={selectedId === id}
            startDrag={startDrag}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onKeyDown={handleKeyDown}
          />
        );
      })}
    </div>
  );
}

interface SelectableObjectProps {
  id: string;
  layout: CanvasObjectLayout;
  isSelected: boolean;
  startDrag: (event: React.PointerEvent, id: string, mode: DragMode) => void;
  onPointerMove: (event: React.PointerEvent, id: string) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onKeyDown: (event: React.KeyboardEvent, id: string) => void;
}

function SelectableObject({ id, layout, isSelected, startDrag, onPointerMove, onPointerUp, onKeyDown }: SelectableObjectProps) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => startDrag(e, id, { kind: 'move' }), [startDrag, id]);
  const handlePointerMove = useCallback((e: React.PointerEvent) => onPointerMove(e, id), [onPointerMove, id]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => onKeyDown(e, id), [onKeyDown, id]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Objeto ${id}`}
      className={cn(
        'pointer-events-auto absolute cursor-move touch-none outline-none',
        isSelected ? 'ring-2 ring-blue-500' : 'ring-1 ring-transparent hover:ring-blue-300'
      )}
      style={{ left: `${layout.x}%`, top: `${layout.y}%`, width: `${layout.width}%`, height: `${layout.height}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={onPointerUp}
      onKeyDown={handleKeyDown}
    >
      {isSelected &&
        (['nw', 'ne', 'sw', 'se'] as ResizeHandle[]).map((handle) => (
          <ResizeHandleHotspot key={handle} handle={handle} id={id} startDrag={startDrag} onPointerMove={onPointerMove} onPointerUp={onPointerUp} />
        ))}
    </div>
  );
}

interface ResizeHandleHotspotProps {
  handle: ResizeHandle;
  id: string;
  startDrag: (event: React.PointerEvent, id: string, mode: DragMode) => void;
  onPointerMove: (event: React.PointerEvent, id: string) => void;
  onPointerUp: (event: React.PointerEvent) => void;
}

function ResizeHandleHotspot({ handle, id, startDrag, onPointerMove, onPointerUp }: ResizeHandleHotspotProps) {
  const handlePointerDown = useCallback((e: React.PointerEvent) => startDrag(e, id, { kind: 'resize', handle }), [startDrag, id, handle]);
  const handlePointerMove = useCallback((e: React.PointerEvent) => onPointerMove(e, id), [onPointerMove, id]);

  return (
    <span
      data-resize-handle={handle}
      className={cn(
        'pointer-events-auto absolute h-3 w-3 rounded-full border-2 border-blue-500 bg-white',
        handle === 'nw' && '-left-1.5 -top-1.5 cursor-nwse-resize',
        handle === 'ne' && '-right-1.5 -top-1.5 cursor-nesw-resize',
        handle === 'sw' && '-left-1.5 -bottom-1.5 cursor-nesw-resize',
        handle === 'se' && '-right-1.5 -bottom-1.5 cursor-nwse-resize'
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={onPointerUp}
    />
  );
}
