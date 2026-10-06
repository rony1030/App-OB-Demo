export type PublicProposalMetadata = {
  pageIndex?: number;
  pageLabel?: string;
  cached?: boolean;
};

/** Public clients may suggest an event, but cannot persist arbitrary metadata. */
export function safePublicProposalMetadata(
  eventType: string,
  input: Record<string, unknown>,
  blocks: Array<{ title?: unknown }> = [],
): PublicProposalMetadata {
  const safe: PublicProposalMetadata = {};
  if (Number.isInteger(input.pageIndex) && Number(input.pageIndex) >= 1 && Number(input.pageIndex) <= 500) {
    safe.pageIndex = Number(input.pageIndex);
  }
  if (eventType === 'section_view' && safe.pageIndex) {
    const title = blocks[safe.pageIndex - 1]?.title;
    if (typeof title === 'string') safe.pageLabel = title.slice(0, 100);
  }
  if (eventType === 'locale_change' && typeof input.pageLabel === 'string') {
    const locale = input.pageLabel.toUpperCase();
    if (locale === 'ES' || locale === 'EN' || locale === 'FR') safe.pageLabel = locale;
  }
  if (eventType === 'pdf_export' && input.cached === true) safe.cached = true;
  return safe;
}

export function safePublicSessionId(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value) ? value : null;
}
