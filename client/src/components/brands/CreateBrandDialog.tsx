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
import { Building2, FileText } from "lucide-react";
import { z } from "zod";

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
}

export function CreateBrandDialog({ open, onOpenChange, onBrandCreated }: CreateBrandDialogProps) {
  const { createBrand, isCreatingBrand, createBrandError } = useBrands();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateBrandForm>({
    resolver: zodResolver(createBrandSchema),
  });

  const onSubmit = (data: CreateBrandForm) => {
    createBrand(data, {
      onSuccess: (brand: UserBrand) => {
        reset();
        onBrandCreated(brand);
      },
    });
  };

  const handleClose = () => {
    if (!isCreatingBrand) {
      reset();
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

          {createBrandError && (
            <Alert variant="destructive" data-testid="create-brand-error">
              <AlertDescription>
                {createBrandError.message || "Помилка створення бренду"}
              </AlertDescription>
            </Alert>
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
              disabled={isCreatingBrand}
              data-testid="button-create-brand"
            >
              {isCreatingBrand ? "Створення..." : "Створити бренд"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}