import 'server-only';

import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getPublicAssetUrl } from '@/lib/supabase/storage';

/**
 * WinAnsi/pdf-lib safe text cleaner. Standard fonts throw on any character
 * outside WinAnsi, and the stamping/certificate generation is atomic: one bad
 * character (a stray symbol pasted from Word, an accented name PDF-lib
 * doesn't like) would otherwise abort the whole document.
 * Ported from OsvaldoBello/lib/signature-pdf.ts.
 */
export function sanitizeWinAnsiText(input: string): string {
  if (!input) return '';
  let cleaned = input
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/…/g, '...')
    .replace(/€/g, 'EUR')
    .replace(/™/g, '(TM)')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[ -   　 ]/g, ' ');
  cleaned = cleaned.normalize('NFKC');
  return cleaned.replace(/[^\x20-\x7E\xA0-\xFF]/g, '');
}

/** Single draw-text choke point so no call site can reintroduce the WinAnsi crash. */
export function drawSafe(page: PDFPage, text: unknown, options: Parameters<PDFPage['drawText']>[1]) {
  page.drawText(sanitizeWinAnsiText(String(text ?? '')), options);
}

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const NAVY = rgb(0.04, 0.04, 0.2);
const BLUE = rgb(0.15, 0.35, 0.85);
const GRAY_BG = rgb(0.96, 0.97, 0.98);
const DARK_GRAY = rgb(0.2, 0.2, 0.2);
const LIGHT_BORDER = rgb(0.88, 0.9, 0.92);

export type CommissionMilestoneForPdf = {
  commissionPct: number;
  triggerType: 'client_payment_pct' | 'contract_signed' | 'unit_delivery' | 'final_settlement' | 'custom';
  triggerValue: number | null;
  description: string | null;
};

export type AgreementPdfParams = {
  masterBroker: {
    legalName: string;
    taxId: string | null;
    address: string | null;
    repName: string | null;
    repPosition: string | null;
    repId: string | null;
    repEmail: string | null;
  };
  brokerOrg: {
    legalName: string;
    taxId: string | null;
    address: string | null;
  };
  signerName: string;
  signerIdNumber: string | null;
  project: { name: string; location: string | null; developerName: string | null } | null;
  developer: { legalName: string; taxId: string | null; address: string | null } | null;
  commissionRate: number | null;
  commissionTerms: string | null;
  commissionMilestones?: CommissionMilestoneForPdf[];
  validMonths: number;
  kind: 'general' | 'project_specific';
  masterBrokerSignatureImageBytes?: Uint8Array | null;
  masterBrokerSealImageBytes?: Uint8Array | null;
};

/** Signature box position, expressed as a page percentage (matches signature_fields.x/y/width/height). */
export type FieldBoxPct = { pageNumber: number; x: number; y: number; width: number; height: number };

const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PENDING = '(dato pendiente)';

function fill(value: string | null | undefined): string {
  const trimmed = (value ?? '').trim();
  return trimmed || PENDING;
}

/** Minimal text-flow cursor: wraps paragraphs and starts a new page on overflow. */
class DocFlow {
  pdfDoc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  page!: PDFPage;
  y = 0;
  pageCount = 0;

  private constructor(pdfDoc: PDFDocument, font: PDFFont, bold: PDFFont) {
    this.pdfDoc = pdfDoc;
    this.font = font;
    this.bold = bold;
  }

