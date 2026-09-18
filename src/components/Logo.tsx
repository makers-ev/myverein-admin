import { siteConfig } from '@/config/site';

export default function Logo() {
    return (
        <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- plain <img>
                avoids next/image's `dangerouslyAllowSVG` requirement for a
                trusted local static asset, and the path is configurable
                (siteConfig.logoSrc), not a fixed import next/image would need. */}
            <img src={siteConfig.logoSrc} alt={siteConfig.logoAlt} width={40} height={40} className="h-9 w-9 rounded-md" />
            <span className="text-lg text-card-foreground font-bold tracking-tight">
                {siteConfig.appName}
            </span>
        </div>
    );
}
