import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Users, Sparkles, Loader2, Trash2, 
  User, MapPin, Briefcase, GraduationCap, Heart, Target, 
  DollarSign, Quote, Brain, ShoppingBag, FolderOpen, Layers,
  ChevronDown, ChevronRight, Settings, ArrowRightLeft, Move, X, Image
} from "lucide-react";
import type { UserBrand, TargetAudience, DemographicSegment, DemographicSubSegment } from "@shared/schema";

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

interface SegmentWithData extends DemographicSegment {
  subSegments: (DemographicSubSegment & { personas: TargetAudience[] })[];
  personas: TargetAudience[];
}

export default function TargetAudiencePage() {
  const params = useParams<{ brandId: string }>();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(null);
  const [audienceType, setAudienceType] = useState<"primary" | "secondary" | "niche">("primary");
  const [newAudienceName, setNewAudienceName] = useState("");
  
  // Segment state
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [isSegmentDialogOpen, setIsSegmentDialogOpen] = useState(false);
  const [newSegmentName, setNewSegmentName] = useState("");
  const [editingSegment, setEditingSegment] = useState<DemographicSegment | null>(null);
  const [editingSubSegment, setEditingSubSegment] = useState<DemographicSubSegment | null>(null);
  const [movingSubSegment, setMovingSubSegment] = useState<{ id: string; currentSegmentId: string } | null>(null);
  const [generatingAvatarId, setGeneratingAvatarId] = useState<string | null>(null);
  const [editingAudience, setEditingAudience] = useState<TargetAudience | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const { data: brand, isLoading: brandLoading } = useQuery<UserBrand>({
    queryKey: ["/api/user/brands", params.brandId],
    queryFn: async () => {
      const response = await fetch(`/api/user/brands/${params.brandId}`);
      if (!response.ok) throw new Error("Failed to fetch brand");
      return response.json();
    },
    enabled: !!params.brandId,
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

  const { data: segments = [], isLoading: segmentsLoading } = useQuery<SegmentWithData[]>({
    queryKey: ["/api/brands", params.brandId, "demographic-segments"],
    queryFn: async () => {
      const response = await fetch(`/api/brands/${params.brandId}/demographic-segments`);
      if (!response.ok) throw new Error("Failed to fetch segments");
      return response.json();
    },
    enabled: !!params.brandId,
  });

  // Get all persona IDs that are assigned to segments
  const assignedPersonaIds = new Set<string>();
  segments.forEach(seg => {
    seg.personas.forEach(p => assignedPersonaIds.add(p.id));
    seg.subSegments.forEach(sub => {
      sub.personas.forEach(p => assignedPersonaIds.add(p.id));
    });
  });

  const getUnassignedPersonas = () => audiences.filter(a => !assignedPersonaIds.has(a.id));

  const generatePersonaMutation = useMutation({
    mutationFn: async ({ type, customPrompt }: { type: "primary" | "secondary" | "niche"; customPrompt?: string }) => {
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/generate-persona`, { 
        audienceType: type,
        customPrompt 
      });
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
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setIsCreateOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setSelectedAudience(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити аудиторію", variant: "destructive" });
    },
  });

  const updateAudienceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TargetAudience> }) => {
      const response = await apiRequest("PATCH", `/api/target-audiences/${id}`, data);
      if (!response.ok) throw new Error("Failed to update audience");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персону оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "target-audiences"] });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingAudience(null);
      setSelectedAudience(null);
      setIsEditMode(false);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити персону", variant: "destructive" });
    },
  });

  // Segment mutations
  const createSegmentMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await apiRequest("POST", `/api/brands/${params.brandId}/demographic-segments`, { name });
      if (!response.ok) throw new Error("Failed to create segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Сегмент створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setIsSegmentDialogOpen(false);
      setNewSegmentName("");
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити сегмент", variant: "destructive" });
    },
  });

  const updateSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemographicSegment> }) => {
      const response = await apiRequest("PATCH", `/api/demographic-segments/${id}`, data);
      if (!response.ok) throw new Error("Failed to update segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Сегмент оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити сегмент", variant: "destructive" });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/demographic-segments/${id}`);
      if (!response.ok) throw new Error("Failed to delete segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Сегмент видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити сегмент", variant: "destructive" });
    },
  });

  const createSubSegmentMutation = useMutation({
    mutationFn: async ({ segmentId, name }: { segmentId: string; name: string }) => {
      const response = await apiRequest("POST", `/api/demographic-segments/${segmentId}/sub-segments`, { name });
      if (!response.ok) throw new Error("Failed to create sub-segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Підсегмент створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити підсегмент", variant: "destructive" });
    },
  });

  const updateSubSegmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<DemographicSubSegment> }) => {
      const response = await apiRequest("PATCH", `/api/demographic-sub-segments/${id}`, data);
      if (!response.ok) throw new Error("Failed to update sub-segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Підсегмент оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setEditingSubSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити підсегмент", variant: "destructive" });
    },
  });

  const moveSubSegmentMutation = useMutation({
    mutationFn: async ({ id, newSegmentId }: { id: string; newSegmentId: string }) => {
      const response = await apiRequest("PATCH", `/api/demographic-sub-segments/${id}`, { segmentId: newSegmentId });
      if (!response.ok) throw new Error("Failed to move sub-segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Підсегмент переміщено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setMovingSubSegment(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося перемістити підсегмент", variant: "destructive" });
    },
  });

  const deleteSubSegmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/demographic-sub-segments/${id}`);
      if (!response.ok) throw new Error("Failed to delete sub-segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Підсегмент видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити підсегмент", variant: "destructive" });
    },
  });

  const addToSegmentMutation = useMutation({
    mutationFn: async ({ personaId, segmentId, subSegmentId }: { personaId: string; segmentId: string; subSegmentId: string | null }) => {
      const response = await apiRequest("POST", `/api/persona-segment-assignments`, { personaId, segmentId, subSegmentId });
      if (!response.ok) throw new Error("Failed to add to segment");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персону додано до сегменту" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося додати персону до сегменту", variant: "destructive" });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/brands", params.brandId, "demographic-segments"] });
      setGeneratingAvatarId(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати аватар", variant: "destructive" });
      setGeneratingAvatarId(null);
    },
  });

  const handleGeneratePersona = () => {
    generatePersonaMutation.mutate({ type: audienceType, customPrompt: customPrompt.trim() || undefined });
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

  const isLoading = brandLoading || audiencesLoading || segmentsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Бренд не знайдено</p>
        <Link href="/brands">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            До брендів
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/brand/${params.brandId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Цільова аудиторія
              </h1>
              <p className="text-sm text-muted-foreground">{brand.name}</p>
            </div>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) setCustomPrompt("");
          }}>
            <DialogTrigger asChild>
              <Button>
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

                <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                  <div className="flex items-center justify-between">
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
                    AI проаналізує ваш бренд (цінності, місію, опис) та створить детальний портрет ідеального клієнта
                  </p>
                  <div className="space-y-2">
                    <Label className="text-sm">Додатковий напрямок (опціонально)</Label>
                    <Textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Опишіть особливості персони, яку хочете згенерувати. Наприклад: 'Молода мама з великого міста, яка цікавиться здоровим харчуванням' або 'IT-спеціаліст, який шукає преміальні продукти'"
                      rows={3}
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ваші вказівки будуть враховані як пріоритетний напрямок для створення персони
                    </p>
                  </div>
                </div>

                {generatePersonaMutation.data && (
                  <PersonaPreview persona={generatePersonaMutation.data} />
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
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Скасувати
                  </Button>
                  <Button 
                    onClick={handleCreateFromPersona}
                    disabled={!generatePersonaMutation.data || createAudienceMutation.isPending}
                  >
                    {createAudienceMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Зберегти
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Segments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Segments Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Сегменти аудиторії</CardTitle>
                  </div>
                  <Dialog open={isSegmentDialogOpen} onOpenChange={setIsSegmentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Сегмент
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Створити сегмент</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Назва сегменту</Label>
                          <Input
                            value={newSegmentName}
                            onChange={(e) => setNewSegmentName(e.target.value)}
                            placeholder="напр. Молодь 18-25"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsSegmentDialogOpen(false)}>
                            Скасувати
                          </Button>
                          <Button
                            onClick={() => createSegmentMutation.mutate(newSegmentName)}
                            disabled={!newSegmentName.trim() || createSegmentMutation.isPending}
                          >
                            {createSegmentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : null}
                            Створити
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-medium text-muted-foreground mb-1">Немає сегментів</p>
                    <p className="text-sm text-muted-foreground">Створіть сегменти для групування персон за демографією</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {segments.map((segment) => (
                      <Collapsible
                        key={segment.id}
                        open={expandedSegments.has(segment.id)}
                        onOpenChange={(open) => {
                          const newSet = new Set(expandedSegments);
                          if (open) newSet.add(segment.id);
                          else newSet.delete(segment.id);
                          setExpandedSegments(newSet);
                        }}
                      >
                        <div className="border rounded-lg">
                          <CollapsibleTrigger className="w-full">
                            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                {expandedSegments.has(segment.id) ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <FolderOpen className="h-5 w-5" style={{ color: segment.color || '#f59e0b' }} />
                                <span className="font-medium">{segment.name}</span>
                                <Badge variant="secondary">
                                  {segment.personas.length + segment.subSegments.reduce((acc, s) => acc + s.personas.length, 0)} персон
                                </Badge>
                                {segment.communicationTone && (
                                  <Badge variant="outline">{segment.communicationTone}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSegment(segment);
                                  }}
                                  title="Налаштування сегменту"
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const name = prompt("Назва підсегменту:");
                                    if (name) createSubSegmentMutation.mutate({ segmentId: segment.id, name });
                                  }}
                                  title="Додати підсегмент"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Видалити сегмент?")) deleteSegmentMutation.mutate(segment.id);
                                  }}
                                  title="Видалити"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="px-4 pb-4 space-y-3">
                              {/* Personas directly in segment */}
                              {segment.personas.map((persona) => (
                                <PersonaInline 
                                  key={persona.id}
                                  persona={persona}
                                  onSelect={() => setSelectedAudience(persona)}
                                  onGenerateAvatar={() => generateAvatarMutation.mutate(persona.id)}
                                  isGeneratingAvatar={generatingAvatarId === persona.id}
                                  className="ml-8"
                                />
                              ))}
                              
                              {/* Sub-segments */}
                              {segment.subSegments.map((subSegment) => (
                                <div key={subSegment.id} className="ml-8 border-l-2 pl-4 space-y-2" style={{ borderColor: subSegment.color || '#60a5fa' }}>
                                  <div className="flex items-center gap-2 py-2 group">
                                    <Layers className="h-4 w-4" style={{ color: subSegment.color || '#60a5fa' }} />
                                    <span className="text-sm font-medium flex-1">{subSegment.name}</span>
                                    <Badge variant="outline" className="text-xs">{subSegment.personas.length}</Badge>
                                    <div className="hidden group-hover:flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setEditingSubSegment(subSegment)}
                                        title="Налаштування"
                                      >
                                        <Settings className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() => setMovingSubSegment({ id: subSegment.id, currentSegmentId: segment.id })}
                                        title="Перемістити"
                                      >
                                        <ArrowRightLeft className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                        onClick={() => {
                                          if (confirm("Видалити підсегмент?")) {
                                            deleteSubSegmentMutation.mutate(subSegment.id);
                                          }
                                        }}
                                        title="Видалити"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  {subSegment.personas.map((persona) => (
                                    <PersonaInline 
                                      key={persona.id}
                                      persona={persona}
                                      onSelect={() => setSelectedAudience(persona)}
                                      onGenerateAvatar={() => generateAvatarMutation.mutate(persona.id)}
                                      isGeneratingAvatar={generatingAvatarId === persona.id}
                                      small
                                    />
                                  ))}
                                </div>
                              ))}
                              
                              {segment.personas.length === 0 && segment.subSegments.length === 0 && (
                                <p className="text-sm text-muted-foreground ml-8 py-2">Немає персон у цьому сегменті</p>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unassigned Personas */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-lg">Персони без сегменту</CardTitle>
                  {getUnassignedPersonas().length > 0 && (
                    <Badge variant="secondary">{getUnassignedPersonas().length}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {getUnassignedPersonas().length === 0 && audiences.length === 0 ? (
                  <div className="p-6 border border-dashed rounded-lg text-center">
                    <Users className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-medium text-muted-foreground mb-1">Ще немає персон</p>
                    <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)} className="mt-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Створити персону
                    </Button>
                  </div>
                ) : getUnassignedPersonas().length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p className="text-sm">Всі персони розподілені по сегментах</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getUnassignedPersonas().map((audience) => (
                      <div key={audience.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <PersonaInline 
                            persona={audience}
                            onSelect={() => setSelectedAudience(audience)}
                            onGenerateAvatar={() => generateAvatarMutation.mutate(audience.id)}
                            isGeneratingAvatar={generatingAvatarId === audience.id}
                            onDelete={() => deleteAudienceMutation.mutate(audience.id)}
                          />
                        </div>
                        {segments.length > 0 && (
                          <Select
                            value=""
                            onValueChange={(value) => {
                              if (value.startsWith("seg:")) {
                                addToSegmentMutation.mutate({ personaId: audience.id, segmentId: value.replace("seg:", ""), subSegmentId: null });
                              } else if (value.startsWith("sub:")) {
                                const [, subId, segId] = value.split(":");
                                addToSegmentMutation.mutate({ personaId: audience.id, segmentId: segId, subSegmentId: subId });
                              }
                            }}
                          >
                            <SelectTrigger className="w-10 h-9 p-0 justify-center">
                              <Move className="h-4 w-4" />
                            </SelectTrigger>
                            <SelectContent>
                              {segments.map((seg) => (
                                <div key={seg.id}>
                                  <SelectItem value={`seg:${seg.id}`}>
                                    <div className="flex items-center gap-2">
                                      <FolderOpen className="h-4 w-4" style={{ color: seg.color || '#f59e0b' }} />
                                      {seg.name}
                                    </div>
                                  </SelectItem>
                                  {seg.subSegments.map((sub) => (
                                    <SelectItem key={sub.id} value={`sub:${sub.id}:${seg.id}`}>
                                      <div className="flex items-center gap-2 ml-4">
                                        <Layers className="h-4 w-4" style={{ color: sub.color || '#60a5fa' }} />
                                        {sub.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Quick Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Всього персон</span>
                  <Badge variant="secondary">{audiences.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Сегментів</span>
                  <Badge variant="secondary">{segments.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Без сегменту</span>
                  <Badge variant="outline">{getUnassignedPersonas().length}</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Типи аудиторій</span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Основна</span>
                    <span>{audiences.filter(a => a.isPrimary).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Вторинна</span>
                    <span>{audiences.filter(a => !a.isPrimary).length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Швидкі дії</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsCreateOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Згенерувати персону
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsSegmentDialogOpen(true)}>
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Створити сегмент
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Audience Dialog */}
        {selectedAudience && (
          <Dialog open={!!selectedAudience} onOpenChange={() => { setSelectedAudience(null); setIsEditMode(false); setEditingAudience(null); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {isEditMode ? "Редагувати персону" : selectedAudience.name}
                  </DialogTitle>
                  {!isEditMode && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setEditingAudience({ ...selectedAudience });
                        setIsEditMode(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Редагувати
                    </Button>
                  )}
                </div>
              </DialogHeader>
              {isEditMode && editingAudience ? (
                <AudienceEditForm 
                  audience={editingAudience}
                  onChange={setEditingAudience}
                  onSave={() => {
                    updateAudienceMutation.mutate({
                      id: editingAudience.id,
                      data: {
                        name: editingAudience.name,
                        description: editingAudience.description,
                        isPrimary: editingAudience.isPrimary,
                        ageRange: editingAudience.ageRange,
                        gender: editingAudience.gender,
                        location: editingAudience.location,
                        income: editingAudience.income,
                        education: editingAudience.education,
                        occupation: editingAudience.occupation,
                        values: editingAudience.values,
                        interests: editingAudience.interests,
                        painPoints: editingAudience.painPoints,
                        goals: editingAudience.goals,
                        motivations: editingAudience.motivations,
                        fears: editingAudience.fears,
                        buyingBehavior: editingAudience.buyingBehavior,
                        mediaConsumption: editingAudience.mediaConsumption,
                        decisionFactors: editingAudience.decisionFactors,
                        aiPortrait: editingAudience.aiPortrait,
                      }
                    });
                  }}
                  onCancel={() => {
                    setIsEditMode(false);
                    setEditingAudience(null);
                  }}
                  isSaving={updateAudienceMutation.isPending}
                />
              ) : (
                <AudienceDetails audience={selectedAudience} />
              )}
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Segment Dialog */}
        {editingSegment && (
          <Dialog open={!!editingSegment} onOpenChange={() => setEditingSegment(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Налаштування сегменту</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Назва</Label>
                  <Input
                    value={editingSegment.name}
                    onChange={(e) => setEditingSegment({ ...editingSegment, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Колір</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSegment.color || '#f59e0b'}
                      onChange={(e) => setEditingSegment({ ...editingSegment, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={editingSegment.color || '#f59e0b'}
                      onChange={(e) => setEditingSegment({ ...editingSegment, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Тон комунікації</Label>
                  <Select
                    value={editingSegment.communicationTone || ""}
                    onValueChange={(v) => setEditingSegment({ ...editingSegment, communicationTone: v || null })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть тон..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Формальний</SelectItem>
                      <SelectItem value="friendly">Дружній</SelectItem>
                      <SelectItem value="professional">Професійний</SelectItem>
                      <SelectItem value="casual">Неформальний</SelectItem>
                      <SelectItem value="inspirational">Надихаючий</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Опис контексту</Label>
                  <Textarea
                    value={editingSegment.contextDescription || ""}
                    onChange={(e) => setEditingSegment({ ...editingSegment, contextDescription: e.target.value })}
                    placeholder="Опишіть контекст використання цього сегменту..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Маркетингова стратегія</Label>
                  <Textarea
                    value={editingSegment.marketingStrategy || ""}
                    onChange={(e) => setEditingSegment({ ...editingSegment, marketingStrategy: e.target.value })}
                    placeholder="Яка стратегія для цього сегменту..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingSegment(null)}>
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => updateSegmentMutation.mutate({ 
                      id: editingSegment.id, 
                      data: {
                        name: editingSegment.name,
                        color: editingSegment.color,
                        communicationTone: editingSegment.communicationTone,
                        contextDescription: editingSegment.contextDescription,
                        marketingStrategy: editingSegment.marketingStrategy,
                      }
                    })}
                    disabled={!editingSegment.name.trim() || updateSegmentMutation.isPending}
                  >
                    {updateSegmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Зберегти
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Sub-Segment Dialog */}
        {editingSubSegment && (
          <Dialog open={!!editingSubSegment} onOpenChange={() => setEditingSubSegment(null)}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Налаштування підсегменту</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Назва</Label>
                  <Input
                    value={editingSubSegment.name}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Колір</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingSubSegment.color || '#60a5fa'}
                      onChange={(e) => setEditingSubSegment({ ...editingSubSegment, color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <Input
                      value={editingSubSegment.color || '#60a5fa'}
                      onChange={(e) => setEditingSubSegment({ ...editingSubSegment, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Опис контексту</Label>
                  <Textarea
                    value={editingSubSegment.contextDescription || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, contextDescription: e.target.value })}
                    placeholder="Опишіть контекст цього підсегменту..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Специфічні потреби</Label>
                  <Textarea
                    value={editingSubSegment.specificNeeds || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, specificNeeds: e.target.value })}
                    placeholder="Які специфічні потреби у цього підсегменту..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Відмінності</Label>
                  <Textarea
                    value={editingSubSegment.differentiators || ""}
                    onChange={(e) => setEditingSubSegment({ ...editingSubSegment, differentiators: e.target.value })}
                    placeholder="Чим відрізняється від інших..."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingSubSegment(null)}>
                    Скасувати
                  </Button>
                  <Button
                    onClick={() => updateSubSegmentMutation.mutate({ 
                      id: editingSubSegment.id, 
                      data: {
                        name: editingSubSegment.name,
                        color: editingSubSegment.color,
                        contextDescription: editingSubSegment.contextDescription,
                        specificNeeds: editingSubSegment.specificNeeds,
                        differentiators: editingSubSegment.differentiators,
                      }
                    })}
                    disabled={!editingSubSegment.name.trim() || updateSubSegmentMutation.isPending}
                  >
                    {updateSubSegmentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Зберегти
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Move Sub-Segment Dialog */}
        {movingSubSegment && (
          <Dialog open={!!movingSubSegment} onOpenChange={() => setMovingSubSegment(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Перемістити підсегмент</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Оберіть новий сегмент для переміщення підсегменту:
                </p>
                <Select
                  onValueChange={(value) => moveSubSegmentMutation.mutate({ id: movingSubSegment.id, newSegmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть сегмент..." />
                  </SelectTrigger>
                  <SelectContent>
                    {segments
                      .filter(s => s.id !== movingSubSegment.currentSegmentId)
                      .map((seg) => (
                        <SelectItem key={seg.id} value={seg.id}>
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4" style={{ color: seg.color || '#f59e0b' }} />
                            {seg.name}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

function PersonaInline({ 
  persona, 
  onSelect,
  onDelete,
  onGenerateAvatar,
  isGeneratingAvatar,
  small,
  className
}: { 
  persona: TargetAudience;
  onSelect: () => void;
  onDelete?: () => void;
  onGenerateAvatar?: () => void;
  isGeneratingAvatar?: boolean;
  small?: boolean;
  className?: string;
}) {
  const values = (persona.values || []) as string[];
  
  return (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group ${className || ''}`}
      onClick={onSelect}
    >
      {persona.aiPortraitImageUrl ? (
        <img 
          src={persona.aiPortraitImageUrl} 
          alt="" 
          className={`rounded-full object-cover ${small ? 'h-8 w-8' : 'h-10 w-10'}`} 
        />
      ) : (
        <div className={`rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center ${small ? 'h-8 w-8' : 'h-10 w-10'}`}>
          <User className={small ? 'h-4 w-4 text-primary' : 'h-5 w-5 text-primary'} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${small ? 'text-sm' : ''}`}>{persona.name}</span>
          {persona.isPrimary && (
            <Badge variant="default" className="text-xs">Основна</Badge>
          )}
          {!persona.isPrimary && (
            <Badge variant="outline" className="text-xs">Вторинна</Badge>
          )}
        </div>
        {persona.description && !small && (
          <p className="text-sm text-muted-foreground truncate">{persona.description}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-1">
          {persona.gender && <Badge variant="outline" className="text-xs">{persona.gender}</Badge>}
          {persona.ageRange && <Badge variant="outline" className="text-xs">{persona.ageRange}</Badge>}
          {values.length > 0 && <Badge variant="secondary" className="text-xs">+{values.length} цінностей</Badge>}
        </div>
      </div>
      <div className="hidden group-hover:flex items-center gap-1">
        {!persona.aiPortraitImageUrl && onGenerateAvatar && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateAvatar();
            }}
            disabled={isGeneratingAvatar}
            title="Згенерувати аватар"
          >
            {isGeneratingAvatar ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Image className="h-4 w-4" />
            )}
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Видалити"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function PersonaPreview({ persona }: { persona: GeneratedPersona }) {
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

function AudienceDetails({ audience }: { audience: TargetAudience }) {
  const values = (audience.values || []) as string[];
  const interests = (audience.interests || []) as string[];
  const painPoints = (audience.painPoints || []) as string[];
  const goals = (audience.goals || []) as string[];
  const motivations = (audience.motivations || []) as string[];
  const fears = (audience.fears || []) as string[];
  const mediaConsumption = (audience.mediaConsumption || []) as string[];
  const decisionFactors = (audience.decisionFactors || []) as string[];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Демографія
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {audience.gender && <p><strong>Стать:</strong> {audience.gender}</p>}
            {audience.ageRange && <p><strong>Вік:</strong> {audience.ageRange}</p>}
            {audience.location && <p><strong>Локація:</strong> {audience.location}</p>}
            {audience.income && <p><strong>Дохід:</strong> {audience.income}</p>}
            {audience.education && <p><strong>Освіта:</strong> {audience.education}</p>}
            {audience.occupation && <p><strong>Професія:</strong> {audience.occupation}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Психографіка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {values.length > 0 && (
              <div>
                <strong>Цінності:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {values.map((v, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <strong>Інтереси:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {interests.slice(0, 4).map((v, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {painPoints.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4" />
              Болі та цілі
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-destructive">Болі:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {painPoints.map((p, i) => (
                  <li key={i} className="text-muted-foreground">{p}</li>
                ))}
              </ul>
            </div>
            {goals.length > 0 && (
              <div>
                <strong className="text-green-600">Цілі:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {goals.map((g, i) => (
                    <li key={i} className="text-muted-foreground">{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {motivations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Мотивації та страхи
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong className="text-blue-600">Мотивації:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                {motivations.map((m, i) => (
                  <li key={i} className="text-muted-foreground">{m}</li>
                ))}
              </ul>
            </div>
            {fears.length > 0 && (
              <div>
                <strong className="text-orange-600">Страхи:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {fears.map((f, i) => (
                    <li key={i} className="text-muted-foreground">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audience.buyingBehavior && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Поведінка
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Поведінка при покупках:</strong> {audience.buyingBehavior}</p>
            {decisionFactors.length > 0 && (
              <div>
                <strong>Фактори рішень:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {decisionFactors.map((f, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                  ))}
                </div>
              </div>
            )}
            {mediaConsumption.length > 0 && (
              <div>
                <strong>Канали медіа:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {mediaConsumption.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {audience.aiPortrait && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Портрет
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-line">
            {audience.aiPortrait}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AudienceEditForm({ 
  audience, 
  onChange, 
  onSave, 
  onCancel, 
  isSaving 
}: { 
  audience: TargetAudience;
  onChange: (audience: TargetAudience) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const updateArrayField = (field: keyof TargetAudience, value: string) => {
    const items = value.split('\n').filter(item => item.trim());
    onChange({ ...audience, [field]: items });
  };

  const getArrayValue = (arr: unknown): string => {
    if (Array.isArray(arr)) {
      return arr.join('\n');
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Ім'я</Label>
          <Input
            value={audience.name}
            onChange={(e) => onChange({ ...audience, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Тип аудиторії</Label>
          <Select
            value={audience.isPrimary ? "primary" : "secondary"}
            onValueChange={(v) => onChange({ ...audience, isPrimary: v === "primary" })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Основна</SelectItem>
              <SelectItem value="secondary">Вторинна</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Опис</Label>
        <Textarea
          value={audience.description || ""}
          onChange={(e) => onChange({ ...audience, description: e.target.value })}
          rows={2}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Стать</Label>
          <Input
            value={audience.gender || ""}
            onChange={(e) => onChange({ ...audience, gender: e.target.value })}
            placeholder="Жінка, Чоловік..."
          />
        </div>
        <div className="space-y-2">
          <Label>Вік</Label>
          <Input
            value={audience.ageRange || ""}
            onChange={(e) => onChange({ ...audience, ageRange: e.target.value })}
            placeholder="25-35"
          />
        </div>
        <div className="space-y-2">
          <Label>Локація</Label>
          <Input
            value={audience.location || ""}
            onChange={(e) => onChange({ ...audience, location: e.target.value })}
            placeholder="Київ, Україна"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Дохід</Label>
          <Input
            value={audience.income || ""}
            onChange={(e) => onChange({ ...audience, income: e.target.value })}
            placeholder="Середній"
          />
        </div>
        <div className="space-y-2">
          <Label>Освіта</Label>
          <Input
            value={audience.education || ""}
            onChange={(e) => onChange({ ...audience, education: e.target.value })}
            placeholder="Вища"
          />
        </div>
        <div className="space-y-2">
          <Label>Професія</Label>
          <Input
            value={audience.occupation || ""}
            onChange={(e) => onChange({ ...audience, occupation: e.target.value })}
            placeholder="Маркетолог"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Цінності (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.values)}
            onChange={(e) => updateArrayField('values', e.target.value)}
            rows={4}
            placeholder="Якість&#10;Інновації&#10;Сталість"
          />
        </div>
        <div className="space-y-2">
          <Label>Інтереси (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.interests)}
            onChange={(e) => updateArrayField('interests', e.target.value)}
            rows={4}
            placeholder="Технології&#10;Подорожі&#10;Спорт"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Болі (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.painPoints)}
            onChange={(e) => updateArrayField('painPoints', e.target.value)}
            rows={4}
            placeholder="Нестача часу&#10;Високі ціни"
          />
        </div>
        <div className="space-y-2">
          <Label>Цілі (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.goals)}
            onChange={(e) => updateArrayField('goals', e.target.value)}
            rows={4}
            placeholder="Збільшити дохід&#10;Розвиток кар'єри"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Мотивації (по одній на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.motivations)}
            onChange={(e) => updateArrayField('motivations', e.target.value)}
            rows={3}
            placeholder="Успіх&#10;Визнання"
          />
        </div>
        <div className="space-y-2">
          <Label>Страхи (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.fears)}
            onChange={(e) => updateArrayField('fears', e.target.value)}
            rows={3}
            placeholder="Невдача&#10;Втрата роботи"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label>Поведінка при покупках</Label>
        <Textarea
          value={audience.buyingBehavior || ""}
          onChange={(e) => onChange({ ...audience, buyingBehavior: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Канали медіа (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.mediaConsumption)}
            onChange={(e) => updateArrayField('mediaConsumption', e.target.value)}
            rows={3}
            placeholder="Instagram&#10;YouTube&#10;Podcasts"
          />
        </div>
        <div className="space-y-2">
          <Label>Фактори рішень (по одному на рядок)</Label>
          <Textarea
            value={getArrayValue(audience.decisionFactors)}
            onChange={(e) => updateArrayField('decisionFactors', e.target.value)}
            rows={3}
            placeholder="Ціна&#10;Якість&#10;Відгуки"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>AI Портрет / Додаткова інформація</Label>
        <Textarea
          value={audience.aiPortrait || ""}
          onChange={(e) => onChange({ ...audience, aiPortrait: e.target.value })}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Скасувати
        </Button>
        <Button onClick={onSave} disabled={!audience.name.trim() || isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Зберегти
        </Button>
      </div>
    </div>
  );
}
