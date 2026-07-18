import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart3, Eye, MousePointer } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import type { Banner } from '@/types/advertising';
import type { NativeAd } from '@/types/advertising';

export default function AdminAdAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedBannerId, setSelectedBannerId] = useState<number | null>(null);
  const [selectedAdId, setSelectedAdId] = useState<number | null>(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch banners and ads
  const { data: banners = [] } = trpc.advertising.banners.getAll.useQuery();
  const { data: nativeAds = [] } = trpc.advertising.nativeAds.getAll.useQuery();

  // Fetch banner stats
  const { data: bannerStats, isLoading: bannerStatsLoading } = trpc.advertising.analytics.getBannerStats.useQuery(
    { bannerId: selectedBannerId || 0 },
    { enabled: !!selectedBannerId }
  );

  // Fetch native ad stats
  const { data: adStats, isLoading: adStatsLoading } = trpc.advertising.analytics.getNativeAdStats.useQuery(
    { adId: selectedAdId || 0 },
    { enabled: !!selectedAdId }
  );

  const calculateCTR = (clicks: number, impressions: number) => {
    if (impressions === 0) return '0%';
    return ((clicks / impressions) * 100).toFixed(2) + '%';
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <BarChart3 className="w-8 h-8" />
          <h1 className="text-4xl font-bold">廣告統計分析</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Banner Analytics */}
          <div>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Banner 統計</h2>

              <div className="space-y-3 mb-6">
                {banners.map((banner) => (
                  <Button
                    key={banner.id}
                    variant={selectedBannerId === banner.id ? 'default' : 'outline'}
                    onClick={() => setSelectedBannerId(banner.id)}
                    className="w-full justify-start text-left"
                  >
                    <div>
                      <p className="font-semibold">{banner.title}</p>
                      <p className="text-xs text-muted-foreground">{banner.externalLink}</p>
                    </div>
                  </Button>
                ))}
              </div>

              {selectedBannerId && (
                <div className="border-t border-border pt-6">
                  {bannerStatsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : bannerStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">總展示次數</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {bannerStats.total.totalImpressions}
                          </p>
                        </div>

                        <div className="bg-accent/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MousePointer className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium">總點擊次數</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {bannerStats.total.totalClicks}
                          </p>
                        </div>
                      </div>

                      <div className="bg-secondary/10 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">點擊率 (CTR)</p>
                        <p className="text-2xl font-bold">
                          {calculateCTR(
                            bannerStats.total.totalClicks,
                            bannerStats.total.totalImpressions
                          )}
                        </p>
                      </div>

                      {/* Daily Stats */}
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">日期統計</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {bannerStats.daily.map((stat) => (
                            <div
                              key={stat.id}
                              className="flex justify-between items-center p-2 bg-muted rounded"
                            >
                              <span className="text-sm">{stat.date}</span>
                              <div className="flex gap-4 text-sm">
                                <span>展示：{stat.impressions}</span>
                                <span>點擊：{stat.clicks}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </div>

          {/* Native Ad Analytics */}
          <div>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">原生廣告統計</h2>

              <div className="space-y-3 mb-6">
                {nativeAds.map((ad) => (
                  <Button
                    key={ad.id}
                    variant={selectedAdId === ad.id ? 'default' : 'outline'}
                    onClick={() => setSelectedAdId(ad.id)}
                    className="w-full justify-start text-left"
                  >
                    <div>
                      <p className="font-semibold">{ad.title}</p>
                      <p className="text-xs text-muted-foreground">{ad.label}</p>
                    </div>
                  </Button>
                ))}
              </div>

              {selectedAdId && (
                <div className="border-t border-border pt-6">
                  {adStatsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : adStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-primary/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">總展示次數</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {adStats.total.totalImpressions}
                          </p>
                        </div>

                        <div className="bg-accent/10 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MousePointer className="w-4 h-4 text-accent" />
                            <span className="text-sm font-medium">總點擊次數</span>
                          </div>
                          <p className="text-3xl font-bold">
                            {adStats.total.totalClicks}
                          </p>
                        </div>
                      </div>

                      <div className="bg-secondary/10 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">點擊率 (CTR)</p>
                        <p className="text-2xl font-bold">
                          {calculateCTR(
                            adStats.total.totalClicks,
                            adStats.total.totalImpressions
                          )}
                        </p>
                      </div>

                      {/* Daily Stats */}
                      <div className="mt-6">
                        <h3 className="font-semibold mb-3">日期統計</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {adStats.daily.map((stat) => (
                            <div
                              key={stat.id}
                              className="flex justify-between items-center p-2 bg-muted rounded"
                            >
                              <span className="text-sm">{stat.date}</span>
                              <div className="flex gap-4 text-sm">
                                <span>展示：{stat.impressions}</span>
                                <span>點擊：{stat.clicks}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
