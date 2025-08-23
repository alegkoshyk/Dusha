import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Edit, Save } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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
  };
}

export default function CardTypes() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<CardType | null>(null);

  // Mock data for card types
  const cardTypes: CardType[] = [
    {
      id: "text",
      name: "Текстове поле",
      description: "Поле для введення тексту з можливістю валідації довжини",
      icon: "📝",
      color: "blue",
      validationRules: {
        required: true,
        minLength: 10,
        maxLength: 500,
      }
    },
    {
      id: "choice",
      name: "Вибір варіанту",
      description: "Поле з декількома можливими варіантами відповіді",
      icon: "✓",
      color: "purple",
      validationRules: {
        required: true,
      }
    },
    {
      id: "values",
      name: "Цінності",
      description: "Поле для визначення основних цінностей бренду",
      icon: "💎",
      color: "green",
      validationRules: {
        required: true,
        minLength: 5,
        maxLength: 200,
      }
    },
    {
      id: "archetype",
      name: "Архетип",
      description: "Поле для вибору архетипу бренду",
      icon: "🎭",
      color: "orange",
      validationRules: {
        required: true,
      }
    },
    {
      id: "reflection",
      name: "Рефлексія",
      description: "Поле для роздумів та аналізу",
      icon: "🤔",
      color: "indigo",
      validationRules: {
        required: false,
        minLength: 20,
        maxLength: 1000,
      }
    },
    {
      id: "completion",
      name: "Завершення",
      description: "Підсумкове поле для фіналізації етапу",
      icon: "🎯",
      color: "emerald",
      validationRules: {
        required: true,
        minLength: 50,
        maxLength: 300,
      }
    }
  ];

  const getTypeColor = (color: string) => {
    switch (color) {
      case "blue": return "bg-gray-800 text-blue-400 border-blue-600";
      case "purple": return "bg-gray-800 text-purple-400 border-purple-600";
      case "green": return "bg-gray-800 text-green-400 border-green-600";
      case "orange": return "bg-gray-800 text-orange-400 border-orange-600";
      case "indigo": return "bg-gray-800 text-indigo-400 border-indigo-600";
      case "emerald": return "bg-gray-800 text-emerald-400 border-emerald-600";
      default: return "bg-gray-800 text-gray-400 border-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Типи Карток</h1>
            <p className="text-gray-400 mt-2">Налаштування типів карток та їх правил валідації</p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="flex items-center gap-2" data-testid="button-create-new-type">
              <Plus className="h-4 w-4" />
              Створити Тип
            </Button>
            <Link href="/rcadmin">
              <Button variant="outline" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800" data-testid="button-back-admin">
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
                      <CardTitle className="text-lg font-semibold text-white">
                        {type.name}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 border-gray-600 text-gray-300">
                        {type.id}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingType(type);
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-type-${type.id}`}
                    className="text-gray-400 hover:text-white hover:bg-gray-700"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-400 mb-4">
                  {type.description}
                </p>
                
                {type.validationRules && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-300 uppercase tracking-wide">
                      Правила валідації
                    </h4>
                    <div className="space-y-1">
                      {type.validationRules.required !== undefined && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Обов'язкове:</span>
                          <Badge variant={type.validationRules.required ? "default" : "secondary"} className="bg-gray-700 text-gray-300">
                            {type.validationRules.required ? "Так" : "Ні"}
                          </Badge>
                        </div>
                      )}
                      {type.validationRules.minLength && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Мін. довжина:</span>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">{type.validationRules.minLength}</Badge>
                        </div>
                      )}
                      {type.validationRules.maxLength && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Макс. довжина:</span>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">{type.validationRules.maxLength}</Badge>
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
          <DialogContent className="max-w-2xl bg-gray-800 text-white border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Налаштування типу картки</DialogTitle>
              <DialogDescription className="text-gray-400">
                Редагуйте параметри та правила валідації для типу "{editingType?.name}"
              </DialogDescription>
            </DialogHeader>
            {editingType && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-300">Назва</Label>
                    <Input
                      id="name"
                      value={editingType.name}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        name: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="icon" className="text-gray-300">Іконка</Label>
                    <Input
                      id="icon"
                      value={editingType.icon}
                      onChange={(e) => setEditingType({
                        ...editingType,
                        icon: e.target.value
                      })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-gray-300">Опис</Label>
                  <Input
                    id="description"
                    value={editingType.description}
                    onChange={(e) => setEditingType({
                      ...editingType,
                      description: e.target.value
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300">Правила валідації</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="required"
                      checked={editingType.validationRules?.required || false}
                      onCheckedChange={(checked) => setEditingType({
                        ...editingType,
                        validationRules: {
                          ...editingType.validationRules,
                          required: !!checked
                        }
                      })}
                    />
                    <Label htmlFor="required" className="text-gray-300">Обов'язкове поле</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="minLength" className="text-gray-300">Мін. довжина</Label>
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
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxLength" className="text-gray-300">Макс. довжина</Label>
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
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-gray-600 text-gray-300 hover:bg-gray-700">
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
    </div>
  );
}