
import { UITranslationBoundary } from '@/components/i18n/UITranslationBoundary';
interface SlideFooterProps {
  logoUrl: string | null;
  show: boolean;
}

export function SlideFooter({ logoUrl, show }: SlideFooterProps) {
  if (!show || !logoUrl) return null;
  return (
    <UITranslationBoundary attributes={["alt"]}><img
      src={logoUrl}
      alt="Logotipo"
      crossOrigin="anonymous"
      className="absolute right-4 top-4 z-20 h-6 w-auto object-contain opacity-90"
    /></UITranslationBoundary>
  );
}
