'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const LETTER_WIDTH = 816;
const LETTER_HEIGHT = 1056;

export interface ScaledSlideSheetProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  width?: number;
  height?: number;
}

export function ScaledSlideSheet({
  children,
  className,
  innerClassName,
  width = 1120,
  height = 820,
}: ScaledSlideSheetProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useIsomorphicLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const update = () => {
      const clientW = shell.clientWidth;
      if (clientW > 0) {
        setScale(Math.min(1, clientW / width));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [width]);

  return (
    <div
      ref={shellRef}
      className={cn('relative w-full overflow-hidden', className)}
      style={{
        aspectRatio: `${width} / ${height}`,
        height: scale < 1 ? `${height * scale}px` : undefined,
      }}
    >
      <div
        className={cn('absolute left-0 top-0 origin-top-left overflow-hidden bg-[#fcfbf9]', innerClassName)}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default function ScaledProposalSheet({
  children,
  className,
  width = LETTER_WIDTH,
  height = LETTER_HEIGHT,
}: ScaledSlideSheetProps) {
  return (
    <ScaledSlideSheet
      width={width}
      height={height}
      className={cn('max-w-[816px]', className)}
      innerClassName="bg-[#fefdf9]"
    >
      {children}
    </ScaledSlideSheet>
  );
}