  static async create(pdfDoc: PDFDocument): Promise<DocFlow> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const flow = new DocFlow(pdfDoc, font, bold);
    flow.addPage();
    return flow;
  }

  addPage() {
    this.page = this.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    this.page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 6, width: PAGE_WIDTH, height: 6, color: BLUE });
    this.y = PAGE_HEIGHT - 44;
    this.pageCount += 1;
  }

  ensureSpace(height: number) {
    if (this.y - height < 70) this.addPage();
  }

  gap(amount: number) {
    this.y -= amount;
  }

  heading(text: string, size = 10) {
    this.ensureSpace(size + 10);
    drawSafe(this.page, text, { x: MARGIN, y: this.y, size, font: this.bold, color: NAVY });
    this.y -= size + 6;
  }

  /** Wraps `text` at CONTENT_WIDTH (minus `indent`), justifying lines and advancing the cursor. */
  paragraph(
    text: string,
    {
      size = 9,
      indent = 0,
      lineGap = 12.5,
      color = DARK_GRAY,
      bold = false,
      justify = true,
    }: {
      size?: number;
      indent?: number;
      lineGap?: number;
      color?: ReturnType<typeof rgb>;
      bold?: boolean;
      justify?: boolean;
    } = {}
  ) {
    const font = bold ? this.bold : this.font;
    const maxWidth = CONTENT_WIDTH - indent;
    const rawWords = sanitizeWinAnsiText(text).split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return;

    const lines: string[][] = [];
    let currentLineWords: string[] = [];
    let currentLineWidth = 0;
    const spaceWidth = font.widthOfTextAtSize(' ', size);

    for (const word of rawWords) {
      const wordWidth = font.widthOfTextAtSize(word, size);
      if (currentLineWords.length === 0) {
        currentLineWords.push(word);
        currentLineWidth = wordWidth;
      } else if (currentLineWidth + spaceWidth + wordWidth <= maxWidth) {
        currentLineWords.push(word);
        currentLineWidth += spaceWidth + wordWidth;
      } else {
        lines.push(currentLineWords);
        currentLineWords = [word];
        currentLineWidth = wordWidth;
      }
    }
    if (currentLineWords.length > 0) {
      lines.push(currentLineWords);
    }

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const lineWords = lines[lineIdx];
      const isLastLine = lineIdx === lines.length - 1;
      this.ensureSpace(lineGap);

      if (!justify || isLastLine || lineWords.length <= 1) {
        drawSafe(this.page, lineWords.join(' '), { x: MARGIN + indent, y: this.y, size, font, color });
      } else {
        const wordsWidthSum = lineWords.reduce((sum, w) => sum + font.widthOfTextAtSize(w, size), 0);
        const gaps = lineWords.length - 1;
        const extraSpace = maxWidth - wordsWidthSum;
        const gapWidth = extraSpace / gaps;

        if (gapWidth > spaceWidth * 3.5) {
          drawSafe(this.page, lineWords.join(' '), { x: MARGIN + indent, y: this.y, size, font, color });
        } else {
          let curX = MARGIN + indent;
          for (let i = 0; i < lineWords.length; i++) {
            const w = lineWords[i];
            drawSafe(this.page, w, { x: curX, y: this.y, size, font, color });
            curX += font.widthOfTextAtSize(w, size) + gapWidth;
          }
        }
      }

      this.y -= lineGap;
    }
  }

  /** A lettered clause item, e.g. "a. Asistir al cliente en..." */
  clauseItem(letter: string, text: string) {
    this.paragraph(`${letter}. ${text}`, { size: 9, indent: 14, lineGap: 12.5, justify: true });
    this.gap(4);
  }
}

async function tryEmbedLogo(pdfDoc: PDFDocument): Promise<PDFImage | null> {
  try {
    const res = await fetch(getPublicAssetUrl('ob-brokers-team/brand/logo-isotype-blue.png'));
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return await pdfDoc.embedPng(bytes);
  } catch {
    return null;
  }
}

/**
 * Generates the collaboration agreement contract as a PDF, modeled on a real
 * Dominican master-broker/sub-broker agreement (legal identification of both
 * parties, numbered duty clauses, commission, duration, confidentiality,
 * jurisdiction, signature block). Any legal field not yet on file for an
 * organization prints as "(dato pendiente)" rather than blocking creation —
 * the same convention the reference document itself uses for unfilled data.
 */
