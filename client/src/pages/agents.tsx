import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Sparkles,
  Loader2,
  Bot,
  Brain,
  Target,
  Lightbulb,
  Rocket,
  Star,
  Zap,
  Heart,
  Crown,
  Shield,
  Flame,
  Eye,
  MessageSquare
} from "lucide-react";
import type { UserAgent } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AGENT_ICONS: { [key: string]: React.ComponentType<{ className?: string }> } = {
  Bot,
  Brain,
  Target,
  Lightbulb,
  Rocket,
  Star,
  Zap,
  Heart,
  Crown,
  Shield,
  Flame,
  Eye,
  Sparkles,
  MessageSquare
};

const ICON_OPTIONS = Object.keys(AGENT_ICONS);

export default function AgentsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<UserAgent | null>(null);
  const [deleteAgent, setDeleteAgent] = useState<UserAgent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateDescription, setGenerateDescription] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    icon: "Bot",
    description: "",
    context: "",
    personality: "",
    expertise: [] as string[],
    isActive: true
  });
  const [expertiseInput, setExpertiseInput] = useState("");

  const { data: agents, isLoading, error } = useQuery<UserAgent[]>({
    queryKey: ["/api/agents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/agents", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create agent");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Агента створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const response = await apiRequest("PATCH", `/api/agents/${id}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update agent");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Агента оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const response = await apiRequest("DELETE", `/api/agents/${agentId}`);
      if (!response.ok) throw new Error("Failed to delete agent");
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Агента видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      setDeleteAgent(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити агента", variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (description: string) => {
      const response = await apiRequest("POST", "/api/agents/generate", { description });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate agent");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setFormData({
        name: data.name || "",
        icon: data.icon && ICON_OPTIONS.includes(data.icon) ? data.icon : "Bot",
        description: data.description || "",
        context: data.context || "",
        personality: data.personality || "",
        expertise: Array.isArray(data.expertise) ? data.expertise : [],
        isActive: true
      });
      setGenerateDescription("");
      toast({ title: "Успішно", description: "Дані агента згенеровано" });
    },
    onError: (error: Error) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      icon: "Bot",
      description: "",
      context: "",
      personality: "",
      expertise: [],
      isActive: true
    });
    setExpertiseInput("");
    setSelectedAgent(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (agent: UserAgent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      icon: agent.icon || "Bot",
      description: agent.description || "",
      context: agent.context,
      personality: agent.personality || "",
      expertise: agent.expertise || [],
      isActive: agent.isActive ?? true
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.context.trim()) {
      toast({ title: "Помилка", description: "Назва та контекст обов'язкові", variant: "destructive" });
      return;
    }

    if (selectedAgent) {
      updateMutation.mutate({ id: selectedAgent.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertiseInput.trim()]
      });
      setExpertiseInput("");
    }
  };

  const removeExpertise = (item: string) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter(e => e !== item)
    });
  };

  const filteredAgents = agents?.filter(agent => 
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIconComponent = (iconName: string) => {
    const IconComponent = AGENT_ICONS[iconName] || Bot;
    return <IconComponent className="h-6 w-6" />;
  };

  if (error) {
    const errorMessage = (error as Error).message;
    if (errorMessage.includes("403") || errorMessage.includes("підписок")) {
      return (
        <div className="container mx-auto p-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            До панелі
          </Button>
          <Card className="max-w-md mx-auto mt-20">
            <CardHeader className="text-center">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <CardTitle>AI Агенти</CardTitle>
              <CardDescription>
                Створюйте власних AI асистентів для роботи з вашими брендами
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4">
                Ця функція доступна тільки для платних підписок
              </p>
              <Button onClick={() => navigate("/pricing")}>
                Переглянути тарифи
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" />
        До панелі
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">AI Агенти</h1>
          <p className="text-muted-foreground mt-1">
            Створюйте спеціалізованих AI асистентів для роботи з брендами
          </p>
        </div>
        <Button onClick={openCreateDialog} disabled={agents && agents.length >= 10}>
          <Plus className="h-4 w-4 mr-2" />
          Новий агент
        </Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Пошук агентів..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {agents && agents.length >= 10 && (
        <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 p-4 rounded-lg mb-6">
          Ви досягли максимальної кількості агентів (10). Видаліть існуючих агентів, щоб створити нових.
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${!agent.isActive ? 'opacity-60' : ''}`}
              onClick={() => openEditDialog(agent)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getIconComponent(agent.icon || "Bot")}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      {!agent.isActive && (
                        <Badge variant="secondary" className="mt-1">Неактивний</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(agent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteAgent(agent)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {agent.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {agent.description}
                  </p>
                )}
                {agent.expertise && agent.expertise.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {agent.expertise.slice(0, 3).map((exp, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {exp}
                      </Badge>
                    ))}
                    {agent.expertise.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.expertise.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Немає агентів</h3>
            <p className="text-muted-foreground mb-4">
              Створіть свого першого AI агента для роботи з брендами
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Створити агента
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAgent ? "Редагувати агента" : "Новий AI агент"}
            </DialogTitle>
            <DialogDescription>
              Налаштуйте свого спеціалізованого AI асистента
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!selectedAgent && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <Label>Автоматична генерація</Label>
                <p className="text-sm text-muted-foreground">
                  Опишіть, якого агента ви хочете створити, і AI заповнить всі поля
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Наприклад: Експерт з digital маркетингу для стартапів"
                    value={generateDescription}
                    onChange={(e) => setGenerateDescription(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && generateDescription.length >= 10) {
                        generateMutation.mutate(generateDescription);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => generateMutation.mutate(generateDescription)}
                    disabled={generateDescription.length < 10 || generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Назва*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Маркетинг-гуру"
                  maxLength={50}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Іконка</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        {getIconComponent(formData.icon)}
                        <span>{formData.icon}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {getIconComponent(icon)}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Короткий опис</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Спеціаліст з digital маркетингу та стратегій зростання"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="context">Контекст та інструкції*</Label>
              <Textarea
                id="context"
                value={formData.context}
                onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                placeholder="Детальні інструкції для агента: як він має поводитись, на чому фокусуватись, який стиль комунікації використовувати..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Цей контекст буде додано до кожного запиту в чаті при роботі з цим агентом
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personality">Особистість</Label>
              <Input
                id="personality"
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Дружній, професійний, креативний"
              />
            </div>

            <div className="space-y-2">
              <Label>Сфери експертизи</Label>
              <div className="flex gap-2">
                <Input
                  value={expertiseInput}
                  onChange={(e) => setExpertiseInput(e.target.value)}
                  placeholder="Додати сферу експертизи"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addExpertise();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addExpertise}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.expertise.map((exp, i) => (
                    <Badge 
                      key={i} 
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => removeExpertise(exp)}
                    >
                      {exp} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Активний агент</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Скасувати
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {selectedAgent ? "Зберегти" : "Створити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAgent} onOpenChange={() => setDeleteAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити агента?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити агента "{deleteAgent?.name}"? 
              Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAgent && deleteMutation.mutate(deleteAgent.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Видалити"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
