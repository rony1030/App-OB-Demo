export function normalizeUnitCode(value: unknown): string {
  const code = String(value ?? '').trim();
  return code.replace(/^(\d+)\.0+$/, '$1');
}

export function compareUnitCodes(left: unknown, right: unknown): number {
  const a = normalizeUnitCode(left).toLocaleLowerCase();
  const b = normalizeUnitCode(right).toLocaleLowerCase();
  const aParts = a.match(/\d+|\D+/g) || [];
  const bParts = b.match(/\d+|\D+/g) || [];
  for (let index = 0; index < Math.max(aParts.length, bParts.length); index += 1) {
    const aPart = aParts[index] ?? '';
    const bPart = bParts[index] ?? '';
    if (aPart === bPart) continue;
    const aNumber = /^\d+$/.test(aPart);
    const bNumber = /^\d+$/.test(bPart);
    if (aNumber && bNumber) return Number(aPart) - Number(bPart);
    if (aNumber !== bNumber) return aNumber ? -1 : 1;
    return aPart.localeCompare(bPart);
  }
  return a.localeCompare(b, undefined, { numeric: true });
}
