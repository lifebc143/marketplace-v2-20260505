import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ShoppingBag, Search, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { getCategoryTranslationKey } from "@/lib/categoryTranslation";

export default function ProductList() {
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Fetch categories
  const { data: categories } = trpc.products.categories.useQuery();

  // Fetch products based on search/filter
  const { data: products, isLoading } = trpc.products.search.useQuery({
    query: searchQuery,
    categoryId: selectedCategory ? parseInt(selectedCategory) : undefined,
    limit,
    offset,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setOffset(0);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-b border-border py-8">
        <div className="container">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("common.back")}
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2">{t("products.title")}</h1>
          <p className="text-muted-foreground">
            {t("products.search")}
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-6">{t("products.category")}</h2>

              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Input
                    placeholder={t("products.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                </div>
              </form>

              {/* Category Filter */}
              {categories && categories.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t("products.category")}
                  </label>
                  <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("products.category")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("products.category")}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {t(getCategoryTranslationKey(category.name, i18n.language))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Clear Filters */}
              {(searchQuery || selectedCategory) && (
                <Button
                  variant="outline"
                  className="w-full mt-6"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("");
                    setOffset(0);
                  }}
                >
                  {t("products.clearFilters")}
                </Button>
              )}
            </Card>
          </div>

          {/* Main Content - Products Grid */}
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : products && products.length > 0 ? (
              <>
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">
                    找到 {products.length} 件商品
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {products.map((product) => {
                    const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;
                    return (
                      <Link key={product.id} href={`/products/${product.id}`}>
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

                {/* Pagination */}
                <div className="flex gap-4 justify-center">
                  <Button
                    variant="outline"
                    disabled={offset === 0}
                    onClick={() => setOffset(Math.max(0, offset - limit))}
                  >
                    上一頁
                  </Button>
                  <Button
                    variant="outline"
                    disabled={products.length < limit}
                    onClick={() => setOffset(offset + limit)}
                  >
                    下一頁
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground mb-4">
                  {searchQuery || selectedCategory
                    ? "沒有找到符合條件的商品"
                    : "暫無商品"}
                </p>
                {(searchQuery || selectedCategory) && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("");
                      setOffset(0);
                    }}
                  >
                    {t("products.clearFilters")}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
