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
import { ArrowLeft, Database, RefreshCw, Upload, Check, X, AlertCircle, Loader2, Settings as SettingsIcon, Brain, Key, Info, Eye, EyeOff, Save, Sparkles, BarChart3, Coins, Clock, Image, ExternalLink } from "lucide-react";
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
  const [selectedModelPerplexity, setSelectedModelPerplexity] = useState("llama-3.1-sonar-large-128k-online");
  const [aiContext, setAiContext] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  const { data: comparison, isLoading, refetch, isRefetching } = useQuery<CompareResult>({
    queryKey: ["/api/admin/db-sync/compare"],
  });

  const { data: aiSettings, isLoading: isLoadingAI, refetch: refetchAI } = useQuery<AISettingsData>({
    queryKey: ["/api/admin/ai-settings"],
  });

  const { data: aiUsage, isLoading: isLoadingUsage, refetch: refetchUsage } = useQuery<AIUsageData>({
    queryKey: ["/api/admin/ai-usage"],
  });

  const { data: userSettings, refetch: refetchUserSettings } = useQuery<{ hasGeminiKey: boolean }>({
    queryKey: ["/api/user/settings"],
  });

  useEffect(() => {
    if (aiSettings?.settings) {
      setSelectedProvider(aiSettings.settings.provider || 'openai');
      setSelectedModelOpenAI(aiSettings.settings.modelOpenAI || 'gpt-4o');
      setSelectedModelPerplexity(aiSettings.settings.modelPerplexity || 'llama-3.1-sonar-large-128k-online');
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
                            <SelectItem value="llama-3.1-sonar-large-128k-online">Llama 3.1 Sonar Large (Online)</SelectItem>
                            <SelectItem value="llama-3.1-sonar-small-128k-online">Llama 3.1 Sonar Small (Online)</SelectItem>
                            <SelectItem value="llama-3.1-sonar-huge-128k-online">Llama 3.1 Sonar Huge (Online)</SelectItem>
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
                                <div key={log.id} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 text-sm border border-gray-700">
                                  <div className="flex items-center gap-3">
                                    <Badge className="bg-blue-600 text-xs">{log.provider}</Badge>
                                    <span className="text-gray-400">{log.endpoint || 'unknown'}</span>
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
                      <Badge className={userSettings?.hasGeminiKey ? 'bg-green-600' : 'bg-gray-600'} data-testid="badge-gemini-status">
                        {userSettings?.hasGeminiKey ? (
                          <><Check className="h-3 w-3 mr-1" /> Налаштовано</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Не налаштовано</>
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-400">
                      {userSettings?.hasGeminiKey 
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
                        {userSettings?.hasGeminiKey && (
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
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Генерація зображень</h5>
                        <p className="text-sm text-gray-400">
                          Створюйте унікальні зображення для вашого бренду за допомогою AI
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Візуальна ідентичність</h5>
                        <p className="text-sm text-gray-400">
                          Генеруйте логотипи, банери та інші візуальні елементи бренду
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Швидкий результат</h5>
                        <p className="text-sm text-gray-400">
                          Отримуйте готові зображення за лічені секунди
                        </p>
                      </div>
                      <div className={`p-4 rounded-lg border ${userSettings?.hasGeminiKey ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                        <h5 className="font-medium text-white mb-2">Інтеграція в чат</h5>
                        <p className="text-sm text-gray-400">
                          Генеруйте зображення прямо з чату бренд-асистента
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
