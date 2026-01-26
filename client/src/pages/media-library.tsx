import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Download, Trash2, Image, User, Palette, Package, FileImage, X, Loader2, Building2 } from "lucide-react";

type Brand = {
  id: string;
  name: string;
};

type MediaAsset = {
  id: string;
  userId: string;
  brandId: string | null;
  assetType: string;
  storageKey: string;
  publicUrl: string;
  filename: string | null;
  mimeType: string;
  sizeBytes: number;
  altText: string | null;
  createdAt: string;
};

type MediaQuota = {
  usedBytes: number;
  maxTotalBytes: number;
  usedFiles: number;
  maxFiles: number;
  usedPercentBytes: number;
  usedPercentFiles: number;
};

const assetTypeLabels: Record<string, { label: string; icon: typeof Image }> = {
  logo: { label: "Логотипи", icon: Palette },
  avatar: { label: "Аватари", icon: User },
  merch: { label: "Мерч", icon: Package },
  chat_ai: { label: "AI зображення", icon: FileImage },
  chat_user: { label: "Завантажені", icon: Image },
  attachment: { label: "Вкладення", icon: FileImage },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function MediaLibrary() {
  const { toast } = useToast();
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const { data: assets = [], isLoading: assetsLoading } = useQuery<MediaAsset[]>({
    queryKey: ["/api/media"],
  });

  const { data: quota } = useQuery<MediaQuota>({
    queryKey: ["/api/media/quota"],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ["/api/user/brands"],
  });

  const brandMap = useMemo(() => {
    const map: Record<string, string> = {};
    brands.forEach(brand => {
      map[brand.id] = brand.name;
    });
    return map;
  }, [brands]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      queryClient.invalidateQueries({ queryKey: ["/api/media/quota"] });
      setSelectedAsset(null);
      toast({ title: "Файл видалено" });
    },
    onError: () => {
      toast({ title: "Помилка видалення", variant: "destructive" });
    },
  });

  const filteredAssets = activeTab === "all" 
    ? assets 
    : assets.filter(a => a.assetType === activeTab);

  const handleDownload = (asset: MediaAsset) => {
    const link = document.createElement("a");
    link.href = asset.publicUrl;
    link.download = asset.filename || `image-${asset.id}`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const groupedAssets = assets.reduce((acc, asset) => {
    acc[asset.assetType] = (acc[asset.assetType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Бібліотека медіа
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Усі ваші збережені зображення в одному місці
        </p>
      </div>

      {quota && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Використано місця
                  </span>
                  <span className="text-sm font-medium">
                    {formatBytes(quota.usedBytes)} / {formatBytes(quota.maxTotalBytes)}
                  </span>
                </div>
                <Progress value={quota.usedPercentBytes} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Кількість файлів
                  </span>
                  <span className="text-sm font-medium">
                    {quota.usedFiles} / {quota.maxFiles}
                  </span>
                </div>
                <Progress value={quota.usedPercentFiles} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 flex-wrap h-auto gap-2">
          <TabsTrigger value="all" className="gap-2" data-testid="tab-all">
            <Image className="w-4 h-4" />
            Усі ({assets.length})
          </TabsTrigger>
          {Object.entries(assetTypeLabels).map(([type, { label, icon: Icon }]) => {
            const count = groupedAssets[type] || 0;
            if (count === 0) return null;
            return (
              <TabsTrigger key={type} value={type} className="gap-2" data-testid={`tab-${type}`}>
                <Icon className="w-4 h-4" />
                {label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab}>
          {assetsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Image className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {activeTab === "all" 
                    ? "У вас поки немає збережених зображень" 
                    : "Немає зображень у цій категорії"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredAssets.map((asset) => (
                <Card 
                  key={asset.id} 
                  className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all group"
                  onClick={() => setSelectedAsset(asset)}
                  data-testid={`media-card-${asset.id}`}
                >
                  <div className="aspect-square relative bg-gray-100 dark:bg-gray-800">
                    <img
                      src={asset.publicUrl}
                      alt={asset.altText || "Image"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(asset);
                        }}
                        data-testid={`download-btn-${asset.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-2">
                    <p className="text-xs text-gray-500 truncate">
                      {assetTypeLabels[asset.assetType]?.label || asset.assetType}
                    </p>
                    {asset.brandId && brandMap[asset.brandId] && (
                      <p className="text-xs text-primary font-medium truncate flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {brandMap[asset.brandId]}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {formatBytes(asset.sizeBytes)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedAsset} onOpenChange={() => setSelectedAsset(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedAsset?.altText || "Зображення"}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAsset(null)}
                data-testid="close-preview-btn"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <img
                  src={selectedAsset.publicUrl}
                  alt={selectedAsset.altText || "Image"}
                  className="w-full max-h-[60vh] object-contain"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Тип:</span>{" "}
                  <span className="font-medium">
                    {assetTypeLabels[selectedAsset.assetType]?.label || selectedAsset.assetType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Розмір:</span>{" "}
                  <span className="font-medium">{formatBytes(selectedAsset.sizeBytes)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Бренд:</span>{" "}
                  <span className="font-medium">
                    {selectedAsset.brandId && brandMap[selectedAsset.brandId] 
                      ? brandMap[selectedAsset.brandId] 
                      : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Формат:</span>{" "}
                  <span className="font-medium">{selectedAsset.mimeType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Створено:</span>{" "}
                  <span className="font-medium">
                    {new Date(selectedAsset.createdAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownload(selectedAsset)}
                  data-testid="download-preview-btn"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Завантажити
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(selectedAsset.id)}
                  disabled={deleteMutation.isPending}
                  data-testid="delete-preview-btn"
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Видалити
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
