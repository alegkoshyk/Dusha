import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  LayoutTemplate, 
  Plus, 
  Loader2, 
  Edit2, 
  Trash2, 
  Star,
  StarOff,
  Check,
  RefreshCw
} from "lucide-react";
import type { BrandAnalysisTemplate } from "@shared/schema";

const DEFAULT_TEMPLATE = {
  name: "",
  description: "",
  systemPrompt: "Ти експерт з брендингу та маркетингу з багаторічним досвідом. Ти аналізуєш бренди за методологією \"Душа Бренду\", яка включає три виміри: Душа (чому бренд існує), Розум (що і як комунікує), Тіло (як виглядає).",
  analysisContext: "Аналізуй бренд об'єктивно, звертаючи увагу на:\n- Чіткість місії та цінностей\n- Узгодженість повідомлень\n- Візуальну ідентичність\n- Баланс між трьома компонентами",
  soulCriteria: "Місія, призначення, цінності, історія бренду, глибинний сенс існування",
  mindCriteria: "Позиціонування, цільова аудиторія, стиль комунікації, ключові повідомлення",
  bodyCriteria: "Візуальний стиль, кольорова палітра, типографіка, загальне враження",
  scoringScale: "0-30: Слабо, 31-50: Задовільно, 51-70: Добре, 71-85: Дуже добре, 86-100: Відмінно",
  balanceWeight: "Баланс = рівномірність розвитку всіх трьох компонентів. Ідеальний бренд має гармонійно розвинені Душу, Розум і Тіло.",
  outputLanguage: "ukrainian",
  includeRecommendations: true,
  maxStrengths: 5,
  maxWeaknesses: 5,
  isActive: true,
  isDefault: false,
};

