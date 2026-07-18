import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import type { NativeAd } from '@/types/advertising';

export default function AdminNativeAds() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    discount: '',
    externalLink: '',
    label: '贊助',
    position: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  // Fetch native ads
  const { data: nativeAds = [], isLoading, refetch } = trpc.advertising.nativeAds.getAll.useQuery();

  // Create/Update mutations
  const createMutation = trpc.advertising.nativeAds.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const updateMutation = trpc.advertising.nativeAds.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
    },
  });

  const deleteMutation = trpc.advertising.nativeAds.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      discount: '',
      externalLink: '',
      label: '贊助',
      position: 0,
    });
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
      alert('請上傳廣告圖片');
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
        const uploadMutation = trpc.upload.image.useMutation();
        const uploadResult = await new Promise((resolve, reject) => {
          uploadMutation.mutate(
            {
              fileName: imageFile.name,
              fileData: base64Data,
              type: 'native-ad',
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

      const price = formData.price ? Math.floor(parseFloat(formData.price) * 100) : null;

      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          title: formData.title,
          price,
          discount: formData.discount || null,
          externalLink: formData.externalLink,
          label: formData.label,
          position: formData.position,
          ...(imageUrl && { imageUrl, imageKey }),
        });
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          imageUrl,
          imageKey,
          price,
          discount: formData.discount || null,
          externalLink: formData.externalLink,
          label: formData.label,
          position: formData.position,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      alert('操作失敗，請重試');
    }
  };

  const handleEdit = (ad: NativeAd) => {
    setEditingId(ad.id);
    setFormData({
      title: ad.title,
      price: ad.price ? (ad.price / 100).toString() : '',
      discount: ad.discount || '',
      externalLink: ad.externalLink,
      label: ad.label,
      position: ad.position,
    });
  };

  const handleDelete = async (id: number) => {
    if (confirm('確定要刪除此廣告嗎？')) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">原生廣告管理</h1>

        {/* Form */}
        <Card className="p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6">
            {editingId ? '編輯廣告' : '新增廣告'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">廣告標題 *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例：新款手機"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">價格</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="999.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">折扣資訊</label>
                <Input
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  placeholder="例：限時 7 折"
                />
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">標籤</label>
                <Input
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="贊助"
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
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                廣告圖片 {!editingId && '*'}
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
                  '更新廣告'
                ) : (
                  '新增廣告'
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

        {/* Native Ads List */}
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-6">現有廣告</h2>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : nativeAds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">暫無廣告</p>
          ) : (
            <div className="space-y-4">
              {nativeAds.map((ad) => (
                <div
                  key={ad.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{ad.title}</h3>
                    <p className="text-sm text-muted-foreground">{ad.externalLink}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      {ad.price && <span>價格：NT${(ad.price / 100).toFixed(2)}</span>}
                      {ad.discount && <span>折扣：{ad.discount}</span>}
                      <span>標籤：{ad.label}</span>
                      <span>排序：{ad.position}</span>
                      <span>狀態：{ad.isActive ? '啟用' : '停用'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(ad)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(ad.id)}
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
