import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBrands } from "@/hooks/useBrands";
import { insertUserBrandSchema, type InsertUserBrand, type UserBrand } from "@shared/schema";
import { Building2, FileText, ImagePlus, X, Crown, Zap } from "lucide-react";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";

const createBrandSchema = insertUserBrandSchema.omit({
  userId: true,
}).extend({
  name: z.string().min(2, "Назва бренду повинна містити мінімум 2 символи"),
  description: z.string().optional(),
});

type CreateBrandForm = z.infer<typeof createBrandSchema>;

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandCreated: (brand: UserBrand) => void;
  defaultValues?: { name?: string; description?: string };
}

export function CreateBrandDialog({ open, onOpenChange, onBrandCreated, defaultValues }: CreateBrandDialogProps) {
  const { createBrand, isCreatingBrand, createBrandError } = useBrands();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [quotaError, setQuotaError] = useState<{
    currentPlan: string;
    nextPlan: { id: number; name: string; maxStorageBytes: number; maxMediaFiles: number; priceMonthly: number; currency: string } | null;
  } | null>(null);

  const uploadLogoMutation = useMutation({
    mutationFn: async ({ brandId, logo }: { brandId: string; logo: string }) => {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`/api/user/brands/${brandId}/logo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { "x-auth-token": authToken } : {}),
        },
        body: JSON.stringify({ logo }),
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
  } = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
    },
  });

  useEffect(() => {
    if (open && defaultValues) {
      reset({
        name: defaultValues.name || '',
        description: defaultValues.description || '',
      });
    }
  }, [open, defaultValues, reset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setQuotaError(null);

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      alert('Підтримуються тільки PNG, JPG, WebP або SVG формати');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Розмір файлу не повинен перевищувати 2MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CreateBrandForm) => {
    createBrand(data, {
      onSuccess: async (brand: UserBrand) => {
        // If logo was selected, upload it
        if (logoPreview) {
          await uploadLogoMutation.mutateAsync({ brandId: brand.id, logo: logoPreview });
        }
        reset();
        setLogoPreview(null);
        onBrandCreated(brand);
      },
    });
  };

  const handleClose = () => {
    if (!isCreatingBrand && !uploadLogoMutation.isPending) {
      reset();
      setLogoPreview(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-brand">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Створити новий бренд
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Дайте назву та опис вашому бренду для початку подорожі
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
                data-testid="input-brand-name"
                {...register("name")}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600" data-testid="error-brand-name">
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
                placeholder="Короткий опис вашого бренду, його діяльності або цілей"
                className="pl-10 min-h-[80px] resize-none"
                data-testid="textarea-brand-description"
                {...register("description")}
              />
            </div>
            {errors.description && (
              <p className="text-sm text-red-600" data-testid="error-brand-description">
                {errors.description.message}
              </p>
            )}
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
                    data-testid="img-logo-preview"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    data-testid="button-remove-logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors"
                  data-testid="button-upload-logo"
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
              data-testid="input-logo-file"
            />
          </div>

          {createBrandError && (
            <Alert variant="destructive" data-testid="create-brand-error">
              <AlertDescription>
                {createBrandError.message || "Помилка створення бренду"}
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
              disabled={isCreatingBrand}
              data-testid="button-cancel"
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isCreatingBrand || uploadLogoMutation.isPending}
              data-testid="button-create-brand"
            >
              {isCreatingBrand || uploadLogoMutation.isPending ? "Створення..." : "Створити бренд"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}