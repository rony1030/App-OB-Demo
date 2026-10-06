import type { PaymentPlanStep } from "@/types/proposals";

export interface SimulatorUnitData {
  id: string | number;
  unitCode: string;
  price: number;
  currency: "USD" | "DOP" | "EUR";
  floor?: number | null;
  tower?: string | null;
  type?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqm?: number | null;
  deliveryDate?: string | null;
}

export interface SimulatorPlanConfig {
  reservationAmount: number;
  initialPercentage: number;
  duringConstructionPercentage: number;
  uponDeliveryPercentage: number;
  constructionMonths?: number;
}

export interface CalculatedSchedule {
  reservationAmount: number;
  initialAmount: number;
  duringConstructionAmount: number;
  uponDeliveryAmount: number;
  monthlyInstallmentAmount?: number;
  steps: PaymentPlanStep[];
}

export interface FrozenProposalSnapshot {
  title: string;
  projectSlug: string;
  projectName: string;
  client: {
    name: string;
    email?: string;
    phone?: string;
  };
  asOfDate: string;
  validUntil: string;
  unit: {
    id: string | number;
    unitCode: string;
    price: number;
    currency: "USD" | "DOP" | "EUR";
    floor: number | null;
    tower: string | null;
    type: string | null;
    bedrooms: number | null;
    bathrooms: number | null;
    areaSqm: number | null;
    deliveryDate: string | null;
  };
  paymentPlan: {
    reservationAmount: number;
    initialPercentage: number;
    duringConstructionPercentage: number;
    uponDeliveryPercentage: number;
    constructionMonths?: number;
    calculatedSchedule: CalculatedSchedule;
  };
  approvedDocuments: {
    title: string;
    category: string;
    versionNumber: number;
    storagePath?: string;
    publicUrl?: string;
    mimeType?: string;
  }[];
  branding: {
    organizationName?: string;
    primaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
  };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateCommercialSchedule(
  price: number,
  config: SimulatorPlanConfig
): CalculatedSchedule {
  const totalPct = config.initialPercentage + config.duringConstructionPercentage + config.uponDeliveryPercentage;
  if (totalPct > 100) {
    const scale = 100 / totalPct;
    config = {
      ...config,
      initialPercentage: roundCents(config.initialPercentage * scale),
      duringConstructionPercentage: roundCents(config.duringConstructionPercentage * scale),
      uponDeliveryPercentage: roundCents(100 - roundCents(config.initialPercentage * scale) - roundCents(config.duringConstructionPercentage * scale)),
    };
  }

  const reservation = roundCents(Math.max(0, config.reservationAmount));
  const totalInitial = roundCents(price * (config.initialPercentage / 100));
  const effectiveInitial = roundCents(Math.max(0, totalInitial - reservation));
  const duringConstruction = roundCents(price * (config.duringConstructionPercentage / 100));
  const uponDelivery = roundCents(price - reservation - effectiveInitial - duringConstruction);

  const steps: PaymentPlanStep[] = [
    {
      label: "Reserva para bloqueo de unidad",
      percentage: Number(((reservation / (price || 1)) * 100).toFixed(2)),
      amount: reservation,
      due_date_or_milestone: "Al firmar separación",
    },
    {
      label: `Firma de contrato (${config.initialPercentage}% inicial)`,
      percentage: Number(((effectiveInitial / (price || 1)) * 100).toFixed(2)),
      amount: effectiveInitial,
      due_date_or_milestone: "Hasta 30 días tras reserva",
    },
    {
      label: `Durante construcción (${config.duringConstructionPercentage}%)`,
      percentage: config.duringConstructionPercentage,
      amount: duringConstruction,
      due_date_or_milestone: config.constructionMonths
        ? `En ${config.constructionMonths} cuotas mensuales`
        : "Durante ejecución de obra",
    },
    {
      label: `Contra entrega final (${config.uponDeliveryPercentage}%)`,
      percentage: config.uponDeliveryPercentage,
      amount: uponDelivery,
      due_date_or_milestone: "A la entrega de llaves o financiamiento hipotecario",
    },
  ];

  const monthlyInstallment =
    config.constructionMonths && config.constructionMonths > 0
      ? roundCents(duringConstruction / config.constructionMonths)
      : undefined;

  return {
    reservationAmount: reservation,
    initialAmount: effectiveInitial,
    duringConstructionAmount: duringConstruction,
    uponDeliveryAmount: uponDelivery,
    monthlyInstallmentAmount: monthlyInstallment,
    steps,
  };
}

export function buildFrozenProposalSnapshot(params: {
  title: string;
  projectSlug: string;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  unit: SimulatorUnitData;
  planConfig: SimulatorPlanConfig;
  validDays?: number;
  approvedDocuments?: FrozenProposalSnapshot["approvedDocuments"];
  branding?: FrozenProposalSnapshot["branding"];
}): FrozenProposalSnapshot {
  const asOfDate = new Date().toISOString();
  const validDays = params.validDays ?? 30;
  const validUntil = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString();
  const calculatedSchedule = calculateCommercialSchedule(params.unit.price, params.planConfig);

  return {
    title: params.title,
    projectSlug: params.projectSlug,
    projectName: params.projectName,
    client: {
      name: params.clientName,
      email: params.clientEmail,
      phone: params.clientPhone,
    },
    asOfDate,
    validUntil,
    unit: {
      id: params.unit.id,
      unitCode: params.unit.unitCode,
      price: params.unit.price,
      currency: params.unit.currency,
      floor: params.unit.floor ?? null,
      tower: params.unit.tower ?? null,
      type: params.unit.type ?? null,
      bedrooms: params.unit.bedrooms ?? null,
      bathrooms: params.unit.bathrooms ?? null,
      areaSqm: params.unit.areaSqm ?? null,
      deliveryDate: params.unit.deliveryDate ?? null,
    },
    paymentPlan: {
      reservationAmount: params.planConfig.reservationAmount,
      initialPercentage: params.planConfig.initialPercentage,
      duringConstructionPercentage: params.planConfig.duringConstructionPercentage,
      uponDeliveryPercentage: params.planConfig.uponDeliveryPercentage,
      constructionMonths: params.planConfig.constructionMonths,
      calculatedSchedule,
    },
    approvedDocuments: params.approvedDocuments || [],
    branding: params.branding || {},
  };
}
