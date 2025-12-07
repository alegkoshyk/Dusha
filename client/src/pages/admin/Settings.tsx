import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Database, RefreshCw, Upload, Check, X, AlertCircle, Loader2, Settings as SettingsIcon } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
        </Tabs>
      </div>
    </div>
  );
}
