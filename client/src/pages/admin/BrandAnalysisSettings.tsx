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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
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
  RefreshCw,
  Upload,
  ArrowRight,
  CheckCircle,
  AlertCircle
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
    key: "analysis_enabled",
    value: "true",
    description: "Чи увімкнено аналіз брендів",
    category: "general",
  },
  {
    key: "analysis_timeout",
    value: "120",
    description: "Максимальний час аналізу в секундах",
    category: "general",
  },
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

interface SyncPreviewData {
  settings: {
    dev: number;
    prod: number;
    diff: {
      toAdd: any[];
      toUpdate: any[];
      unchanged: any[];
    };
  };
  templates: {
    dev: number;
    prod: number;
    diff: {
      toAdd: any[];
      toUpdate: any[];
      unchanged: any[];
    };
  };
}

export default function BrandAnalysisSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState("prompts");
  const [newSetting, setNewSetting] = useState({ key: "", value: "", description: "", category: "general" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncPreview, setSyncPreview] = useState<SyncPreviewData | null>(null);
  const [showConfirmSync, setShowConfirmSync] = useState(false);

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
        await apiRequest('POST', '/api/admin/brand-analysis-settings', setting);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-settings'] });
      toast({ title: "Готово", description: "Усі типові налаштування синхронізовано" });
    },
  });

  const syncPreviewMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('GET', '/api/admin/brand-analysis-sync/preview');
      return res.json();
    },
    onSuccess: (data: SyncPreviewData) => {
      setSyncPreview(data);
      setShowSyncDialog(true);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const syncApplyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/brand-analysis-sync/apply');
      return res.json();
    },
    onSuccess: (data: any) => {
      setShowConfirmSync(false);
      setShowSyncDialog(false);
      setSyncPreview(null);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-settings'] });
      toast({ 
        title: "Синхронізовано!", 
        description: `Синхронізовано ${data.settingsSynced} налаштувань та ${data.templatesSynced} шаблонів` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Помилка синхронізації", description: error.message, variant: "destructive" });
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
            <Button 
              variant="outline" 
              onClick={() => syncPreviewMutation.mutate()}
              disabled={syncPreviewMutation.isPending}
              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400"
            >
              {syncPreviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Синхр. з Production
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

      {/* Sync Preview Dialog */}
      <Dialog open={showSyncDialog} onOpenChange={setShowSyncDialog}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 dark:text-white">
              <Upload className="h-5 w-5" />
              Синхронізація з Production
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Перегляньте зміни перед синхронізацією налаштувань аналізу брендів
            </DialogDescription>
          </DialogHeader>

          {syncPreview && (
            <div className="space-y-6">
              {/* Settings Preview */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                  <Settings className="h-4 w-4" />
                  Налаштування
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="text-2xl font-bold text-blue-600">{syncPreview.settings.dev}</div>
                    <div className="text-muted-foreground dark:text-gray-400">Dev</div>
                  </Card>
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="text-2xl font-bold text-purple-600">{syncPreview.settings.prod}</div>
                    <div className="text-muted-foreground dark:text-gray-400">Production</div>
                  </Card>
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="flex gap-2 text-sm">
                      {syncPreview.settings.diff.toAdd.length > 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          +{syncPreview.settings.diff.toAdd.length} нових
                        </Badge>
                      )}
                      {syncPreview.settings.diff.toUpdate.length > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {syncPreview.settings.diff.toUpdate.length} оновити
                        </Badge>
                      )}
                      {syncPreview.settings.diff.toAdd.length === 0 && syncPreview.settings.diff.toUpdate.length === 0 && (
                        <Badge variant="outline">Без змін</Badge>
                      )}
                    </div>
                  </Card>
                </div>
                {syncPreview.settings.diff.toAdd.length > 0 && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Нові: {syncPreview.settings.diff.toAdd.map((s: any) => s.key).join(', ')}
                  </div>
                )}
                {syncPreview.settings.diff.toUpdate.length > 0 && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Оновити: {syncPreview.settings.diff.toUpdate.map((s: any) => s.key).join(', ')}
                  </div>
                )}
              </div>

              {/* Templates Preview */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 dark:text-white">
                  <FileText className="h-4 w-4" />
                  Шаблони
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="text-2xl font-bold text-blue-600">{syncPreview.templates.dev}</div>
                    <div className="text-muted-foreground dark:text-gray-400">Dev</div>
                  </Card>
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="text-2xl font-bold text-purple-600">{syncPreview.templates.prod}</div>
                    <div className="text-muted-foreground dark:text-gray-400">Production</div>
                  </Card>
                  <Card className="p-3 dark:bg-gray-700 dark:border-gray-600">
                    <div className="flex gap-2 text-sm">
                      {syncPreview.templates.diff.toAdd.length > 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          +{syncPreview.templates.diff.toAdd.length} нових
                        </Badge>
                      )}
                      {syncPreview.templates.diff.toUpdate.length > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          {syncPreview.templates.diff.toUpdate.length} оновити
                        </Badge>
                      )}
                      {syncPreview.templates.diff.toAdd.length === 0 && syncPreview.templates.diff.toUpdate.length === 0 && (
                        <Badge variant="outline">Без змін</Badge>
                      )}
                    </div>
                  </Card>
                </div>
                {syncPreview.templates.diff.toAdd.length > 0 && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Нові: {syncPreview.templates.diff.toAdd.map((t: any) => t.name).join(', ')}
                  </div>
                )}
                {syncPreview.templates.diff.toUpdate.length > 0 && (
                  <div className="text-sm text-muted-foreground dark:text-gray-400">
                    Оновити: {syncPreview.templates.diff.toUpdate.map((t: any) => t.name).join(', ')}
                  </div>
                )}
              </div>

              {/* Summary */}
              <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Буде синхронізовано: {syncPreview.settings.dev} налаштувань та {syncPreview.templates.dev} шаблонів
                  </span>
                </div>
              </Card>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSyncDialog(false)} className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              Скасувати
            </Button>
            <Button 
              onClick={() => setShowConfirmSync(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={syncApplyMutation.isPending}
            >
              {syncApplyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Синхронізувати
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Sync Alert Dialog */}
      <AlertDialog open={showConfirmSync} onOpenChange={setShowConfirmSync}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Підтвердіть синхронізацію</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Ви впевнені, що хочете синхронізувати налаштування та шаблони аналізу брендів з Dev до Production бази даних? 
              Це перезапише існуючі дані в Production.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
              Скасувати
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => syncApplyMutation.mutate()}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={syncApplyMutation.isPending}
            >
              {syncApplyMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Синхронізація...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Так, синхронізувати
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
