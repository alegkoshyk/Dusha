import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Save, 
  Plus, 
  Loader2, 
  Heart, 
  Brain, 
  Dumbbell,
  FileText,
  Search,
  Target,
  Sparkles,
  RefreshCw
} from "lucide-react";
import type { BrandAnalysisSetting } from "@shared/schema";

const CATEGORIES = [
  { id: "general", label: "Загальні", icon: Settings },
  { id: "prompts", label: "Промпти", icon: FileText },
  { id: "soul", label: "Душа", icon: Heart },
  { id: "mind", label: "Розум", icon: Brain },
  { id: "body", label: "Тіло", icon: Dumbbell },
  { id: "criteria", label: "Критерії", icon: Target },
  { id: "format", label: "Формат", icon: Sparkles },
];

const DEFAULT_SETTINGS = [
  {
    key: "system_prompt",
    value: "Ти експерт з брендингу та маркетингу з багаторічним досвідом. Ти аналізуєш бренди за методологією \"Душа Бренду\", яка включає три виміри: Душа (чому бренд існує), Розум (що і як комунікує), Тіло (як виглядає).",
    description: "Системний промпт для AI",
    category: "prompts",
  },
  {
    key: "analysis_context",
    value: "Аналізуй бренд об'єктивно, звертаючи увагу на:\n- Чіткість місії та цінностей\n- Узгодженість повідомлень\n- Візуальну ідентичність\n- Баланс між трьома компонентами",
    description: "Контекст для аналізу",
    category: "prompts",
  },
  {
    key: "soul_criteria",
    value: "Місія, призначення, цінності, історія бренду, глибинний сенс існування",
    description: "Критерії оцінки Душі",
    category: "soul",
  },
  {
    key: "mind_criteria",
    value: "Позиціонування, цільова аудиторія, стиль комунікації, ключові повідомлення",
    description: "Критерії оцінки Розуму",
    category: "mind",
  },
  {
    key: "body_criteria",
    value: "Візуальний стиль, кольорова палітра, типографіка, загальне враження",
    description: "Критерії оцінки Тіла",
    category: "body",
  },
  {
    key: "scoring_scale",
    value: "0-30: Слабо, 31-50: Задовільно, 51-70: Добре, 71-85: Дуже добре, 86-100: Відмінно",
    description: "Шкала оцінювання",
    category: "criteria",
  },
  {
    key: "balance_weight",
    value: "Баланс = рівномірність розвитку всіх трьох компонентів. Ідеальний бренд має гармонійно розвинені Душу, Розум і Тіло.",
    description: "Вага балансу компонентів",
    category: "criteria",
  },
  {
    key: "output_language",
    value: "ukrainian",
    description: "Мова результатів аналізу",
    category: "format",
  },
  {
    key: "include_recommendations",
    value: "true",
    description: "Включати рекомендації в результати",
    category: "format",
  },
  {
    key: "max_strengths",
    value: "5",
    description: "Максимальна кількість сильних сторін",
    category: "format",
  },
  {
    key: "max_weaknesses",
    value: "5",
    description: "Максимальна кількість слабких сторін",
    category: "format",
  },
];

function SettingCard({ 
  setting, 
  onSave 
}: { 
  setting: BrandAnalysisSetting; 
  onSave: (key: string, value: string) => void;
}) {
  const [value, setValue] = useState(setting.value || "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    onSave(setting.key, value);
    setIsEditing(false);
  };

  const isLongText = (setting.value?.length || 0) > 100;

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{setting.key}</CardTitle>
            {setting.description && (
              <CardDescription className="text-xs mt-1">
                {setting.description}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {setting.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-2">
            {isLongText ? (
              <Textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={4}
                className="font-mono text-sm"
              />
            ) : (
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="font-mono text-sm"
              />
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-3 w-3 mr-1" /> Зберегти
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Скасувати
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="p-2 bg-muted/50 rounded text-sm font-mono cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {setting.value || <span className="text-muted-foreground italic">Не задано</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function BrandAnalysisSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("prompts");
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "", category: "general" });
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: settings = [], isLoading, refetch } = useQuery<BrandAnalysisSetting[]>({
    queryKey: ['/api/admin/brand-analysis-settings'],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await apiRequest('PUT', `/api/admin/brand-analysis-settings/${key}`, { value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-settings'] });
      toast({ title: "Збережено", description: "Налаштування оновлено" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSetting) => {
      const res = await apiRequest('POST', '/api/admin/brand-analysis-settings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-settings'] });
      setNewSetting({ key: "", value: "", description: "", category: "general" });
      setShowAddForm(false);
      toast({ title: "Створено", description: "Нове налаштування додано" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const seedDefaultsMutation = useMutation({
    mutationFn: async () => {
      for (const setting of DEFAULT_SETTINGS) {
        const exists = settings.find(s => s.key === setting.key);
        if (!exists) {
          await apiRequest('POST', '/api/admin/brand-analysis-settings', setting);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-settings'] });
      toast({ title: "Готово", description: "Типові налаштування додано" });
    },
  });

  const handleSave = (key: string, value: string) => {
    updateMutation.mutate({ key, value });
  };

  const filteredSettings = settings.filter(s => s.category === activeCategory);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              Налаштування аналізу брендів
            </h1>
            <p className="text-muted-foreground mt-1">
              Налаштуйте критерії, промпти та формат результатів аналізу
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Оновити
            </Button>
            <Button variant="outline" onClick={() => seedDefaultsMutation.mutate()}>
              <Settings className="h-4 w-4 mr-2" /> Типові налаштування
            </Button>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" /> Додати
            </Button>
          </div>
        </div>

        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Нове налаштування</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ключ</Label>
                  <Input
                    value={newSetting.key}
                    onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value })}
                    placeholder="my_setting_key"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Категорія</Label>
                  <select
                    value={newSetting.category}
                    onChange={(e) => setNewSetting({ ...newSetting, category: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Опис</Label>
                <Input
                  value={newSetting.description}
                  onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
                  placeholder="Опис налаштування"
                />
              </div>
              <div className="space-y-2">
                <Label>Значення</Label>
                <Textarea
                  value={newSetting.value}
                  onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
                  placeholder="Значення налаштування"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => createMutation.mutate(newSetting)} disabled={!newSetting.key || !newSetting.value}>
                  <Plus className="h-4 w-4 mr-2" /> Створити
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Скасувати
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="grid grid-cols-7 w-full">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const count = settings.filter(s => s.category === cat.id).length;
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {CATEGORIES.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredSettings.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <cat.icon className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Немає налаштувань у цій категорії</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => {
                        setNewSetting({ ...newSetting, category: cat.id });
                        setShowAddForm(true);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Додати перше налаштування
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {filteredSettings.map(setting => (
                    <SettingCard 
                      key={setting.id} 
                      setting={setting} 
                      onSave={handleSave}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
