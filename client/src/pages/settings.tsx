import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, apiRequestJson } from '@/lib/queryClient';

interface SettingsData {
  hasGeminiApiKey: boolean;
  maskedApiKey?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const { data: settings, isLoading } = useQuery<SettingsData>({
    queryKey: ['/api/user/settings'],
    enabled: !!user,
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: async (newApiKey: string) => {
      return apiRequestJson('POST', '/api/user/settings/gemini-api-key', { apiKey: newApiKey });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      setApiKey('');
      toast({
        title: "Успішно",
        description: data.message || "API ключ збережено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося зберегти API ключ",
        variant: "destructive",
      });
    },
  });

  const deleteApiKeyMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', '/api/user/settings/gemini-api-key');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      toast({
        title: "Успішно",
        description: "API ключ видалено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося видалити API ключ",
        variant: "destructive",
      });
    },
  });

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    saveApiKeyMutation.mutate(apiKey.trim());
  };

  const handleDeleteApiKey = () => {
    if (window.confirm('Ви впевнені, що хочете видалити API ключ?')) {
      deleteApiKeyMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Налаштування
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Керуйте своїми налаштуваннями та API ключами
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            NanoBanana API ключ
          </CardTitle>
          <CardDescription>
            Додайте свій API ключ NanoBanana для генерації зображень у чаті з брендом.
            <a 
              href="https://nanobananaapi.ai/api-key" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 ml-1 text-blue-600 hover:underline"
            >
              Отримати ключ <ExternalLink className="w-3 h-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings?.hasGeminiApiKey ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-700 dark:text-green-400">
                  API ключ налаштовано: {settings.maskedApiKey}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowApiKey(!showApiKey)}
                  data-testid="button-toggle-update-key"
                >
                  Оновити ключ
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteApiKey}
                  disabled={deleteApiKeyMutation.isPending}
                  data-testid="button-delete-key"
                >
                  {deleteApiKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Видалити"
                  )}
                </Button>
              </div>

              {showApiKey && (
                <form onSubmit={handleSaveApiKey} className="space-y-4 mt-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">Новий API ключ</Label>
                    <div className="relative">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIza..."
                        className="pr-10"
                        data-testid="input-api-key"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={!apiKey.trim() || saveApiKeyMutation.isPending}
                    data-testid="button-save-key"
                  >
                    {saveApiKeyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Зберегти
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveApiKey} className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-700 dark:text-yellow-400 text-sm">
                  API ключ не налаштовано. Додайте ключ для генерації зображень.
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API ключ NanoBanana</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Ваш NanoBanana API ключ"
                  data-testid="input-api-key"
                />
                <p className="text-xs text-gray-500">
                  Ваш ключ буде зашифровано перед збереженням
                </p>
              </div>
              
              <Button 
                type="submit" 
                disabled={!apiKey.trim() || saveApiKeyMutation.isPending}
                data-testid="button-save-key"
              >
                {saveApiKeyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Зберегти API ключ
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
