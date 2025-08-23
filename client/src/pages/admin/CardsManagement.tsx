import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, Trash2, Plus, Save, GripVertical } from "lucide-react";
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

// Sortable Card Component
function SortableCard({ card, onEdit, onDelete }: { 
  card: GameCard; 
  onEdit: (card: GameCard) => void; 
  onDelete: (cardId: string) => void; 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  return (
    <Card ref={setNodeRef} style={style} className="relative cursor-move h-fit">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div 
              className="flex items-center justify-center w-5 h-5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mt-0.5 flex-shrink-0"
              {...attributes} 
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
            </div>
            <div className="space-y-1.5 flex-1 min-w-0">
              <CardTitle className="text-xs font-medium leading-tight line-clamp-2">
                {card.title}
              </CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge className={`${getDifficultyColor(card.difficulty)} text-xs px-1 py-0`}>
                  {card.difficulty}
                </Badge>
                <Badge className={`${getTypeColor(card.type)} text-xs px-1 py-0`}>
                  {card.type}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => onEdit(card)}
              data-testid={`button-edit-${card.id}`}
              className="h-6 w-6 p-0"
            >
              <Edit className="h-3 w-3" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                  data-testid={`button-delete-${card.id}`}
                >
                  <Trash2 className="h-3 w-3" />
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
                    onClick={() => onDelete(card.id)}
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
      <CardContent className="pt-0 pb-3">
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {card.shortDescription}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="truncate font-mono">#{card.positionX}</span>
          <span>{card.estimatedTime}хв</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CardsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<GameCard | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: cards, isLoading } = useQuery<GameCard[]>({
    queryKey: ["/api/admin/cards"],
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ cardId, cardData }: { cardId: string; cardData: Partial<GameCard> }) => {
      return await apiRequest("PUT", `/api/admin/cards/${cardId}`, cardData);
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
      return await apiRequest("DELETE", `/api/admin/cards/${cardId}`);
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

  const updateCardsOrderMutation = useMutation({
    mutationFn: async (cards: { id: string; positionX: number }[]) => {
      const response = await apiRequest("POST", "/api/admin/cards/reorder", { cards });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cards"] });
      toast({
        title: "Порядок оновлено",
        description: "Новий порядок карток збережено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити порядок карток",
        variant: "destructive",
      });
    },
  });

  const normalizePositionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/cards/normalize-positions");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cards"] });
      toast({
        title: "Позиції виправлено",
        description: "Нумерація карток починається з 1 для кожного рівня",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося виправити позиції карток",
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

  const handleDragEnd = (event: DragEndEvent, levelCards: GameCard[]) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      const oldIndex = levelCards.findIndex((card) => card.id === active.id);
      const newIndex = levelCards.findIndex((card) => card.id === over.id);
      
      const reorderedCards = arrayMove(levelCards, oldIndex, newIndex);
      
      // Update positions sequentially from 1 - horizontal then vertical ordering
      const cardsWithNewPositions = reorderedCards.map((card, index) => ({
        id: card.id,
        positionX: index + 1,
      }));
      
      updateCardsOrderMutation.mutate(cardsWithNewPositions);
    }
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
          <Button 
            variant="outline"
            onClick={() => normalizePositionsMutation.mutate()}
            disabled={normalizePositionsMutation.isPending}
            data-testid="button-normalize-positions"
            className="flex items-center gap-2"
          >
            {normalizePositionsMutation.isPending ? "Виправляємо..." : "Виправити позиції"}
          </Button>
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
      {Object.entries(cardsByLevel).map(([levelId, levelCards]) => {
        // Sort cards by positionX for proper display order
        const sortedCards = [...levelCards].sort((a, b) => a.positionX - b.positionX);
        
        return (
          <Card key={levelId}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Рівень: {levelId.toUpperCase()}</span>
                <Badge variant="secondary">{levelCards.length} карток</Badge>
              </CardTitle>
              <CardDescription>
                Перетягніть картки за іконку ⋮⋮ щоб змінити порядок. Позиції йдуть зліва направо, зверху вниз.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, sortedCards)}
              >
                <SortableContext items={sortedCards.map(card => card.id)}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedCards.map((card) => (
                      <SortableCard
                        key={card.id}
                        card={card}
                        onEdit={(card) => {
                          setEditingCard(card);
                          setIsDialogOpen(true);
                        }}
                        onDelete={handleDeleteCard}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        );
      })}

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редагувати Картку</DialogTitle>
            <DialogDescription>
              Внесіть зміни до картки "{editingCard?.title}"
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
    </div>
  );
}