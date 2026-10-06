'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useRef, useState } from 'react';
import { Eraser, PenLine, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isCanvasBlank, trimCanvas, renderTypedSignature } from '@/lib/signatures/signature-image';

const signatureFont = { className: 'signature-script', style: { fontFamily: 'cursive' } };
const greatVibes = signatureFont;
const dancingScript = signatureFont;
const sacramento = signatureFont;

const FONTS = [
  { id: 'vibes', label: 'Elegante', font: greatVibes, size: 64, weight: 400 },
  { id: 'dancing', label: 'Fluida', font: dancingScript, size: 56, weight: 700 },
  { id: 'sacramento', label: 'Clásica', font: sacramento, size: 60, weight: 400 },
] as const;

type FontId = (typeof FONTS)[number]['id'];

export default function SignatureCapture({
  signerName,
  onChange,
}: {
  signerName: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(signerName);
  const [fontId, setFontId] = useState<FontId>('vibes');
  const [fontsReady, setFontsReady] = useState(() => !(document as unknown as { fonts?: FontFaceSet }).fonts?.load);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (!fonts?.load) return;
    Promise.all(FONTS.map((f) => fonts.load(`${f.weight} ${f.size}px ${f.font.style.fontFamily}`, 'ABCabc')))
      .catch(() => null)
      .then(() => setFontsReady(true));
  }, []);

  const activeFont = FONTS.find((f) => f.id === fontId) ?? FONTS[0];

  useEffect(() => {
    if (mode !== 'type' || !fontsReady) return;
    const url = typedName.trim()
      ? renderTypedSignature(typedName, activeFont.font.style.fontFamily, activeFont.size, activeFont.weight)
      : null;
    onChange(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, typedName, fontId, fontsReady]);

  function pointerPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    isDrawingRef.current = true;
    const { x, y } = pointerPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    const { x, y } = pointerPos(e, canvas);
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0A0A33';
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(isCanvasBlank(canvas) ? null : trimCanvas(canvas));
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    ctx?.clearRect(0, 0, canvas!.width, canvas!.height);
    onChange(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('draw');
            onChange(null);
          }}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold',
            mode === 'draw' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'
          )}
        >
          <PenLine className="h-3.5 w-3.5" /><LocalizedText text={" Dibujar"} /></button>
        <button
          type="button"
          onClick={() => setMode('type')}
          className={cn(
            'inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold',
            mode === 'type' ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'
          )}
        >
          <Type className="h-3.5 w-3.5" /><LocalizedText text={" Escribir"} /></button>
      </div>

      {mode === 'draw' ? (
        <div className="space-y-2">
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            className="w-full touch-none rounded-xl border-2 border-dashed border-slate-300 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          <button type="button" onClick={clearCanvas} className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-red-600">
            <Eraser className="h-3.5 w-3.5" /><LocalizedText text={" Borrar"} /></button>
        </div>
      ) : (
        <div className="space-y-3">
          <UITranslationBoundary attributes={["placeholder"]}><input
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="Escribe tu nombre completo"
            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-400"
          /></UITranslationBoundary>
          <div className="flex gap-2">
            {FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontId(f.id)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[11px] font-bold',
                  fontId === f.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div
            className={cn('flex h-[100px] items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-white px-4 text-3xl text-[#0A0A33]', activeFont.font.className)}
          >
            {typedName.trim() || 'Vista previa de tu firma'}
          </div>
        </div>
      )}
    </div>
  );
}
