import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { Banner } from '@/types/advertising';

export function HomeBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Fetch banners
  const { data: banners = [] } = trpc.advertising.banners.getAll.useQuery();

  // Setup mutations for tracking
  const recordImpressionMutation = trpc.advertising.analytics.recordBannerImpression.useMutation();
  const recordClickMutation = trpc.advertising.analytics.recordBannerClick.useMutation();

  // Auto-play effect
  useEffect(() => {
    if (!autoPlayEnabled || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlayEnabled, banners.length]);

  // Record impression when banner changes
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      recordImpressionMutation.mutate({ bannerId: banners[currentIndex].id });
    }
  }, [currentIndex, banners]);

  if (banners.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setAutoPlayEnabled(false);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleBannerClick = (banner: Banner) => {
    // Record click
    recordClickMutation.mutate({ bannerId: banner.id });
    // Open external link
    window.open(banner.externalLink, '_blank');
  };

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg overflow-hidden">
      {/* Banner Container */}
      <div className="relative w-full aspect-[3/1] overflow-hidden">
        {/* Banner Image */}
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="w-full h-full object-contain"
          onClick={() => handleBannerClick(currentBanner)}
          style={{ cursor: 'pointer' }}
        />

        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
          aria-label="Previous banner"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
          aria-label="Next banner"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setAutoPlayEnabled(false);
                setCurrentIndex(index);
              }}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-2 hover:bg-white/75'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Banner Info */}
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {currentIndex + 1} / {banners.length}
        </p>
      </div>
    </div>
  );
}
