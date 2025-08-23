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
import { ArrowLeft, Edit, Trash2, Plus, Save, Settings } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CardType {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  validationRules?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

export default function CardTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState<CardType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Mock data for card types
  const cardTypes: CardType[] = [
    {
      id: "text",
      name: "Текстове поле",
      description: "Поле для введення тексту або відповідей",
      icon: "📝",
      color: "blue",
      validationRules: {
        required: true,
        minLength: 10,
        maxLength: 500
      }
    },
    {
      id: "choice",
      name: "Вибір варіанту",
      description: "Один варіант з декількох можливих",
      icon: "🔘",
      color: "purple",
      validationRules: {
        required: true
      }
    },
    {
      id: "values",
      name: "Множинний вибір",
      description: "Декілька варіантів з списку",
      icon: "☑️",
      color: "green",
      validationRules: {
        required: false
      }
    },
    {
      id: "archetype",
      name: "Архетип",
      description: "Вибір архетипу бренду",
      icon: "🎭",
      color: "orange",
      validationRules: {
        required: true
      }
    },
    {
      id: "reflection",
      name: "Рефлексія",
      description: "Глибокі роздуми та аналіз",
      icon: "💭",
      color: "indigo",
      validationRules: {
        required: false,
        minLength: 50,
        maxLength: 1000
      }
    },
    {
      id: "completion",
      name: "Завершення",
      description: "Фінальна картка етапу",
      icon: "🎯",
      color: "emerald",
      validationRules: {
        required: false
      }
    }
  ];

  const getTypeColor = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-100 text-blue-800 border-blue-200";
      case "purple": return "bg-purple-100 text-purple-800 border-purple-200";
      case "green": return "bg-green-100 text-green-800 border-green-200";
      case "orange": return "bg-orange-100 text-orange-800 border-orange-200";
      case "indigo": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "emerald": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Типи Карток</h1>
          <p className="text-gray-500 mt-2">Налаштування типів карток та їх правил валідації</p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2" data-testid="button-create-new-type">
            <Plus className="h-4 w-4" />
            Створити Тип
          </Button>
          <Link href="/rcadmin">
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      {/* Card Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cardTypes.map((type) => (
          <Card key={type.id} className={`border-2 ${getTypeColor(type.color)}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{type.icon}</div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {type.name}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {type.id}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      setEditingType(type);
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-${type.id}`}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-gray-600 mb-4">
                {type.description}
              </p>
              
              {type.validationRules && (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Правила валідації
                  </h4>
                  <div className="space-y-1">
                    {type.validationRules.required !== undefined && (
                      <div className="flex items-center justify-between text-xs">
                        <span>Обов'язкове:</span>
                        <Badge variant={type.validationRules.required ? "default" : "secondary"}>
                          {type.validationRules.required ? "Так" : "Ні"}
                        </Badge>
                      </div>
                    )}
                    {type.validationRules.minLength && (
                      <div className="flex items-center justify-between text-xs">
                        <span>Мін. довжина:</span>
                        <Badge variant="outline">{type.validationRules.minLength}</Badge>
                      </div>
                    )}
                    {type.validationRules.maxLength && (
                      <div className="flex items-center justify-between text-xs">
                        <span>Макс. довжина:</span>
                        <Badge variant="outline">{type.validationRules.maxLength}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Налаштування типу картки</DialogTitle>
            <DialogDescription>
              Редагуйте параметри та правила валідації для типу "{editingType?.name}"
            </DialogDescription>
          </DialogHeader>
          {editingType && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Назва</Label>
                  <Input
                    id="name"
                    value={editingType.name}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      name: e.target.value
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Іконка</Label>
                  <Input
                    id="icon"
                    value={editingType.icon}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      icon: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Опис</Label>
                <Textarea
                  id="description"
                  value={editingType.description}
                  onChange={(e) => setEditingType({
                    ...editingType,
                    description: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="color">Колір</Label>
                <Select 
                  value={editingType.color} 
                  onValueChange={(value) => setEditingType({
                    ...editingType,
                    color: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue">Синій</SelectItem>
                    <SelectItem value="purple">Фіолетовий</SelectItem>
                    <SelectItem value="green">Зелений</SelectItem>
                    <SelectItem value="orange">Помаранчевий</SelectItem>
                    <SelectItem value="indigo">Індиго</SelectItem>
                    <SelectItem value="emerald">Смарагдовий</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Правила валідації</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="required"
                      checked={editingType.validationRules?.required || false}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        validationRules: {
                          ...editingType.validationRules,
                          required: e.target.checked
                        }
                      })}
                    />
                    <Label htmlFor="required">Обов'язкове поле</Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength">Мінімальна довжина</Label>
                      <Input
                        id="minLength"
                        type="number"
                        value={editingType.validationRules?.minLength || ''}
                        onChange={(e) => setEditingType({
                          ...editingType,
                          validationRules: {
                            ...editingType.validationRules,
                            minLength: parseInt(e.target.value) || undefined
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLength">Максимальна довжина</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        value={editingType.validationRules?.maxLength || ''}
                        onChange={(e) => setEditingType({
                          ...editingType,
                          validationRules: {
                            ...editingType.validationRules,
                            maxLength: parseInt(e.target.value) || undefined
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button 
                  onClick={() => {
                    toast({
                      title: "Тип оновлено",
                      description: "Налаштування типу картки збережені",
                    });
                    setIsDialogOpen(false);
                  }}
                  data-testid="button-save-type"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Зберегти
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}