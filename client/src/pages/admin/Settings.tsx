import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, RefreshCw, Upload, Check, X, AlertCircle, Loader2, Settings as SettingsIcon, Brain, Key, Info } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AISettingsData {
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

export default function Settings() {
  const { toast } = useToast();
  const [syncProgress, setSyncProgress] = useState<SyncResult[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: comparison, isLoading, refetch, isRefetching } = useQuery<CompareResult>({
    queryKey: ["/api/admin/db-sync/compare"],
  });

  const { data: aiSettings, isLoading: isLoadingAI, refetch: refetchAI } = useQuery<AISettingsData>({
    queryKey: ["/api/admin/ai-settings"],
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

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger value="database" className="data-[state=active]:bg-gray-700 text-gray-300">
              <Database className="h-4 w-4 mr-2" />
              Синхронізація БД
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-gray-700 text-gray-300" data-testid="tab-ai-settings">
              <Brain className="h-4 w-4 mr-2" />
              AI Налаштування
            </TabsTrigger>
          </TabsList>

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

          <TabsContent value="ai" className="space-y-6 mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  OpenAI Інтеграція
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Налаштування AI для аналізу брендів та генерації рекомендацій
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingAI ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-gray-900">
                      <div className={`p-3 rounded-full ${aiSettings?.configured ? 'bg-green-900' : 'bg-red-900'}`}>
                        <Key className={`h-6 w-6 ${aiSettings?.configured ? 'text-green-400' : 'text-red-400'}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">OPENAI_API_KEY</h3>
                        <p className="text-sm text-gray-400">
                          {aiSettings?.configured 
                            ? 'API ключ налаштовано. AI функції доступні.'
                            : 'API ключ не налаштовано. AI функції недоступні.'}
                        </p>
                      </div>
                      <Badge className={aiSettings?.configured ? 'bg-green-600' : 'bg-red-600'} data-testid="badge-ai-status">
                        {aiSettings?.configured ? (
                          <><Check className="h-3 w-3 mr-1" /> Налаштовано</>
                        ) : (
                          <><X className="h-3 w-3 mr-1" /> Не налаштовано</>
                        )}
                      </Badge>
                    </div>

                    {!aiSettings?.configured && (
                      <Card className="bg-blue-900/30 border-blue-700">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-3">
                              <h4 className="font-medium text-blue-300">Як налаштувати OpenAI API</h4>
                              <ol className="list-decimal list-inside text-sm text-blue-200 space-y-2">
                                <li>Перейдіть на <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">platform.openai.com/api-keys</a></li>
                                <li>Створіть новий API ключ</li>
                                <li>У Replit відкрийте вкладку "Secrets" (іконка замка)</li>
                                <li>Додайте новий секрет з ім'ям <code className="bg-blue-900 px-1 rounded">OPENAI_API_KEY</code></li>
                                <li>Вставте ваш API ключ як значення</li>
                                <li>Перезапустіть додаток</li>
                              </ol>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-white font-medium">Можливості AI:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border ${aiSettings?.configured ? 'bg-gray-900 border-gray-700' : 'bg-gray-900/50 border-gray-800'}`}>
                          <h5 className="font-medium text-white mb-2">Аналіз бренду</h5>
                          <p className="text-sm text-gray-400">
                            AI аналізує відповіді користувача на кожному рівні (Душа, Розум, Тіло) та надає персоналізовані рекомендації
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
                    </div>

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => refetchAI()}
                        disabled={isLoadingAI}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        data-testid="button-refresh-ai"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingAI ? 'animate-spin' : ''}`} />
                        Оновити статус
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
