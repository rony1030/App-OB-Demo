// Only editorial text is translated. IDs, unit codes, amounts, media, styling,
// bank details and icon keys must never be sent through a translator.
const textFields = [
  'title', 'body', 'kicker', 'subHeader', 'locationLeft', 'locationRight',
  'disclaimer', 'typologyName', 'typologyDetails', 'offerTitle', 'offerText',
  'customFooterText', 'complexBadgeText', 'conceptPart1', 'conceptPart2'
];
export type PresentationText = { fieldPath: string; sourceText: string };

export function presentationTextEntries(blocks: Record<string, unknown>[]): PresentationText[] {
  const entries: PresentationText[] = [];
  const add = (fieldPath: string, value: unknown) => {
    if (typeof value === 'string' && value.trim()) entries.push({ fieldPath, sourceText: value.trim() });
  };
  blocks.forEach((block, index) => {
    const prefix = `blocks.${index}`;
    textFields.forEach(field => add(`${prefix}.${field}`, block[field]));
    if (Array.isArray(block.extraList)) block.extraList.forEach((value, i) => add(`${prefix}.extraList.${i}`, value));
    for (const [collection, fields] of [
      ['pricingCards', ['title', 'kicker']],
      ['paymentSteps', ['label', 'value', 'title', 'description']],
      ['visibleDocuments', ['name']],
      ['typologyCards', ['name']]
    ] as const) {
      if (Array.isArray(block[collection])) block[collection].forEach((item, i) => fields.forEach(field => add(`${prefix}.${collection}.${i}.${field}`, (item as Record<string, unknown>)?.[field])));
    }
    if (block.paymentSchedule && typeof block.paymentSchedule === 'object') {
      const ps = block.paymentSchedule as Record<string, unknown>;
      if (Array.isArray(ps.steps)) {
        ps.steps.forEach((step: Record<string, unknown>, i: number) => {
          add(`${prefix}.paymentSchedule.steps.${i}.label`, step.label);
          add(`${prefix}.paymentSchedule.steps.${i}.description`, step.description);
        });
      }
    }
    if (block.customStats && typeof block.customStats === 'object') {
      Object.entries(block.customStats).forEach(([key, value]) => add(`${prefix}.customStats.${key}`, value));
    }
  });
  return entries;
}

export function applyPresentationTranslations<T>(blocks: T[], translations: Record<string, string>): T[] {
  const copy = structuredClone(blocks);
  for (const block of copy as Record<string, unknown>[]) {
    if (Array.isArray(block.extraList)) block.iconSourceLabels = [...block.extraList];
  }
  // Traverse known source paths only, with graceful fallback to source text if missing
  for (const { fieldPath, sourceText } of presentationTextEntries(blocks as Record<string, unknown>[])) {
    const value = translations[fieldPath] || sourceText;
    if (!value?.trim()) continue;
    const parts = fieldPath.split('.').slice(1);
    let target = copy as unknown as Record<string, unknown>;
    for (const part of parts.slice(0, -1)) {
      if (!target[part] || typeof target[part] !== 'object') break;
      target = target[part] as Record<string, unknown>;
    }
    if (target && parts.at(-1)) {
      target[parts.at(-1)!] = value;
    }
  }
  return copy;
}

function normalizeNumberString(str: string): string {
  let s = str.replace(/[\u00a0\u202f]/g, ' ');
  // Remove thousand separators: e.g. 217 500, 217,500, 217.500 where followed by 3 digits
  s = s.replace(/(\d)[,.\s](\d{3})(?!\d)/g, '$1$2');
  // Normalize remaining decimal comma to dot: e.g. 64,83 -> 64.83
  s = s.replace(/(\d),(\d+)/g, '$1.$2');
  return s;
}

function extractNumericValues(str: string): number[] {
  const normalized = normalizeNumberString(str);
  const matches = normalized.match(/\d+(?:\.\d+)?/g) || [];
  return matches.map((m) => {
    const num = parseFloat(m);
    return isNaN(num) ? -999999 : num;
  });
}

export function validPresentationTranslation(source: Record<string, string>, value: unknown): value is Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const result = value as Record<string, unknown>;
  const sourceEntries = Object.entries(source);
  return sourceEntries.every(([key, text]) => {
    const translated = result[key];
    if (typeof translated !== 'string' || !translated.trim()) return false;
    const sourceNums = extractNumericValues(text);
    // For entries with no numbers (amenity labels, disclaimers, titles) any non-empty
    // translation is valid. For entries with numbers (prices, percentages, areas) every
    // source number must appear somewhere in the translation (order-independent superset),
    // which accommodates natural expansions like "24/7" → "24 heures/7 jours".
    if (sourceNums.length === 0) return true;
    const transNums = extractNumericValues(translated);
    const transSet = new Set(transNums);
    return sourceNums.every((n) => transSet.has(n));
  });
}

