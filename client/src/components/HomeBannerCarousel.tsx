import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function HomeBannerCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Fetch banners
  const { data: banners = [] } = trpc.advertising.banners.getAll.useQuery();

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
      // Record impression
      trpc.advertising.analytics.recordBannerImpression.mutate(
        { bannerId: banners[currentIndex].id },
        { onError: () => {} } // Silently fail
      );
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

  const handleBannerClick = (banner: typeof banners[0]) => {
    // Record click
    trpc.advertising.analytics.recordBannerClick.mutate(
      { bannerId: banner.id },
      { onError: () => {} } // Silently fail
    );

    // Open external link
    window.open(banner.externalLink, '_blank');
  };

  const handleDotClick = (index: number) => {
    setAutoPlayEnabled(false);
    setCurrentIndex(index);
  };

  // Re-enable auto-play after 10 seconds of inactivity
  useEffect(() => {
    if (!autoPlayEnabled && banners.length > 0) {
      const timer = setTimeout(() => {
        setAutoPlayEnabled(true);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [autoPlayEnabled, banners.length]);

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full bg-background rounded-lg overflow-hidden shadow-lg">
      {/* Banner Container */}
      <div className="relative w-full aspect-[3/1] bg-muted">
        {/* Current Banner Image */}
        <img
          src={currentBanner.imageUrl}
          alt={currentBanner.title}
          className="w-full h-full object-cover cursor-pointer transition-opacity hover:opacity-90"
          onClick={() => handleBannerClick(currentBanner)}
        />

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous banner"
            >
              <ChevronLeft size={24} />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next banner"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{currentBanner.title}</h3>
        </div>
      </div>

      {/* Dot Navigation */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 p-4 bg-background">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-primary w-6'
                  : 'bg-muted-foreground/50 hover:bg-muted-foreground'
              }`}
              aria-label={`Go to banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
