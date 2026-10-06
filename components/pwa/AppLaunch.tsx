
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Image from 'next/image';

/** A decorative, CSS-only cold-launch transition. Never gates app readiness. */
export default function AppLaunch() {
  return (
    <div className="pwa-app-launch" aria-hidden="true">
      <div className="pwa-app-launch-identity">
        <div className="pwa-app-launch-mark">
          <UITranslationBoundary attributes={["alt"]}><Image src="/brand/logo-isotype-blue.png" width={320} height={320} alt="" unoptimized loading="eager" /></UITranslationBoundary>
        </div>
        <div className="pwa-app-launch-name"><LocalizedText text={"OB"} /></div>
        <div className="pwa-app-launch-team"><LocalizedText text={"Brokers Team"} /></div>
      </div>
    </div>
  );
}

