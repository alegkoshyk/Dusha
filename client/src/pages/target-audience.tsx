import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, Plus, Users, Sparkles, Loader2, Trash2, 
  User, MapPin, Briefcase, GraduationCap, Heart, Target, 
  DollarSign, Quote, Brain, ShoppingBag
} from "lucide-react";
import type { UserBrand, TargetAudience } from "@shared/schema";

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

export default function TargetAudiencePage() {
  const params = useParams<{ brandId: string }>();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(null);
  const [audienceType, setAudienceType] = useState<"primary" | "secondary" | "niche">("primary");
  const [newAudienceName, setNewAudienceName] = useState("");

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
      setSelectedAudience(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити аудиторію", variant: "destructive" });
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

  const isLoading = brandLoading || audiencesLoading;

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
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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

        {audiences.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Немає цільових аудиторій</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Створіть портрети ваших ідеальних клієнтів за допомогою AI-аналізу вашого бренду
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Створити першу ЦА
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audiences.map((audience) => (
              <AudienceCard 
                key={audience.id} 
                audience={audience}
                onSelect={() => setSelectedAudience(audience)}
                onDelete={() => deleteAudienceMutation.mutate(audience.id)}
              />
            ))}
          </div>
        )}

        {selectedAudience && (
          <Dialog open={!!selectedAudience} onOpenChange={() => setSelectedAudience(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {selectedAudience.name}
                </DialogTitle>
              </DialogHeader>
              <AudienceDetails audience={selectedAudience} />
            </DialogContent>
          </Dialog>
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

function AudienceCard({ 
  audience, 
  onSelect, 
  onDelete 
}: { 
  audience: TargetAudience; 
  onSelect: () => void;
  onDelete: () => void;
}) {
  const values = (audience.values || []) as string[];
  
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onSelect}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{audience.name}</CardTitle>
              <CardDescription className="text-xs">
                {audience.isPrimary ? "Основна" : "Вторинна"}
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {audience.description && (
          <p className="text-sm text-muted-foreground mb-3">{audience.description}</p>
        )}
        <div className="flex flex-wrap gap-1">
          {audience.gender && (
            <Badge variant="outline" className="text-xs">{audience.gender}</Badge>
          )}
          {audience.ageRange && (
            <Badge variant="outline" className="text-xs">{audience.ageRange} років</Badge>
          )}
          {audience.location && (
            <Badge variant="outline" className="text-xs">{audience.location}</Badge>
          )}
          {values.length > 0 && (
            <Badge variant="secondary" className="text-xs">+{values.length} цінностей</Badge>
          )}
        </div>
      </CardContent>
    </Card>
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
