import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { commissionAmount, documentNumber, fiscalNumber, FICTIONAL_AGENCY, type WorkflowDeal } from './browser-workflow';

export async function downloadCommissionDocument(deal: WorkflowDeal, kind: 'proforma' | 'factura') {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${kind === 'proforma' ? 'Proforma' : 'Factura'} ${documentNumber(deal, kind)}`);
  pdf.setAuthor(FICTIONAL_AGENCY.name);
  const page = pdf.addPage([612, 792]); const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(.06, .12, .2); const muted = rgb(.36, .4, .45); const line = rgb(.85, .88, .91); const green = rgb(.08, .35, .29);
  const text = (value: string, x: number, y: number, size = 10, strong = false, color = navy) => page.drawText(value.replace(/[^\x20-\x7E\xA0-\xFF]/g, '-'), { x, y, size, font: strong ? bold : regular, color, maxWidth: 516 });
  const money = (value: number) => `${deal.currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const rule = (y: number) => page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, color: line, thickness: 1 });
  page.drawRectangle({ x: 0, y: 660, width: 612, height: 132, color: navy });
  text('HORIZONTE', 48, 742, 24, true, rgb(1,1,1)); text('ASESORES INMOBILIARIOS', 48, 719, 10, true, rgb(.8,.86,.9));
  text(kind === 'proforma' ? 'PROFORMA DE COMISION' : 'FACTURA DE COMISION', 48, 686, 13, true, rgb(1,1,1));
  text(documentNumber(deal, kind), 370, 741, 13, true, rgb(1,1,1));
  text(new Date(kind === 'proforma' ? deal.proformaAt! : deal.invoiceAt!).toLocaleDateString('es-DO'), 370, 718, 10, false, rgb(1,1,1));
  text(FICTIONAL_AGENCY.name, 48, 629, 12, true); text(`RNC: ${FICTIONAL_AGENCY.taxId}`, 48, 610); text(FICTIONAL_AGENCY.address, 48, 591); text(FICTIONAL_AGENCY.email, 48, 572);
  if (kind === 'factura') { text('COMPROBANTE FISCAL', 370, 629, 9, true); text(fiscalNumber(deal), 370, 609, 13, true); }
  rule(546); text('FACTURAR A', 48, 521, 9, true, muted); text(deal.developer, 48, 500, 13, true); text(`Proyecto: ${deal.projectName}`, 48, 480); text(`Cliente: ${deal.clientName}`, 48, 461); text(`Unidad: ${deal.unitCode}`, 48, 442);
  page.drawRectangle({ x: 48, y: 381, width: 516, height: 31, color: rgb(.94,.96,.97) }); text('DESCRIPCION', 60, 393, 9, true); text('IMPORTE', 453, 393, 9, true);
  text('Servicios de intermediacion inmobiliaria', 60, 360, 11, true); text(`Comision ${deal.commissionRate}% sobre ${money(deal.price)}`, 60, 339); text(money(commissionAmount(deal)), 428, 360, 10, true); rule(316);
  text('Comision liberada', 340, 286); text(money(commissionAmount(deal)), 442, 286, 10, true);
  text('TOTAL', 340, 251, 13, true); text(money(commissionAmount(deal)), 429, 251, 13, true);
  page.drawCircle({ x: 123, y: 218, size: 57, borderColor: green, borderWidth: 2 }); page.drawCircle({ x: 123, y: 218, size: 50, borderColor: green, borderWidth: .7 });
  text('HORIZONTE', 85, 235, 11, true, green); text('ADMINISTRACION', 77, 215, 9, true, green); text('AUTORIZADO', 88, 195, 9, true, green);
  text('Departamento de administracion', 48, 133, 10, true); text('Horizonte Asesores Inmobiliarios', 48, 115, 9, false, muted); rule(91); text(`${deal.projectName} / ${deal.unitCode}`, 48, 70, 9, false, muted); text('Pagina 1 de 1', 500, 70, 9, false, muted);
  const bytes = await pdf.save(); const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }));
  const link = document.createElement('a'); link.href = url; link.download = `${documentNumber(deal, kind)}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000);
}
