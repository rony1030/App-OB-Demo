type BrandableBlock = {
  type?: string;
  backgroundType?: string;
  backgroundColor?: string;
  image?: string;
  accentColor?: string;
  footerTextColor?: string;
  disclaimerColor?: string;
  textColor?: string;
  brokerLogoVariant?: 'normal' | 'white';
  copyContactBackgroundColor?: string;
};

export function readableOnWhite(color?: string): string {
  const match = /^#([\da-f]{6})$/i.exec(color || '');
  if (!match) return '#334155';
  const channels = [0, 2, 4].map((start) => parseInt(match[1].slice(start, start + 2), 16));
  const contrast = (rgb: number[]) => {
    const linear = rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 1.05 / (linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722 + 0.05);
  };
  while (contrast(channels) < 4.5) {
    for (let index = 0; index < channels.length; index += 1) channels[index] = Math.floor(channels[index] * 0.85);
  }
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

/** Apply the recipient agency palette without mutating a saved dossier version. */
export function brandPersonalizedBlock<T extends BrandableBlock>(
  block: T,
  branding: { primary_color?: string | null; accent_color?: string | null; surface_color?: string | null },
): T {
  const accentColor = branding.accent_color || branding.primary_color || '#334155';
  const footerColor = block.backgroundType === 'image' && block.image ? '#ffffff' : readableOnWhite(accentColor);
  if (block.type === 'contact') {
    const hasCoverBackground = block.backgroundType === 'image' && Boolean(block.image);
    return {
      ...block,
      backgroundType: hasCoverBackground ? 'image' : 'solid',
      backgroundColor: block.copyContactBackgroundColor || branding.surface_color || '#f8fafc',
      textColor: '#0f172a',
      accentColor,
      footerTextColor: footerColor,
      disclaimerColor: footerColor,
      brokerLogoVariant: 'normal',
    };
  }
  return {
    ...block,
    accentColor,
    footerTextColor: footerColor,
    disclaimerColor: footerColor,
  };
}
