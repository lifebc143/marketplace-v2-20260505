import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getCategoryTranslationKey } from "@/lib/categoryTranslation";

export default function EditProduct() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t, i18n } = useTranslation();
  const params = useParams();
  const productId = params.id ? parseInt(params.id) : null;

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    condition: "good",
  });

  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated || !productId) {
    return null;
  }

  // Fetch product details
  const { data: product, isLoading: isLoadingProduct } = trpc.products.getById.useQuery({ id: productId });
  
  // Fetch categories
  const { data: categories } = trpc.products.categories.useQuery();

  // Populate form when product data is loaded
  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: String((product.price || 0) / 100),
        categoryId: String(product.categoryId || ""),
        condition: product.condition || "good",
      });
      setExistingImages(product.images || []);
    }
  }, [product]);

  // Update product mutation
  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: (data) => {
      toast.success("商品已成功更新！");
      navigate(`/products/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗，請重試");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (uploadedImages.length + existingImages.length + files.length > 10) {
      toast.error("最多只能上傳 10 張圖片");
      return;
    }
    setUploadedImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("請輸入商品標題");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("請輸入商品描述");
      return;
    }
    if (!formData.price) {
      toast.error("請輸入商品價格");
      return;
    }
    if (!formData.categoryId) {
      toast.error("請選擇商品分類");
      return;
    }
    // Only require images if no existing images (new product)
    // For editing, allow keeping existing images without uploading new ones
    if (existingImages.length === 0) {
      toast.error("請至少保留一張商品圖片");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert new images to Uint8Array for submission
      const imageData: Array<{ data: Uint8Array; mimeType: string }> = [];

      for (const file of uploadedImages) {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
          };
          reader.readAsArrayBuffer(file);
        });

        // Convert ArrayBuffer to Uint8Array
        const uint8Array = new Uint8Array(arrayBuffer) as any;

        imageData.push({
          data: uint8Array,
          mimeType: file.type,
        });
      }

      await updateProductMutation.mutateAsync({
        id: productId,
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100),
        categoryId: parseInt(formData.categoryId),
        condition: formData.condition as any,
        images: imageData,
        existingImageIds: existingImages.map((img) => img.id),
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("更新失敗，請重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/my-products")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">編輯商品</h1>
          <p className="text-muted-foreground mt-2">
            修改商品資訊和圖片
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">基本資訊</h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">商品標題 *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="例：iPhone 13 Pro 256GB"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="description">商品描述 *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="詳細描述商品狀況、功能、缺陷等..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">價格 (NT$) *</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      placeholder="0"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="condition">商品狀況 *</Label>
                    <Select
                      value={formData.condition}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, condition: value }))
                      }
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="like_new">全新</SelectItem>
                        <SelectItem value="good">良好</SelectItem>
                        <SelectItem value="fair">尚可</SelectItem>
                        <SelectItem value="poor">不佳</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="categoryId">分類 *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoryId: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="選擇分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {t(getCategoryTranslationKey(cat.name))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">商品圖片</h2>

              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">現有圖片</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {existingImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.imageUrl}
                          alt="Product"
                          className="w-full h-32 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(image.id)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {uploadedImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-3">新增圖片</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  拖放圖片或點擊選擇
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>選擇圖片</span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  最多 10 張圖片，每張不超過 5MB
                </p>
              </div>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    更新中...
                  </>
                ) : (
                  "更新商品"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/my-products")}
              >
                取消
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
