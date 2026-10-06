'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useBrand } from './BrandProvider';

interface BrandLogoProps {
  className?: string;
  /** Color of the logo mark itself: 'dark' for light backgrounds, 'light' for dark backgrounds. */
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'sidebar';
  /** Use the compact icon-only mark instead of the full horizontal lockup. */
  iconOnly?: boolean;
}

const HEIGHT_CLASSES = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-12',
  xl: 'h-14',
  sidebar: 'h-20',
};

const LOCAL_FALLBACKS = {
  icon: '/brand/logo-isotype-blue.png',
  light: '/brand/logo-horizontal-white-v2.png',
  dark: '/brand/logo-horizontal-blue-v2.png',
};

export default function BrandLogo({ className, variant = 'dark', size = 'md', iconOnly = false }: BrandLogoProps) {
  const { theme } = useBrand();
  const isLight = variant === 'light';
  const resolvedSrc = iconOnly
    ? theme.favicon_url || LOCAL_FALLBACKS.icon
    : isLight
      ? theme.logo_dark_url || theme.logo_url || LOCAL_FALLBACKS.light
      : theme.logo_url || LOCAL_FALLBACKS.dark;

  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const fallback = iconOnly
    ? LOCAL_FALLBACKS.icon
    : isLight
      ? LOCAL_FALLBACKS.light
      : LOCAL_FALLBACKS.dark;
  const currentSrc = failedSrc === resolvedSrc ? fallback : resolvedSrc;

  return (
    <Image
      src={currentSrc}
      alt={theme.name || 'OB Brokers Team'}
      width={iconOnly ? 400 : 900}
      height={iconOnly ? 400 : 462}
      priority
      unoptimized
      onError={() => {
        if (currentSrc !== fallback) {
          setFailedSrc(resolvedSrc);
        }
      }}
      className={cn('w-auto select-none object-contain', HEIGHT_CLASSES[size], className)}
    />
  );
}