export async function generateAgreementPdf(params: AgreementPdfParams): Promise<{ bytes: Uint8Array; signatureField: FieldBoxPct }> {
  const pdfDoc = await PDFDocument.create();
  const flow = await DocFlow.create(pdfDoc);
  const logo = await tryEmbedLogo(pdfDoc);

  if (logo) {
    const logoHeight = 26;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    flow.page.drawImage(logo, { x: MARGIN, y: flow.y - logoHeight + 8, width: logoWidth, height: logoHeight });
  }

  flow.y -= 8;
  drawSafe(flow.page, 'ACUERDO DE COLABORACIÓN CON MASTER BRÓKER', { x: MARGIN, y: flow.y, size: 14, font: flow.bold, color: NAVY });
  flow.gap(26);

  const projectLabel = params.kind === 'project_specific' && params.project ? params.project.name : null;

  flow.paragraph(
    `Entre la sociedad ${fill(params.masterBroker.legalName)}, constituida de conformidad con las leyes de la República Dominicana, provista del Registro Nacional de Contribuyentes (RNC) N.º ${fill(params.masterBroker.taxId)}, con domicilio en ${fill(params.masterBroker.address)}, República Dominicana, debidamente representada por ${fill(params.masterBroker.repName)}${params.masterBroker.repPosition ? `, en su calidad de ${params.masterBroker.repPosition}` : ''}, portador(a) de la cédula de identidad y electoral N.º ${fill(params.masterBroker.repId)}${params.masterBroker.repEmail ? ` (${params.masterBroker.repEmail})` : ''}, quien para los fines del presente contrato se denominará El Master Bróker, de una parte; y de la otra parte, la sociedad ${fill(params.brokerOrg.legalName)}, provista del RNC N.º ${fill(params.brokerOrg.taxId)}, con domicilio en ${fill(params.brokerOrg.address)}, República Dominicana, debidamente representada por ${fill(params.signerName)}, portador(a) de la cédula de identidad N.º ${fill(params.signerIdNumber)}, quien en lo adelante será denominado El Sub-Bróker.`,
    { size: 9 }
  );
  flow.gap(6);

  if (projectLabel && params.developer) {
    const devAddress = params.developer.address?.trim();
    const addressClause = devAddress ? `, con domicilio en ${devAddress}, República Dominicana,` : '';
    flow.paragraph(
      `Los Desarrolladores, sociedad ${fill(params.developer.legalName)}, provista del RNC N.º ${fill(params.developer.taxId)}${addressClause} son responsables del desarrollo del proyecto "${projectLabel}".`,
      { size: 9 }
    );
    flow.gap(6);
  }

  flow.paragraph(
    projectLabel
      ? `A continuación se describen las acciones y deberes de El Sub-Bróker, así como las obligaciones de El Master Bróker, para la contratación de servicios de gestión de ventas del proyecto "${projectLabel}"${params.project?.location ? `, ubicado en ${params.project.location}` : ''}, que en lo adelante será denominado el Proyecto.`
      : 'A continuación se describen las acciones y deberes de El Sub-Bróker, así como las obligaciones de El Master Bróker, para la gestión de ventas de los proyectos que El Master Bróker autorice a El Sub-Bróker dentro de su red comercial, cada uno bajo las condiciones específicas informadas para dicho proyecto.',
    { size: 9 }
  );
  flow.gap(10);

  flow.heading('1. Acciones y deberes de El Sub-Bróker');
  flow.clauseItem('a', 'Asistir al cliente en todas las gestiones de mercadeo y ventas.');
  flow.clauseItem('b', 'Promover y reservar para fines de cierre de negocios bajo las condiciones previamente acordadas con El Master Bróker.');
  flow.clauseItem('c', 'Reconfirmar y verificar que todos los datos y documentos de los compradores estén de acuerdo a las normativas legales, las documentaciones requeridas y las confirmaciones efectivas de pago.');
  flow.clauseItem('d', 'Proveer asistencia personalizada antes, durante y después del cierre de la gestión de venta inmobiliaria.');
  flow.clauseItem('e', 'Registrar a cada cliente interesado a través de la plataforma antes de compartir información del proyecto, con nombre y apellidos, teléfono y correo electrónico. Esta condición es de carácter obligatorio; los registros tendrán una vigencia de 180 días.');
  flow.clauseItem('f', 'Promover los pagos de separación e inicial únicamente a través de las cuentas destinadas para tal fin por Los Desarrolladores, suministradas por El Master Bróker.');
  flow.gap(6);

  flow.heading('2. Acciones y deberes de El Master Bróker');
  flow.clauseItem('a', 'Respetar los prospectos compradores que sean debidamente registrados y validados por el período de protección vigente.');

  const milestones = params.commissionMilestones ?? [];
  if (milestones.length > 0 && params.commissionRate) {
    flow.clauseItem('b', `El Master Bróker pagará a El Sub-Bróker el valor equivalente al ${params.commissionRate}% del valor del precio final de venta, según el siguiente esquema de desembolso:`);
    for (const ms of milestones) {
      const pctLabel = `${ms.commissionPct}% de la comisión`;
      let condition: string;
      switch (ms.triggerType) {
        case 'client_payment_pct':
          condition = `cuando el cliente paga el ${ms.triggerValue}% del valor de la unidad`;
          break;
        case 'contract_signed':
          condition = 'al firmar el contrato de compra-venta';
          break;
        case 'unit_delivery':
          condition = 'al momento de la entrega de la unidad';
          break;
        case 'final_settlement':
          condition = 'al completar todos los compromisos con la desarrolladora';
          break;
        case 'custom':
          condition = ms.description || '(condición personalizada)';
          break;
      }
      flow.paragraph(`• ${pctLabel} ${condition}.`, { size: 8.5, indent: 14 });
    }
    if (params.commissionTerms) {
      flow.paragraph(params.commissionTerms, { size: 8.5, indent: 14 });
    }
    flow.gap(4);
  } else {
    flow.clauseItem(
      'b',
      params.commissionRate
        ? `El Master Bróker pagará a El Sub-Bróker el valor equivalente al ${params.commissionRate}% del valor del precio final de venta.${params.commissionTerms ? ` ${params.commissionTerms}` : ''}`
        : `El Master Bróker pagará a El Sub-Bróker la comisión informada para cada proyecto.${params.commissionTerms ? ` ${params.commissionTerms}` : ' El esquema de pagos será comunicado por El Master Bróker junto con Los Desarrolladores.'}`
    );
  }

  flow.clauseItem('c', 'Toda factura generada por El Sub-Bróker correspondiente a pago de comisiones será enviada a El Master Bróker, quien gestionará el pago con Los Desarrolladores en tiempo y forma.');
  flow.clauseItem('d', 'Este acuerdo está suscrito exclusivamente para la gestión de venta y mercadeo de los proyectos autorizados descritos en este documento.');
  flow.clauseItem('e', `Duración y renovación: este acuerdo tiene una vigencia de ${params.validMonths} mes(es) a partir de la fecha de firma, tras los cuales deberá renovarse mediante una nueva firma para continuar activo.`);
  flow.clauseItem('f', 'Queda entendido y acordado entre las partes que El Sub-Bróker no tiene relación laboral alguna con El Master Bróker ni con Los Desarrolladores.');
  flow.clauseItem('g', 'Los términos de este documento son confidenciales y no podrán ser revelados por ninguna de las partes salvo autorización previa y escrita de la otra.');
  flow.clauseItem('h', 'Este acuerdo se interpretará y regirá de acuerdo con las leyes de la República Dominicana, sujetándose las partes a la competencia exclusiva de sus tribunales judiciales.');

  flow.gap(20);
  flow.paragraph(
    `HECHO Y FIRMADO DE BUENA FE entre Las Partes, quedando este acuerdo formalizado mediante firma electrónica con validez legal conforme a la Ley No. 126-02 sobre Comercio Electrónico y Firmas Digitales de la República Dominicana.`,
    { size: 8.5, bold: true, color: NAVY }
  );

  // Fixed signature box for the broker's digital signature.
  flow.ensureSpace(110);
  flow.gap(30);
  const signaturePageIndex = flow.pageCount;
  const boxTopY = flow.y;
  const boxHeightPt = 55;
  const boxWidthPt = 220;

  flow.page.drawLine({ start: { x: MARGIN, y: boxTopY - boxHeightPt }, end: { x: MARGIN + boxWidthPt, y: boxTopY - boxHeightPt }, thickness: 0.75, color: LIGHT_BORDER });
  drawSafe(flow.page, 'Firma de El Sub-Bróker', { x: MARGIN, y: boxTopY - boxHeightPt - 12, size: 7.5, font: flow.font, color: DARK_GRAY });
  drawSafe(flow.page, fill(params.signerName), { x: MARGIN, y: boxTopY - boxHeightPt - 24, size: 8.5, font: flow.bold, color: NAVY });
  drawSafe(flow.page, fill(params.brokerOrg.legalName), { x: MARGIN, y: boxTopY - boxHeightPt - 35, size: 7.5, font: flow.font, color: DARK_GRAY });

  const masterX = MARGIN + boxWidthPt + 60;
  const lineY = boxTopY - boxHeightPt;
  flow.page.drawLine({ start: { x: masterX, y: lineY }, end: { x: masterX + boxWidthPt, y: lineY }, thickness: 0.75, color: LIGHT_BORDER });
  drawSafe(flow.page, 'Representante de El Master Bróker', { x: masterX, y: lineY - 12, size: 7.5, font: flow.font, color: DARK_GRAY });
  drawSafe(flow.page, fill(params.masterBroker.repName), { x: masterX, y: lineY - 24, size: 8.5, font: flow.bold, color: NAVY });
  drawSafe(flow.page, fill(params.masterBroker.legalName), { x: masterX, y: lineY - 35, size: 7.5, font: flow.font, color: DARK_GRAY });

  // Stamping Master Broker official signature and corporate seal
  let sigBytes = params.masterBrokerSignatureImageBytes;
  let sealBytes = params.masterBrokerSealImageBytes;

  if (!sigBytes) {
    try {
      const localSigPath = path.join(process.cwd(), 'public', 'brand', 'firma-osvaldo.png');
      if (fs.existsSync(localSigPath)) {
        sigBytes = fs.readFileSync(localSigPath);
      }
    } catch {}
  }

  if (!sealBytes) {
    try {
      const localSealPath = path.join(process.cwd(), 'public', 'brand', 'sello-bello-valdez.png');
      if (fs.existsSync(localSealPath)) {
        sealBytes = fs.readFileSync(localSealPath);
      }
    } catch {}
  }

  if (sigBytes) {
    try {
      const sigImg = await pdfDoc.embedPng(sigBytes);
      const sigH = 46;
      const sigW = (sigImg.width / sigImg.height) * sigH;
      flow.page.drawImage(sigImg, {
        x: masterX + 10,
        y: lineY + 3,
        width: sigW,
        height: sigH,
      });
    } catch (e) {
      console.warn('Failed to embed Master Broker signature:', e);
    }
  }

  if (sealBytes) {
    try {
      const sealImg = await pdfDoc.embedPng(sealBytes);
      const sealSize = 65;
      flow.page.drawImage(sealImg, {
        x: masterX + 145,
        y: lineY - 12,
        width: sealSize,
        height: sealSize,
        opacity: 0.85,
      });
    } catch (e) {
      console.warn('Failed to embed Master Broker seal:', e);
    }
  }

  const signatureField: FieldBoxPct = {
    pageNumber: signaturePageIndex,
    x: (MARGIN / PAGE_WIDTH) * 100,
    y: ((PAGE_HEIGHT - boxTopY) / PAGE_HEIGHT) * 100,
    width: (boxWidthPt / PAGE_WIDTH) * 100,
    height: (boxHeightPt / PAGE_HEIGHT) * 100,
  };

  const bytes = await pdfDoc.save();
  return { bytes, signatureField };
}

