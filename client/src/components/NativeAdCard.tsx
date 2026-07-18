import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import type { NativeAd } from '@/types/advertising';

interface NativeAdCardProps {
  ad: NativeAd;
}

export function NativeAdCard({ ad }: NativeAdCardProps) {
  // Record impression on mount
  useEffect(() => {
    trpc.advertising.analytics.recordNativeAdImpression.mutate(
      { adId: ad.id },
      { onError: () => {} } // Silently fail
    );
  }, [ad.id]);

  const handleClick = () => {
    // Record click
    trpc.advertising.analytics.recordNativeAdClick.mutate(
      { adId: ad.id },
      { onError: () => {} } // Silently fail
    );

    // Open external link
    window.open(ad.externalLink, '_blank');
  };

  return (
    <div
      onClick={handleClick}
      className="group relative bg-card text-card-foreground rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer border border-border"
    >
      {/* Image Container */}
      <div className="relative w-full aspect-square overflow-hidden bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Label Badge */}
        <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-semibold">
          {ad.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Title */}
        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {ad.title}
        </h3>

        {/* Price Section */}
        <div className="mt-2 flex items-center justify-between">
          {ad.price !== null && (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-primary">
                ${(ad.price / 100).toFixed(2)}
              </span>
            </div>
          )}

          {ad.discount && (
            <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
              {ad.discount}
            </span>
          )}
        </div>

        {/* CTA */}
        <button className="w-full mt-3 bg-primary text-primary-foreground py-2 rounded text-sm font-medium hover:bg-primary/90 transition-colors">
          查看詳情
        </button>
      </div>
    </div>
  );
}
