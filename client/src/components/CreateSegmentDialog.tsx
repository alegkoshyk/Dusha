import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Sparkles, ChevronDown, User, MapPin, Brain, ShoppingCart, Target, Users, Clock } from "lucide-react";

interface CreateSegmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
}

interface SegmentFormData {
  name: string;
  description: string;
  tier: "standard" | "pro";
  ageRange: string;
  income: string;
  needPain: string;
  lifeContext: string;
  awarenessLevel: string;
  readinessToAct: string;
  barrier: string;
  trigger: string;
  gender: string;
  education: string;
  familyStatus: string;
  occupation: string;
  companySize: string;
  industry: string;
  companyRevenue: string;
  employeeCount: string;
  location: string;
  citySize: string;
  climate: string;
  urbanization: string;
  localContext: string;
  values: string;
  beliefs: string;
  lifestyle: string;
  interests: string;
  fears: string;
  triggersPsycho: string;
  desires: string;
  selfIdentification: string;
  purchaseFrequency: string;
  usageScenarios: string;
  loyaltyLevel: string;
  willingnessToPay: string;
  priceSensitivity: string;
  interactionChannels: string;
  purchaseTriggers: string;
  purchaseBarriers: string;
  taskToSolve: string;
  painToRelieve: string;
  desiredResult: string;
  currentAlternatives: string;
  socialRole: string;
  communities: string;
  socialStatus: string;
  influenceLevel: string;
  languageSymbolsCodes: string;
  currentState: string;
  lifeStage: string;
  decisionSituation: string;
  timeSeasonEvent: string;
}

const initialFormData: SegmentFormData = {
  name: "",
  description: "",
  tier: "standard",
  ageRange: "",
  income: "",
  needPain: "",
  lifeContext: "",
  awarenessLevel: "",
  readinessToAct: "",
  barrier: "",
  trigger: "",
  gender: "",
  education: "",
  familyStatus: "",
  occupation: "",
  companySize: "",
  industry: "",
  companyRevenue: "",
  employeeCount: "",
  location: "",
  citySize: "",
  climate: "",
  urbanization: "",
  localContext: "",
  values: "",
  beliefs: "",
  lifestyle: "",
  interests: "",
  fears: "",
  triggersPsycho: "",
  desires: "",
  selfIdentification: "",
  purchaseFrequency: "",
  usageScenarios: "",
  loyaltyLevel: "",
  willingnessToPay: "",
  priceSensitivity: "",
  interactionChannels: "",
  purchaseTriggers: "",
  purchaseBarriers: "",
  taskToSolve: "",
  painToRelieve: "",
  desiredResult: "",
  currentAlternatives: "",
  socialRole: "",
  communities: "",
  socialStatus: "",
  influenceLevel: "",
  languageSymbolsCodes: "",
  currentState: "",
  lifeStage: "",
  decisionSituation: "",
  timeSeasonEvent: "",
};

