import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus, Trash2, Copy, Link as LinkIcon, FileText, ChevronUp, ChevronDown,
  Sparkles, Lock, Eye, Edit, ArrowLeft, Loader2, X
} from "lucide-react";
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

type FieldType = "short_text" | "long_text" | "multiple_choice" | "dropdown";

interface BriefField {
  id?: string;
  type: FieldType;
  label: string;
  description?: string;
  required: boolean;
  options?: string[];
  allowCustomOption?: boolean;
}

interface Brief {
  id: string;
  title: string;
  description?: string;
  slug: string;
  brandId: string;
  hasPassword?: boolean;
  respondentNameRequired?: boolean;
  respondentEmailRequired?: boolean;
  status?: string;
  fields?: BriefField[];
  responseCount?: number;
  createdAt?: string;
}

function FieldEditor({
  fields,
  onChange,
}: {
  fields: BriefField[];
  onChange: (fields: BriefField[]) => void;
}) {
  const addField = () => {
    onChange([
      ...fields,
      { type: "short_text", label: "", description: "", required: false, options: [] },
    ]);
  };

  const updateField = (index: number, updates: Partial<BriefField>) => {
    const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    onChange(updated);
  };

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    const updated = [...fields];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onChange(updated);
  };

  const addOption = (fieldIndex: number) => {
    const field = fields[fieldIndex];
    updateField(fieldIndex, { options: [...(field.options || []), ""] });
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = value;
    updateField(fieldIndex, { options });
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  };

  const fieldTypeLabels: Record<FieldType, string> = {
    short_text: "Короткий текст",
    long_text: "Довгий текст",
    multiple_choice: "Множинний вибір",
    dropdown: "Випадаючий список",
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <Card key={index} className="border border-border">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Поле {index + 1}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === 0}
                  onClick={() => moveField(index, "up")}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={index === fields.length - 1}
                  onClick={() => moveField(index, "down")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Тип поля</Label>
                <Select
                  value={field.type}
                  onValueChange={(v) => {
                    const updates: Partial<BriefField> = { type: v as FieldType };
                    if (v === "multiple_choice" || v === "dropdown") {
                      if (!field.options?.length) updates.options = [""];
                    }
                    updateField(index, updates);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Назва поля</Label>
                <Input
                  className="h-9"
                  placeholder="Введіть назву"
                  value={field.label}
                  onChange={(e) => updateField(index, { label: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Опис (необов'язково)</Label>
              <Input
                className="h-9"
                placeholder="Підказка для респондента"
                value={field.description || ""}
                onChange={(e) => updateField(index, { description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={field.required}
                onCheckedChange={(checked) => updateField(index, { required: checked })}
              />
              <Label className="text-xs">Обов'язкове поле</Label>
            </div>

            {(field.type === "multiple_choice" || field.type === "dropdown") && (
              <div className="space-y-2 pl-2 border-l-2 border-muted">
                <Label className="text-xs font-medium">Варіанти відповідей</Label>
                {(field.options || []).map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center gap-2">
                    <Input
                      className="h-8 text-sm"
                      placeholder={`Варіант ${optIdx + 1}`}
                      value={opt}
                      onChange={(e) => updateOption(index, optIdx, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive"
                      onClick={() => removeOption(index, optIdx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => addOption(index)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Додати варіант
                </Button>
                {field.type === "multiple_choice" && (
                  <div className="flex items-center gap-2 mt-1">
                    <Switch
                      checked={field.allowCustomOption || false}
                      onCheckedChange={(checked) =>
                        updateField(index, { allowCustomOption: checked })
                      }
                    />
                    <Label className="text-xs">Дозволити свій варіант</Label>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" className="w-full" onClick={addField}>
        <Plus className="h-4 w-4 mr-2" />
        Додати поле
      </Button>
    </div>
  );
}

export default function BriefsPage() {
  const params = useParams<{ brandId: string }>();
  const brandId = params.brandId;
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<Brief | null>(null);
  const [deletingBrief, setDeletingBrief] = useState<Brief | null>(null);
  const [viewingResponses, setViewingResponses] = useState<Brief | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [respondentNameRequired, setRespondentNameRequired] = useState(false);
  const [respondentEmailRequired, setRespondentEmailRequired] = useState(false);
  const [fields, setFields] = useState<BriefField[]>([]);
  const [aiContext, setAiContext] = useState("");
  const [mode, setMode] = useState<"manual" | "ai">("manual");

  const { data: brand, isLoading: brandLoading } = useQuery<any>({
    queryKey: ["/api/user/brands", brandId],
    enabled: !!brandId,
  });

  const { data: briefs, isLoading: briefsLoading } = useQuery<Brief[]>({
    queryKey: ["/api/brands", brandId, "briefs"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`/api/brands/${brandId}/briefs`, {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch briefs");
      return res.json();
    },
    enabled: !!brandId,
  });

  const { data: responsesData } = useQuery<{ responses: any[]; fieldMap: Record<string, string> }>({
    queryKey: ["/api/briefs", viewingResponses?.id, "responses"],
    queryFn: async () => {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`/api/briefs/${viewingResponses!.id}/responses`, {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch responses");
      return res.json();
    },
    enabled: !!viewingResponses?.id,
  });

  const responses = responsesData?.responses;
  const fieldMap = responsesData?.fieldMap || {};

  const resetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setPassword("");
    setRespondentNameRequired(false);
    setRespondentEmailRequired(false);
    setFields([]);
    setAiContext("");
    setMode("manual");
    setEditingBrief(null);
  }, []);

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = async (brief: Brief) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const res = await fetch(`/api/briefs/${brief.id}`, {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });
      if (!res.ok) throw new Error("Failed");
      const fullBrief = await res.json();
      setEditingBrief(fullBrief);
      setTitle(fullBrief.title || "");
      setDescription(fullBrief.description || "");
      setPassword("");
      setRespondentNameRequired(fullBrief.respondentNameRequired || false);
      setRespondentEmailRequired(fullBrief.respondentEmailRequired || false);
      setFields(fullBrief.fields || []);
      setMode("manual");
      setDialogOpen(true);
    } catch {
      toast({ title: "Помилка", description: "Не вдалося завантажити бриф", variant: "destructive" });
    }
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/briefs", data),
    onSuccess: () => {
      toast({ title: "Успішно", description: "Бриф створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "briefs"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити бриф", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PATCH", `/api/briefs/${editingBrief!.id}`, data),
    onSuccess: () => {
      toast({ title: "Успішно", description: "Бриф оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "briefs"] });
      setDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити бриф", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/briefs/${id}`),
    onSuccess: () => {
      toast({ title: "Успішно", description: "Бриф видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "briefs"] });
      setDeletingBrief(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити бриф", variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: { context: string; brandId: string }) => {
      const res = await apiRequest("POST", "/api/briefs/generate", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data?.fields) {
        setFields(data.fields);
        setMode("manual");
        toast({ title: "Успішно", description: "Поля згенеровано ШІ. Перегляньте та збережіть." });
      }
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати поля", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: "Помилка", description: "Введіть назву брифу", variant: "destructive" });
      return;
    }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      brandId,
      password: password.trim() || undefined,
      respondentNameRequired,
      respondentEmailRequired,
      fields: fields.map(({ id, ...f }) => f),
    };

    if (editingBrief) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGenerate = () => {
    if (!aiContext.trim()) {
      toast({ title: "Помилка", description: "Введіть контекст для генерації", variant: "destructive" });
      return;
    }
    generateMutation.mutate({ context: aiContext.trim(), brandId: brandId! });
  };

  const getPublicUrl = (slug: string) => {
    const prodDomain = "https://brandsoul.site";
    return `${prodDomain}/brief/${slug}`;
  };

  const copyLink = (slug: string) => {
    const url = getPublicUrl(slug);
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Скопійовано", description: "Посилання скопійовано в буфер обміну" });
    });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (brandLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Бренд не знайдено</p>
        <Link href="/brands">
          <Button className="mt-4">До брендів</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/brand/${brandId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Брифи
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Створити бриф
        </Button>
      </div>

      {briefsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !briefs?.length ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Немає брифів</h3>
          <p className="text-muted-foreground mb-4">
            Створіть перший бриф для збору інформації від клієнтів
          </p>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Створити бриф
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {briefs.map((brief) => (
            <Card key={brief.id} className="hover:shadow-lg transition-shadow">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-base leading-snug line-clamp-2 flex-1 min-w-0">{brief.title}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive shrink-0 -mt-1 -mr-1"
                    onClick={() => setDeletingBrief(brief)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {brief.hasPassword && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Lock className="h-3 w-3" />
                      Пароль
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {brief.responseCount ?? 0} відповідей
                  </Badge>
                </div>

                {brief.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {brief.description}
                  </p>
                )}

                <button
                  onClick={() => copyLink(brief.slug)}
                  className="flex items-center gap-2 w-full text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 hover:bg-muted transition-colors text-left"
                >
                  <LinkIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate flex-1 min-w-0">
                    {getPublicUrl(brief.slug)}
                  </span>
                  <Copy className="h-3 w-3 shrink-0" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(brief)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Редагувати
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingResponses(brief)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    Відповіді
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBrief ? "Редагувати бриф" : "Створити бриф"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Назва брифу *</Label>
              <Input
                placeholder="Введіть назву"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Опис</Label>
              <Textarea
                placeholder="Опис брифу для респондентів"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Налаштування
              </h4>
              <div className="space-y-2">
                <Label className="text-xs">Пароль для доступу (необов'язково)</Label>
                <Input
                  type="password"
                  placeholder="Залиште порожнім для відкритого доступу"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ім'я респондента обов'язкове</Label>
                <Switch
                  checked={respondentNameRequired}
                  onCheckedChange={setRespondentNameRequired}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email респондента обов'язковий</Label>
                <Switch
                  checked={respondentEmailRequired}
                  onCheckedChange={setRespondentEmailRequired}
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={mode === "manual" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("manual")}
                >
                  Вручну
                </Button>
                <Button
                  type="button"
                  variant={mode === "ai" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setMode("ai")}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  ШІ генерація
                </Button>
              </div>

              {mode === "ai" ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Контекст для генерації</Label>
                    <Textarea
                      placeholder="Опишіть мету брифу, яку інформацію потрібно зібрати, для кого цей бриф..."
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      rows={4}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleGenerate}
                    disabled={generateMutation.isPending}
                  >
                    {generateMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Згенерувати поля
                  </Button>
                  {fields.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">
                        Згенеровані поля (можна редагувати):
                      </Label>
                      <FieldEditor fields={fields} onChange={setFields} />
                    </div>
                  )}
                </div>
              ) : (
                <FieldEditor fields={fields} onChange={setFields} />
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                resetForm();
              }}
            >
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingBrief ? "Зберегти" : "Створити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingBrief}
        onOpenChange={(open) => !open && setDeletingBrief(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити бриф?</AlertDialogTitle>
            <AlertDialogDescription>
              Бриф "{deletingBrief?.title}" та всі його відповіді будуть видалені
              назавжди. Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingBrief && deleteMutation.mutate(deletingBrief.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!viewingResponses}
        onOpenChange={(open) => !open && setViewingResponses(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Відповіді: {viewingResponses?.title}
            </DialogTitle>
          </DialogHeader>
          {responses?.length ? (
            <div className="space-y-4">
              {responses.map((response: any, idx: number) => (
                <Card key={response.id || idx}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      {response.respondentName && (
                        <span className="text-sm font-medium">
                          {response.respondentName}
                        </span>
                      )}
                      {response.respondentEmail && (
                        <span className="text-sm text-muted-foreground">
                          {response.respondentEmail}
                        </span>
                      )}
                      {response.createdAt && (
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(response.createdAt).toLocaleDateString("uk-UA")}
                        </span>
                      )}
                    </div>
                    {response.answers && (
                      <div className="space-y-2">
                        {Object.entries(response.answers).map(
                          ([key, value]: [string, any]) => (
                            <div key={key} className="text-sm">
                              <span className="font-medium">{fieldMap[key] || key}:</span>{" "}
                              <span className="text-muted-foreground">
                                {Array.isArray(value) ? value.join(", ") : String(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Поки що немає відповідей</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
