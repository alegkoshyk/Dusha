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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Save, Loader2, Building2, Palette, Type, Target, 
  Users, Sparkles, ImagePlus, X, FileText, Megaphone, Eye, Heart, Zap,
  Plus, Trash2, User, Quote
} from "lucide-react";
import { Link } from "wouter";
import type { UserBrand, TargetAudience } from "@shared/schema";
import { BrandColorPicker, type BrandColor } from "@/components/brands/BrandColorPicker";

interface GeneratedPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  income: string;
  education: string;
  familyStatus: string;
  lifestyle: string;
  values: string[];
  interests: string[];
  painPoints: string[];
  goals: string[];
  motivations: string[];
  fears: string[];
  buyingBehavior: string;
  mediaConsumption: string[];
  decisionFactors: string[];
  quote: string;
  dayInLife: string;
  brandRelationship: string;
}

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
  const [isAudienceDialogOpen, setIsAudienceDialogOpen] = useState(false);
  const [audienceType, setAudienceType] = useState<"primary" | "secondary" | "niche">("primary");
  const [newAudienceName, setNewAudienceName] = useState("");
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(null);

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

  const { data: audiences = [], isLoading: audiencesLoading } = useQuery<TargetAudience[]>({
    queryKey: ["/api/brands", params.brandId, "target-audiences"],
    queryFn: async () => {
      const response = await fetch(`/api/brands/${params.brandId}/target-audiences`);
      if (!response.ok) throw new Error("Failed to fetch audiences");
      return response.json();
    },
    enabled: !!params.brandId,
  });

  const generatePersonaMutation = useMutation({
    mutationFn: async (type: "primary" | "secondary" | "niche") => {
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/generate-persona`, { audienceType: type });
      if (!response.ok) throw new Error("Failed to generate persona");
      return response.json() as Promise<GeneratedPersona>;
    },
    onSuccess: (persona) => {
      setNewAudienceName(persona.name);
      toast({ title: "Персона згенерована", description: `Портрет "${persona.name}" створено` });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати персону", variant: "destructive" });
    },
  });

  const createAudienceMutation = useMutation({
    mutationFn: async (data: Partial<TargetAudience>) => {
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/target-audiences`, data);
      if (!response.ok) throw new Error("Failed to create audience");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Цільову аудиторію створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      setIsAudienceDialogOpen(false);
      setNewAudienceName("");
      generatePersonaMutation.reset();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити аудиторію", variant: "destructive" });
    },
  });

  const deleteAudienceMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/target-audiences/${id}`);
      if (!response.ok) throw new Error("Failed to delete audience");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Цільову аудиторію видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      setSelectedAudience(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити аудиторію", variant: "destructive" });
    },
  });

  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);
  
  const generateAvatarMutation = useMutation({
    mutationFn: async (audienceId: string) => {
      setGeneratingAvatarId(audienceId);
      const response = await apiRequest("POST", `/api/target-audiences/${audienceId}/generate-avatar`);
      if (!response.ok) throw new Error("Failed to generate avatar");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Аватар згенеровано" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      setGeneratingAvatarId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати аватар", variant: "destructive" });
      setGeneratingAvatarId(null);
    },
  });

  const handleGeneratePersona = () => {
    generatePersonaMutation.mutate(audienceType);
  };

  const handleCreateFromPersona = () => {
    const persona = generatePersonaMutation.data;
    if (!persona) return;

    createAudienceMutation.mutate({
      brandId: params.brandId!,
      name: persona.name,
      description: `${persona.occupation}, ${persona.age} років`,
      isPrimary: audienceType === "primary",
      ageRange: `${persona.age - 5}-${persona.age + 5}`,
      gender: persona.gender,
      location: persona.location,
      income: persona.income,
      education: persona.education,
      occupation: persona.occupation,
      values: persona.values,
      interests: persona.interests,
      painPoints: persona.painPoints,
      goals: persona.goals,
      motivations: persona.motivations,
      fears: persona.fears,
      buyingBehavior: persona.buyingBehavior,
      mediaConsumption: persona.mediaConsumption,
      decisionFactors: persona.decisionFactors,
      aiPortrait: `${persona.lifestyle}\n\n${persona.dayInLife}\n\n${persona.brandRelationship}`,
    });
  };

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
      <div className="container max-w-4xl mx-auto py-6 px-4">
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
          <TabsList className="grid w-full grid-cols-5 lg:grid-cols-5">
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
            <TabsTrigger value="audience" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 hidden sm:inline" />
              Аудиторія
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs sm:text-sm">
              <Megaphone className="h-4 w-4 mr-1 hidden sm:inline" />
              Голос
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Основна інформація
                </CardTitle>
                <CardDescription>Базові дані про ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="space-y-2 flex-shrink-0">
                    <Label className="text-sm font-medium">Логотип</Label>
                    <div className="flex items-center gap-4">
                      {logoPreview ? (
                        <div className="relative group">
                          <img 
                            src={logoPreview} 
                            alt="Logo" 
                            className="w-20 h-20 object-contain rounded-lg border-2 border-border bg-white dark:bg-gray-800 p-2"
                            data-testid="img-brand-logo"
                          />
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 shadow-sm"
                            data-testid="button-remove-logo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-20 h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center hover:border-primary/50 hover:bg-muted/50 transition-all"
                          data-testid="button-upload-logo"
                        >
                          <ImagePlus className="w-5 h-5 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Додати</span>
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

                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Назва бренду *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Назва вашого бренду"
                        className="h-10"
                        data-testid="input-brand-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline" className="text-sm font-medium">Слоган</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="Короткий запам'ятовується слоган"
                        className="h-10"
                        data-testid="input-brand-tagline"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-2" />

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Опис бренду</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Детальний опис вашого бренду, його місії та цільової аудиторії..."
                    rows={4}
                    className="resize-none"
                    data-testid="textarea-brand-description"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Цінності бренду
                </CardTitle>
                <CardDescription>Ключові цінності, які визначають ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {values.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                    {values.map((value, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-sm py-1.5 px-3 bg-background border border-border hover:bg-muted transition-colors"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => removeValue(index)}
                          className="ml-2 hover:text-destructive transition-colors"
                          data-testid={`button-remove-value-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValue())}
                    placeholder="Додати цінність..."
                    className="h-10"
                    data-testid="input-new-value"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addValue}
                    className="h-10 px-4"
                    data-testid="button-add-value"
                  >
                    Додати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="identity" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Palette className="h-5 w-5 text-violet-500" />
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

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="h-5 w-5 text-blue-500" />
                  Типографіка
                </CardTitle>
                <CardDescription>Шрифти для різних елементів бренду</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Заголовки</Label>
                    <Input
                      value={typography.headingFont || ""}
                      onChange={(e) => setTypography({ ...typography, headingFont: e.target.value })}
                      placeholder="Наприклад: Montserrat"
                      className="h-10"
                      data-testid="input-heading-font"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Основний текст</Label>
                    <Input
                      value={typography.bodyFont || ""}
                      onChange={(e) => setTypography({ ...typography, bodyFont: e.target.value })}
                      placeholder="Наприклад: Inter"
                      className="h-10"
                      data-testid="input-body-font"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Акцентний</Label>
                    <Input
                      value={typography.accentFont || ""}
                      onChange={(e) => setTypography({ ...typography, accentFont: e.target.value })}
                      placeholder="Наприклад: Playfair Display"
                      className="h-10"
                      data-testid="input-accent-font"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-emerald-500" />
                  Місія та Візія
                </CardTitle>
                <CardDescription>Фундаментальні цілі вашого бренду</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="mission" className="text-sm font-medium">Місія</Label>
                  <Textarea
                    id="mission"
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    placeholder="Чому існує ваш бренд? Яку проблему ви вирішуєте?"
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-brand-mission"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vision" className="text-sm font-medium">Візія</Label>
                  <Textarea
                    id="vision"
                    value={formData.vision}
                    onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                    placeholder="Яким ви бачите майбутнє вашого бренду?"
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-brand-vision"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-amber-500" />
                  Цільова аудиторія
                </CardTitle>
                <CardDescription>Для кого створено ваш бренд</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetAudience" className="text-sm font-medium">Опис цільової аудиторії</Label>
                  <Textarea
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="Хто ваші ідеальні клієнти? Їх вік, інтереси, потреби..."
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-target-audience"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Унікальна ціннісна пропозиція
                </CardTitle>
                <CardDescription>Що робить вас особливими</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uniqueValue" className="text-sm font-medium">УЦП</Label>
                  <Textarea
                    id="uniqueValue"
                    value={formData.uniqueValue}
                    onChange={(e) => setFormData({ ...formData, uniqueValue: e.target.value })}
                    placeholder="Чим ваш бренд відрізняється від конкурентів? Яку унікальну цінність ви пропонуєте?"
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-unique-value"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-red-500" />
                  Конкуренти
                </CardTitle>
                <CardDescription>Основні конкуренти на ринку</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                    {competitors.map((competitor, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-sm py-1.5 px-3 bg-background border-border hover:bg-muted transition-colors"
                      >
                        {competitor}
                        <button
                          type="button"
                          onClick={() => removeCompetitor(index)}
                          className="ml-2 hover:text-destructive transition-colors"
                          data-testid={`button-remove-competitor-${index}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={newCompetitor}
                    onChange={(e) => setNewCompetitor(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetitor())}
                    placeholder="Додати конкурента..."
                    className="h-10"
                    data-testid="input-new-competitor"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addCompetitor}
                    className="h-10 px-4"
                    data-testid="button-add-competitor"
                  >
                    Додати
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audience" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5 text-blue-500" />
                      Цільова аудиторія
                    </CardTitle>
                    <CardDescription>Ваші ідеальні клієнти та їх портрети</CardDescription>
                  </div>
                  <Dialog open={isAudienceDialogOpen} onOpenChange={setIsAudienceDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Додати ЦА
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Створити цільову аудиторію</DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        <div className="space-y-2">
                          <Label>Тип аудиторії</Label>
                          <Select value={audienceType} onValueChange={(v) => setAudienceType(v as "primary" | "secondary" | "niche")}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">Основна (Primary)</SelectItem>
                              <SelectItem value="secondary">Вторинна (Secondary)</SelectItem>
                              <SelectItem value="niche">Нішева (Niche)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-primary" />
                              <span className="font-medium">AI-генерація персони</span>
                            </div>
                            <Button 
                              onClick={handleGeneratePersona} 
                              disabled={generatePersonaMutation.isPending}
                              size="sm"
                            >
                              {generatePersonaMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Генерація...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Згенерувати
                                </>
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            AI проаналізує ваш бренд та створить детальний портрет ідеального клієнта
                          </p>
                        </div>

                        {generatePersonaMutation.data && (
                          <PersonaPreviewCard persona={generatePersonaMutation.data} />
                        )}

                        <Separator />

                        <div className="space-y-2">
                          <Label>Ім'я персони</Label>
                          <Input 
                            value={newAudienceName}
                            onChange={(e) => setNewAudienceName(e.target.value)}
                            placeholder="Введіть ім'я або згенеруйте AI"
                          />
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" onClick={() => setIsAudienceDialogOpen(false)}>
                            Скасувати
                          </Button>
                          <Button 
                            onClick={handleCreateFromPersona}
                            disabled={!generatePersonaMutation.data || createAudienceMutation.isPending}
                          >
                            {createAudienceMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            Зберегти
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="targetAudienceDesc" className="text-sm font-medium">Загальний опис</Label>
                  <Textarea
                    id="targetAudienceDesc"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="Хто ваші ідеальні клієнти? Їх демографія, інтереси, потреби..."
                    rows={3}
                    className="resize-none"
                    data-testid="textarea-target-audience"
                  />
                </div>
                
                <Separator />
                
                {audiencesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : audiences.length === 0 ? (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground mb-3">Ще немає персон цільової аудиторії</p>
                    <Button variant="outline" size="sm" onClick={() => setIsAudienceDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Створити першу персону
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {audiences.map((audience) => (
                      <AudienceCardInline 
                        key={audience.id} 
                        audience={audience}
                        onSelect={() => setSelectedAudience(audience)}
                        onDelete={() => deleteAudienceMutation.mutate(audience.id)}
                        onGenerateAvatar={() => generateAvatarMutation.mutate(audience.id)}
                        isGeneratingAvatar={generatingAvatarId === audience.id}
                      />
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/target-audience/${params.brandId}`}>
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-2" />
                      Детальний інструмент ЦА
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {selectedAudience && (
              <Dialog open={!!selectedAudience} onOpenChange={() => setSelectedAudience(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedAudience.name}
                    </DialogTitle>
                  </DialogHeader>
                  <AudienceDetailsCard 
                    audience={selectedAudience} 
                    onRefresh={() => queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] })}
                  />
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          <TabsContent value="voice" className="space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Megaphone className="h-5 w-5 text-orange-500" />
                  Голос та тон бренду
                </CardTitle>
                <CardDescription>Як ваш бренд спілкується з аудиторією</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Характеристики особистості</Label>
                  {(voiceTone.personality || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
                      {(voiceTone.personality || []).map((trait, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="text-sm py-1.5 px-3 bg-primary/10 border border-primary/20 text-primary"
                        >
                          {trait}
                          <button
                            type="button"
                            onClick={() => setVoiceTone({
                              ...voiceTone,
                              personality: (voiceTone.personality || []).filter((_, i) => i !== index)
                            })}
                            className="ml-2 hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {['Дружній', 'Професійний', 'Інноваційний', 'Надійний', 'Енергійний', 'Спокійний', 'Експертний', 'Грайливий'].map((trait) => (
                      <Button
                        key={trait}
                        type="button"
                        variant={(voiceTone.personality || []).includes(trait) ? "default" : "outline"}
                        size="sm"
                        className="h-8"
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
                  <Label htmlFor="tone" className="text-sm font-medium">Тон комунікації</Label>
                  <Input
                    id="tone"
                    value={voiceTone.tone || ""}
                    onChange={(e) => setVoiceTone({ ...voiceTone, tone: e.target.value })}
                    placeholder="Наприклад: Теплий та підтримуючий"
                    className="h-10"
                    data-testid="input-voice-tone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style" className="text-sm font-medium">Стиль написання</Label>
                  <Textarea
                    id="style"
                    value={voiceTone.style || ""}
                    onChange={(e) => setVoiceTone({ ...voiceTone, style: e.target.value })}
                    placeholder="Опишіть як має виглядати текст бренду: формальність, довжина речень, використання емодзі тощо"
                    rows={3}
                    className="resize-none"
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

function PersonaPreviewCard({ persona }: { persona: GeneratedPersona }) {
  return (
    <div className="border rounded-lg p-4 space-y-4 bg-background">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <User className="h-8 w-8 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{persona.name}</h3>
          <p className="text-muted-foreground">{persona.occupation}, {persona.age} років</p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant="outline">{persona.gender}</Badge>
            <Badge variant="outline">{persona.location}</Badge>
            <Badge variant="outline">{persona.familyStatus}</Badge>
          </div>
        </div>
      </div>

      <div className="p-3 bg-muted/50 rounded-lg italic text-sm">
        <Quote className="h-4 w-4 inline mr-2 text-muted-foreground" />
        "{persona.quote}"
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center gap-2 font-medium mb-1">
            <Heart className="h-4 w-4 text-red-500" />
            Цінності
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.values.slice(0, 3).map((v, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 font-medium mb-1">
            <Target className="h-4 w-4 text-green-500" />
            Цілі
          </div>
          <div className="flex flex-wrap gap-1">
            {persona.goals.slice(0, 2).map((g, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{g}</Badge>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{persona.lifestyle}</p>
    </div>
  );
}

function AudienceCardInline({ 
  audience, 
  onSelect, 
  onDelete,
  onGenerateAvatar,
  isGeneratingAvatar
}: { 
  audience: TargetAudience; 
  onSelect: () => void;
  onDelete: () => void;
  onGenerateAvatar: () => void;
  isGeneratingAvatar: boolean;
}) {
  const values = (audience.values || []) as string[];
  
  return (
    <div 
      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={onSelect}
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center shrink-0 overflow-hidden relative group">
        {audience.aiPortraitImageUrl ? (
          <img 
            src={audience.aiPortraitImageUrl} 
            alt={audience.name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="h-6 w-6 text-primary" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onGenerateAvatar(); }}
          disabled={isGeneratingAvatar}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {isGeneratingAvatar ? (
            <Loader2 className="h-4 w-4 text-white animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{audience.name}</span>
          <Badge variant="outline" className="text-xs shrink-0">
            {audience.isPrimary ? "Основна" : "Вторинна"}
          </Badge>
        </div>
        {audience.description && (
          <p className="text-sm text-muted-foreground truncate">{audience.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {audience.gender && (
            <Badge variant="secondary" className="text-xs">{audience.gender}</Badge>
          )}
          {audience.ageRange && (
            <Badge variant="secondary" className="text-xs">{audience.ageRange}</Badge>
          )}
          {values.length > 0 && (
            <Badge variant="secondary" className="text-xs">+{values.length} цінностей</Badge>
          )}
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 shrink-0"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
      </Button>
    </div>
  );
}

function AudienceDetailsCard({ audience, onRefresh }: { audience: TargetAudience; onRefresh?: () => void }) {
  const { toast } = useToast();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState("using_product");
  
  const values = (audience.values || []) as string[];
  const interests = (audience.interests || []) as string[];
  const painPoints = (audience.painPoints || []) as string[];
  const goals = (audience.goals || []) as string[];
  const motivations = (audience.motivations || []) as string[];
  const fears = (audience.fears || []) as string[];
  const mediaConsumption = (audience.mediaConsumption || []) as string[];
  const decisionFactors = (audience.decisionFactors || []) as string[];
  const brandInteractionImages = (audience.brandInteractionImages || []) as string[];

  const generateInteractionMutation = useMutation({
    mutationFn: async (scenario: string) => {
      const response = await apiRequest("POST", `/api/target-audiences/${audience.id}/generate-interaction`, { scenario });
      if (!response.ok) throw new Error("Failed to generate image");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Зображення згенеровано" });
      onRefresh?.();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати зображення", variant: "destructive" });
    },
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: async (imageIndex: number) => {
      const response = await apiRequest("DELETE", `/api/target-audiences/${audience.id}/interaction-image/${imageIndex}`);
      if (!response.ok) throw new Error("Failed to delete image");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Зображення видалено" });
      onRefresh?.();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити зображення", variant: "destructive" });
    },
  });

  const scenarios = [
    { value: "using_product", label: "Використовує продукт" },
    { value: "shopping", label: "Покупка/вибір" },
    { value: "recommending", label: "Рекомендує друзям" },
    { value: "social_media", label: "В соцмережах" },
    { value: "event", label: "На заході бренду" },
  ];

  return (
    <div className="space-y-6">
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-2xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд зображення</DialogTitle>
          </DialogHeader>
          {lightboxImage && (
            <img 
              src={lightboxImage} 
              alt="Повнорозмірне зображення" 
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="flex items-start gap-4">
        <button 
          onClick={() => audience.aiPortraitImageUrl && setLightboxImage(audience.aiPortraitImageUrl)}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        >
          {audience.aiPortraitImageUrl ? (
            <img 
              src={audience.aiPortraitImageUrl} 
              alt={audience.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-primary" />
          )}
        </button>
        <div>
          <Badge variant={audience.isPrimary ? "default" : "secondary"}>
            {audience.isPrimary ? "Основна" : "Вторинна"}
          </Badge>
          {audience.description && (
            <p className="text-muted-foreground mt-1">{audience.description}</p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-medium">Демографія</h4>
          <div className="space-y-2 text-sm">
            {audience.ageRange && <p><span className="text-muted-foreground">Вік:</span> {audience.ageRange}</p>}
            {audience.gender && <p><span className="text-muted-foreground">Стать:</span> {audience.gender}</p>}
            {audience.location && <p><span className="text-muted-foreground">Локація:</span> {audience.location}</p>}
            {audience.education && <p><span className="text-muted-foreground">Освіта:</span> {audience.education}</p>}
            {audience.occupation && <p><span className="text-muted-foreground">Професія:</span> {audience.occupation}</p>}
            {audience.income && <p><span className="text-muted-foreground">Дохід:</span> {audience.income}</p>}
          </div>
        </div>
        
        {values.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Цінності
            </h4>
            <div className="flex flex-wrap gap-1">
              {values.map((v, i) => (
                <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {goals.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            Цілі та мотивації
          </h4>
          <div className="flex flex-wrap gap-1">
            {goals.map((g, i) => (
              <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
            ))}
          </div>
        </div>
      )}

      {painPoints.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Болі та проблеми</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            {painPoints.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </div>
      )}

      {audience.aiPortrait && (
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI-портрет
          </h4>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{audience.aiPortrait}</p>
        </div>
      )}

      <Separator />

      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-primary" />
          Взаємодія з брендом
        </h4>
        
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={selectedScenario} onValueChange={setSelectedScenario}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Оберіть сценарій" />
            </SelectTrigger>
            <SelectContent>
              {scenarios.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            size="sm" 
            onClick={() => generateInteractionMutation.mutate(selectedScenario)}
            disabled={generateInteractionMutation.isPending}
          >
            {generateInteractionMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Згенерувати фото
          </Button>
        </div>

        {brandInteractionImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {brandInteractionImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => setLightboxImage(imageUrl)}
                  className="w-full aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                >
                  <img 
                    src={imageUrl} 
                    alt={`Взаємодія ${index + 1}`} 
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  onClick={() => deleteInteractionMutation.mutate(index)}
                  disabled={deleteInteractionMutation.isPending}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Згенеруйте зображення персони у взаємодії з вашим брендом
          </p>
        )}
      </div>
    </div>
  );
}
