import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (isAuthenticated && user?.role !== "admin") {
      navigate("/");
    }
  }, [isAuthenticated, user, navigate]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });

  // Fetch categories
  const { data: categories, refetch } = trpc.admin.categories.useQuery();

  // Create category mutation
  const createMutation = trpc.admin.createCategory.useMutation({
    onSuccess: () => {
      toast.success("分類已新增");
      setFormData({ name: "", slug: "" });
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "新增失敗");
    },
  });

  // Update category mutation
  const updateMutation = trpc.admin.updateCategory.useMutation({
    onSuccess: () => {
      toast.success("分類已更新");
      setFormData({ name: "", slug: "" });
      setIsEditOpen(false);
      setSelectedCategory(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "更新失敗");
    },
  });

  // Delete category mutation
  const deleteMutation = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("分類已刪除");
      setIsDeleteOpen(false);
      setSelectedCategory(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "刪除失敗");
    },
  });

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }
    createMutation.mutate({
      name: formData.name,
      slug: formData.slug,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error("請填寫所有欄位");
      return;
    }
    updateMutation.mutate({
      id: selectedCategory.id,
      name: formData.name,
      slug: formData.slug,
    });
  };

  const handleDelete = () => {
    if (selectedCategory) {
      deleteMutation.mutate({ id: selectedCategory.id });
    }
  };

  const openEditDialog = (category: any) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setIsEditOpen(true);
  };

  const openDeleteDialog = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border">
        <div className="container py-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回管理員後台
          </Button>
          <h1 className="text-3xl font-bold">分類管理</h1>
          <p className="text-muted-foreground mt-2">
            新增、編輯或刪除商品分類
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Create Button */}
        <div className="mb-6">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
                <Plus className="w-4 h-4" />
                新增分類
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增分類</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="create-name">分類名稱</Label>
                  <Input
                    id="create-name"
                    placeholder="例：電子產品"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="create-slug">分類代碼 (Slug)</Label>
                  <Input
                    id="create-slug"
                    placeholder="例：electronics"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slug: e.target.value,
                      }))
                    }
                    className="mt-2"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="w-full"
                >
                  {createMutation.isPending ? "新增中..." : "新增分類"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories List */}
        <div className="grid gap-4">
          {categories && categories.length > 0 ? (
            categories.map((category) => (
              <Card key={category.id} className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    代碼: {category.slug}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(category)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              <p>暫無分類</p>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯分類</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">分類名稱</Label>
              <Input
                id="edit-name"
                placeholder="例：電子產品"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="edit-slug">分類代碼 (Slug)</Label>
              <Input
                id="edit-slug"
                placeholder="例：electronics"
                value={formData.slug}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    slug: e.target.value,
                  }))
                }
                className="mt-2"
              />
            </div>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full"
            >
              {updateMutation.isPending ? "更新中..." : "更新分類"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>確認刪除分類？</AlertDialogTitle>
          <AlertDialogDescription>
            您確定要刪除分類「{selectedCategory?.name}」嗎？此操作無法復原。
          </AlertDialogDescription>
          <div className="flex gap-4 justify-end">
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "刪除中..." : "刪除"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
