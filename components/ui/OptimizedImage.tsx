'use client';

import Image, { type ImageProps } from 'next/image';
import { supabaseUrlToCdn } from '@/lib/supabase/storage';
import { getHostingerAssetUrl } from '@/lib/storage/hostinger-constants';

type OptimizedImageProps = Omit<ImageProps, 'loader'>;

export default function OptimizedImage(props: OptimizedImageProps) {
  const rawSrc = typeof props.src === 'string' ? props.src : '';
  const src = getHostingerAssetUrl(rawSrc) || (rawSrc.includes('supabase.co/storage') ? supabaseUrlToCdn(rawSrc) : rawSrc);
  // Keep public UVE project imagery available even when the Next image
  // optimization endpoint is temporarily unavailable on the current host.

  return (
    <Image
      {...props}
      alt={props.alt}
      src={src || props.src}
      unoptimized
    />
  );
}
