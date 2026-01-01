import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Save, Loader2, Building2, Palette, Type, Target, 
  Users, Sparkles, ImagePlus, X, FileText, Megaphone, Eye, Heart, Zap
} from "lucide-react";
import { Link } from "wouter";
import type { UserBrand } from "@shared/schema";
import { BrandColorPicker, type BrandColor } from "@/components/brands/BrandColorPicker";

interface BrandTypography {
  headingFont?: string;
  bodyFont?: string;
  accentFont?: string;
}

interface BrandVoiceTone {
  personality?: string[];
  tone?: string;
  style?: string;
}

export default function BrandEditPage() {
  const params = useParams<{ brandId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tagline: "",
    mission: "",
    vision: "",
    targetAudience: "",
    uniqueValue: "",
  });
  const [values, setValues] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");
  const [brandColors, setBrandColors] = useState<BrandColor[]>([]);
  const [typography, setTypography] = useState<BrandTypography>({});
  const [voiceTone, setVoiceTone] = useState<BrandVoiceTone>({});
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);

  const { data: brand, isLoading } = useQuery<UserBrand>({
    queryKey: ["/api/user/brands", params.brandId],
    queryFn: async () => {
      const response = await fetch(`/api/user/brands/${params.brandId}`);
      if (!response.ok) throw new Error("Failed to fetch brand");
      return response.json();
    },
    enabled: !!params.brandId,
  });

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        description: brand.description || "",
        tagline: (brand as any).tagline || "",
        mission: (brand as any).mission || "",
        vision: (brand as any).vision || "",
        targetAudience: (brand as any).targetAudience || "",
        uniqueValue: (brand as any).uniqueValue || "",
      });
      setValues((brand as any).values || []);
      setBrandColors((brand as any).brandColors || []);
      setTypography((brand as any).typography || {});
      setVoiceTone((brand as any).voiceTone || {});
      setCompetitors((brand as any).competitors || []);
      setLogoPreview(brand.logo || null);
    }
  }, [brand]);

  const updateBrandMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/user/brands/${params.brandId}`, data);
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Бренд оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands", params.brandId] });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (logo: string | null) => {
      const response = await apiRequest("PATCH", `/api/user/brands/${params.brandId}/logo`, { logo: logo || '' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands", params.brandId] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Помилка", description: "Підтримуються тільки PNG, JPG та SVG формати", variant: "destructive" });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Помилка", description: "Розмір файлу не повинен перевищувати 2MB", variant: "destructive" });
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
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addValue = () => {
    if (newValue.trim() && !values.includes(newValue.trim())) {
      setValues([...values, newValue.trim()]);
      setNewValue("");
    }
  };

  const removeValue = (index: number) => {
    setValues(values.filter((_, i) => i !== index));
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      await updateBrandMutation.mutateAsync({
        ...formData,
        values,
        brandColors,
        typography,
        voiceTone,
        competitors,
      });

      if (logoChanged) {
        await uploadLogoMutation.mutateAsync(logoPreview);
        setLogoChanged(false);
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Бренд не знайдено</p>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            На головну
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = updateBrandMutation.isPending || uploadLogoMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{formData.name || "Редагування бренду"}</h1>
              <p className="text-sm text-muted-foreground">Паспорт бренду</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isPending} data-testid="button-save-brand">
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Збереження...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Зберегти
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">
              <Building2 className="h-4 w-4 mr-1 hidden sm:inline" />
              Основне
            </TabsTrigger>
            <TabsTrigger value="identity" className="text-xs sm:text-sm">
              <Palette className="h-4 w-4 mr-1 hidden sm:inline" />
              Ідентичність
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs sm:text-sm">
              <Target className="h-4 w-4 mr-1 hidden sm:inline" />
              Стратегія
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs sm:text-sm">
              <Megaphone className="h-4 w-4 mr-1 hidden sm:inline" />
              Голос
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Основна інформація
                </CardTitle>
                <CardDescription>Базові дані про ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className="space-y-2">
                    <Label>Логотип</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative">
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="w-24 h-24 object-contain rounded-xl border bg-white"
                            data-testid="img-brand-logo"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90"
                            data-testid="button-remove-logo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center hover:border-primary/50 transition-colors"
                          data-testid="button-upload-logo"
                        >
                          <ImagePlus className="w-6 h-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Завантажити</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Назва бренду *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Назва вашого бренду"
                        data-testid="input-brand-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Слоган</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Короткий запам'ятовується слоган"
                        data-testid="input-brand-tagline"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Опис бренду</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Детальний опис вашого бренду"
                    rows={3}
                    data-testid="textarea-brand-description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Цінності бренду
                </CardTitle>
                <CardDescription>Ключові цінності, які визначають ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {values.map((value, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                      {value}
                      <button
                        type="button"
                        onClick={() => removeValue(index)}
                        className="ml-2 hover:text-destructive"
                        data-testid={`button-remove-value-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                    placeholder="Додати цінність..."
                    data-testid="input-new-value"
                  />
                  <Button type="button" variant="outline" onClick={addValue} data-testid="button-add-value">
                    Додати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Кольорова палітра
                </CardTitle>
                <CardDescription>Визначте кольори вашого бренду</CardDescription>
              </CardHeader>
              <CardContent>
                <BrandColorPicker
                  colors={brandColors}
                  onChange={setBrandColors}
                  logoImage={logoPreview}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Типографіка
                </CardTitle>
                <CardDescription>Шрифти для різних елементів бренду</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Заголовки</Label>
                    <Input
                      value={typography.headingFont || ""}
                      onChange={(e) => setTypography({ ...typography, headingFont: e.target.value })}
                      placeholder="Наприклад: Montserrat"
                      data-testid="input-heading-font"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Основний текст</Label>
                    <Input
                      value={typography.bodyFont || ""}
                      onChange={(e) => setTypography({ ...typography, bodyFont: e.target.value })}
                      placeholder="Наприклад: Inter"
                      data-testid="input-body-font"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Акцентний</Label>
                    <Input
                      value={typography.accentFont || ""}
                      onChange={(e) => setTypography({ ...typography, accentFont: e.target.value })}
                      placeholder="Наприклад: Playfair Display"
                      data-testid="input-accent-font"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Місія та Візія
                </CardTitle>
                <CardDescription>Фундаментальні цілі вашого бренду</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mission">Місія</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    placeholder="Чому існує ваш бренд? Яку проблему ви вирішуєте?"
                    rows={3}
                    data-testid="textarea-brand-mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision">Візія</Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    placeholder="Яким ви бачите майбутнє вашого бренду?"
                    rows={3}
                    data-testid="textarea-brand-vision"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Цільова аудиторія
                </CardTitle>
                <CardDescription>Для кого створено ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Опис цільової аудиторії</Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="Хто ваші ідеальні клієнти? Їх вік, інтереси, потреби..."
                    rows={3}
                    data-testid="textarea-target-audience"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Унікальна ціннісна пропозиція
                </CardTitle>
                <CardDescription>Що робить вас особливими</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uniqueValue">УЦП</Label>
                  <Textarea
                    id="uniqueValue"
                    value={formData.uniqueValue}
                    onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
                    placeholder="Чим ваш бренд відрізняється від конкурентів? Яку унікальну цінність ви пропонуєте?"
                    rows={3}
                    data-testid="textarea-unique-value"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Конкуренти
                </CardTitle>
                <CardDescription>Основні конкуренти на ринку</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {competitors.map((competitor, index) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {competitor}
                      <button
                        type="button"
                        onClick={() => removeCompetitor(index)}
                        className="ml-2 hover:text-destructive"
                        data-testid={`button-remove-competitor-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                    placeholder="Додати конкурента..."
                    data-testid="input-new-competitor"
                  />
                  <Button type="button" variant="outline" onClick={addCompetitor} data-testid="button-add-competitor">
                    Додати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Голос та тон бренду
                </CardTitle>
                <CardDescription>Як ваш бренд спілкується з аудиторією</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Характеристики особистості</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(voiceTone.personality || []).map((trait, index) => (
                      <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                        {trait}
                        <button
                          type="button"
                          onClick={() => setVoiceTone({
                            ...voiceTone,
                            personality: (voiceTone.personality || []).filter((_, i) => i !== index)
                          })}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['Дружній', 'Професійний', 'Інноваційний', 'Надійний', 'Енергійний', 'Спокійний', 'Експертний', 'Грайливий'].map((trait) => (
                      <Button
                        key={trait}
                        type="button"
                        variant={(voiceTone.personality || []).includes(trait) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = voiceTone.personality || [];
                          if (current.includes(trait)) {
                            setVoiceTone({ ...voiceTone, personality: current.filter(t => t !== trait) });
                          } else {
                            setVoiceTone({ ...voiceTone, personality: [...current, trait] });
                          }
                        }}
                      >
                        {trait}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="tone">Тон комунікації</Label>
                  <Input
                    id="tone"
                    value={voiceTone.tone || ""}
                    onChange={(e) => setVoiceTone({ ...voiceTone, tone: e.target.value })}
                    placeholder="Наприклад: Теплий та підтримуючий"
                    data-testid="input-voice-tone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Стиль написання</Label>
                  <Textarea
                    id="style"
                    value={voiceTone.style || ""}
                    onChange={(e) => setVoiceTone({ ...voiceTone, style: e.target.value })}
                    placeholder="Опишіть як має виглядати текст бренду: формальність, довжина речень, використання емодзі тощо"
                    rows={3}
                    data-testid="textarea-voice-style"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
