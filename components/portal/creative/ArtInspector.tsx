'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useId, type ReactNode } from 'react';
import { ART_ICONS } from './Artboard';
import type { ArtElement, Fill } from './editorModel';

export const controlClass = 'w-full min-w-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 outline-none focus:border-indigo-700 focus:ring-1 focus:ring-indigo-700 disabled:opacity-50';
export const buttonClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed';
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-slate-700"><span>{label}</span>{children}</label>;
}
export function NumberField({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return <Field label={label}><input className={controlClass} type="number" value={Number(value.toFixed(2))} min={min} max={max} step={step} onChange={event => {
    if (event.target.value === '') return;
    const n = Number(event.target.value); if (Number.isFinite(n)) onChange(Math.max(min ?? -10000, Math.min(max ?? 10000, n)));
  }} /></Field>;
}
function toHexColor(color: string): string {
  if (/^#[\da-f]{6}$/i.test(color)) return color;
  const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (match) {
    const r = Number(match[1]).toString(16).padStart(2, '0');
    const g = Number(match[2]).toString(16).padStart(2, '0');
    const b = Number(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#000000';
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (n: string) => void }) {
  return <Field label={label}><div className="flex items-center gap-2"><input aria-label={`${label}: selector`} type="color" className="h-9 w-9 shrink-0 cursor-pointer rounded border border-slate-300 bg-white p-1" value={toHexColor(value)} onChange={e => onChange(e.target.value)} /><input aria-label={`${label}: valor`} className={controlClass} value={value} onChange={e => { if (!/[;{}]|url\(/i.test(e.target.value)) onChange(e.target.value); }} /></div></Field>;
}
export function FillFields({ value, onChange, onImage }: { value: Fill; onChange: (f: Fill) => void; onImage: () => void }) {
  return <div className="space-y-3">
    <UITranslationBoundary attributes={["label"]}><Field label="Tipo de relleno"><select className={controlClass} value={value.mode} onChange={e => onChange({ ...value, mode: e.target.value as Fill['mode'] })}>
      <option value="solid"><LocalizedText text={"Color sólido"} /></option><option value="linear"><LocalizedText text={"Degradado lineal"} /></option><option value="radial"><LocalizedText text={"Degradado radial"} /></option><option value="image"><LocalizedText text={"Imagen"} /></option>
    </select></Field></UITranslationBoundary>
    <UITranslationBoundary attributes={["label"]}><ColorField label="Color" value={value.color} onChange={color => onChange({ ...value, color })} /></UITranslationBoundary>
    {(value.mode === 'linear' || value.mode === 'radial') && <UITranslationBoundary attributes={["label"]}><ColorField label="Segundo color" value={value.color2} onChange={color2 => onChange({ ...value, color2 })} /></UITranslationBoundary>}
    {value.mode === 'linear' && <UITranslationBoundary attributes={["label"]}><NumberField label="Dirección (°)" value={value.angle} min={-360} max={360} onChange={angle => onChange({ ...value, angle })} /></UITranslationBoundary>}
    {value.mode === 'image' && <button type="button" className={buttonClass} onClick={onImage}><LocalizedText text={"Elegir imagen del fondo"} /></button>}
    <UITranslationBoundary attributes={["label"]}><NumberField label="Opacidad del relleno (%)" value={value.opacity * 100} min={0} max={100} onChange={opacity => onChange({ ...value, opacity: opacity / 100 })} /></UITranslationBoundary>
  </div>;
}
export function ArtInspector({ element: e, patch, chooseImage, focusText }: { element: ArtElement; patch: (patch: Partial<ArtElement>) => void; chooseImage: () => void; focusText: boolean }) {
  const fontList = useId();
  return <div className="space-y-4">
    <UITranslationBoundary attributes={["label"]}><Field label="Nombre de capa"><input className={controlClass} value={e.name} onChange={event => patch({ name: event.target.value })} /></Field></UITranslationBoundary>
    {e.locked && <p className="text-sm text-amber-800"><LocalizedText text={"Capa bloqueada. Desbloquéala en Capas para editarla."} /></p>}
    <fieldset disabled={e.locked} className="space-y-4">
      {e.kind === 'text' && <>
        <UITranslationBoundary attributes={["label"]}><Field label="Texto"><textarea key={focusText ? 'focused' : 'normal'} autoFocus={focusText} data-text-editor rows={3} className={`${controlClass} select-text`} value={e.text} onChange={event => patch({ text: event.target.value })} /></Field></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Field label="Tipografía"><input className={controlClass} list={fontList} value={e.fontFamily} onChange={event => patch({ fontFamily: event.target.value })} /><datalist id={fontList}>
          {['Arial, sans-serif', 'Georgia, serif', 'Verdana, sans-serif', 'Trebuchet MS, sans-serif', 'Times New Roman, serif', 'Courier New, monospace', 'var(--font-sans)', 'var(--font-display)', 'var(--font-signature-dancing)', 'var(--font-signature-greatvibes)'].map(font => <option key={font} value={font} />)}
        </datalist></Field></UITranslationBoundary>
        <div className="grid grid-cols-2 gap-2"><UITranslationBoundary attributes={["label"]}><NumberField label="Tamaño de letra" value={e.fontSize} min={1} max={300} onChange={fontSize => patch({ fontSize })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><Field label="Peso"><select className={controlClass} value={e.fontWeight} onChange={event => patch({ fontWeight: Number(event.target.value) })}>{[100, 200, 300, 400, 500, 600, 700, 800, 900].map(n => <option key={n} value={n}>{n === 400 ? 'Normal' : n === 700 ? 'Negrita' : n}</option>)}</select></Field></UITranslationBoundary></div>
        <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.italic} onChange={event => patch({ italic: event.target.checked })} /><LocalizedText text={"Cursiva"} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.underline} onChange={event => patch({ underline: event.target.checked })} /><LocalizedText text={"Subrayado"} /></label></div>
        <UITranslationBoundary attributes={["label"]}><ColorField label="Color del texto" value={e.color} onChange={color => patch({ color })} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Field label="Alineación"><select className={controlClass} value={e.align} onChange={event => patch({ align: event.target.value as ArtElement['align'] })}><option value="left"><LocalizedText text={"Izquierda"} /></option><option value="center"><LocalizedText text={"Centro"} /></option><option value="right"><LocalizedText text={"Derecha"} /></option></select></Field></UITranslationBoundary>
        <div className="grid grid-cols-2 gap-2"><UITranslationBoundary attributes={["label"]}><NumberField label="Interlineado" value={e.lineHeight} min={0.5} max={4} step={0.1} onChange={lineHeight => patch({ lineHeight })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Espaciado" value={e.letterSpacing} min={-4} max={30} step={0.1} onChange={letterSpacing => patch({ letterSpacing })} /></UITranslationBoundary></div>
        <UITranslationBoundary attributes={["label"]}><Field label="Sombra del texto"><select className={controlClass} value={e.textShadow} onChange={event => patch({ textShadow: event.target.value })}><option value="none"><LocalizedText text={"Sin sombra"} /></option><option value="0 2px 4px rgba(0,0,0,0.4)"><LocalizedText text={"Suave"} /></option><option value="0 3px 8px rgba(0,0,0,0.75)"><LocalizedText text={"Intensa"} /></option>{!['none', '0 2px 4px rgba(0,0,0,0.4)', '0 3px 8px rgba(0,0,0,0.75)'].includes(e.textShadow) && <option value={e.textShadow}><LocalizedText text={"De plantilla"} /></option>}</select></Field></UITranslationBoundary>
      </>}
      {e.kind === 'image' && <>
        <button className={buttonClass} type="button" onClick={chooseImage}><LocalizedText text={"Reemplazar imagen"} /></button>
        <UITranslationBoundary attributes={["label"]}><Field label="Encuadre"><select className={controlClass} value={e.fit} onChange={event => patch({ fit: event.target.value as ArtElement['fit'] })}><option value="cover"><LocalizedText text={"Recortar para llenar"} /></option><option value="contain"><LocalizedText text={"Mostrar completa"} /></option><option value="fill"><LocalizedText text={"Estirar al marco"} /></option></select></Field></UITranslationBoundary>
        <p className="text-xs text-slate-600"><LocalizedText text={"Ajusta el marco con las esquinas del lienzo y mueve la foto dentro del marco con estos valores."} /></p>
        <div className="grid grid-cols-2 gap-2"><UITranslationBoundary attributes={["label"]}><NumberField label="Encuadre horizontal (%)" value={e.positionX} min={0} max={100} onChange={positionX => patch({ positionX })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Encuadre vertical (%)" value={e.positionY} min={0} max={100} onChange={positionY => patch({ positionY })} /></UITranslationBoundary></div>
        <div className="space-y-2"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.flipX} onChange={event => patch({ flipX: event.target.checked })} /><LocalizedText text={"Voltear horizontal"} /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={e.flipY} onChange={event => patch({ flipY: event.target.checked })} /><LocalizedText text={"Voltear vertical"} /></label></div>
      </>}
      {e.kind === 'shape' && <FillFields value={e.fill} onChange={fill => patch({ fill, templateGradient: undefined })} onImage={chooseImage} />}
      {e.kind === 'icon' && <><UITranslationBoundary attributes={["label"]}><Field label="Icono"><select className={controlClass} value={e.icon} onChange={event => patch({ icon: event.target.value })}>{e.icon === 'Original' && <option value="Original"><LocalizedText text={"Original de plantilla"} /></option>}{Object.entries(ART_ICONS).map(([id, icon]) => <option key={id} value={id}>{icon.label}</option>)}</select></Field></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><ColorField label="Color del icono" value={e.color} onChange={color => patch({ color })} /></UITranslationBoundary></>}
      <div className="border-t border-slate-200 pt-3"><p className="mb-2 text-sm font-semibold"><LocalizedText text={"Posición y apariencia"} /></p><div className="grid grid-cols-2 gap-2">
        <UITranslationBoundary attributes={["label"]}><NumberField label="X" value={e.x} onChange={x => patch({ x })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Y" value={e.y} onChange={y => patch({ y })} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><NumberField label="Ancho del marco" value={e.width} min={1} onChange={width => patch({ width })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Alto del marco" value={e.height} min={1} onChange={height => patch({ height })} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><NumberField label="Giro (°)" value={e.rotation} min={-360} max={360} onChange={rotation => patch({ rotation })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Opacidad (%)" value={e.opacity * 100} min={0} max={100} onChange={opacity => patch({ opacity: opacity / 100 })} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><NumberField label="Esquinas" value={e.radius} min={0} max={1000} onChange={radius => patch({ radius })} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Grosor del borde" value={e.borderWidth} min={0} max={50} onChange={borderWidth => patch({ borderWidth })} /></UITranslationBoundary>
      </div></div>
      <UITranslationBoundary attributes={["label"]}><ColorField label="Color del borde" value={e.borderColor} onChange={borderColor => patch({ borderColor })} /></UITranslationBoundary>
      <UITranslationBoundary attributes={["label"]}><Field label="Sombra del elemento"><select className={controlClass} value={e.shadow} onChange={event => patch({ shadow: event.target.value })}><option value="none"><LocalizedText text={"Sin sombra"} /></option><option value="0 4px 10px rgba(0,0,0,0.25)"><LocalizedText text={"Suave"} /></option><option value="0 8px 20px rgba(0,0,0,0.5)"><LocalizedText text={"Intensa"} /></option>{!['none', '0 4px 10px rgba(0,0,0,0.25)', '0 8px 20px rgba(0,0,0,0.5)'].includes(e.shadow) && <option value={e.shadow}><LocalizedText text={"De plantilla"} /></option>}</select></Field></UITranslationBoundary>
    </fieldset>
  </div>;
}
