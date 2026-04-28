import { useState, useEffect } from "react";
import { Buffer } from "buffer";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
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
import { Loader2, Upload, Wand2, ArrowLeft, X } from "lucide-react";
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
      toast.info("AI 示意圖生成中...");
      // Placeholder: In production, this would call backend AI image generation
      setTimeout(() => {
        toast.success("AI 示意圖功能已準備就緒");
        setIsGeneratingImage(false);
      }, 1500);
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
      // Convert images to ArrayBuffer for submission
      const imageData: Array<{ data: Buffer; mimeType: string }> = [];

      for (const file of uploadedImages) {
        const arrayBuffer = await new Promise<ArrayBuffer>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as ArrayBuffer);
          };
          reader.readAsArrayBuffer(file);
        });

        // Convert ArrayBuffer to Buffer
        const buffer = Buffer.from(arrayBuffer);

        imageData.push({
          data: buffer,
          mimeType: file.type,
        });
      }

      await createProductMutation.mutateAsync({
        title: formData.title,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100),
        categoryId: parseInt(formData.categoryId),
        condition: formData.condition as any,
        images: imageData,
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
            填寫商品資訊並上傳圖片
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
                        <SelectItem value="excellent">優秀</SelectItem>
                        <SelectItem value="good">良好</SelectItem>
                        <SelectItem value="fair">尚可</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">商品分類 *</Label>
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
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
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

              <div className="space-y-4">
                {/* Image Upload */}
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted/50 transition">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    拖拽圖片或點擊選擇
                  </p>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="cursor-pointer text-accent hover:underline"
                  >
                    選擇圖片
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    最多 10 張，支援 JPG、PNG 格式
                  </p>
                </div>

                {/* AI Image Generation */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={generateAIImage}
                  disabled={isGeneratingImage}
                >
                  <Wand2 className="w-4 h-4" />
                  {isGeneratingImage ? "生成中..." : "AI 示意圖生成"}
                </Button>

                {/* Uploaded Images Preview */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-4">
                    {uploadedImages.map((file, index) => (
                      <div
                        key={index}
                        className="relative group aspect-square bg-muted rounded-lg overflow-hidden"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-destructive text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  已上傳 {uploadedImages.length} 張圖片
                </p>
              </div>
            </Card>

            {/* Submit */}
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
