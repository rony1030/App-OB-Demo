import { cn } from '@/lib/utils';

export default function WaveDivider({
  fill = 'fill-white',
  bg = 'bg-transparent',
  className,
}: {
  fill?: string;
  bg?: string;
  flipped?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('pointer-events-none relative -my-1 w-full overflow-hidden leading-none select-none', bg, className)} aria-hidden="true">
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-12 w-full sm:h-16"
      >
        <path d="M0,32 C240,80 480,0 720,24 C960,48 1200,88 1440,32 L1440,80 L0,80 Z" className={fill} />
      </svg>
    </div>
  );
}
