import { PDFDocument, rgb, StandardFonts, type PDFFont } from 'pdf-lib';
import type { PortalUnit } from '@/lib/portal-projects';
import { availabilityTables, type AvailabilityReport } from '@/lib/availability/report';
import { availabilityText, availabilityDisclaimer } from '@/lib/availability/copy';
import type { Locale } from '@/lib/i18n/locale';

export interface ExportAvailabilityPdfOptions {
  projectName: string; units: PortalUnit[]; customColumns?: string[]; updatedAt?: string;
  availabilityUrl?: string; generatedAt?: Date; projectSlug?: string;
  locale?: Locale;
  primaryColorHex?: string; accentColorHex?: string; projectLogoUrl?: string | null;
}

function safe(text: string, font: PDFFont) {
  return [...text.replace(/[\u2010-\u2015]/g,'-').replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\s+/g,' ')].map(char => {
    try { font.encodeText(char); return char; } catch { return '?'; }
  }).join('');
}
function wrap(text: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = []; let line = '';
  for (const char of safe(text,font)) {
    if (font.widthOfTextAtSize(line + char,size) > width && line) {
      const space = line.lastIndexOf(' ');
      if (space > line.length/2) { lines.push(line.slice(0,space)); line = line.slice(space+1) + char; }
      else { lines.push(line); line = char; }
    } else line += char;
  }
  lines.push(line.trim()); return lines;
}

/** Vector text, true Letter landscape. Every page reserves space for source and disclaimer. */
export async function buildAvailabilityPdf(options: ExportAvailabilityPdfOptions): Promise<Uint8Array> {
  const {projectName,units,customColumns = [],updatedAt = 'Sin fecha de actualización',availabilityUrl = 'https://brokers.osvaldobello.com',generatedAt = new Date()} = options;
  const pdf = await PDFDocument.create();
  const locale=options.locale || 'es';
  const t=(text:string)=>availabilityText(text,locale);
  const font = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.08,.08,.08), muted = rgb(.32,.32,.32), line = rgb(.8,.8,.8);
  const stamp = new Intl.DateTimeFormat(locale==='es'?'es-DO':locale,{dateStyle:'long',timeStyle:'short',timeZone:'America/Santo_Domingo'}).format(generatedAt);
  const report: AvailabilityReport = {projectName,projectSlug:options.projectSlug || '',updatedAt,units,customColumns};
  const tables = availabilityTables(report);
  const width = 720, left = 36;
  const columnWidths = (columns:string[]) => columns.length === 8 && columns[3] === 'Tipología'
    ? [70,85,40,170,100,65,105,85] : columns.map(()=>width/columns.length);
  const columnX = (widths:number[],index:number) => left+widths.slice(0,index).reduce((sum,value)=>sum+value,0);
  const pages: Array<{page: ReturnType<typeof pdf.addPage>; y: number}> = [];
  const newPage = (table: {title:string;columns:string[]}) => {
    const page = pdf.addPage([792,612]);
    page.drawText(safe(projectName,bold),{x:left,y:574,size:17,font:bold,color:ink});
    page.drawText(safe(`Osvaldo Bello · ${t('Disponibilidad de unidades')}`,font),{x:left,y:555,size:10,font,color:muted});
    page.drawText(safe(`${t(table.title)} | ${units.length} ${t('unidades en este reporte')}`,font),{x:left,y:536,size:9,font,color:muted});
    const widths = columnWidths(table.columns);
    const headers = table.columns.map((c,i) => wrap(t(c),bold,8.5,widths[i]-14));
    const h = Math.max(...headers.map(l=>l.length))*11+12;
    headers.forEach((lines,i) => lines.forEach((t,j)=>page.drawText(t,{x:columnX(widths,i)+6,y:516-j*11,size:8.5,font:bold,color:ink})));
    page.drawLine({start:{x:left,y:524-h},end:{x:756,y:524-h},thickness:.8,color:ink});
    const state = {page,y:524-h}; pages.push(state); return state;
  };
  if (!tables.length) {
    const state = newPage({title:'Inventario',columns:['Disponibilidad']});
    state.page.drawText(safe(t('No hay unidades que coincidan con estos filtros.'),font),{x:left,y:state.y-30,size:11,font,color:ink});
  }
  for (const table of tables) {
    let state = newPage(table);
    const widths = columnWidths(table.columns);
    for (const row of table.rows) {
      const cells = row.map((cell,i)=>wrap(i===row.length-1?t(cell):cell,i===0?bold:font,9,widths[i]-14));
      const rowHeight = Math.max(22,Math.max(...cells.map(c=>c.length))*11+11);
      if (state.y-rowHeight < 125) state = newPage(table);
      cells.forEach((lines,i)=>lines.forEach((text,j)=>state.page.drawText(text,{x:columnX(widths,i)+6,y:state.y-15-j*11,size:9,font:i===0?bold:font,color:ink})));
      state.y -= rowHeight;
      state.page.drawLine({start:{x:left,y:state.y},end:{x:756,y:state.y},thickness:.35,color:line});
    }
  }
  pages.forEach(({page},i)=>{
    page.drawLine({start:{x:left,y:113},end:{x:756,y:113},thickness:.6,color:line});
    page.drawText(safe(`${t('Generado:')} ${stamp} ${t('(hora de Santo Domingo)')}`,font),{x:left,y:99,size:8,font,color:muted});
    page.drawText(safe(`${t('Última actualización de inventario:')} ${updatedAt}`,font),{x:left,y:87,size:8,font,color:muted});
    wrap(`${t('Disponibilidad en línea:')} ${availabilityUrl}`,font,8,width).forEach((text,j)=>page.drawText(text,{x:left,y:75-j*10,size:8,font,color:muted}));
    wrap(availabilityDisclaimer(locale),font,8,width).forEach((text,j)=>page.drawText(text,{x:left,y:52-j*10,size:8,font,color:muted}));
    page.drawText(`${i+1} / ${pages.length}`,{x:725,y:17,size:8,font,color:muted});
  });
  pdf.setTitle(`${projectName} · Disponibilidad`); pdf.setAuthor('Osvaldo Bello'); pdf.setCreationDate(generatedAt);
  return pdf.save();
}

export async function exportAvailabilityToPdf(options: ExportAvailabilityPdfOptions) {
  const bytes = await buildAvailabilityPdf(options);
  const blob = new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `Disponibilidad_${options.projectName.replace(/[^\p{L}\p{N}]+/gu,'_')}.pdf`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}
