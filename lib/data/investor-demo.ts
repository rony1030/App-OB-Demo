/**
 * Clientes de demostración del portal del inversionista (códigos CLI-*).
 * Las cuotas se generan con fechas relativas a la fecha de corte, así los tres
 * escenarios (al día, mora, legal, entrega con insoluto) nunca caducan.
 */
import type { DeliveryStatus, CollectionStatus, InstallmentKind, InstallmentRow } from '@/lib/investor/account';
import { toIsoDate } from '@/lib/investor/account';

export interface DemoUnit {
  reservationId: number;
  projectName: string;
  projectSlug: string;
  unitCode: string;
  price: number;
  deliveryStatus: DeliveryStatus;
  collectionStatus: CollectionStatus;
  legalNotes?: string;
  installments: InstallmentRow[];
}

export interface DemoDocument {
  id: number;
  publicCode: string;
  documentType: string;
  title: string;
  fileName: string;
  unitCode: string;
  monthsAgo: number;
}

export interface DemoClient {
  id: number;
  code: string;
  aliases: string[];
  fullName: string;
  email: string;
  phone: string;
  units: string[];
  documents: DemoDocument[];
}

type Spec = { kind: InstallmentKind; concept: string; due: string; amount: number; paid?: boolean; mora?: number };

function month(asOf: Date, offset: number, day = 15): string {
  return toIsoDate(new Date(asOf.getFullYear(), asOf.getMonth() + offset, day));
}
function daysFrom(asOf: Date, days: number): string {
  const d = new Date(asOf);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
}
function rows(specs: Spec[]): InstallmentRow[] {
  return specs.map((s, i) => ({
    sequence: i + 1,
    kind: s.kind,
    concept: s.concept,
    dueDate: s.due,
    amount: s.amount,
    paidAmount: s.paid ? s.amount : 0,
    paidAt: s.paid ? s.due : null,
    moraAmount: s.mora ?? 0,
  }));
}
/** Cuotas mensuales de construcción: desfases de mes `from..to`; las de desfase <= paidUntil están pagadas. */
function monthly(asOf: Date, from: number, to: number, amount: number, paidUntil: number, startNumber: number, moraOverdue = 0): Spec[] {
  const out: Spec[] = [];
  for (let off = from, n = startNumber; off <= to; off++, n++) {
    const paid = off <= paidUntil;
    out.push({
      kind: 'construction',
      concept: `Cuota de construcción #${n}`,
      due: month(asOf, off),
      amount,
      paid,
      mora: !paid && off < 0 ? moraOverdue : 0,
    });
  }
  return out;
}

const INSOLUTO = 'Pago Insoluto contra entrega (50%)';
const RESERVA = 'Reserva de unidad';
const INICIAL = 'Inicial 20% a la firma de promesa';

