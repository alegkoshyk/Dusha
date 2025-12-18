import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Database, RefreshCw, Upload, Check, X, AlertCircle, Loader2, Settings as SettingsIcon, Brain, Key, Info, Eye, EyeOff, Save, Sparkles, BarChart3, Coins, Clock, Image, ExternalLink, Plus, Trash2, Edit2, GripVertical } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProviderStatus {
  configured: boolean;
  hasDbKey: boolean;
  hasEnvKey: boolean;
  keySource: 'database' | 'environment' | 'none';
}

interface AISettings {
  provider: string;
  modelOpenAI: string;
  modelPerplexity: string;
  context: string;
}

interface AISettingsData {
  openai: ProviderStatus;
  perplexity: ProviderStatus;
  settings: AISettings;
  configured: boolean;
}

interface TableComparison {
  table: string;
  devCount: number;
  prodCount: number;
  diff: number;
  status: 'synced' | 'different' | 'missing' | 'error';
  error?: string;
}

interface CompareResult {
  comparison: TableComparison[];
  prodDbConnected: boolean;
}

interface SyncResult {
  table: string;
  synced: number;
  status: 'success' | 'empty' | 'error';
  error?: string;
}

interface AIUsageLog {
  id: string;
  provider: string;
  model: string | null;
  tokensInput: number | null;
  tokensOutput: number | null;
  costEstimate: string | null;
  endpoint: string | null;
  createdAt: string;
  brandName?: string;
}

interface AIUsageStats {
  totalRequests: number;
  totalTokensInput: number;
  totalTokensOutput: number;
  totalCost: string;
  byProvider: { provider: string; requests: number; tokensInput: number; tokensOutput: number }[];
}

interface AIUsageData {
  stats: AIUsageStats;
  recentLogs: AIUsageLog[];
}

interface NanoBananaUsageData {
  totalImages: number;
  totalCost: string;
  recentLogs: AIUsageLog[];
}

