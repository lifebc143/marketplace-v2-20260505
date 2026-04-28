import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Wand2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CreateProduct() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  // Fetch categories
  const { data: categories } = trpc.products.categories.useQuery();

  // Create product mutation
  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: (data) => {
      toast.success("商品已成功上架！");
      navigate(`/products/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || "上架失敗，請重試");
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
    if (uploadedImages.length + files.length > 10) {
      toast.error("最多只能上傳 10 張圖片");
      return;
    }
    setUploadedImages((prev) => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const generateAIImage = async () => {
    if (!formData.description.trim()) {
      toast.error("請先輸入商品描述");
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Call AI image generation API
      // This would integrate with the backend's generateImage helper
      toast.info("AI 示意圖生成中...");
      // Placeholder for actual implementation
      setTimeout(() => {
        toast.success("AI 示意圖已生成");
        setIsGeneratingImage(false);
      }, 2000);
    } catch (error) {
      toast.error("AI 圖片生成失敗");
      setIsGeneratingImage(false);
    }
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
    if (uploadedImages.length === 0) {
      toast.error("請至少上傳一張商品圖片");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert images to buffers
      const imagePromises = uploadedImages.map(
        (file) =>
          new Promise<{ data: Buffer; mimeType: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const buffer = e.target?.result as ArrayBuffer;
              resolve({
                data: Buffer.from(buffer),
                mimeType: file.type,
              });
            };
            reader.readAsArrayBuffer(file);
          })
      );

      const images = await Promise.all(imagePromises);

      await createProductMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100),
        categoryId: parseInt(formData.categoryId),
        condition: formData.condition as any,
        images: images.map((img) => ({
          data: img.data,
          mimeType: img.mimeType,
          isAiGenerated: false,
        })),
      });
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("上架失敗，請重試");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold">上架新商品</h1>
          <p className="text-muted-foreground mt-2">
            填寫商品資訊並上傳圖片，讓買家快速了解您的商品
          </p>
        </div>
      </div>

      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">基本資訊</h2>

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <Label htmlFor="title">商品標題 *</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="例如：全新 iPhone 15 Pro Max"
                    value={formData.title}
                    onChange={handleInputChange}
                    maxLength={255}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.title.length}/255
                  </p>
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">商品描述 *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="詳細描述商品狀況、功能、使用年限等..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    className="mt-2"
                  />
                </div>

                {/* Price */}
                <div>
                  <Label htmlFor="price">價格 (NT$) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="100"
                    className="mt-2"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">分類 *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, categoryId: value }))
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="選擇商品分類" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id.toString()}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition */}
                <div>
                  <Label htmlFor="condition">商品狀況</Label>
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
                      <SelectItem value="like_new">如新</SelectItem>
                      <SelectItem value="good">良好</SelectItem>
                      <SelectItem value="fair">尚可</SelectItem>
                      <SelectItem value="poor">有損傷</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Images */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">商品圖片</h2>

              {/* Image Upload Area */}
              <div className="mb-6">
                <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium">點擊或拖拽上傳圖片</p>
                  <p className="text-sm text-muted-foreground">
                    支援 JPG、PNG 格式，最多 10 張
                  </p>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* AI Image Generation */}
              <div className="mb-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium mb-1">AI 示意圖生成</p>
                    <p className="text-sm text-muted-foreground">
                      根據商品描述自動生成示意圖
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateAIImage}
                    disabled={isGeneratingImage || !formData.description.trim()}
                  >
                    {isGeneratingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        生成圖片
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Uploaded Images Preview */}
              {uploadedImages.length > 0 && (
                <div>
                  <p className="font-medium mb-3">
                    已上傳 {uploadedImages.length}/10 張圖片
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div
                        key={index}
                        className="relative group rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index}`}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="text-white text-sm">移除</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    上架中...
                  </>
                ) : (
                  "上架商品"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