export function buildDemoUnit(unitCode: string, asOf: Date = new Date()): DemoUnit {
  const m = (o: number, d?: number) => month(asOf, o, d);
  switch (unitCode) {
    case 'CRS-204':
      return {
        reservationId: 701, projectName: 'Cana Rock Star', projectSlug: 'cana-rock-star', unitCode, price: 178000,
        deliveryStatus: 'in_construction', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-9), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-8), amount: 32600, paid: true },
          ...monthly(asOf, -7, -1, 5933.33, -1, 1),
          { kind: 'construction', concept: 'Cuota de construcción #8', due: m(1), amount: 5933.33 },
          { kind: 'construction', concept: 'Cuota de construcción #9', due: m(2), amount: 5933.36 },
          { kind: 'delivery_balance', concept: INSOLUTO, due: m(8), amount: 89000 },
        ]),
      };
    case 'CIP-301':
      return {
        reservationId: 702, projectName: 'Ciprés Residences', projectSlug: 'cipres-residences', unitCode, price: 195000,
        deliveryStatus: 'in_construction', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-11), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-10), amount: 36000, paid: true },
          ...monthly(asOf, -10, -1, 5850, -1, 1),
          { kind: 'delivery_balance', concept: INSOLUTO, due: m(6), amount: 97500 },
        ]),
      };
    case 'UVE-115':
      return {
        reservationId: 703, projectName: 'UVE Residences', projectSlug: 'uve-residences', unitCode, price: 210000,
        deliveryStatus: 'in_construction', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-10), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-9), amount: 39000, paid: true },
          ...monthly(asOf, -8, -3, 3500, -3, 1),
          { kind: 'construction', concept: 'Cuota de construcción #7', due: m(-2), amount: 3500, mora: 350 },
          { kind: 'construction', concept: 'Cuota de construcción #8', due: m(-1), amount: 3500, mora: 300 },
          ...monthly(asOf, 1, 10, 3500, -99, 9),
          { kind: 'delivery_balance', concept: INSOLUTO, due: m(11), amount: 105000 },
        ]),
      };
    case 'PV-408':
      return {
        reservationId: 704, projectName: 'Palm View Golf & Residences', projectSlug: 'palm-view', unitCode, price: 225000,
        deliveryStatus: 'in_construction', collectionStatus: 'legal',
        legalNotes: 'Expediente en cobro jurídico por mora reiterada. Intimación de pago vigente.',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-14), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-13), amount: 42000, paid: true },
          ...monthly(asOf, -6, -1, 6000, -99, 1, 700),
          { kind: 'construction', concept: 'Cuotas de construcción restantes', due: m(1), amount: 31500 },
          { kind: 'delivery_balance', concept: INSOLUTO, due: m(9), amount: 112500 },
        ]),
      };
    case 'CRS-101':
      return {
        reservationId: 705, projectName: 'Cana Rock Star', projectSlug: 'cana-rock-star', unitCode, price: 165000,
        deliveryStatus: 'delivered', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-28), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-27), amount: 30000, paid: true },
          ...monthly(asOf, -26, -21, 8250, -21, 1),
          { kind: 'delivery_balance', concept: 'Pago Insoluto y entrega de llaves (50%)', due: m(-10), amount: 82500, paid: true },
        ]),
      };
    case 'PV-202':
      return {
        reservationId: 706, projectName: 'Palm View Golf & Residences', projectSlug: 'palm-view', unitCode, price: 380000,
        deliveryStatus: 'negotiation', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-7), amount: 5000, paid: true },
          { kind: 'initial', concept: 'Inicial 20% · promesa de compraventa', due: m(-6), amount: 71000, paid: true },
          ...monthly(asOf, -4, 8, 9500, -1, 1),
          { kind: 'delivery_balance', concept: INSOLUTO, due: m(14), amount: 190000 },
        ]),
      };
    case 'UVE-108':
      return {
        reservationId: 707, projectName: 'UVE Residences', projectSlug: 'uve-residences', unitCode, price: 240000,
        deliveryStatus: 'ready_for_delivery', collectionStatus: 'normal',
        installments: rows([
          { kind: 'reservation', concept: RESERVA, due: m(-24), amount: 3000, paid: true },
          { kind: 'initial', concept: INICIAL, due: m(-23), amount: 45000, paid: true },
          ...monthly(asOf, -18, -4, 4000, -4, 1),
          ...monthly(asOf, -3, -1, 4000, -99, 16, 600),
          { kind: 'delivery_balance', concept: 'Pago Insoluto previo a entrega de llaves (50%)', due: daysFrom(asOf, 12), amount: 120000 },
        ]),
      };
    default:
      throw new Error(`Unidad demo desconocida: ${unitCode}`);
  }
}

