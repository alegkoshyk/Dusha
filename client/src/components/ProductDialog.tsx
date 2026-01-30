import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Sparkles, Package, DollarSign, Target, Tag, Upload, Image, X, Plus } from "lucide-react";
import type { BrandProduct } from "@shared/schema";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  product?: BrandProduct | null;
}

interface ProductFormData {
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  subcategory: string;
  price: string;
  currency: string;
  priceType: string;
  sku: string;
  status: string;
  features: string[];
  benefits: string[];
  targetAudience: string;
  useCases: string[];
  keywords: string[];
  specifications: Record<string, string>;
  isHighlighted: boolean;
}

const initialFormData: ProductFormData = {
  name: "",
  shortDescription: "",
  fullDescription: "",
  category: "",
  subcategory: "",
  price: "",
  currency: "UAH",
  priceType: "fixed",
  sku: "",
  status: "draft",
  features: [],
  benefits: [],
  targetAudience: "",
  useCases: [],
  keywords: [],
  specifications: {},
  isHighlighted: false,
};

export function ProductDialog({ open, onOpenChange, brandId, product }: ProductDialogProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [aiDescription, setAiDescription] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [newBenefit, setNewBenefit] = useState("");
  const [newUseCase, setNewUseCase] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        shortDescription: product.shortDescription || "",
        fullDescription: product.fullDescription || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        price: product.price || "",
        currency: product.currency || "UAH",
        priceType: product.priceType || "fixed",
        sku: product.sku || "",
        status: product.status || "draft",
        features: (product.features as string[]) || [],
        benefits: (product.benefits as string[]) || [],
        targetAudience: product.targetAudience || "",
        useCases: (product.useCases as string[]) || [],
        keywords: (product.keywords as string[]) || [],
        specifications: (product.specifications as Record<string, string>) || {},
        isHighlighted: product.isHighlighted || false,
      });
    } else {
      setFormData(initialFormData);
      setAiDescription("");
    }
  }, [product, open]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/brands/${brandId}/generate-product`, {
        description: aiDescription,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to generate product data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        shortDescription: data.shortDescription || prev.shortDescription,
        fullDescription: data.fullDescription || prev.fullDescription,
        category: data.category || prev.category,
        subcategory: data.subcategory || prev.subcategory,
        price: data.price || prev.price,
        priceType: data.priceType || prev.priceType,
        features: data.features || prev.features,
        benefits: data.benefits || prev.benefits,
        targetAudience: data.targetAudience || prev.targetAudience,
        useCases: data.useCases || prev.useCases,
        keywords: data.keywords || prev.keywords,
        specifications: data.specifications || prev.specifications,
      }));
      toast({ title: "Успішно", description: "Дані продукту згенеровано" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        brandId,
        name: formData.name,
        shortDescription: formData.shortDescription || null,
        fullDescription: formData.fullDescription || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        price: formData.price || null,
        currency: formData.currency,
        priceType: formData.priceType,
        sku: formData.sku || null,
        status: formData.status,
        features: formData.features,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience || null,
        useCases: formData.useCases,
        keywords: formData.keywords,
        specifications: formData.specifications,
        isHighlighted: formData.isHighlighted,
      };
      const response = await apiRequest("POST", `/api/brands/${brandId}/products`, payload);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Продукт створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "products"] });
      queryClient.refetchQueries({ queryKey: ["/api/brands", brandId, "products"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!product) return;
      const payload = {
        name: formData.name,
        shortDescription: formData.shortDescription || null,
        fullDescription: formData.fullDescription || null,
        category: formData.category || null,
        subcategory: formData.subcategory || null,
        price: formData.price || null,
        currency: formData.currency,
        priceType: formData.priceType,
        sku: formData.sku || null,
        status: formData.status,
        features: formData.features,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience || null,
        useCases: formData.useCases,
        keywords: formData.keywords,
        specifications: formData.specifications,
        isHighlighted: formData.isHighlighted,
      };
      const response = await apiRequest("PATCH", `/api/products/${product.id}`, payload);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update product");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Продукт оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "products"] });
      queryClient.refetchQueries({ queryKey: ["/api/brands", brandId, "products"] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Помилка", description: "Назва продукту обов'язкова", variant: "destructive" });
      return;
    }
    if (product) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  const addArrayItem = (field: 'features' | 'benefits' | 'useCases' | 'keywords', value: string, setter: (v: string) => void) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      setter("");
    }
  };

  const removeArrayItem = (field: 'features' | 'benefits' | 'useCases' | 'keywords', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const addSpecification = () => {
    if (newSpecKey.trim() && newSpecValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: { ...prev.specifications, [newSpecKey.trim()]: newSpecValue.trim() }
      }));
      setNewSpecKey("");
      setNewSpecValue("");
    }
  };

  const removeSpecification = (key: string) => {
    setFormData(prev => {
      const { [key]: _, ...rest } = prev.specifications;
      return { ...prev, specifications: rest };
    });
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? "Редагування продукту" : "Новий продукт"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!product && (
            <div className="p-4 rounded-lg bg-muted/50 border space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-генерація даних продукту
              </div>
              <Textarea
                placeholder="Опишіть ваш продукт... Наприклад: 'Курс з особистого брендингу для підприємців, 8 модулів, онлайн формат, з домашніми завданнями та зворотнім зв'язком'"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                rows={3}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending || aiDescription.length < 5}
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Генерація...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Згенерувати
                  </>
                )}
              </Button>
            </div>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Основне</TabsTrigger>
              <TabsTrigger value="details">Деталі</TabsTrigger>
              <TabsTrigger value="marketing">Маркетинг</TabsTrigger>
              <TabsTrigger value="specs">Характеристики</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Назва продукту *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Назва продукту"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Короткий опис</Label>
                  <Textarea
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="1-2 речення для превʼю"
                    rows={2}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Повний опис</Label>
                  <Textarea
                    value={formData.fullDescription}
                    onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                    placeholder="Детальний опис продукту"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Категорія</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Напр: Курси"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Підкатегорія</Label>
                  <Input
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Напр: Онлайн"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Ціна
                  </Label>
                  <Input
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Напр: 5000"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Валюта</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UAH">UAH (грн)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Тип ціни</Label>
                  <Select value={formData.priceType} onValueChange={(v) => setFormData({ ...formData, priceType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Фіксована</SelectItem>
                      <SelectItem value="range">Діапазон</SelectItem>
                      <SelectItem value="from">Від</SelectItem>
                      <SelectItem value="negotiable">Договірна</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Артикул (SKU)</Label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Унікальний код"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Чернетка</SelectItem>
                      <SelectItem value="active">Активний</SelectItem>
                      <SelectItem value="archived">Архів</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="highlighted"
                    checked={formData.isHighlighted}
                    onChange={(e) => setFormData({ ...formData, isHighlighted: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="highlighted" className="cursor-pointer">Виділений продукт</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Цільова аудиторія
                </Label>
                <Textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  placeholder="Для кого цей продукт"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Особливості</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Додати особливість"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem("features", newFeature, setNewFeature))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addArrayItem("features", newFeature, setNewFeature)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {f}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("features", i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Переваги</Label>
                <div className="flex gap-2">
                  <Input
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    placeholder="Додати перевагу"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem("benefits", newBenefit, setNewBenefit))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addArrayItem("benefits", newBenefit, setNewBenefit)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((b, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {b}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("benefits", i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Сценарії використання</Label>
                <div className="flex gap-2">
                  <Input
                    value={newUseCase}
                    onChange={(e) => setNewUseCase(e.target.value)}
                    placeholder="Додати сценарій"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem("useCases", newUseCase, setNewUseCase))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addArrayItem("useCases", newUseCase, setNewUseCase)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.useCases.map((u, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {u}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("useCases", i)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Ключові слова
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="Додати ключове слово"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem("keywords", newKeyword, setNewKeyword))}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={() => addArrayItem("keywords", newKeyword, setNewKeyword)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keywords.map((k, i) => (
                    <Badge key={i} variant="outline" className="gap-1">
                      {k}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("keywords", i)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Характеристики</Label>
                <div className="flex gap-2">
                  <Input
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    placeholder="Параметр"
                    className="flex-1"
                  />
                  <Input
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    placeholder="Значення"
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSpecification())}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addSpecification}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <div>
                        <span className="font-medium">{key}:</span> {value}
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeSpecification(key)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Збереження...
                </>
              ) : (
                product ? "Оновити" : "Створити"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
