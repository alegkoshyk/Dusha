import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { insertUserBrandSchema, type UserBrand } from "@shared/schema";
import { Building2, FileText, ImagePlus, X, Loader2, Crown, Zap } from "lucide-react";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

const editBrandSchema = insertUserBrandSchema.omit({
  userId: true,
}).extend({
  name: z.string().min(2, "Назва бренду повинна містити мінімум 2 символи"),
  description: z.string().optional(),
});

type EditBrandForm = z.infer<typeof editBrandSchema>;

interface EditBrandDialogProps {
  brand: UserBrand | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandUpdated?: () => void;
}

export function EditBrandDialog({ brand, open, onOpenChange, onBrandUpdated }: EditBrandDialogProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quotaError, setQuotaError] = useState<{
    currentPlan: string;
    nextPlan: { id: number; name: string; maxStorageBytes: number; maxMediaFiles: number; priceMonthly: number; currency: string } | null;
  } | null>(null);

  const updateBrandMutation = useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      const response = await apiRequest("PATCH", `/api/user/brands/${id}`, { name, description });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands"] });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ brandId, logo }: { brandId: string; logo: string | null }) => {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/brands/${brandId}/logo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "x-auth-token": authToken } : {}),
        },
        body: JSON.stringify({ logo: logo || '' }),
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 413 && result.error === "quota_exceeded") {
          setQuotaError({ currentPlan: result.currentPlan, nextPlan: result.nextPlan });
          throw new Error("quota_exceeded");
        }
        throw new Error(result.error || result.message);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands"] });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EditBrandForm>({
    resolver: zodResolver(editBrandSchema),
  });

  useEffect(() => {
    if (brand && open) {
      setValue('name', brand.name);
      setValue('description', brand.description || '');
      setLogoPreview(brand.logo || null);
      setLogoChanged(false);
    }
  }, [brand, open, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuotaError(null);

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Підтримуються тільки PNG, JPG, WebP або SVG формати');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Розмір файлу не повинен перевищувати 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      setLogoChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoChanged(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: EditBrandForm) => {
    if (!brand) return;

    try {
      await updateBrandMutation.mutateAsync({ 
        id: brand.id, 
        name: data.name, 
        description: data.description 
      });

      if (logoChanged) {
        await uploadLogoMutation.mutateAsync({ 
          brandId: brand.id, 
          logo: logoPreview 
        });
      }

      reset();
      setLogoPreview(null);
      setLogoChanged(false);
      onOpenChange(false);
      onBrandUpdated?.();
    } catch (error) {
      console.error("Error updating brand:", error);
    }
  };

  const handleClose = () => {
    if (!updateBrandMutation.isPending && !uploadLogoMutation.isPending) {
      reset();
      setLogoPreview(null);
      setLogoChanged(false);
      onOpenChange(false);
    }
  };

  const isPending = updateBrandMutation.isPending || uploadLogoMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-edit-brand">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Редагувати бренд
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Змініть назву, опис або логотип вашого бренду
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Назва бренду *</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="name"
                placeholder="Наприклад: Red Cats Agency"
                className="pl-10"
                data-testid="input-edit-brand-name"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600" data-testid="error-edit-brand-name">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Опис (необов'язково)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="description"
                placeholder="Короткий опис вашого бренду"
                className="pl-10 min-h-[80px] resize-none"
                data-testid="textarea-edit-brand-description"
                {...register("description")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Логотип (необов'язково)</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white"
                    data-testid="img-edit-logo-preview"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    data-testid="button-remove-edit-logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                  data-testid="button-upload-edit-logo"
                >
                  <ImagePlus className="w-6 h-6 text-gray-400" />
                </button>
              )}
              <div className="text-sm text-gray-500">
                <p>PNG, JPG або SVG</p>
                <p>Макс. 2MB</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
              data-testid="input-edit-logo-file"
            />
          </div>

          {(updateBrandMutation.isError || uploadLogoMutation.isError) && !quotaError && (
            <Alert variant="destructive" data-testid="edit-brand-error">
              <AlertDescription>
                Помилка оновлення бренду
              </AlertDescription>
            </Alert>
          )}

          {quotaError && (
            <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                Ліміт зберігання вичерпано
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Тариф "{quotaError.currentPlan}" не дозволяє завантажити більше файлів.
                {quotaError.nextPlan && ` Оновіть до "${quotaError.nextPlan.name}" для ${Math.round(quotaError.nextPlan.maxStorageBytes / (1024 * 1024))} МБ.`}
              </p>
              <Link href="/pricing">
                <Button size="sm" variant="outline" className="mt-2 text-xs">
                  <Zap className="h-3 w-3 mr-1" /> Обрати тариф
                </Button>
              </Link>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isPending}
              data-testid="button-cancel-edit"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending}
              data-testid="button-save-brand"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Збереження...
                </>
              ) : (
                "Зберегти"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
