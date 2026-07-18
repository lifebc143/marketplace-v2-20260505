import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { ShoppingBag } from 'lucide-react';
import { NativeAdCard } from '@/components/NativeAdCard';
import { trpc } from '@/lib/trpc';
import type { Product } from '@/types/product';
import type { NativeAd } from '@/types/advertising';

interface ProductListWithAdsProps {
  products: Product[];
  isLoading?: boolean;
}

export function ProductListWithAds({ products, isLoading = false }: ProductListWithAdsProps) {
  // Fetch native ads
  const { data: nativeAds = [] } = trpc.advertising.nativeAds.getAll.useQuery();

  // Merge products and ads with ads appearing every 6 products
  const mergedList = useMemo(() => {
    const result: (Product | NativeAd | { type: 'ad'; ad: NativeAd })[] = [];
    const adsToShow = nativeAds.slice(0, Math.ceil(products.length / 6)); // Limit ads

    let adIndex = 0;

    for (let i = 0; i < products.length; i++) {
      result.push(products[i]);

      // Insert ad after every 6 products
      if ((i + 1) % 6 === 0 && adIndex < adsToShow.length) {
        result.push({ type: 'ad', ad: adsToShow[adIndex] });
        adIndex++;
      }
    }

    return result;
  }, [products, nativeAds]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
      {mergedList.map((item, index) => {
        // Render native ad
        if ('type' in item && item.type === 'ad') {
          return <NativeAdCard key={`ad-${item.ad.id}`} ad={item.ad} />;
        }

        // Render product
        const product = item as Product;
        const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;

        return (
          <Link key={`product-${product.id}`} href={`/products/${product.id}`}>
            <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
              {/* Product Image */}
              <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                {firstImage && firstImage.imageUrl ? (
                  <img
                    src={firstImage.imageUrl}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-2 text-foreground">
                  {product.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  {product.description}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-accent">
                    NT${(product.price / 100).toFixed(0)}
                  </span>
                  <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary rounded">
                    {product.condition}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