interface TemplateFormProps {
  template?: BrandAnalysisTemplate;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function TemplateForm({ template, onSubmit, onCancel, isLoading }: TemplateFormProps) {
  const [formData, setFormData] = useState(template ? {
    name: template.name,
    description: template.description || "",
    systemPrompt: template.systemPrompt,
    analysisContext: template.analysisContext || "",
    soulCriteria: template.soulCriteria || "",
    mindCriteria: template.mindCriteria || "",
    bodyCriteria: template.bodyCriteria || "",
    scoringScale: template.scoringScale || "",
    balanceWeight: template.balanceWeight || "",
    outputLanguage: template.outputLanguage || "ukrainian",
    includeRecommendations: template.includeRecommendations ?? true,
    maxStrengths: template.maxStrengths ?? 5,
    maxWeaknesses: template.maxWeaknesses ?? 5,
    isActive: template.isActive ?? true,
    isDefault: template.isDefault ?? false,
  } : DEFAULT_TEMPLATE);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Назва шаблону *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Мій шаблон аналізу"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Мова результатів</Label>
          <select
            value={formData.outputLanguage}
            onChange={(e) => setFormData({ ...formData, outputLanguage: e.target.value })}
            className="w-full h-10 px-3 rounded-md border border-input bg-background"
          >
            <option value="ukrainian">Українська</option>
            <option value="english">English</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Опис</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Короткий опис шаблону"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Системний промпт *</Label>
        <Textarea
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          placeholder="Інструкції для AI..."
          rows={4}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Контекст аналізу</Label>
        <Textarea
          value={formData.analysisContext}
          onChange={(e) => setFormData({ ...formData, analysisContext: e.target.value })}
          placeholder="Додатковий контекст для аналізу..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Критерії Душі</Label>
          <Textarea
            value={formData.soulCriteria}
            onChange={(e) => setFormData({ ...formData, soulCriteria: e.target.value })}
            placeholder="Критерії оцінки Душі..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Критерії Розуму</Label>
          <Textarea
            value={formData.mindCriteria}
            onChange={(e) => setFormData({ ...formData, mindCriteria: e.target.value })}
            placeholder="Критерії оцінки Розуму..."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Критерії Тіла</Label>
          <Textarea
            value={formData.bodyCriteria}
            onChange={(e) => setFormData({ ...formData, bodyCriteria: e.target.value })}
            placeholder="Критерії оцінки Тіла..."
            rows={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Шкала оцінювання</Label>
          <Textarea
            value={formData.scoringScale}
            onChange={(e) => setFormData({ ...formData, scoringScale: e.target.value })}
            placeholder="Опис шкали оцінювання..."
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Вага балансу</Label>
          <Textarea
            value={formData.balanceWeight}
            onChange={(e) => setFormData({ ...formData, balanceWeight: e.target.value })}
            placeholder="Опис ваги балансу..."
            rows={2}
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label>Макс. сильних сторін</Label>
          <Input
            type="number"
            value={formData.maxStrengths}
            onChange={(e) => setFormData({ ...formData, maxStrengths: parseInt(e.target.value) || 5 })}
            min={1}
            max={20}
          />
        </div>
        <div className="space-y-2">
          <Label>Макс. слабких сторін</Label>
          <Input
            type="number"
            value={formData.maxWeaknesses}
            onChange={(e) => setFormData({ ...formData, maxWeaknesses: parseInt(e.target.value) || 5 })}
            min={1}
            max={20}
          />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.includeRecommendations}
            onCheckedChange={(checked) => setFormData({ ...formData, includeRecommendations: checked })}
          />
          <Label>Включати рекомендації</Label>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Активний</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name || !formData.systemPrompt}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {template ? "Зберегти" : "Створити"}
        </Button>
      </div>
    </form>
  );
}

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete, 
  onSetDefault 
}: { 
  template: BrandAnalysisTemplate;
  onEdit: (template: BrandAnalysisTemplate) => void;
  onDelete: (id: number) => void;
  onSetDefault: (id: number) => void;
}) {
  return (
    <Card className={`${template.isDefault ? 'border-primary' : ''} ${!template.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {template.isDefault && (
              <Badge variant="default" className="bg-primary">
                <Star className="h-3 w-3 mr-1" /> За замовчуванням
              </Badge>
            )}
            {!template.isActive && (
              <Badge variant="secondary">Неактивний</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {!template.isDefault && template.isActive && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onSetDefault(template.id)}
                title="Встановити за замовчуванням"
              >
                <StarOff className="h-4 w-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onEdit(template)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(template.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {template.description && (
          <CardDescription>{template.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground space-y-1">
          <p><span className="font-medium">Мова:</span> {template.outputLanguage === 'ukrainian' ? 'Українська' : 'English'}</p>
          <p><span className="font-medium">Рекомендації:</span> {template.includeRecommendations ? 'Так' : 'Ні'}</p>
          <p><span className="font-medium">Сильні/Слабкі:</span> {template.maxStrengths}/{template.maxWeaknesses}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function BrandAnalysisTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<BrandAnalysisTemplate | null>(null);

  const { data: templates = [], isLoading, refetch } = useQuery<BrandAnalysisTemplate[]>({
    queryKey: ['/api/admin/brand-analysis-templates'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/admin/brand-analysis-templates', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-templates'] });
      setIsCreateOpen(false);
      toast({ title: "Створено", description: "Шаблон успішно створено" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest('PUT', `/api/admin/brand-analysis-templates/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-templates'] });
      setEditingTemplate(null);
      toast({ title: "Збережено", description: "Шаблон успішно оновлено" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/admin/brand-analysis-templates/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-templates'] });
      toast({ title: "Видалено", description: "Шаблон успішно видалено" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('POST', `/api/admin/brand-analysis-templates/${id}/set-default`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/brand-analysis-templates'] });
      toast({ title: "Встановлено", description: "Шаблон встановлено за замовчуванням" });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Ви впевнені, що хочете видалити цей шаблон?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LayoutTemplate className="h-6 w-6 text-primary" />
              Шаблони аналізу брендів
            </h1>
            <p className="text-muted-foreground mt-1">
              Створюйте та керуйте шаблонами параметрів для аналізу брендів
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" /> Оновити
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" /> Новий шаблон
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Новий шаблон аналізу</DialogTitle>
                  <DialogDescription>
                    Створіть шаблон з налаштуваннями для аналізу брендів
                  </DialogDescription>
                </DialogHeader>
                <TemplateForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  onCancel={() => setIsCreateOpen(false)}
                  isLoading={createMutation.isPending}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <LayoutTemplate className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Немає шаблонів</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Створити перший шаблон
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {templates.map(template => (
              <TemplateCard 
                key={template.id} 
                template={template}
                onEdit={(t) => setEditingTemplate(t)}
                onDelete={handleDelete}
                onSetDefault={(id) => setDefaultMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Редагування шаблону</DialogTitle>
              <DialogDescription>
                Змініть налаштування шаблону аналізу
              </DialogDescription>
            </DialogHeader>
            {editingTemplate && (
              <TemplateForm
                template={editingTemplate}
                onSubmit={(data) => updateMutation.mutate({ id: editingTemplate.id, data })}
                onCancel={() => setEditingTemplate(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
