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

  // Fetch card option sets з реальної бази даних
  const { data: optionSets, isLoading } = useQuery<CardOptionSet[]>({
    queryKey: ["/api/admin/card-option-sets"],
    staleTime: 1000 * 60 * 5, // 5 хвилин
  });

  // Fetch options for selected set з реальної бази
  const { data: options } = useQuery<CardOption[]>({
    queryKey: [`/api/admin/card-option-sets/${selectedOptionSet}/options`],
    enabled: !!selectedOptionSet,
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/card-option-sets/${selectedOptionSet}/options`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/card-option-sets/${selectedOptionSet}/options`] });
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
      queryClient.invalidateQueries({ queryKey: [`/api/admin/card-option-sets/${selectedOptionSet}/options`] });
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
                      ? getTypeColor(optionSet.cardTypeId || 'choice')
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
                            {cardTypes.find(t => t.id === optionSet.cardTypeId)?.name || 'Універсальний'}
                          </Badge>
                          {optionSet.isDefault && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              За замовчуванням
                            </Badge>
                          )}
                        </div>
                        {optionSet.description && (
                          <p className="text-gray-400 mt-2 text-sm">{optionSet.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingOptionSet(optionSet);
                            setIsDialogOpen(true);
                          }}
                          className="p-2 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Ви впевнені, що хочете видалити цей набір варіантів?')) {
                              deleteOptionSetMutation.mutate(optionSet.id);
                            }
                          }}
                          className="p-2 hover:bg-red-600 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
              
              {!optionSets?.length && (
                <div className="text-center py-8 text-gray-400">
                  Поки що немає наборів варіантів
                </div>
              )}
            </div>
          </div>

          {/* Options for Selected Set */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                Варіанти
                {selectedOptionSet && (
                  <span className="text-gray-400 ml-2 text-base">
                    ({optionSets?.find(s => s.id === selectedOptionSet)?.name})
                  </span>
                )}
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
                >
                  <Plus className="h-4 w-4" />
                  Додати Варіант
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {selectedOptionSet ? (
                <>
                  {options?.map((option) => (
                    <Card key={option.id} className="bg-gray-800 border-gray-700">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {option.icon && (
                              <span className="text-xl">{option.icon}</span>
                            )}
                            <div>
                              <h4 className="text-white font-medium">{option.name}</h4>
                              {option.description && (
                                <p className="text-gray-400 text-sm mt-1">{option.description}</p>
                              )}
                              <p className="text-gray-500 text-xs mt-1">Значення: {option.value}</p>
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
                              className="p-2 hover:bg-gray-700"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('Ви впевнені, що хочете видалити цей варіант?')) {
                                  deleteOptionMutation.mutate(option.id);
                                }
                              }}
                              className="p-2 hover:bg-red-600 text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {!options?.length && (
                    <div className="text-center py-8 text-gray-400">
                      У цьому наборі поки що немає варіантів
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  Оберіть набір варіантів зліва, щоб переглянути його варіанти
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
