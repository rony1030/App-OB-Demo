import type { SVGProps } from 'react';

export type PropertySpecIconName = 'bedrooms' | 'bathrooms' | 'area' | 'parking';

interface PropertySpecIconProps extends SVGProps<SVGSVGElement> {
  name: PropertySpecIconName;
}

/**
 * Compact architectural line icons used only for property specifications.
 * They deliberately do not share the more expressive amenity icon language.
 */
export function PropertySpecIcon({ name, ...props }: PropertySpecIconProps) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.65,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      {name === 'bedrooms' && (
        <g {...common}>
          <path d="M3.5 18.5v-6.1c0-1.05.85-1.9 1.9-1.9h13.2c1.05 0 1.9.85 1.9 1.9v6.1" />
          <path d="M3.5 15.5h17" />
          <path d="M6.5 10.5V8.2c0-.94.76-1.7 1.7-1.7h2.1c.94 0 1.7.76 1.7 1.7v2.3" />
          <path d="M3.5 18.5v1.5M20.5 18.5v1.5" />
        </g>
      )}
      {name === 'bathrooms' && (
        <g {...common}>
          <path d="M4 12.5h16" />
          <path d="M5.5 12.5v2.35A3.15 3.15 0 0 0 8.65 18h6.7a3.15 3.15 0 0 0 3.15-3.15V12.5" />
          <path d="M7.5 18v1.5M16.5 18v1.5" />
          <path d="M7.5 12.5V8.7A2.2 2.2 0 0 1 9.7 6.5h.8" />
          <path d="M10.5 6.5v2.2M10.5 8.7h2" />
        </g>
      )}
      {name === 'area' && (
        <g {...common}>
          <path d="M8 4H4v4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
          <path d="M8 12h8" />
          <path d="m10 10-2 2 2 2M14 10l2 2-2 2" />
        </g>
      )}
      {name === 'parking' && (
        <g {...common}>
          <path d="M4 16.5v1.35c0 .64.51 1.15 1.15 1.15h1.1c.64 0 1.15-.51 1.15-1.15V17h9v.85c0 .64.51 1.15 1.15 1.15h1.1c.64 0 1.15-.51 1.15-1.15V16.5" />
          <path d="M3.5 16.5h17l-1.35-4.1A2.1 2.1 0 0 0 17.15 11H6.85a2.1 2.1 0 0 0-2 1.4L3.5 16.5Z" />
          <path d="M6.5 15.2h.01M17.5 15.2h.01" />
        </g>
      )}
    </svg>
  );
}
