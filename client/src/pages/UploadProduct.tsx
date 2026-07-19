import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ImageUploadField } from "@/components/ImageUploadField";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  isCompressed: boolean;
}

// Canadian cities/regions
const CANADIAN_LOCATIONS = [
  "Calgary",
  "Edmonton",
  "Toronto",
  "Vancouver",
  "Montreal",
  "Winnipeg",
  "Ottawa",
  "Mississauga",
  "Brampton",
  "Hamilton",
  "Quebec City",
  "Surrey",
  "Laval",
  "Halifax",
  "London",
  "Kitchener",
  "Markham",
  "Vaughan",
  "Gatineau",
  "Longueuil",
  "Other",
];

// Product conditions
const CONDITIONS = [
  { value: "brand_new", label: "Brand New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];

export default function UploadProduct() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    titleCn: "",
    description: "",
    price: "",
    location: "Calgary",
    categoryId: "",
    condition: "good",
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = trpc.products.categories.useQuery();

  // Create product mutation
  const createProduct = trpc.products.create.useMutation({
    onSuccess: (data) => {
      toast.success("Product published successfully!");
      navigate("/");
    },
    onError: (error) => {
      console.error("[UploadProduct] Error:", error);
      toast.error(error.message || "Failed to publish product");
      setIsSubmitting(false);
    },
  });

  // Check authentication
  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please log in to upload products.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error("Product title is required");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Product description is required");
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (images.length === 0) {
      toast.error("At least one image is required");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert images to array format for upload
      const imageData = await Promise.all(
        images.map(async (img) => ({
          data: new Uint8Array(await img.file.arrayBuffer()),
          mimeType: img.file.type,
          isAiGenerated: false,
        }))
      );

      await createProduct.mutateAsync({
        title: formData.title,
        titleCn: formData.titleCn || undefined,
        description: formData.description,
        price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
        location: formData.location,
        categoryId: parseInt(formData.categoryId),
        condition: formData.condition as "brand_new" | "like_new" | "good" | "fair",
        images: imageData,
      });
    } catch (error) {
      console.error("[UploadProduct] Submit error:", error);
      toast.error("Failed to publish product");
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 py-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">Upload Product</h1>
          <p className="text-muted-foreground mt-2">
            Fill in the product details and upload images to list your item for sale
          </p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Provide accurate details about your product to attract buyers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Title */}
              <div className="grid gap-2">
                <Label htmlFor="title">
                  Product Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., iPhone 13 Pro Max"
                  value={formData.title}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  English title (required)
                </p>
              </div>

              {/* Product Title (Chinese) */}
              <div className="grid gap-2">
                <Label htmlFor="titleCn">Product Title (Chinese)</Label>
                <Input
                  id="titleCn"
                  name="titleCn"
                  placeholder="e.g., iPhone 13 Pro Max (optional)"
                  value={formData.titleCn}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Chinese title (optional)
                </p>
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your product in detail..."
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  rows={5}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Include details about condition, features, and any defects
                </p>
              </div>

              {/* Price */}
              <div className="grid gap-2">
                <Label htmlFor="price">
                  Price (CAD) <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-medium">$</span>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div className="grid gap-2">
                <Label htmlFor="category">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleSelectChange("categoryId", value)}
                  disabled={isSubmitting || categoriesLoading}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location */}
              <div className="grid gap-2">
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => handleSelectChange("location", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="location">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CANADIAN_LOCATIONS.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="grid gap-2">
                <Label htmlFor="condition">
                  Condition <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => handleSelectChange("condition", value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Images */}
              <div className="grid gap-2">
                <Label>
                  Product Images <span className="text-red-500">*</span>
                </Label>
                <ImageUploadField
                  maxFiles={5}
                  maxSizeMB={5}
                  onImagesChange={setImages}
                  value={images}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || images.length === 0}
                  size="lg"
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Publish Product
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
              Tips for Better Listings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Use clear, descriptive titles that include brand and model</p>
            <p>• Upload high-quality images from multiple angles</p>
            <p>• Be honest about the product condition</p>
            <p>• Include all relevant details in the description</p>
            <p>• Set a competitive price to attract buyers</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