export function CreateSegmentDialog({ open, onOpenChange, brandId }: CreateSegmentDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<SegmentFormData>(initialFormData);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["demographic"]));

  const toggleSection = (section: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(section)) {
      newSet.delete(section);
    } else {
      newSet.add(section);
    }
    setExpandedSections(newSet);
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/brands/${brandId}/generate-segment`, {
        description: formData.description,
        tier: formData.tier,
      });
      if (!response.ok) throw new Error("Failed to generate segment data");
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({
        ...prev,
        name: data.name || prev.name,
        ageRange: data.ageRange || "",
        income: data.income || "",
        needPain: data.needPain || "",
        lifeContext: data.lifeContext || "",
        awarenessLevel: data.awarenessLevel || "",
        readinessToAct: data.readinessToAct || "",
        barrier: data.barrier || "",
        trigger: data.trigger || "",
        gender: data.gender || "",
        education: data.education || "",
        familyStatus: data.familyStatus || "",
        occupation: data.occupation || "",
        companySize: data.companySize || "",
        industry: data.industry || "",
        companyRevenue: data.companyRevenue || "",
        employeeCount: data.employeeCount || "",
        location: data.location || "",
        citySize: data.citySize || "",
        climate: data.climate || "",
        urbanization: data.urbanization || "",
        localContext: data.localContext || "",
        values: data.values || "",
        beliefs: data.beliefs || "",
        lifestyle: data.lifestyle || "",
        interests: data.interests || "",
        fears: data.fears || "",
        triggersPsycho: data.triggersPsycho || "",
        desires: data.desires || "",
        selfIdentification: data.selfIdentification || "",
        purchaseFrequency: data.purchaseFrequency || "",
        usageScenarios: data.usageScenarios || "",
        loyaltyLevel: data.loyaltyLevel || "",
        willingnessToPay: data.willingnessToPay || "",
        priceSensitivity: data.priceSensitivity || "",
        interactionChannels: data.interactionChannels || "",
        purchaseTriggers: data.purchaseTriggers || "",
        purchaseBarriers: data.purchaseBarriers || "",
        taskToSolve: data.taskToSolve || "",
        painToRelieve: data.painToRelieve || "",
        desiredResult: data.desiredResult || "",
        currentAlternatives: data.currentAlternatives || "",
        socialRole: data.socialRole || "",
        communities: data.communities || "",
        socialStatus: data.socialStatus || "",
        influenceLevel: data.influenceLevel || "",
        languageSymbolsCodes: data.languageSymbolsCodes || "",
        currentState: data.currentState || "",
        lifeStage: data.lifeStage || "",
        decisionSituation: data.decisionSituation || "",
        timeSeasonEvent: data.timeSeasonEvent || "",
      }));
      toast({ title: "Успішно", description: "Дані сегменту згенеровано" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати дані", variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/brands/${brandId}/demographic-segments`, formData);
      if (!response.ok) throw new Error("Failed to create segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Сегмент створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "demographic-segments"] });
      onOpenChange(false);
      setFormData(initialFormData);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити сегмент", variant: "destructive" });
    },
  });

  const updateField = (field: keyof SegmentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStandardFields = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>1. Вік (життєвий етап)</Label>
          <Input
            value={formData.ageRange}
            onChange={(e) => updateField("ageRange", e.target.value)}
            placeholder="напр. 25-35, 45+"
          />
        </div>
        <div className="space-y-2">
          <Label>2. Доходи</Label>
          <Select value={formData.income} onValueChange={(v) => updateField("income", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Виберіть рівень" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="низький">Низький</SelectItem>
              <SelectItem value="середній">Середній</SelectItem>
              <SelectItem value="вище середнього">Вище середнього</SelectItem>
              <SelectItem value="високий">Високий</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>3. Потреба / біль</Label>
        <Textarea
          value={formData.needPain}
          onChange={(e) => updateField("needPain", e.target.value)}
          placeholder="Навіщо їй це взагалі потрібно?"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>4. Контекст</Label>
          <Select value={formData.lifeContext} onValueChange={(v) => updateField("lifeContext", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Ситуація" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="криза">Криза</SelectItem>
              <SelectItem value="спокій">Спокій</SelectItem>
              <SelectItem value="пошук">Пошук</SelectItem>
              <SelectItem value="розвиток">Розвиток</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>5. Рівень усвідомлення</Label>
          <Select value={formData.awarenessLevel} onValueChange={(v) => updateField("awarenessLevel", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Рівень" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="не усвідомлює">Не усвідомлює</SelectItem>
              <SelectItem value="усвідомлює">Усвідомлює</SelectItem>
              <SelectItem value="шукає рішення">Шукає рішення</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>6. Готовність діяти</Label>
        <Select value={formData.readinessToAct} onValueChange={(v) => updateField("readinessToAct", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Коли готовий?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="зараз">Зараз</SelectItem>
            <SelectItem value="пізніше">Пізніше</SelectItem>
            <SelectItem value="колись">Колись</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>7. Бар'єр</Label>
        <Textarea
          value={formData.barrier}
          onChange={(e) => updateField("barrier", e.target.value)}
          placeholder="Що заважає купити? (страх, гроші, недовіра, складність)"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>8. Тригер</Label>
        <Textarea
          value={formData.trigger}
          onChange={(e) => updateField("trigger", e.target.value)}
          placeholder="Що змусить зробити крок? (рекомендація, приклад, проста дія)"
          rows={2}
        />
      </div>
    </div>
  );

  const renderProFields = () => (
    <div className="space-y-3">
      <Collapsible open={expandedSections.has("demographic")} onOpenChange={() => toggleSection("demographic")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" />
              <span className="font-medium">1. Демографічні (ХТО)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("demographic") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Вік</Label>
              <Input value={formData.ageRange} onChange={(e) => updateField("ageRange", e.target.value)} placeholder="25-35" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Стать</Label>
              <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                <SelectTrigger><SelectValue placeholder="Виберіть" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="чоловіки">Чоловіки</SelectItem>
                  <SelectItem value="жінки">Жінки</SelectItem>
                  <SelectItem value="всі">Всі</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Дохід</Label>
              <Input value={formData.income} onChange={(e) => updateField("income", e.target.value)} placeholder="Середній" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Освіта</Label>
              <Input value={formData.education} onChange={(e) => updateField("education", e.target.value)} placeholder="Вища" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Сімейний стан</Label>
              <Input value={formData.familyStatus} onChange={(e) => updateField("familyStatus", e.target.value)} placeholder="Одружений" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Професія</Label>
              <Input value={formData.occupation} onChange={(e) => updateField("occupation", e.target.value)} placeholder="Менеджер" />
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">Для B2B:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Розмір компанії</Label>
              <Input value={formData.companySize} onChange={(e) => updateField("companySize", e.target.value)} placeholder="10-50 осіб" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Галузь</Label>
              <Input value={formData.industry} onChange={(e) => updateField("industry", e.target.value)} placeholder="IT" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Оборот</Label>
              <Input value={formData.companyRevenue} onChange={(e) => updateField("companyRevenue", e.target.value)} placeholder="$1M+" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Співробітників</Label>
              <Input value={formData.employeeCount} onChange={(e) => updateField("employeeCount", e.target.value)} placeholder="50-100" />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("geographic")} onOpenChange={() => toggleSection("geographic")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="font-medium">2. Географічні (ДЕ)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("geographic") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Локація</Label>
              <Input value={formData.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Україна, Київ" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Розмір міста</Label>
              <Input value={formData.citySize} onChange={(e) => updateField("citySize", e.target.value)} placeholder="Мільйонник" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Клімат</Label>
              <Input value={formData.climate} onChange={(e) => updateField("climate", e.target.value)} placeholder="Помірний" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Урбанізація</Label>
              <Select value={formData.urbanization} onValueChange={(v) => updateField("urbanization", v)}>
                <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="місто">Місто</SelectItem>
                  <SelectItem value="село">Село</SelectItem>
                  <SelectItem value="передмістя">Передмістя</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Локальний контекст</Label>
            <Textarea value={formData.localContext} onChange={(e) => updateField("localContext", e.target.value)} placeholder="Культура, війна, міграція, економіка" rows={2} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("psychographic")} onOpenChange={() => toggleSection("psychographic")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="font-medium">3. Психографічні (ХТО ВСЕРЕДИНІ)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("psychographic") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Цінності</Label>
              <Textarea value={formData.values} onChange={(e) => updateField("values", e.target.value)} placeholder="Сім'я, кар'єра..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Переконання</Label>
              <Textarea value={formData.beliefs} onChange={(e) => updateField("beliefs", e.target.value)} placeholder="Вірить у..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Стиль життя</Label>
              <Textarea value={formData.lifestyle} onChange={(e) => updateField("lifestyle", e.target.value)} placeholder="Активний, спокійний..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Інтереси</Label>
              <Textarea value={formData.interests} onChange={(e) => updateField("interests", e.target.value)} placeholder="Хобі, захоплення..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Страхи</Label>
              <Textarea value={formData.fears} onChange={(e) => updateField("fears", e.target.value)} placeholder="Чого боїться..." rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Бажання</Label>
              <Textarea value={formData.desires} onChange={(e) => updateField("desires", e.target.value)} placeholder="Чого хоче..." rows={2} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Самоідентифікація ("я хто?")</Label>
            <Input value={formData.selfIdentification} onChange={(e) => updateField("selfIdentification", e.target.value)} placeholder="Як себе бачить" />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("behavioral")} onOpenChange={() => toggleSection("behavioral")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              <span className="font-medium">4. Поведінкові (ЯК ДІЄ)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("behavioral") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Частота покупок</Label>
              <Input value={formData.purchaseFrequency} onChange={(e) => updateField("purchaseFrequency", e.target.value)} placeholder="Раз на місяць" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Рівень лояльності</Label>
              <Input value={formData.loyaltyLevel} onChange={(e) => updateField("loyaltyLevel", e.target.value)} placeholder="Високий" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Готовність платити</Label>
              <Input value={formData.willingnessToPay} onChange={(e) => updateField("willingnessToPay", e.target.value)} placeholder="Середня" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Чутливість до ціни</Label>
              <Input value={formData.priceSensitivity} onChange={(e) => updateField("priceSensitivity", e.target.value)} placeholder="Низька" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Сценарії використання</Label>
            <Textarea value={formData.usageScenarios} onChange={(e) => updateField("usageScenarios", e.target.value)} placeholder="Як використовує продукт" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Канали взаємодії</Label>
            <Textarea value={formData.interactionChannels} onChange={(e) => updateField("interactionChannels", e.target.value)} placeholder="Instagram, email, телефон..." rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Тригери покупки</Label>
              <Textarea value={formData.purchaseTriggers} onChange={(e) => updateField("purchaseTriggers", e.target.value)} placeholder="Що спонукає" rows={2} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Бар'єри покупки</Label>
              <Textarea value={formData.purchaseBarriers} onChange={(e) => updateField("purchaseBarriers", e.target.value)} placeholder="Що заважає" rows={2} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("needs")} onOpenChange={() => toggleSection("needs")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-red-500" />
              <span className="font-medium">5. Потреби і задачі (ЧОМУ)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("needs") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Яку задачу хоче вирішити</Label>
            <Textarea value={formData.taskToSolve} onChange={(e) => updateField("taskToSolve", e.target.value)} placeholder="Jobs To Be Done" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Який біль зняти</Label>
            <Textarea value={formData.painToRelieve} onChange={(e) => updateField("painToRelieve", e.target.value)} placeholder="Головний біль" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Який результат отримати</Label>
            <Textarea value={formData.desiredResult} onChange={(e) => updateField("desiredResult", e.target.value)} placeholder="Бажаний результат" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Альтернативи (як вирішує зараз)</Label>
            <Textarea value={formData.currentAlternatives} onChange={(e) => updateField("currentAlternatives", e.target.value)} placeholder="Поточні рішення" rows={2} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("social")} onOpenChange={() => toggleSection("social")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-cyan-500" />
              <span className="font-medium">6. Соціально-культурні</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("social") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Роль у суспільстві</Label>
              <Input value={formData.socialRole} onChange={(e) => updateField("socialRole", e.target.value)} placeholder="Батько, лідер..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Соціальний статус</Label>
              <Input value={formData.socialStatus} onChange={(e) => updateField("socialStatus", e.target.value)} placeholder="Середній клас" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Рівень впливу</Label>
              <Select value={formData.influenceLevel} onValueChange={(v) => updateField("influenceLevel", v)}>
                <SelectTrigger><SelectValue placeholder="Тип" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="лідер">Лідер</SelectItem>
                  <SelectItem value="послідовник">Послідовник</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Спільноти</Label>
            <Textarea value={formData.communities} onChange={(e) => updateField("communities", e.target.value)} placeholder="До яких спільнот належить" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Мова, символи, коди</Label>
            <Textarea value={formData.languageSymbolsCodes} onChange={(e) => updateField("languageSymbolsCodes", e.target.value)} placeholder="Культурні маркери" rows={2} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={expandedSections.has("contextual")} onOpenChange={() => toggleSection("contextual")}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 h-auto">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">7. Контекстні (КОЛИ)</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.has("contextual") ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="px-3 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Поточний стан</Label>
              <Select value={formData.currentState} onValueChange={(v) => updateField("currentState", v)}>
                <SelectTrigger><SelectValue placeholder="Стан" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="стрес">Стрес</SelectItem>
                  <SelectItem value="спокій">Спокій</SelectItem>
                  <SelectItem value="криза">Криза</SelectItem>
                  <SelectItem value="зростання">Зростання</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Життєвий етап</Label>
              <Input value={formData.lifeStage} onChange={(e) => updateField("lifeStage", e.target.value)} placeholder="Студент, молодий батько..." />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ситуація прийняття рішення</Label>
            <Textarea value={formData.decisionSituation} onChange={(e) => updateField("decisionSituation", e.target.value)} placeholder="В якій ситуації приймає рішення" rows={2} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Час, сезон, подія</Label>
            <Textarea value={formData.timeSeasonEvent} onChange={(e) => updateField("timeSeasonEvent", e.target.value)} placeholder="Коли найкраще контактувати" rows={2} />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Створити сегмент аудиторії</DialogTitle>
        </DialogHeader>
        
        <Tabs value={formData.tier} onValueChange={(v) => updateField("tier", v as "standard" | "pro")} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="standard">Стандарт (8 параметрів)</TabsTrigger>
            <TabsTrigger value="pro">Про (повний набір)</TabsTrigger>
          </TabsList>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Назва сегменту *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="напр. Молоді підприємці"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Опис для AI
                  <Sparkles className="h-3 w-3 text-yellow-500" />
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Опишіть сегмент для генерації..."
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => generateMutation.mutate()}
                    disabled={!formData.description.trim() || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-4">
            <TabsContent value="standard" className="mt-0">
              {renderStandardFields()}
            </TabsContent>
            <TabsContent value="pro" className="mt-0">
              {renderProFields()}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Скасувати
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!formData.name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Створити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
