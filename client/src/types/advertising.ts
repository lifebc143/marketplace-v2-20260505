export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  imageKey: string;
  externalLink: string;
  position: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface NativeAd {
  id: number;
  title: string;
  imageUrl: string;
  imageKey: string;
  price: number | null;
  discount: string | null;
  externalLink: string;
  label: string;
  position: number;
  isActive: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdStatistic {
  id: number;
  resourceId: number;
  resourceType: 'banner' | 'native_ad';
  impressions: number;
  clicks: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdStats {
  daily: AdStatistic[];
  total: {
    totalImpressions: number;
    totalClicks: number;
  };
}
