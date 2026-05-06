import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ShoppingBag, Plus } from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { getCategoryTranslationKey } from "@/lib/categoryTranslation";


export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } =
    trpc.products.categories.useQuery();

  // Fetch products based on selected category
  const { data: products, isLoading: productsLoading } =
    trpc.products.search.useQuery({
      query: "",
      categoryId: selectedCategory,
      limit: 20,
      offset: 0,
    });

  const isLoading = categoriesLoading || productsLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section with Cinematic Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-background to-accent/20 py-20 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
        </div>

        <div className="container relative z-10 text-center">
          <div className="flex items-center justify-center mb-6">
            <ShoppingBag className="w-12 h-12 text-accent mr-3" />
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Marketplace
            </h1>
          </div>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("home.tagline")}
          </p>

          <div className="flex gap-4 justify-center">
            {isAuthenticated ? (
              <Link href="/products/create">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  <Plus className="w-5 h-5 mr-2" />
                  {t("home.uploadProduct")}
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={() => (window.location.href = getLoginUrl())}
              >
                {t("home.loginToSell")}
              </Button>
            )}
            <Link href="/products">
              <Button size="lg" variant="outline">
                {t("home.browseAll")}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      {categories && categories.length > 0 && (
        <div className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-40">
          <div className="container py-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === undefined ? "default" : "outline"}
                onClick={() => setSelectedCategory(undefined)}
                className="whitespace-nowrap"
              >
                {t("home.allProducts")}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="whitespace-nowrap"
                >
                  {t(getCategoryTranslationKey(category.name, i18n.language))}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div className="container py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : products && products.length > 0 ? (
          <div>
            <h2 className="text-3xl font-bold mb-8 text-foreground">{t("home.featured")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    {/* Product Image */}
                    <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center overflow-hidden">
                      {(product as any).images && (product as any).images.length > 0 ? (
                        <img
                          src={(product as any).images[0].imageUrl}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
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
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">暫無商品</p>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-primary to-accent/50 py-16 text-center">
        <div className="container">
          <h2 className="text-3xl font-bold mb-4 text-white">{t("home.ctaTitle")}</h2>
          <p className="text-lg text-white/80 mb-8">
            {t("home.ctaDescription")}
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              {t("home.register")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
