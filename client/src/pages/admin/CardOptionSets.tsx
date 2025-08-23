import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Edit, Trash2, Save, Settings2, List } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CardOptionSet {
  id: string;
  name: string;
  description?: string;
  cardTypeId: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CardOption {
  id: string;
  optionSetId: string;
  name: string;
  description?: string;
  value: string;
  icon?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const cardTypes = [
  { id: "choice", name: "Вибір варіанту", icon: "✓", color: "purple" },
  { id: "archetype", name: "Архетип", icon: "🎭", color: "orange" },
  { id: "values", name: "Цінності", icon: "💎", color: "green" },
  { id: "text", name: "Текст", icon: "📝", color: "blue" },
  { id: null, name: "Універсальний", icon: "⚡", color: "gray" },
];

export default function CardOptionSets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);
  const [editingOptionSet, setEditingOptionSet] = useState<CardOptionSet | null>(null);
  const [editingOption, setEditingOption] = useState<CardOption | null>(null);
  const [selectedOptionSet, setSelectedOptionSet] = useState<string | null>(null);

  // Fetch card option sets - використовуємо демонстраційні дані поки таблиці не створені
  const { data: optionSets, isLoading } = useQuery<CardOptionSet[]>({
    queryKey: ["/api/admin/card-option-sets"],
    staleTime: 1000 * 60 * 5, // 5 хвилин
    retry: false,
    queryFn: () => {
      // Демонстраційні дані для тестування
      return Promise.resolve([
        {
          id: "1",
          name: "Архетипи бренду",
          description: "Класичні архетипи для вибору ідентичності бренду",
          cardTypeId: "archetype",
          isDefault: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "2", 
          name: "Базові цінності",
          description: "Основні цінності бренду",
          cardTypeId: "values",
          isDefault: false,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]);
    }
  });

  // Fetch options for selected set - демонстраційні дані
  const { data: options } = useQuery<CardOption[]>({
    queryKey: ["/api/admin/card-options", selectedOptionSet],
    enabled: !!selectedOptionSet,
    retry: false,
    queryFn: () => {
      if (selectedOptionSet === "1") {
        // Архетипи бренду - всі 12 класичних архетипів
        return Promise.resolve([
          {
            id: "1",
            optionSetId: "1",
            name: "Невинний",
            description: "Оптимізм, довіра, чистота намірів",
            value: "innocent",
            icon: "☀️",
            order: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "2",
            optionSetId: "1", 
            name: "Мудрець",
            description: "Знання, розуміння, істина",
            value: "sage",
            icon: "🧠",
            order: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "3",
            optionSetId: "1",
            name: "Дослідник",
            description: "Свобода, пригоди, автентичність",
            value: "explorer",
            icon: "🌍",
            order: 3,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "4",
            optionSetId: "1",
            name: "Герой",
            description: "Мужність, майстерність, тріумф",
            value: "hero",
            icon: "⚡",
            order: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "5",
            optionSetId: "1",
            name: "Бунтар",
            description: "Революція, свобода, зміни",
            value: "rebel",
            icon: "🔥",
            order: 5,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "6",
            optionSetId: "1",
            name: "Маг",
            description: "Перетворення, візія, харизма",
            value: "magician",
            icon: "✨",
            order: 6,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "7",
            optionSetId: "1",
            name: "Простодушний",
            description: "Належність, реалізм, емпатія",
            value: "everyman",
            icon: "👥",
            order: 7,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "8",
            optionSetId: "1",
            name: "Коханець",
            description: "Пристрасть, близькість, відданість",
            value: "lover",
            icon: "❤️",
            order: 8,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "9",
            optionSetId: "1",
            name: "Блазень",
            description: "Веселощі, легкість, момент",
            value: "jester",
            icon: "🃏",
            order: 9,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "10",
            optionSetId: "1",
            name: "Піклувальник",
            description: "Служіння, співчуття, щедрість",
            value: "caregiver",
            icon: "🤗",
            order: 10,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "11",
            optionSetId: "1",
            name: "Правитель",
            description: "Відповідальність, лідерство, контроль",
            value: "ruler",
            icon: "👑",
            order: 11,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "12",
            optionSetId: "1",
            name: "Творець",
            description: "Творчість, уява, артистизм",
            value: "creator",
            icon: "🎨",
            order: 12,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]);
      } else if (selectedOptionSet === "2") {
        // Базові цінності
        return Promise.resolve([
          {
            id: "v1",
            optionSetId: "2",
            name: "Чесність",
            description: "Прозорість та правдивість у всіх справах",
            value: "honesty",
            icon: "💯",
            order: 1,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "v2",
            optionSetId: "2",
            name: "Інновації",
            description: "Постійний розвиток та нові рішення",
            value: "innovation",
            icon: "💡",
            order: 2,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "v3",
            optionSetId: "2",
            name: "Якість",
            description: "Досконалість у кожній деталі",
            value: "quality",
            icon: "⭐",
            order: 3,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: "v4",
            optionSetId: "2",
            name: "Сталість",
            description: "Відповідальність перед планетою",
            value: "sustainability",
            icon: "🌱",
            order: 4,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ]);
      }
      return Promise.resolve([]);
    }
  });

  // Mutations for option sets
  const createOptionSetMutation = useMutation({
    mutationFn: async (data: Partial<CardOptionSet>) => {
      const response = await apiRequest("POST", "/api/admin/card-option-sets", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-option-sets"] });
      toast({ title: "Набір створено", description: "Новий набір варіантів успішно створено" });
      setIsDialogOpen(false);
      setEditingOptionSet(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити набір", variant: "destructive" });
    },
  });

  const updateOptionSetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CardOptionSet> }) => {
      const response = await apiRequest("PUT", `/api/admin/card-option-sets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-option-sets"] });
      toast({ title: "Набір оновлено", description: "Зміни успішно збережено" });
      setIsDialogOpen(false);
      setEditingOptionSet(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити набір", variant: "destructive" });
    },
  });

  const deleteOptionSetMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/card-option-sets/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-option-sets"] });
      toast({ title: "Набір видалено", description: "Набір варіантів успішно видалено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити набір", variant: "destructive" });
    },
  });

  // Mutations for options
  const createOptionMutation = useMutation({
    mutationFn: async (data: Partial<CardOption>) => {
      const response = await apiRequest("POST", "/api/admin/card-options", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-options", selectedOptionSet] });
      toast({ title: "Варіант створено", description: "Новий варіант успішно додано" });
      setIsOptionDialogOpen(false);
      setEditingOption(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити варіант", variant: "destructive" });
    },
  });

  const updateOptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CardOption> }) => {
      const response = await apiRequest("PUT", `/api/admin/card-options/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-options", selectedOptionSet] });
      toast({ title: "Варіант оновлено", description: "Зміни успішно збережено" });
      setIsOptionDialogOpen(false);
      setEditingOption(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити варіант", variant: "destructive" });
    },
  });

  const deleteOptionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/admin/card-options/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/card-options", selectedOptionSet] });
      toast({ title: "Варіант видалено", description: "Варіант успішно видалено" });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити варіант", variant: "destructive" });
    },
  });

  const handleSaveOptionSet = () => {
    if (!editingOptionSet) return;
    
    if (editingOptionSet.id) {
      updateOptionSetMutation.mutate({
        id: editingOptionSet.id,
        data: editingOptionSet,
      });
    } else {
      createOptionSetMutation.mutate(editingOptionSet);
    }
  };

  const handleSaveOption = () => {
    if (!editingOption) return;
    
    if (editingOption.id) {
      updateOptionMutation.mutate({
        id: editingOption.id,
        data: editingOption,
      });
    } else {
      createOptionMutation.mutate({
        ...editingOption,
        optionSetId: selectedOptionSet!,
      });
    }
  };

  const getTypeColor = (cardTypeId: string) => {
    const type = cardTypes.find(t => t.id === cardTypeId);
    switch (type?.color) {
      case "purple": return "bg-gray-800 text-purple-400 border-purple-600";
      case "orange": return "bg-gray-800 text-orange-400 border-orange-600";
      case "green": return "bg-gray-800 text-green-400 border-green-600";
      default: return "bg-gray-800 text-gray-400 border-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-white">Завантаження наборів варіантів...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Набори Варіантів</h1>
            <p className="text-gray-400 mt-2">Управління попередньо заготовленими варіантами для карток (архетипи, цінності тощо)</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="flex items-center gap-2" 
              onClick={() => {
                setEditingOptionSet({
                  id: "",
                  name: "",
                  description: "",
                  cardTypeId: "choice",
                  isDefault: false,
                  isActive: true,
                  createdAt: "",
                  updatedAt: "",
                });
                setIsDialogOpen(true);
              }}
              data-testid="button-create-option-set"
            >
              <Plus className="h-4 w-4" />
              Створити Набір
            </Button>
            <Link href="/rcadmin">
              <Button variant="outline" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800" data-testid="button-back-admin">
                <ArrowLeft className="h-4 w-4" />
                Назад
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Option Sets */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Набори Варіантів</h2>
            <div className="space-y-4">
              {optionSets?.map((optionSet) => (
                <Card 
                  key={optionSet.id} 
                  className={`border-2 cursor-pointer transition-colors ${
                    selectedOptionSet === optionSet.id 
                      ? getTypeColor(optionSet.cardTypeId)
                      : "bg-gray-800 border-gray-700 hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedOptionSet(optionSet.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-white">
                          {optionSet.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {cardTypes.find(t => t.id === optionSet.cardTypeId)?.name || optionSet.cardTypeId}
                          </Badge>
                          {optionSet.isDefault && (
                            <Badge className="bg-blue-600 text-white">За замовчуванням</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOptionSet(optionSet);
                            setIsDialogOpen(true);
                          }}
                          className="text-gray-400 hover:text-white hover:bg-gray-700"
                          data-testid={`button-edit-option-set-${optionSet.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteOptionSetMutation.mutate(optionSet.id);
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          data-testid={`button-delete-option-set-${optionSet.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  {optionSet.description && (
                    <CardContent className="pt-0">
                      <p className="text-sm text-gray-400">{optionSet.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Options for Selected Set */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {selectedOptionSet ? "Варіанти" : "Оберіть набір"}
              </h2>
              {selectedOptionSet && (
                <Button 
                  size="sm"
                  onClick={() => {
                    setEditingOption({
                      id: "",
                      optionSetId: selectedOptionSet,
                      name: "",
                      description: "",
                      value: "",
                      icon: "",
                      order: (options?.length || 0) + 1,
                      isActive: true,
                      createdAt: "",
                      updatedAt: "",
                    });
                    setIsOptionDialogOpen(true);
                  }}
                  className="flex items-center gap-2"
                  data-testid="button-add-option"
                >
                  <Plus className="h-4 w-4" />
                  Додати Варіант
                </Button>
              )}
            </div>

            {selectedOptionSet ? (
              <div className="space-y-3">
                {options?.map((option) => (
                  <Card key={option.id} className="bg-gray-800 border-gray-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {option.icon && <span className="text-lg">{option.icon}</span>}
                            <h4 className="font-medium text-white">{option.name}</h4>
                          </div>
                          {option.description && (
                            <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              Порядок: {option.order}
                            </Badge>
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              {option.value}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOption(option);
                              setIsOptionDialogOpen(true);
                            }}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                            data-testid={`button-edit-option-${option.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOptionMutation.mutate(option.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                            data-testid={`button-delete-option-${option.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    Варіанти відсутні. Додайте перший варіант.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Оберіть набір варіантів ліворуч для перегляду та редагування варіантів</p>
              </div>
            )}
          </div>
        </div>

        {/* Edit Option Set Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingOptionSet?.id ? "Редагувати набір" : "Створити набір"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Налаштуйте параметри набору варіантів для карток
              </DialogDescription>
            </DialogHeader>
            {editingOptionSet && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Назва набору</Label>
                    <Input
                      id="name"
                      value={editingOptionSet.name}
                      onChange={(e) => setEditingOptionSet({
                        ...editingOptionSet,
                        name: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Наприклад: Архетипи бренду"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cardTypeId" className="text-gray-300">Тип картки</Label>
                    <Select 
                      value={editingOptionSet.cardTypeId} 
                      onValueChange={(value) => setEditingOptionSet({
                        ...editingOptionSet,
                        cardTypeId: value
                      })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {cardTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id} className="text-white hover:bg-gray-600">
                            {type.icon} {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Опис</Label>
                  <Textarea
                    id="description"
                    value={editingOptionSet.description || ""}
                    onChange={(e) => setEditingOptionSet({
                      ...editingOptionSet,
                      description: e.target.value
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Опис набору варіантів..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Скасувати
                  </Button>
                  <Button 
                    onClick={handleSaveOptionSet}
                    disabled={createOptionSetMutation.isPending || updateOptionSetMutation.isPending}
                    data-testid="button-save-option-set"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {(createOptionSetMutation.isPending || updateOptionSetMutation.isPending) ? "Збереження..." : "Зберегти"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Option Dialog */}
        <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingOption?.id ? "Редагувати варіант" : "Додати варіант"}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Налаштуйте параметри варіанту відповіді
              </DialogDescription>
            </DialogHeader>
            {editingOption && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="optionName" className="text-gray-300">Назва варіанту</Label>
                    <Input
                      id="optionName"
                      value={editingOption.name}
                      onChange={(e) => setEditingOption({
                        ...editingOption,
                        name: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Наприклад: Невинний"
                    />
                  </div>
                  <div>
                    <Label htmlFor="optionIcon" className="text-gray-300">Іконка</Label>
                    <Input
                      id="optionIcon"
                      value={editingOption.icon || ""}
                      onChange={(e) => setEditingOption({
                        ...editingOption,
                        icon: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="🎭"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="optionValue" className="text-gray-300">Значення</Label>
                    <Input
                      id="optionValue"
                      value={editingOption.value}
                      onChange={(e) => setEditingOption({
                        ...editingOption,
                        value: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="innocent"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="optionDescription" className="text-gray-300">Опис</Label>
                  <Textarea
                    id="optionDescription"
                    value={editingOption.description || ""}
                    onChange={(e) => setEditingOption({
                      ...editingOption,
                      description: e.target.value
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Детальний опис варіанту..."
                  />
                </div>

                <div>
                  <Label htmlFor="optionOrder" className="text-gray-300">Порядок</Label>
                  <Input
                    id="optionOrder"
                    type="number"
                    value={editingOption.order}
                    onChange={(e) => setEditingOption({
                      ...editingOption,
                      order: parseInt(e.target.value) || 0
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOptionDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
                    Скасувати
                  </Button>
                  <Button 
                    onClick={handleSaveOption}
                    disabled={createOptionMutation.isPending || updateOptionMutation.isPending}
                    data-testid="button-save-option"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {(createOptionMutation.isPending || updateOptionMutation.isPending) ? "Збереження..." : "Зберегти"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}