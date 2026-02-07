import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Loader2, Crown, Zap, Sparkles, ArrowLeft } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxBrands: number;
  maxTotalGames: number;
  maxStorageBytes: number;
  maxMediaFiles: number;
  analysisQuota: number;
  features: string[] | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface PremiumFeature {
  id: number;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
}

export default function SubscriptionPlans() {
  const { toast } = useToast();
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/admin/subscriptions/plans'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<SubscriptionPlan>) => {
      const response = await apiRequest('POST', '/api/admin/subscriptions/plans', data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Тариф створено" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions/plans'] });
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SubscriptionPlan> }) => {
      const response = await apiRequest('PATCH', `/api/admin/subscriptions/plans/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Тариф оновлено" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions/plans'] });
      setEditingPlan(null);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/admin/subscriptions/plans/${id}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Тариф видалено" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscriptions/plans'] });
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Безкоштовно";
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatStorage = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(0)} ГБ`;
    return `${(bytes / 1048576).toFixed(0)} МБ`;
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'pro': return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'basic': return <Zap className="h-5 w-5 text-blue-500" />;
      default: return <Sparkles className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto py-8 px-4">
        <Link href="/rcadmin" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад до панелі адміністратора
        </Link>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Тарифні плани</h1>
            <p className="text-gray-400 mt-1">Управління підписками та ціноутворенням</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-plan">
                <Plus className="h-4 w-4 mr-2" />
                Новий тариф
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
              <DialogHeader>
                <DialogTitle>Створити тариф</DialogTitle>
              </DialogHeader>
              <PlanForm 
                onSubmit={(data) => createMutation.mutate(data)} 
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans?.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => (
              <Card key={plan.id} className="bg-gray-900 border-gray-700" data-testid={`card-admin-plan-${plan.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {getPlanIcon(plan.name)}
                      <CardTitle className="text-white truncate">{plan.displayName}</CardTitle>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {plan.isDefault && <Badge variant="outline" className="text-xs whitespace-nowrap">За замовч.</Badge>}
                      {!plan.isActive && <Badge variant="destructive" className="text-xs whitespace-nowrap">Неактивний</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Щомісяця:</span>
                      <span className="font-medium">{formatPrice(plan.priceMonthly, plan.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Щорічно:</span>
                      <span className="font-medium">{formatPrice(plan.priceYearly, plan.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Бренди:</span>
                      <span>{plan.maxBrands}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ігри:</span>
                      <span>{plan.maxTotalGames}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Сховище:</span>
                      <span>{formatStorage(plan.maxStorageBytes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Файли:</span>
                      <span>{plan.maxMediaFiles}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Аналізи:</span>
                      <span>{plan.analysisQuota}</span>
                    </div>
                  </div>

                  {plan.features && plan.features.length > 0 && (
                    <div className="pt-2 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-2">Функції:</p>
                      <div className="flex flex-wrap gap-1">
                        {plan.features.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => setEditingPlan(plan)}
                          data-testid={`button-edit-plan-${plan.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Редагувати
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl bg-gray-900 text-white border-gray-700">
                        <DialogHeader>
                          <DialogTitle>Редагувати тариф</DialogTitle>
                        </DialogHeader>
                        <PlanForm 
                          plan={editingPlan || plan}
                          onSubmit={(data) => updateMutation.mutate({ id: plan.id, data })} 
                          isLoading={updateMutation.isPending}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    {!plan.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        onClick={() => {
                          if (confirm('Видалити цей тариф?')) {
                            deleteMutation.mutate(plan.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-plan-${plan.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlanForm({ 
  plan, 
  onSubmit, 
  isLoading 
}: { 
  plan?: SubscriptionPlan | null; 
  onSubmit: (data: Partial<SubscriptionPlan>) => void; 
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    displayName: plan?.displayName || '',
    description: plan?.description || '',
    priceMonthly: plan?.priceMonthly || 0,
    priceYearly: plan?.priceYearly || 0,
    currency: plan?.currency || 'UAH',
    maxBrands: plan?.maxBrands || 1,
    maxTotalGames: plan?.maxTotalGames || 1,
    maxStorageMB: plan ? Math.round(plan.maxStorageBytes / 1048576) : 50,
    maxMediaFiles: plan?.maxMediaFiles || 25,
    analysisQuota: plan?.analysisQuota || 1,
    isDefault: plan?.isDefault || false,
    isActive: plan?.isActive ?? true,
    sortOrder: plan?.sortOrder || 1,
  });
  
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(plan?.features || []);
  
  const { data: premiumFeatures } = useQuery<PremiumFeature[]>({
    queryKey: ['/api/admin/subscriptions/features'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { maxStorageMB, ...rest } = formData;
    onSubmit({
      ...rest,
      maxStorageBytes: maxStorageMB * 1048576,
      features: selectedFeatures,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Системна назва</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="free, basic, pro"
            className="bg-gray-800 border-gray-600"
            required
          />
        </div>
        <div>
          <Label>Відображувана назва</Label>
          <Input
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Безкоштовний"
            className="bg-gray-800 border-gray-600"
            required
          />
        </div>
      </div>

      <div>
        <Label>Опис</Label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Короткий опис тарифу"
          className="bg-gray-800 border-gray-600"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Ціна/місяць (копійки)</Label>
          <Input
            type="number"
            value={formData.priceMonthly}
            onChange={(e) => setFormData({ ...formData, priceMonthly: parseInt(e.target.value) || 0 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div>
          <Label>Ціна/рік (копійки)</Label>
          <Input
            type="number"
            value={formData.priceYearly}
            onChange={(e) => setFormData({ ...formData, priceYearly: parseInt(e.target.value) || 0 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div>
          <Label>Валюта</Label>
          <Input
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Макс. брендів</Label>
          <Input
            type="number"
            value={formData.maxBrands}
            onChange={(e) => setFormData({ ...formData, maxBrands: parseInt(e.target.value) || 1 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div>
          <Label>Макс. ігор</Label>
          <Input
            type="number"
            value={formData.maxTotalGames}
            onChange={(e) => setFormData({ ...formData, maxTotalGames: parseInt(e.target.value) || 1 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Сховище (МБ)</Label>
          <Input
            type="number"
            value={formData.maxStorageMB}
            onChange={(e) => setFormData({ ...formData, maxStorageMB: parseInt(e.target.value) || 0 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div>
          <Label>Макс. файлів</Label>
          <Input
            type="number"
            value={formData.maxMediaFiles}
            onChange={(e) => setFormData({ ...formData, maxMediaFiles: parseInt(e.target.value) || 25 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div>
          <Label>Квота аналізів</Label>
          <Input
            type="number"
            value={formData.analysisQuota}
            onChange={(e) => setFormData({ ...formData, analysisQuota: parseInt(e.target.value) || 1 })}
            className="bg-gray-800 border-gray-600"
            min={1}
          />
        </div>
      </div>

      <div>
        <Label>Функції тарифу</Label>
        
        {premiumFeatures && premiumFeatures.filter(f => f.isActive).length > 0 ? (
          <div className="mt-2 border border-gray-700 rounded-md bg-gray-800 max-h-48 overflow-y-auto">
            {premiumFeatures.filter(f => f.isActive).map((feature) => (
              <div
                key={feature.id}
                className="px-3 py-2 flex items-center justify-between border-b border-gray-700 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{feature.name}</span>
                  {feature.description && (
                    <span className="text-xs text-gray-500">({feature.key})</span>
                  )}
                </div>
                <Switch
                  checked={selectedFeatures.includes(feature.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedFeatures([...selectedFeatures, feature.name]);
                    } else {
                      setSelectedFeatures(selectedFeatures.filter(f => f !== feature.name));
                    }
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            Немає доступних функцій. Додайте їх у розділі "Преміум функції".
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Порядок сортування</Label>
          <Input
            type="number"
            value={formData.sortOrder}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
            className="bg-gray-800 border-gray-600"
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={formData.isDefault}
            onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
          />
          <Label>За замовч.</Label>
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
          <Label>Активний</Label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {plan ? 'Зберегти' : 'Створити'}
      </Button>
    </form>
  );
}
