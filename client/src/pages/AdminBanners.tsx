import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import type { Banner } from '@/types/advertising';

export default function AdminBanners() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    externalLink: '',
    position: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch banners
  const { data: banners = [], isLoading, refetch } = trpc.advertising.banners.getAll.useQuery();

  // Create/Update mutations
  const createMutation = trpc.advertising.banners.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.advertising.banners.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteMutation = trpc.advertising.banners.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const uploadMutation = trpc.upload.image.useMutation();

  const resetForm = () => {
    setFormData({ title: '', externalLink: '', position: 0 });
    setImageFile(null);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.externalLink) {
      alert('請填寫所有必填欄位');
      return;
    }

    if (!editingId && !imageFile) {
      alert('請上傳 Banner 圖片');
      return;
    }

    try {
      let imageUrl = '';
      let imageKey = '';

      // Upload image if provided
      if (imageFile) {
        // Convert file to base64
        const buffer = await imageFile.arrayBuffer();
        const uint8Array = new Uint8Array(buffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        const base64Data = btoa(binaryString);
        
        // Upload via tRPC
        const uploadResult = await new Promise((resolve, reject) => {
          uploadMutation.mutate(
            {
              fileName: imageFile.name,
              fileData: base64Data,
              type: 'banner',
            },
            {
              onSuccess: (data) => resolve(data),
              onError: (error) => reject(error),
            }
          );
        });
        
        imageUrl = uploadResult.url;
        imageKey = uploadResult.key;
      }

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          externalLink: formData.externalLink,
          position: formData.position,
          ...(imageUrl && { imageUrl, imageKey }),
        });
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          imageUrl,
          imageKey,
          externalLink: formData.externalLink,
          position: formData.position,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('操作失敗，請重試');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      externalLink: banner.externalLink,
      position: banner.position,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('確定要刪除此 Banner 嗎？')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Banner 管理</h1>

        {/* Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? '編輯 Banner' : '新增 Banner'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Banner 標題 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：夏季大促銷"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">外部連結 *</label>
              <Input
                type="url"
                value={formData.externalLink}
                onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">排序位置</label>
              <Input
                type="number"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Banner 圖片 {!editingId && '*'}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="block w-full"
              />
              {imageFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  已選擇：{imageFile.name}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    處理中...
                  </>
                ) : editingId ? (
                  '更新 Banner'
                ) : (
                  '新增 Banner'
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  取消編輯
                </Button>
              )}
            </div>
          </form>
        </Card>

        {/* Banners List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">現有 Banners</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : banners.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無 Banners</p>
          ) : (
            <div className="space-y-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    <p className="text-sm text-muted-foreground">{banner.externalLink}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      排序：{banner.position} | 狀態：{banner.isActive ? '啟用' : '停用'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(banner)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(banner.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