export type StampSignatureParams = {
  sourcePdfBytes: Uint8Array;
  signatureImageDataUrl: string; // data:image/png;base64,...
  field: FieldBoxPct;
  documentTitle: string;
  documentId: number | string;
  signerName: string;
  signerEmail: string;
  signerRole: string | null;
  signedAt: Date;
  signerIp: string | null;
};

/**
 * Embeds the captured signature image into the source PDF at `field`, then
 * appends a one-page audit certificate, mirroring OsvaldoBello's OB Sign
 * certificate design (hash, signer info, IP, legal declaration).
 */
export async function stampSignatureAndGenerateAuditPdf(params: StampSignatureParams): Promise<{ bytes: Uint8Array; documentHash: string }> {
  const pdfDoc = await PDFDocument.load(params.sourcePdfBytes);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageIdx = Math.max(0, Math.min(pages.length - 1, params.field.pageNumber - 1));
  const targetPage = pages[pageIdx];
  const { width: pageW, height: pageH } = targetPage.getSize();

  const boxW = (params.field.width / 100) * pageW;
  const boxH = (params.field.height / 100) * pageH;
  const boxX = (params.field.x / 100) * pageW;
  const boxY = pageH - (params.field.y / 100) * pageH - boxH;

  const match = params.signatureImageDataUrl.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/);
  if (match) {
    const [, format, base64Data] = match;
    const imgBytes = Buffer.from(base64Data, 'base64');
    const img = format === 'png' ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
    const scale = Math.min(boxW / img.width, boxH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    targetPage.drawImage(img, {
      x: boxX + (boxW - drawW) / 2,
      y: boxY + (boxH - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  const documentHash = crypto.createHash('sha256').update(Buffer.from(params.sourcePdfBytes)).digest('hex');
  await appendAuditCertificatePage(pdfDoc, font, bold, {
    documentTitle: params.documentTitle,
    documentId: params.documentId,
    documentHash,
    signerName: params.signerName,
    signerEmail: params.signerEmail,
    signerRole: params.signerRole,
    signedAt: params.signedAt,
    signerIp: params.signerIp,
  });

  const bytes = await pdfDoc.save();
  return { bytes, documentHash };
}

async function appendAuditCertificatePage(
  pdfDoc: PDFDocument,
  font: PDFFont,
  bold: PDFFont,
  info: {
    documentTitle: string;
    documentId: number | string;
    documentHash: string;
    signerName: string;
    signerEmail: string;
    signerRole: string | null;
    signedAt: Date;
    signerIp: string | null;
  }
) {
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const { width, height } = page.getSize();

  page.drawRectangle({ x: 0, y: height - 10, width, height: 10, color: BLUE });

  drawSafe(page, 'CERTIFICADO DE FIRMA DIGITAL Y VALIDEZ LEGAL', { x: 40, y: height - 40, size: 13, font: bold, color: NAVY });
  drawSafe(page, 'OB BROKERS TEAM - SISTEMA DE AUDITORIA Y TRAZABILIDAD REGISTRADA', { x: 40, y: height - 54, size: 7.5, font: bold, color: BLUE });
  page.drawLine({ start: { x: 40, y: height - 65 }, end: { x: width - 40, y: height - 65 }, thickness: 1, color: LIGHT_BORDER });

  page.drawRectangle({ x: 40, y: height - 150, width: width - 80, height: 75, color: GRAY_BG, borderColor: LIGHT_BORDER, borderWidth: 1 });
  const truncatedTitle = info.documentTitle.length > 50 ? `${info.documentTitle.slice(0, 48)}...` : info.documentTitle;
  drawSafe(page, 'DATOS DEL DOCUMENTO ACORDADO', { x: 52, y: height - 90, size: 8.5, font: bold, color: NAVY });
  drawSafe(page, `Titulo: ${truncatedTitle}`, { x: 52, y: height - 106, size: 8, font, color: DARK_GRAY });
  drawSafe(page, `ID Documento: ${info.documentId}`, { x: 52, y: height - 120, size: 8, font, color: DARK_GRAY });
  drawSafe(page, `Hash SHA-256: ${info.documentHash}`, { x: 52, y: height - 134, size: 7, font, color: DARK_GRAY });

  drawSafe(page, 'REGISTRO DEL FIRMANTE', { x: 40, y: height - 172, size: 9.5, font: bold, color: NAVY });

  const boxTop = height - 192;
  const boxHeight = 70;
  page.drawRectangle({ x: 40, y: boxTop - boxHeight, width: width - 80, height: boxHeight, color: rgb(0.96, 0.99, 0.97), borderColor: rgb(0.6, 0.85, 0.65), borderWidth: 1 });

  drawSafe(page, `Nombre: ${info.signerName}`, { x: 52, y: boxTop - 16, size: 9, font: bold, color: NAVY });
  drawSafe(page, `Rol: ${info.signerRole || 'Broker'}`, { x: 330, y: boxTop - 16, size: 8, font, color: DARK_GRAY });
  drawSafe(page, `Correo: ${info.signerEmail}`, { x: 52, y: boxTop - 29, size: 8, font, color: DARK_GRAY });
  const formattedDate = info.signedAt.toLocaleString('es-DO');
  drawSafe(page, `Fecha/Hora: ${formattedDate}`, { x: 52, y: boxTop - 42, size: 7.5, font, color: DARK_GRAY });
  drawSafe(page, `IP: ${info.signerIp || 'No disponible'}`, { x: 330, y: boxTop - 42, size: 7.5, font, color: DARK_GRAY });
  const signerHash = crypto.createHash('sha256').update(`${info.documentId}-${info.signedAt.toISOString()}-${info.signerEmail}`).digest('hex').slice(0, 14).toUpperCase();
  drawSafe(page, `Codigo Firma: SIG-${signerHash}`, { x: 330, y: boxTop - 55, size: 7, font: bold, color: NAVY });
  drawSafe(page, 'FIRMADO DIGITALMENTE', { x: 52, y: boxTop - 55, size: 7, font: bold, color: rgb(0.1, 0.5, 0.2) });

  page.drawRectangle({ x: 40, y: 25, width: width - 80, height: 42, color: GRAY_BG, borderColor: LIGHT_BORDER, borderWidth: 1 });
  drawSafe(page, 'DECLARACION DE VALIDEZ LEGAL:', { x: 48, y: 54, size: 7, font: bold, color: BLUE });
  drawSafe(page, 'Este documento electronico y su certificado de auditoria constituyen prueba fehaciente de consentimiento,', { x: 48, y: 42, size: 6.5, font, color: DARK_GRAY });
  drawSafe(page, 'autenticidad e integridad de acuerdo a la Ley No. 126-02 sobre Comercio Electronico y Firmas Digitales de la Rep. Dom.', { x: 48, y: 32, size: 6.5, font, color: DARK_GRAY });
}