export const DEMO_CLIENTS: DemoClient[] = [
  {
    id: 9001, code: 'CLI-ALDIA-001', aliases: ['CLI-ALDIA'], fullName: 'Carlos Mendoza',
    email: 'carlos.mendoza@inversionista.com', phone: '+1 (829) 555-0101', units: ['CRS-204'],
    documents: [
      { id: 1, publicCode: 'DOC-CRS204-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · CRS-204', fileName: 'Promesa_CRS204.pdf', unitCode: 'CRS-204', monthsAgo: 8 },
      { id: 2, publicCode: 'DOC-CRS204-REC', documentType: 'recibo_oficial', title: 'Recibo oficial · Inicial 20% · CRS-204', fileName: 'Recibo_Inicial_CRS204.pdf', unitCode: 'CRS-204', monthsAgo: 8 },
    ],
  },
  {
    id: 9002, code: 'CLI-MIXTO-002', aliases: ['CLI-MIXTO'], fullName: 'Dra. Elena Ramos',
    email: 'dra.elena.ramos@inversionista.com', phone: '+1 (809) 555-0202', units: ['CIP-301', 'UVE-115', 'PV-408'],
    documents: [
      { id: 3, publicCode: 'DOC-CIP301-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · CIP-301', fileName: 'Promesa_CIP301.pdf', unitCode: 'CIP-301', monthsAgo: 10 },
      { id: 4, publicCode: 'DOC-UVE115-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · UVE-115', fileName: 'Promesa_UVE115.pdf', unitCode: 'UVE-115', monthsAgo: 9 },
      { id: 5, publicCode: 'DOC-UVE115-AVISO', documentType: 'aviso_cobro', title: 'Aviso de cuotas vencidas · UVE-115', fileName: 'Aviso_UVE115.pdf', unitCode: 'UVE-115', monthsAgo: 1 },
      { id: 6, publicCode: 'DOC-PV408-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · PV-408', fileName: 'Promesa_PV408.pdf', unitCode: 'PV-408', monthsAgo: 13 },
      { id: 7, publicCode: 'DOC-PV408-INT', documentType: 'intimacion_legal', title: 'Intimación legal de pago · PV-408', fileName: 'Intimacion_PV408.pdf', unitCode: 'PV-408', monthsAgo: 1 },
    ],
  },
  {
    id: 9003, code: 'CLI-ENTREGA-003', aliases: ['CLI-ENTREGA'], fullName: 'Ing. Roberto Valenzuela',
    email: 'ing.roberto.valenzuela@inversionista.com', phone: '+1 (809) 555-0303', units: ['CRS-101', 'PV-202', 'UVE-108'],
    documents: [
      { id: 8, publicCode: 'DOC-CRS101-ACTA', documentType: 'acta_entrega', title: 'Acta de entrega de llaves · CRS-101', fileName: 'Acta_Entrega_CRS101.pdf', unitCode: 'CRS-101', monthsAgo: 10 },
      { id: 9, publicCode: 'DOC-CRS101-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · CRS-101', fileName: 'Promesa_CRS101.pdf', unitCode: 'CRS-101', monthsAgo: 27 },
      { id: 10, publicCode: 'DOC-PV202-PROM', documentType: 'promesa_compraventa', title: 'Promesa de compraventa · PV-202', fileName: 'Promesa_PV202.pdf', unitCode: 'PV-202', monthsAgo: 6 },
      { id: 11, publicCode: 'DOC-UVE108-REC', documentType: 'recibo_oficial', title: 'Recibo oficial · Cuotas de construcción · UVE-108', fileName: 'Recibo_UVE108.pdf', unitCode: 'UVE-108', monthsAgo: 4 },
      { id: 12, publicCode: 'DOC-UVE108-LIQ', documentType: 'carta_liquidacion', title: 'Carta de liquidación de saldo insoluto · UVE-108', fileName: 'Liquidacion_UVE108.pdf', unitCode: 'UVE-108', monthsAgo: 0 },
    ],
  },
];

export function findDemoClient(code: string): DemoClient | undefined {
  const c = code.trim().toUpperCase();
  return DEMO_CLIENTS.find((d) => d.code === c || d.aliases.includes(c));
}
