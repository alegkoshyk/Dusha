import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, Heart, Target, AlertTriangle, Sparkles, Upload, 
  FolderOpen, Pencil, X, Loader2, Brain, ShoppingCart, 
  TrendingUp, Zap, ImagePlus, Settings, Plus, Trash2,
  ChevronLeft, ChevronRight
} from "lucide-react";
import type { TargetAudience, DemographicSegment, DemographicSubSegment } from "@shared/schema";

interface SegmentAssignment {
  segmentName: string;
  subSegmentName?: string;
  segmentId: string;
  subSegmentId?: string;
  color?: string;
}

interface SegmentWithSubs extends DemographicSegment {
  subSegments: DemographicSubSegment[];
}

interface PersonaDetailCardProps {
  persona: TargetAudience;
  assignments?: SegmentAssignment[];
  segments?: SegmentWithSubs[];
  onClose: () => void;
  onRefresh: () => void;
  onEdit?: (persona: TargetAudience) => void;
}

export function PersonaDetailCard({ persona, assignments = [], segments = [], onClose, onRefresh, onEdit }: PersonaDetailCardProps) {
  const { toast } = useToast();
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxGallery, setLightboxGallery] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<TargetAudience>>({});
  const [selectedScenario, setSelectedScenario] = useState("using_product");
  const [localInteractionImages, setLocalInteractionImages] = useState<string[]>(
    (persona.brandInteractionImages || []) as string[]
  );

  useEffect(() => {
    setLocalInteractionImages((persona.brandInteractionImages || []) as string[]);
  }, [persona.brandInteractionImages]);

  useEffect(() => {
    if (isEditing) {
      setEditData({
        name: persona.name,
        description: persona.description,
        ageRange: persona.ageRange,
        gender: persona.gender,
        location: persona.location,
        education: persona.education,
        occupation: persona.occupation,
        income: persona.income,
        isPrimary: persona.isPrimary,
        values: persona.values,
        interests: persona.interests,
        painPoints: persona.painPoints,
        goals: persona.goals,
        motivations: persona.motivations,
        fears: persona.fears,
        mediaConsumption: persona.mediaConsumption,
        decisionFactors: persona.decisionFactors,
        aiPortrait: persona.aiPortrait,
        brandInteraction: persona.brandInteraction,
      });
    }
  }, [isEditing, persona]);

  const values = (persona.values || []) as string[];
  const interests = (persona.interests || []) as string[];
  const painPoints = (persona.painPoints || []) as string[];
  const goals = (persona.goals || []) as string[];
  const motivations = (persona.motivations || []) as string[];
  const fears = (persona.fears || []) as string[];
  const mediaConsumption = (persona.mediaConsumption || []) as string[];
  const decisionFactors = (persona.decisionFactors || []) as string[];

  const generateAvatarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/target-audiences/${persona.id}/generate-avatar`);
      if (!response.ok) throw new Error("Failed to generate avatar");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Аватар згенеровано" });
      onRefresh();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати аватар", variant: "destructive" });
    },
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (base64Data: string) => {
      const response = await apiRequest("POST", `/api/target-audiences/${persona.id}/upload-avatar`, { base64Data });
      if (!response.ok) throw new Error("Failed to upload avatar");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Фото завантажено" });
      onRefresh();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося завантажити фото", variant: "destructive" });
    },
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async (data: Partial<TargetAudience>) => {
      const response = await apiRequest("PATCH", `/api/target-audiences/${persona.id}`, data);
      if (!response.ok) throw new Error("Failed to update persona");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персону оновлено" });
      setIsEditing(false);
      onRefresh();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити персону", variant: "destructive" });
    },
  });

  const generateInteractionMutation = useMutation({
    mutationFn: async (scenario: string) => {
      const response = await apiRequest("POST", `/api/target-audiences/${persona.id}/generate-interaction`, { scenario });
      if (!response.ok) throw new Error("Failed to generate image");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        setLocalInteractionImages(prev => [...prev, data.imageUrl]);
        toast({ title: "Успішно", description: "Зображення згенеровано" });
        onRefresh();
      }
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати зображення", variant: "destructive" });
    },
  });

  const assignToSegmentMutation = useMutation({
    mutationFn: async ({ segmentId, subSegmentId }: { segmentId: string; subSegmentId?: string }) => {
      const response = await apiRequest("POST", `/api/target-audiences/${persona.id}/segment-assignments`, { 
        segmentId,
        subSegmentId 
      });
      if (!response.ok) throw new Error("Failed to assign");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персону призначено до сегменту" });
      onRefresh();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося призначити персону", variant: "destructive" });
    },
  });

  const unassignFromSegmentMutation = useMutation({
    mutationFn: async ({ segmentId, subSegmentId }: { segmentId: string; subSegmentId?: string }) => {
      // Find the assignment ID first
      const assignmentsRes = await apiRequest("GET", `/api/target-audiences/${persona.id}/segment-assignments`);
      if (!assignmentsRes.ok) throw new Error("Failed to get assignments");
      const allAssignments = await assignmentsRes.json();
      const assignment = allAssignments.find((a: { segmentId: string; subSegmentId?: string }) => 
        a.segmentId === segmentId && (subSegmentId ? a.subSegmentId === subSegmentId : !a.subSegmentId)
      );
      if (!assignment) throw new Error("Assignment not found");
      
      const response = await apiRequest("DELETE", `/api/target-audiences/${persona.id}/segment-assignments/${assignment.id}`);
      if (!response.ok) throw new Error("Failed to unassign");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персону видалено з сегменту" });
      onRefresh();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити персону з сегменту", variant: "destructive" });
    },
  });

  const isAssignedTo = (segmentId: string, subSegmentId?: string) => {
    return assignments.some(a => 
      a.segmentId === segmentId && 
      (subSegmentId ? a.subSegmentId === subSegmentId : !a.subSegmentId)
    );
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result as string;
        uploadAvatarMutation.mutate(base64Data);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const scenarioOptions = [
    { value: "using_product", label: "Використовує продукт" },
    { value: "discovering_brand", label: "Відкриває бренд" },
    { value: "recommending", label: "Рекомендує друзям" },
    { value: "daily_life", label: "У повсякденному житті" },
    { value: "at_work", label: "На роботі" },
    { value: "social_media", label: "В соцмережах" },
    { value: "event", label: "На заході бренду" },
  ];

  const isAvatarLoading = generateAvatarMutation.isPending || uploadAvatarMutation.isPending;

  return (
    <>
      <Dialog open={!!lightboxImage} onOpenChange={(open) => { if (!open) { setLightboxImage(null); setLightboxGallery([]); setLightboxIndex(0); } }}>
        <DialogContent className="max-w-2xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Перегляд зображення</DialogTitle>
          </DialogHeader>
          {lightboxImage && (
            <div className="relative">
              <img src={lightboxImage} alt="Повнорозмірне зображення" className="w-full h-auto rounded-lg" />
              {lightboxGallery.length > 1 && (
                <>
                  <button
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                    onClick={() => {
                      const newIndex = lightboxIndex === 0 ? lightboxGallery.length - 1 : lightboxIndex - 1;
                      setLightboxIndex(newIndex);
                      setLightboxImage(lightboxGallery[newIndex]);
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
                    onClick={() => {
                      const newIndex = lightboxIndex === lightboxGallery.length - 1 ? 0 : lightboxIndex + 1;
                      setLightboxIndex(newIndex);
                      setLightboxImage(lightboxGallery[newIndex]);
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {lightboxIndex + 1} / {lightboxGallery.length}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {persona.name}
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="mb-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Призначено до сегментів:</Label>
              {segments.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowAssignDialog(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Призначити
                </Button>
              )}
            </div>
            {assignments.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {assignments.map((a, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs group" style={{ borderColor: a.color, color: a.color }}>
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {a.subSegmentName ? `${a.segmentName} → ${a.subSegmentName}` : a.segmentName}
                    <button
                      className="ml-1 opacity-50 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        unassignFromSegmentMutation.mutate({ segmentId: a.segmentId, subSegmentId: a.subSegmentId });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Не призначено до жодного сегменту</p>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="relative group shrink-0">
              <button
                onClick={() => persona.aiPortraitImageUrl && setLightboxImage(persona.aiPortraitImageUrl)}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                disabled={isAvatarLoading}
              >
                {isAvatarLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : persona.aiPortraitImageUrl ? (
                  <img src={persona.aiPortraitImageUrl} alt={persona.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </button>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => generateAvatarMutation.mutate()}
                  disabled={isAvatarLoading}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={handleAvatarUpload}
                  disabled={isAvatarLoading}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={persona.isPrimary ? "default" : "secondary"}>
                  {persona.isPrimary ? "Основна" : "Вторинна"}
                </Badge>
              </div>
              {persona.description && (
                <p className="text-sm text-muted-foreground">{persona.description}</p>
              )}
              {persona.occupation && persona.ageRange && (
                <p className="text-sm text-muted-foreground mt-1">
                  {persona.occupation}, {persona.ageRange}
                </p>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ім'я</Label>
                  <Input
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <Select
                    value={editData.isPrimary ? "primary" : "secondary"}
                    onValueChange={(v) => setEditData({ ...editData, isPrimary: v === "primary" })}
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
                  value={editData.description || ""}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <Separator className="my-2" />
              <h4 className="font-medium text-sm">Демографія</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Вік</Label>
                  <Input
                    value={editData.ageRange || ""}
                    onChange={(e) => setEditData({ ...editData, ageRange: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Стать</Label>
                  <Select 
                    value={editData.gender || ""} 
                    onValueChange={(value) => setEditData({ ...editData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть стать" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="чоловік">Чоловік</SelectItem>
                      <SelectItem value="жінка">Жінка</SelectItem>
                      <SelectItem value="інше">Інше</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Локація</Label>
                  <Input
                    value={editData.location || ""}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Освіта</Label>
                  <Input
                    value={editData.education || ""}
                    onChange={(e) => setEditData({ ...editData, education: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Професія</Label>
                  <Input
                    value={editData.occupation || ""}
                    onChange={(e) => setEditData({ ...editData, occupation: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дохід</Label>
                  <Input
                    value={editData.income || ""}
                    onChange={(e) => setEditData({ ...editData, income: e.target.value })}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm">Психографіка</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Цінності (через кому)</Label>
                  <Textarea
                    value={((editData.values as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, values: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Інтереси (через кому)</Label>
                  <Textarea
                    value={((editData.interests as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, interests: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm">Болі та цілі</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Болі (через кому)</Label>
                  <Textarea
                    value={((editData.painPoints as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, painPoints: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Цілі (через кому)</Label>
                  <Textarea
                    value={((editData.goals as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, goals: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm">Мотивації та страхи</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Мотивації (через кому)</Label>
                  <Textarea
                    value={((editData.motivations as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, motivations: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Страхи (через кому)</Label>
                  <Textarea
                    value={((editData.fears as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, fears: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm">Поведінка</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Фактори рішень (через кому)</Label>
                  <Textarea
                    value={((editData.decisionFactors as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, decisionFactors: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Споживання медіа (через кому)</Label>
                  <Textarea
                    value={((editData.mediaConsumption as string[]) || []).join(", ")}
                    onChange={(e) => setEditData({ ...editData, mediaConsumption: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    rows={2}
                  />
                </div>
              </div>

              <Separator className="my-2" />
              <h4 className="font-medium text-sm">AI-портрет</h4>
              <div className="space-y-2">
                <Label>Загальний AI-портрет</Label>
                <Textarea
                  value={(editData.aiPortrait as string) || ""}
                  onChange={(e) => setEditData({ ...editData, aiPortrait: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Взаємодія з брендом</Label>
                <Textarea
                  value={(editData.brandInteraction as string) || ""}
                  onChange={(e) => setEditData({ ...editData, brandInteraction: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Скасувати</Button>
                <Button onClick={() => updatePersonaMutation.mutate(editData)} disabled={updatePersonaMutation.isPending}>
                  {updatePersonaMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Зберегти
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Демографія
                  </h4>
                  <div className="space-y-1 text-sm">
                    {persona.ageRange && <p><span className="text-muted-foreground">Вік:</span> {persona.ageRange}</p>}
                    {persona.gender && <p><span className="text-muted-foreground">Стать:</span> {persona.gender}</p>}
                    {persona.location && <p><span className="text-muted-foreground">Локація:</span> {persona.location}</p>}
                    {persona.education && <p><span className="text-muted-foreground">Освіта:</span> {persona.education}</p>}
                    {persona.occupation && <p><span className="text-muted-foreground">Професія:</span> {persona.occupation}</p>}
                    {persona.income && <p><span className="text-muted-foreground">Дохід:</span> {persona.income}</p>}
                  </div>
                </div>

                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    Психографіка
                  </h4>
                  {values.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Цінності:</p>
                      <div className="flex flex-wrap gap-1">
                        {values.map((v, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {interests.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Інтереси:</p>
                      <div className="flex flex-wrap gap-1">
                        {interests.map((v, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(painPoints.length > 0 || goals.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {painPoints.length > 0 && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2 text-red-500">
                        <AlertTriangle className="h-4 w-4" />
                        Болі
                      </h4>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {painPoints.map((p, i) => <li key={i}>{p}</li>)}
                      </ul>
                    </div>
                  )}
                  {goals.length > 0 && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2 text-green-500">
                        <Target className="h-4 w-4" />
                        Цілі
                      </h4>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {goals.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(motivations.length > 0 || fears.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                  {motivations.length > 0 && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2 text-blue-500">
                        <TrendingUp className="h-4 w-4" />
                        Мотивації
                      </h4>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {motivations.map((m, i) => <li key={i}>{m}</li>)}
                      </ul>
                    </div>
                  )}
                  {fears.length > 0 && (
                    <div className="space-y-2 p-3 rounded-lg bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2 text-orange-500">
                        <Zap className="h-4 w-4" />
                        Страхи
                      </h4>
                      <ul className="space-y-1 text-sm list-disc list-inside">
                        {fears.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {(decisionFactors.length > 0 || mediaConsumption.length > 0) && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Поведінка
                  </h4>
                  {decisionFactors.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Фактори рішень:</p>
                      <div className="flex flex-wrap gap-1">
                        {decisionFactors.map((d, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {mediaConsumption.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Споживання медіа:</p>
                      <div className="flex flex-wrap gap-1">
                        {mediaConsumption.map((m, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(persona.aiPortrait || persona.brandInteraction) && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                  <h4 className="font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    AI-портрет
                  </h4>
                  {persona.aiPortrait && (
                    <p className="text-sm whitespace-pre-line">{persona.aiPortrait}</p>
                  )}
                  {persona.brandInteraction && (
                    <p className="text-sm">{persona.brandInteraction}</p>
                  )}
                </div>
              )}

              <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                <h4 className="font-medium flex items-center gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Взаємодія з брендом
                </h4>
                {localInteractionImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {localInteractionImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setLightboxGallery(localInteractionImages);
                          setLightboxIndex(idx);
                          setLightboxImage(img);
                        }}
                        className="w-16 h-16 rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarioOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => generateInteractionMutation.mutate(selectedScenario)}
                    disabled={generateInteractionMutation.isPending}
                  >
                    {generateInteractionMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Segment Assignment Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Призначити до сегменту
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {segments.map((seg) => (
              <div key={seg.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isAssignedTo(seg.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        assignToSegmentMutation.mutate({ segmentId: seg.id });
                      } else {
                        unassignFromSegmentMutation.mutate({ segmentId: seg.id });
                      }
                    }}
                  />
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: seg.color || '#f59e0b' }}
                  />
                  <span className="font-medium text-sm">{seg.name}</span>
                </div>
                {seg.subSegments && seg.subSegments.length > 0 && (
                  <div className="ml-6 space-y-1">
                    {seg.subSegments.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={isAssignedTo(seg.id, sub.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              assignToSegmentMutation.mutate({ segmentId: seg.id, subSegmentId: sub.id });
                            } else {
                              unassignFromSegmentMutation.mutate({ segmentId: seg.id, subSegmentId: sub.id });
                            }
                          }}
                        />
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: sub.color || '#60a5fa' }}
                        />
                        <span className="text-sm text-muted-foreground">{sub.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {segments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Немає доступних сегментів. Створіть сегменти для призначення персон.
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