interface GenerationTemplate {
  id: number;
  name: string;
  description: string | null;
  referenceImageUrl: string | null;
  prompt: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function Settings() {
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [openaiKeyInput, setOpenaiKeyInput] = useState("");
  const [perplexityKeyInput, setPerplexityKeyInput] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showPerplexityKey, setShowPerplexityKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [selectedModelOpenAI, setSelectedModelOpenAI] = useState("gpt-4o");
  const [selectedModelPerplexity, setSelectedModelPerplexity] = useState("sonar-pro");
  const [aiContext, setAiContext] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  
  // Generation templates state
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<GenerationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    referenceImageUrl: "",
    prompt: "",
    isActive: true,
    sortOrder: 0,
  });

  const { data: comparison, isLoading, refetch, isRefetching } = useQuery<CompareResult>({
    queryKey: ["/api/admin/db-sync/compare"],
  });

  const { data: aiSettings, isLoading: isLoadingAI, refetch: refetchAI } = useQuery<AISettingsData>({
    queryKey: ["/api/admin/ai-settings"],
  });

  const { data: aiUsage, isLoading: isLoadingUsage, refetch: refetchUsage } = useQuery<AIUsageData>({
    queryKey: ["/api/admin/ai-usage"],
  });

  const { data: userSettings, refetch: refetchUserSettings } = useQuery<{ hasGeminiApiKey: boolean }>({
    queryKey: ["/api/user/settings"],
  });

  const { data: nanoBananaUsage, isLoading: isLoadingNanoBananaUsage, refetch: refetchNanoBananaUsage } = useQuery<NanoBananaUsageData>({
    queryKey: ["/api/admin/nanobanana-usage"],
  });

  const { data: generationTemplates, isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery<GenerationTemplate[]>({
    queryKey: ["/api/admin/generation-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      const response = await apiRequest("POST", "/api/admin/generation-templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Шаблон створено" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-templates"] });
      setIsTemplateDialogOpen(false);
      resetTemplateForm();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося створити шаблон", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof templateForm> }) => {
      const response = await apiRequest("PATCH", `/api/admin/generation-templates/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Шаблон оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-templates"] });
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
      resetTemplateForm();
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити шаблон", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/generation-templates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Шаблон видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/generation-templates"] });
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити шаблон", variant: "destructive" });
    },
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      description: "",
      referenceImageUrl: "",
      prompt: "",
      isActive: true,
      sortOrder: 0,
    });
  };

  const openCreateTemplateDialog = () => {
    setEditingTemplate(null);
    resetTemplateForm();
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (template: GenerationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      referenceImageUrl: template.referenceImageUrl || "",
      prompt: template.prompt,
      isActive: template.isActive,
      sortOrder: template.sortOrder,
    });
    setIsTemplateDialogOpen(true);
  };

  const handleTemplateSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: templateForm });
    } else {
      createTemplateMutation.mutate(templateForm);
    }
  };

  useEffect(() => {
    if (aiSettings?.settings) {
      setSelectedProvider(aiSettings.settings.provider || 'openai');
      setSelectedModelOpenAI(aiSettings.settings.modelOpenAI || 'gpt-4o');
      setSelectedModelPerplexity(aiSettings.settings.modelPerplexity || 'sonar-pro');
      setAiContext(aiSettings.settings.context || '');
    }
  }, [aiSettings]);

  const saveApiKeyMutation = useMutation({
    mutationFn: async ({ apiKey, provider }: { apiKey: string; provider: string }) => {
      const response = await apiRequest("POST", "/api/admin/ai-settings", { apiKey, provider });
      return response.json();
    },
    onSuccess: (_, { provider }) => {
      toast({
        title: "Успішно збережено",
        description: `${provider === 'perplexity' ? 'Perplexity' : 'OpenAI'} API ключ успішно збережено`,
      });
      if (provider === 'openai') {
        setOpenaiKeyInput("");
      } else {
        setPerplexityKeyInput("");
      }
      refetchAI();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти API ключ",
        variant: "destructive",
      });
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (config: { provider?: string; modelOpenAI?: string; modelPerplexity?: string; context?: string }) => {
      const response = await apiRequest("POST", "/api/admin/ai-settings/config", config);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успішно збережено",
        description: "Налаштування AI успішно збережено",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти налаштування",
        variant: "destructive",
      });
    },
  });

  const saveGeminiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await apiRequest("POST", "/api/user/settings/gemini-api-key", { apiKey });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "NanoBanana API ключ збережено" });
      setGeminiKeyInput("");
      refetchUserSettings();
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    },
  });

  const deleteGeminiKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/user/settings/gemini-api-key");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "NanoBanana API ключ видалено" });
      refetchUserSettings();
    },
  });

  const syncAllMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/db-sync/sync-all");
      return response.json();
    },
    onSuccess: (data: any) => {
      setSyncProgress(data.results || []);
      setIsSyncing(false);
      toast({
        title: "Синхронізація завершена",
        description: "Всі таблиці успішно синхронізовано",
      });
      refetch();
    },
    onError: (error: any) => {
      setIsSyncing(false);
      toast({
        title: "Помилка синхронізації",
        description: error.message || "Не вдалося синхронізувати бази даних",
        variant: "destructive",
      });
    },
  });

  const syncTableMutation = useMutation({
    mutationFn: async (table: string) => {
      const response = await apiRequest("POST", "/api/admin/db-sync/sync-table", { table });
      const data = await response.json();
      return { table, ...data };
    },
    onSuccess: (data: any) => {
      toast({
        title: "Таблицю синхронізовано",
        description: `${data.table}: ${data.synced} записів`,
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Помилка синхронізації",
        description: error.message || "Не вдалося синхронізувати таблицю",
        variant: "destructive",
      });
    },
  });

  const handleSyncAll = () => {
    setIsSyncing(true);
    setSyncProgress([]);
    syncAllMutation.mutate();
  };

  const handleSaveConfig = () => {
    saveConfigMutation.mutate({
      provider: selectedProvider,
      modelOpenAI: selectedModelOpenAI,
      modelPerplexity: selectedModelPerplexity,
      context: aiContext,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-green-600 text-white"><Check className="h-3 w-3 mr-1" /> Синхронізовано</Badge>;
      case 'different':
        return <Badge className="bg-yellow-600 text-white"><AlertCircle className="h-3 w-3 mr-1" /> Різниця</Badge>;
      case 'missing':
        return <Badge className="bg-red-600 text-white"><X className="h-3 w-3 mr-1" /> Відсутня</Badge>;
      case 'error':
        return <Badge className="bg-red-800 text-white"><X className="h-3 w-3 mr-1" /> Помилка</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const totalDev = comparison?.comparison.reduce((acc, t) => acc + t.devCount, 0) || 0;
  const totalProd = comparison?.comparison.reduce((acc, t) => acc + (t.prodCount >= 0 ? t.prodCount : 0), 0) || 0;
  const syncedTables = comparison?.comparison.filter(t => t.status === 'synced').length || 0;
  const totalTables = comparison?.comparison.length || 0;

  const renderProviderKeySection = (
    provider: 'openai' | 'perplexity',
    status: ProviderStatus | undefined,
    keyInput: string,
    setKeyInput: (val: string) => void,
    showKey: boolean,
    setShowKey: (val: boolean) => void
  ) => {
    const isOpenAI = provider === 'openai';
    const title = isOpenAI ? 'OpenAI' : 'Perplexity';
    const placeholder = isOpenAI ? 'sk-...' : 'pplx-...';
    const helpUrl = isOpenAI 
      ? 'https://platform.openai.com/api-keys'
      : 'https://www.perplexity.ai/settings/api';

    return (
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Key className="h-4 w-4" />
              {title} API ключ
            </CardTitle>
            <Badge className={status?.configured ? 'bg-green-600' : 'bg-gray-600'} data-testid={`badge-${provider}-status`}>
              {status?.configured ? (
                <><Check className="h-3 w-3 mr-1" /> Налаштовано</>
              ) : (
                <><X className="h-3 w-3 mr-1" /> Не налаштовано</>
              )}
            </Badge>
          </div>
          <CardDescription className="text-gray-400">
            {status?.keySource === 'database' 
              ? 'Ключ зберігається в базі даних.'
              : status?.keySource === 'environment'
              ? 'Ключ налаштовано через змінну середовища.'
              : `Введіть ваш ${title} API ключ.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${provider}-api-key`} className="text-gray-300">API ключ</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id={`${provider}-api-key`}
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder={placeholder}
                  className="bg-gray-800 border-gray-600 text-white pr-10"
                  data-testid={`input-${provider}-api-key`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
                  onClick={() => setShowKey(!showKey)}
                  data-testid={`button-toggle-${provider}-key-visibility`}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => saveApiKeyMutation.mutate({ apiKey: keyInput, provider })}
                disabled={!keyInput || keyInput.length < 10 || saveApiKeyMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
                data-testid={`button-save-${provider}-api-key`}
              >
                {saveApiKeyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Зберегти
              </Button>
            </div>
          </div>

          <div className="flex gap-3 p-3 rounded-lg bg-blue-900/30 border border-blue-700">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-300 text-sm">Як отримати API ключ</h4>
              <p className="text-xs text-blue-200">
                Перейдіть на <a href={helpUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{helpUrl}</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SettingsIcon className="h-8 w-8" />
              Налаштування
            </h1>
            <p className="text-gray-400 mt-2">Системні налаштування та інструменти</p>
          </div>
          <Link href="/rcadmin">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="ai" className="data-[state=active]:bg-gray-700 text-gray-300" data-testid="tab-ai-settings">
              <Brain className="h-4 w-4 mr-2" />
              AI Налаштування
            </TabsTrigger>
            <TabsTrigger value="database" className="data-[state=active]:bg-gray-700 text-gray-300">
              <Database className="h-4 w-4 mr-2" />
              Синхронізація БД
            </TabsTrigger>
            <TabsTrigger value="nanobanana" className="data-[state=active]:bg-gray-700 text-gray-300" data-testid="tab-nanobanana">
              <Image className="h-4 w-4 mr-2" />
              NanoBanana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-6 mt-6">
            {isLoadingAI ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Налаштування AI провайдера
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Оберіть провайдера AI, модель та додатковий контекст для аналізу брендів
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Активний провайдер</Label>
                        <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white" data-testid="select-provider">
                            <SelectValue placeholder="Оберіть провайдера" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="perplexity">Perplexity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Модель OpenAI</Label>
                        <Select value={selectedModelOpenAI} onValueChange={setSelectedModelOpenAI}>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white" data-testid="select-model-openai">
                            <SelectValue placeholder="Оберіть модель" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Модель Perplexity</Label>
                        <Select value={selectedModelPerplexity} onValueChange={setSelectedModelPerplexity}>
                          <SelectTrigger className="bg-gray-900 border-gray-600 text-white" data-testid="select-model-perplexity">
                            <SelectValue placeholder="Оберіть модель" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="sonar">Sonar (базовий)</SelectItem>
                            <SelectItem value="sonar-pro">Sonar Pro (рекомендовано)</SelectItem>
                            <SelectItem value="sonar-reasoning">Sonar Reasoning</SelectItem>
                            <SelectItem value="sonar-reasoning-pro">Sonar Reasoning Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Додатковий контекст для AI</Label>
                      <Textarea
                        value={aiContext}
                        onChange={(e) => setAiContext(e.target.value)}
                        placeholder="Введіть додаткові інструкції для AI, наприклад, особливості вашого бізнесу або стиль відповідей..."
                        className="bg-gray-900 border-gray-600 text-white min-h-[100px]"
                        data-testid="textarea-ai-context"
                      />
                      <p className="text-xs text-gray-500">
                        Цей контекст буде додано до кожного запиту до AI
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleSaveConfig}
                        disabled={saveConfigMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid="button-save-ai-config"
                      >
                        {saveConfigMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Зберегти налаштування
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderProviderKeySection(
                    'openai',
                    aiSettings?.openai,
                    openaiKeyInput,
                    setOpenaiKeyInput,
                    showOpenaiKey,
                    setShowOpenaiKey
                  )}
                  {renderProviderKeySection(
                    'perplexity',
                    aiSettings?.perplexity,
                    perplexityKeyInput,
                    setPerplexityKeyInput,
                    showPerplexityKey,
                    setShowPerplexityKey
                  )}
                </div>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Можливості AI</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border ${aiSettings?.configured ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Аналіз бренду</h5>
                        <p className="text-sm text-gray-400">
                          AI аналізує відповіді користувача на кожному рівні та надає персоналізовані рекомендації
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${aiSettings?.configured ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Оцінка консистентності</h5>
                        <p className="text-sm text-gray-400">
                          Автоматична оцінка узгодженості бренд-стратегії з виявленням сильних та слабких сторін
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${aiSettings?.configured ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Чекліст готовності</h5>
                        <p className="text-sm text-gray-400">
                          Перевірка повноти бренд-стратегії з пріоритезацією задач для покращення
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${aiSettings?.configured ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Наступні кроки</h5>
                        <p className="text-sm text-gray-400">
                          AI генерує конкретні рекомендації щодо подальшого розвитку бренду
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Статистика використання AI
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Моніторинг витрат та використання AI провайдерів
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsage ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : aiUsage ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-blue-400">{aiUsage.stats.totalRequests}</div>
                            <div className="text-sm text-gray-400">Всього запитів</div>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-green-400">{aiUsage.stats.totalTokensInput.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">Вхідних токенів</div>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-purple-400">{aiUsage.stats.totalTokensOutput.toLocaleString()}</div>
                            <div className="text-sm text-gray-400">Вихідних токенів</div>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                              <Coins className="h-5 w-5" />
                              ${aiUsage.stats.totalCost}
                            </div>
                            <div className="text-sm text-gray-400">Орієнтовна вартість</div>
                          </div>
                        </div>

                        {aiUsage.stats.byProvider.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">По провайдерах</h4>
                            <div className="space-y-2">
                              {aiUsage.stats.byProvider.map((p) => (
                                <div key={p.provider} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 border border-gray-700">
                                  <span className="text-white capitalize">{p.provider}</span>
                                  <div className="flex gap-4 text-sm text-gray-400">
                                    <span>{p.requests} запитів</span>
                                    <span>{(p.tokensInput + p.tokensOutput).toLocaleString()} токенів</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiUsage.recentLogs.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Останні запити</h4>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {aiUsage.recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 text-sm border border-gray-700" data-testid={`log-entry-${log.id}`}>
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-600 text-xs">{log.provider}</Badge>
                                    <span className="text-gray-400">{log.endpoint || 'unknown'}</span>
                                    {log.brandName && (
                                      <Badge className="bg-purple-600/50 text-purple-200 text-xs" data-testid={`log-brand-${log.id}`}>
                                        {log.brandName}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-gray-400">
                                    <span>{(log.tokensInput || 0) + (log.tokensOutput || 0)} токенів</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(log.createdAt).toLocaleString('uk-UA')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {aiUsage.stats.totalRequests === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Ще немає даних про використання AI
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Не вдалося завантажити статистику
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => refetchUsage()}
                    disabled={isLoadingUsage}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-refresh-usage"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsage ? 'animate-spin' : ''}`} />
                    Оновити статистику
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetchAI()}
                    disabled={isLoadingAI}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-refresh-ai"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAI ? 'animate-spin' : ''}`} />
                    Оновити налаштування
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="database" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-400">{totalDev}</div>
                  <div className="text-sm text-gray-400">Записів в Dev</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-400">{totalProd}</div>
                  <div className="text-sm text-gray-400">Записів в Prod</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-400">{syncedTables}/{totalTables}</div>
                  <div className="text-sm text-gray-400">Синхронізованих таблиць</div>
                </CardContent>
              </Card>
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-4 space-y-2">
                  <Button
                    onClick={handleSyncAll}
                    disabled={isSyncing || syncAllMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-sync-all"
                  >
                    {isSyncing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Синхронізувати все
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading || isRefetching}
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-refresh"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
                    Оновити
                  </Button>
                </CardContent>
              </Card>
            </div>

            {isSyncing && (
              <Card className="bg-blue-900/30 border-blue-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    <span className="text-blue-300">Синхронізація в процесі...</span>
                  </div>
                  <Progress value={50} className="mt-3" />
                </CardContent>
              </Card>
            )}

            {syncProgress.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Результати останньої синхронізації</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {syncProgress.map((r) => (
                      <div key={r.table} className={`p-2 rounded text-sm ${r.status === 'success' ? 'bg-green-900/50' : r.status === 'empty' ? 'bg-gray-700' : 'bg-red-900/50'}`}>
                        <div className="font-medium text-white">{r.table}</div>
                        <div className="text-gray-400">{r.synced} записів</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Порівняння таблиць</CardTitle>
                <CardDescription className="text-gray-400">
                  Статус синхронізації між Development та Production базами даних
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300">Таблиця</th>
                          <th className="text-center py-3 px-4 text-gray-300">Dev</th>
                          <th className="text-center py-3 px-4 text-gray-300">Prod</th>
                          <th className="text-center py-3 px-4 text-gray-300">Різниця</th>
                          <th className="text-center py-3 px-4 text-gray-300">Статус</th>
                          <th className="text-right py-3 px-4 text-gray-300">Дії</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparison?.comparison.map((table) => (
                          <tr key={table.table} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                            <td className="py-3 px-4 font-medium text-white">{table.table}</td>
                            <td className="py-3 px-4 text-center text-blue-400">{table.devCount}</td>
                            <td className="py-3 px-4 text-center text-green-400">
                              {table.prodCount >= 0 ? table.prodCount : 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={table.diff > 0 ? 'text-yellow-400' : table.diff < 0 ? 'text-red-400' : 'text-gray-400'}>
                                {table.diff > 0 ? '+' : ''}{table.diff}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">{getStatusBadge(table.status)}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => syncTableMutation.mutate(table.table)}
                                disabled={syncTableMutation.isPending}
                                className="text-gray-300 hover:text-white hover:bg-gray-700"
                                data-testid={`button-sync-${table.table}`}
                              >
                                <Upload className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nanobanana" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  NanoBanana - Генерація зображень
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Налаштуйте API ключ для генерації зображень через NanoBanana
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-base flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        NanoBanana API ключ
                      </CardTitle>
                      <Badge className={userSettings?.hasGeminiApiKey ? 'bg-green-600' : 'bg-gray-600'} data-testid="badge-gemini-status">
                        {userSettings?.hasGeminiApiKey ? (
                          <><Check className="h-3 w-3 mr-1" /> Налаштовано</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Не налаштовано</>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {userSettings?.hasGeminiApiKey 
                        ? 'Ключ збережено. Генерація зображень доступна.'
                        : 'Введіть ваш NanoBanana API ключ для генерації зображень.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gemini-api-key" className="text-gray-300">API ключ</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="gemini-api-key"
                            type={showGeminiKey ? "text" : "password"}
                            value={geminiKeyInput}
                            onChange={(e) => setGeminiKeyInput(e.target.value)}
                            placeholder="Ваш NanoBanana API ключ"
                            className="bg-gray-800 border-gray-600 text-white pr-10"
                            data-testid="input-gemini-api-key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent text-gray-400"
                            onClick={() => setShowGeminiKey(!showGeminiKey)}
                            data-testid="button-toggle-gemini-key-visibility"
                          >
                            {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                        <Button
                          onClick={() => saveGeminiKeyMutation.mutate(geminiKeyInput)}
                          disabled={!geminiKeyInput || geminiKeyInput.length < 10 || saveGeminiKeyMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid="button-save-gemini-api-key"
                        >
                          {saveGeminiKeyMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Зберегти
                        </Button>
                        {userSettings?.hasGeminiApiKey && (
                          <Button
                            onClick={() => deleteGeminiKeyMutation.mutate()}
                            disabled={deleteGeminiKeyMutation.isPending}
                            variant="destructive"
                            data-testid="button-delete-gemini-api-key"
                          >
                            {deleteGeminiKeyMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3 p-3 rounded-lg bg-blue-900/30 border border-blue-700">
                      <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="font-medium text-blue-300 text-sm">Як отримати API ключ</h4>
                        <p className="text-xs text-blue-200">
                          Перейдіть на{" "}
                          <a 
                            href="https://nanobananaapi.ai/api-key" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="underline hover:text-white inline-flex items-center gap-1"
                          >
                            NanoBanana API
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Можливості NanoBanana</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiApiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Генерація зображень</h5>
                        <p className="text-sm text-gray-400">
                          Створюйте унікальні зображення для вашого бренду за допомогою AI
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiApiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Візуальна ідентичність</h5>
                        <p className="text-sm text-gray-400">
                          Генеруйте логотипи, банери та інші візуальні елементи бренду
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiApiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Швидкий результат</h5>
                        <p className="text-sm text-gray-400">
                          Отримуйте готові зображення за лічені секунди
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiApiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Інтеграція в чат</h5>
                        <p className="text-sm text-gray-400">
                          Генеруйте зображення прямо з чату бренд-асистента
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Статистика використання NanoBanana
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Моніторинг генерації зображень
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNanoBananaUsage ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : nanoBananaUsage ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-blue-400 flex items-center gap-2">
                              <Image className="h-5 w-5" />
                              {nanoBananaUsage.totalImages}
                            </div>
                            <div className="text-sm text-gray-400">Згенеровано зображень</div>
                          </div>
                          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                            <div className="text-2xl font-bold text-yellow-400 flex items-center gap-1">
                              <Coins className="h-5 w-5" />
                              ${nanoBananaUsage.totalCost}
                            </div>
                            <div className="text-sm text-gray-400">Орієнтовна вартість</div>
                          </div>
                        </div>

                        {nanoBananaUsage.recentLogs.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Останні генерації</h4>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {nanoBananaUsage.recentLogs.map((log) => (
                                <div key={log.id} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 text-sm border border-gray-700" data-testid={`nanobanana-log-${log.id}`}>
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-green-600 text-xs">
                                      <Image className="h-3 w-3 mr-1" />
                                      Зображення
                                    </Badge>
                                    {log.brandName && (
                                      <Badge className="bg-purple-600/50 text-purple-200 text-xs">
                                        {log.brandName}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-gray-400">
                                    <span>${log.costEstimate || '0.02'}</span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(log.createdAt).toLocaleString('uk-UA')}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {nanoBananaUsage.totalImages === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            Ще немає згенерованих зображень
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Не вдалося завантажити статистику
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => refetchNanoBananaUsage()}
                    disabled={isLoadingNanoBananaUsage}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    data-testid="button-refresh-nanobanana-usage"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNanoBananaUsage ? 'animate-spin' : ''}`} />
                    Оновити статистику
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Generation Templates Management */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Image className="h-5 w-5 text-purple-400" />
                      Шаблони генерації
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Налаштуйте шаблони для генерації зображень. Користувачі обиратимуть шаблон, а прихований промпт буде використано для генерації.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={openCreateTemplateDialog}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    data-testid="button-add-template"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Додати шаблон
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingTemplates ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : generationTemplates && generationTemplates.length > 0 ? (
                  <div className="space-y-3">
                    {generationTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-4 p-4 bg-gray-900 rounded-lg border border-gray-700"
                        data-testid={`template-item-${template.id}`}
                      >
                        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-700 flex items-center justify-center overflow-hidden">
                          {template.referenceImageUrl ? (
                            <img
                              src={template.referenceImageUrl}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="h-8 w-8 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white truncate">{template.name}</h4>
                            <Badge className={template.isActive ? "bg-green-600" : "bg-gray-600"}>
                              {template.isActive ? "Активний" : "Неактивний"}
                            </Badge>
                          </div>
                          {template.description && (
                            <p className="text-sm text-gray-400 truncate mt-1">{template.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            Промпт: {template.prompt.substring(0, 60)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTemplateDialog(template)}
                            className="text-gray-400 hover:text-white hover:bg-gray-700"
                            data-testid={`button-edit-template-${template.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            disabled={deleteTemplateMutation.isPending}
                            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                            data-testid={`button-delete-template-${template.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Image className="h-12 w-12 mx-auto mb-3 text-gray-600" />
                    <p>Ще немає шаблонів генерації</p>
                    <p className="text-sm mt-1">Додайте перший шаблон для генерації зображень</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Template Create/Edit Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingTemplate ? "Редагувати шаблон" : "Створити шаблон"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template-name" className="text-gray-300">Назва *</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                placeholder="Наприклад: Футболка з логотипом"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-template-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-description" className="text-gray-300">Опис</Label>
              <Input
                id="template-description"
                value={templateForm.description}
                onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Короткий опис для користувача"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-template-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-image" className="text-gray-300">URL референсного зображення</Label>
              <Input
                id="template-image"
                value={templateForm.referenceImageUrl}
                onChange={(e) => setTemplateForm({ ...templateForm, referenceImageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="bg-gray-900 border-gray-600 text-white"
                data-testid="input-template-image"
              />
              {templateForm.referenceImageUrl && (
                <div className="mt-2 w-24 h-24 rounded-lg bg-gray-700 overflow-hidden">
                  <img
                    src={templateForm.referenceImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-prompt" className="text-gray-300">Промпт для генерації *</Label>
              <Textarea
                id="template-prompt"
                value={templateForm.prompt}
                onChange={(e) => setTemplateForm({ ...templateForm, prompt: e.target.value })}
                placeholder="Детальний промпт для генерації зображення..."
                className="bg-gray-900 border-gray-600 text-white min-h-[100px]"
                data-testid="input-template-prompt"
              />
              <p className="text-xs text-gray-500">
                Цей промпт буде прихований від користувача та використаний для генерації
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="template-order" className="text-gray-300">Порядок сортування</Label>
              <Input
                id="template-order"
                type="number"
                value={templateForm.sortOrder}
                onChange={(e) => setTemplateForm({ ...templateForm, sortOrder: parseInt(e.target.value) || 0 })}
                className="bg-gray-900 border-gray-600 text-white w-24"
                data-testid="input-template-order"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="template-active"
                checked={templateForm.isActive}
                onCheckedChange={(checked) => setTemplateForm({ ...templateForm, isActive: checked })}
                data-testid="switch-template-active"
              />
              <Label htmlFor="template-active" className="text-gray-300">
                Активний (видимий для користувачів)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTemplateDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              data-testid="button-cancel-template"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleTemplateSubmit}
              disabled={!templateForm.name || !templateForm.prompt || createTemplateMutation.isPending || updateTemplateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
              data-testid="button-save-template"
            >
              {(createTemplateMutation.isPending || updateTemplateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTemplate ? "Зберегти" : "Створити"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
