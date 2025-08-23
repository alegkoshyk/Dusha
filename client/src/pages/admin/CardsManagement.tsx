import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Plus, Save } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GameCard {
  id: string;
  levelId: string;
  title: string;
  description: string;
  shortDescription: string;
  hint?: string;
  type: "text" | "choice" | "values" | "reflection" | "completion" | "archetype";
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: number;
  required: boolean;
  positionX: number;
  positionY: number;
  level?: {
    id: string;
    name: string;
    color: string;
  };
  properties?: Array<{
    id: number;
    type: string;
    key: string;
    label?: string;
    description?: string;
  }>;
}

export default function CardsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<GameCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: cards, isLoading } = useQuery<GameCard[]>({
    queryKey: ["/api/admin/cards"],
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, cardData }: { cardId: string; cardData: Partial<GameCard> }) => {
      return await apiRequest(`/api/admin/cards/${cardId}`, {
        method: "PUT",
        body: JSON.stringify(cardData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cards"] });
      toast({
        title: "Картка оновлена",
        description: "Зміни успішно збережені",
      });
      setIsDialogOpen(false);
      setEditingCard(null);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити картку",
        variant: "destructive",
      });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      return await apiRequest(`/api/admin/cards/${cardId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cards"] });
      toast({
        title: "Картка видалена",
        description: "Картка успішно видалена з системи",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити картку",
        variant: "destructive",
      });
    },
  });

  const handleSaveCard = () => {
    if (!editingCard) return;
    
    updateCardMutation.mutate({
      cardId: editingCard.id,
      cardData: editingCard,
    });
  };

  const handleDeleteCard = (cardId: string) => {
    deleteCardMutation.mutate(cardId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "text": return "bg-blue-100 text-blue-800";
      case "choice": return "bg-purple-100 text-purple-800";
      case "values": return "bg-green-100 text-green-800";
      case "archetype": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження карток...</div>
        </div>
      </div>
    );
  }

  const cardsByLevel = cards?.reduce((acc, card) => {
    const levelId = card.levelId;
    if (!acc[levelId]) acc[levelId] = [];
    acc[levelId].push(card);
    return acc;
  }, {} as Record<string, GameCard[]>) || {};

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управління Картками</h1>
          <p className="text-gray-500 mt-2">Редагування ігрових карток та їх властивостей</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/rcadmin/cards/new">
            <Button className="flex items-center gap-2" data-testid="button-create-new-card">
              <Plus className="h-4 w-4" />
              Створити Картку
            </Button>
          </Link>
          <Link href="/rcadmin">
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      {/* Cards by Level */}
      {Object.entries(cardsByLevel).map(([levelId, levelCards]) => (
        <Card key={levelId}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Рівень: {levelId.toUpperCase()}</span>
              <Badge variant="secondary">{levelCards.length} карток</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levelCards.map((card) => (
                <Card key={card.id} className="relative">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <CardTitle className="text-sm font-medium leading-tight">
                          {card.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={getDifficultyColor(card.difficulty)}>
                            {card.difficulty}
                          </Badge>
                          <Badge className={getTypeColor(card.type)}>
                            {card.type}
                          </Badge>
                          <Badge variant="outline">
                            {card.estimatedTime}хв
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Dialog open={isDialogOpen && editingCard?.id === card.id} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => {
                                setEditingCard(card);
                                setIsDialogOpen(true);
                              }}
                              data-testid={`button-edit-${card.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Редагувати Картку</DialogTitle>
                              <DialogDescription>
                                Внесіть зміни до картки "{card.title}"
                              </DialogDescription>
                            </DialogHeader>
                            {editingCard && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor="title">Назва</Label>
                                    <Input
                                      id="title"
                                      value={editingCard.title}
                                      onChange={(e) => setEditingCard({
                                        ...editingCard,
                                        title: e.target.value
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="type">Тип</Label>
                                    <Select 
                                      value={editingCard.type} 
                                      onValueChange={(value) => setEditingCard({
                                        ...editingCard,
                                        type: value as any
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="choice">Choice</SelectItem>
                                        <SelectItem value="values">Values</SelectItem>
                                        <SelectItem value="archetype">Archetype</SelectItem>
                                        <SelectItem value="reflection">Reflection</SelectItem>
                                        <SelectItem value="completion">Completion</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="description">Опис</Label>
                                  <Textarea
                                    id="description"
                                    value={editingCard.description}
                                    onChange={(e) => setEditingCard({
                                      ...editingCard,
                                      description: e.target.value
                                    })}
                                    rows={3}
                                  />
                                </div>

                                <div>
                                  <Label htmlFor="shortDescription">Короткий опис</Label>
                                  <Input
                                    id="shortDescription"
                                    value={editingCard.shortDescription}
                                    onChange={(e) => setEditingCard({
                                      ...editingCard,
                                      shortDescription: e.target.value
                                    })}
                                  />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                  <div>
                                    <Label htmlFor="difficulty">Складність</Label>
                                    <Select 
                                      value={editingCard.difficulty} 
                                      onValueChange={(value) => setEditingCard({
                                        ...editingCard,
                                        difficulty: value as any
                                      })}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="estimatedTime">Час (хв)</Label>
                                    <Input
                                      id="estimatedTime"
                                      type="number"
                                      value={editingCard.estimatedTime}
                                      onChange={(e) => setEditingCard({
                                        ...editingCard,
                                        estimatedTime: parseInt(e.target.value) || 0
                                      })}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="positionX">Позиція X</Label>
                                    <Input
                                      id="positionX"
                                      type="number"
                                      value={editingCard.positionX}
                                      onChange={(e) => setEditingCard({
                                        ...editingCard,
                                        positionX: parseInt(e.target.value) || 0
                                      })}
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Скасувати
                                  </Button>
                                  <Button 
                                    onClick={handleSaveCard}
                                    disabled={updateCardMutation.isPending}
                                    data-testid="button-save-card"
                                  >
                                    <Save className="h-4 w-4 mr-2" />
                                    {updateCardMutation.isPending ? "Збереження..." : "Зберегти"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-${card.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Видалити картку?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Ця дія незворотна. Картка "{card.title}" буде видалена назавжди разом із усіма відповідями користувачів.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Скасувати</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteCard(card.id)}
                                className="bg-red-600 hover:bg-red-700"
                                data-testid="button-confirm-delete"
                              >
                                Видалити
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {card.shortDescription}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>ID: {card.id}</span>
                      <span>{card.properties?.length || 0} властивостей</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}