import { useState, createElement, useLayoutEffect } from 'react';
import { resolveMediaUrl } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Play, 
  Trash2, 
  Heart,
  Brain,
  Dumbbell,
  FileText,
  MessageSquare,
  Map,
  Gamepad2,
  Users,
  Package,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { CreateBrandDialog } from '@/components/brands/CreateBrandDialog';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserBrand, GameSession } from '@shared/schema';

export default function Brands() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClientHook = useQueryClient();
  const [createBrandOpen, setCreateBrandOpen] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: brands = [], isLoading: brandsLoading } = useQuery<UserBrand[]>({
    queryKey: ['/api/user/brands'],
    enabled: !!user,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: !!user,
  });

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      return apiRequest('DELETE', `/api/user/brands/${brandId}`);
    },
    onSuccess: () => {
      queryClientHook.invalidateQueries({ queryKey: ['/api/user/brands'] });
      queryClientHook.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
      toast({
        title: "Бренд видалено",
        description: "Бренд та всі пов'язані дані успішно видалено",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити бренд",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    if (confirm(`Видалити бренд "${brandName}"? Цю дію не можна скасувати.`)) {
      deleteBrandMutation.mutate(brandId);
    }
  };

  const handleStartGame = async (brandId: string) => {
    try {
      const response = await apiRequest('POST', '/api/game-sessions', { brandId });
      const data = await response.json();
      setLocation(`/game/${data.id}`);
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося розпочати гру",
        variant: "destructive",
      });
    }
  };

  const handleContinueGame = (sessionId: string) => {
    setLocation(`/game/${sessionId}`);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return Heart;
      case 'mind': return Brain;
      case 'body': return Dumbbell;
      default: return Heart;
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'soul': return 'Душа';
      case 'mind': return 'Розум';
      case 'body': return 'Тіло';
      default: return level;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'soul': return 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300';
      case 'mind': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'body': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (brandsLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BrandSoulSpinner size={48} className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Завантаження брендів...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Мої бренди
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mt-1">
              Керуйте своїми брендами та їх розвитком
            </p>
          </div>
          <Button 
            onClick={() => setCreateBrandOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-create-brand"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Новий бренд</span>
            <span className="sm:hidden">Додати</span>
          </Button>
        </div>

        {brands.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Ще немає брендів
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Створіть свій перший бренд, щоб розпочати подорож розвитку бренду
              </p>
              <Button 
                onClick={() => setCreateBrandOpen(true)}
                size="lg"
                className="flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Створити перший бренд
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => {
              const brandSessions = sessions.filter(s => s.brandId === brand.id);
              const completedBrandGames = brandSessions.filter(s => s.completed).length;
              const activeBrandGame = brandSessions.find(s => !s.completed);
              const latestSession = brandSessions.sort((a, b) => 
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
              )[0];
              
              const rawProgress = activeBrandGame?.progress || 0;
              const progress = Math.min(Math.round(rawProgress), 100);
              
              const hasActiveGame = !!activeBrandGame;
              const isCompleted = !hasActiveGame && completedBrandGames > 0;
              
              return (
                <Card 
                  key={brand.id} 
                  className="overflow-hidden hover:shadow-lg transition-all border-border/50"
                >
                  <div className="p-4 md:p-5">
                    <div className="flex items-start gap-4 mb-4">
                      {brand.logo ? (
                        <img 
                          src={resolveMediaUrl(brand.logo)} 
                          alt={`${brand.name} logo`}
                          className="w-14 h-14 md:w-16 md:h-16 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-xl md:text-2xl">
                            {brand.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate mb-1">
                          {brand.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {brand.description || 'Без опису'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {hasActiveGame && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              Активний
                            </Badge>
                          )}
                          {isCompleted && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                              Завершено
                            </Badge>
                          )}
                          {activeBrandGame && (
                            <Badge variant="outline" className={`text-xs ${getLevelColor(activeBrandGame.currentLevel || 'soul')}`}>
                              {getLevelName(activeBrandGame.currentLevel || 'soul')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteBrand(brand.id, brand.name)}
                        className="text-gray-400 hover:text-red-500 -mt-1 -mr-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {hasActiveGame && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm mb-1.5">
                          <span className="text-gray-500 dark:text-gray-400">Прогрес гри</span>
                          <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/brand/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9"
                        >
                          <FileText className="w-4 h-4 text-purple-500" />
                          <span className="truncate">Паспорт</span>
                        </Button>
                      </Link>
                      
                      <Link href={`/brand-chat/brand/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" />
                          <span className="truncate">Чат</span>
                        </Button>
                      </Link>
                      
                      {latestSession && (
                        <Link href={`/game/${latestSession.id}/results`} className="contents">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 h-9"
                          >
                            <Map className="w-4 h-4 text-indigo-500" />
                            <span className="truncate">Карта</span>
                          </Button>
                        </Link>
                      )}
                      
                      <Link href={`/target-audience/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9"
                        >
                          <Users className="w-4 h-4 text-orange-500" />
                          <span className="truncate">Аудиторія</span>
                        </Button>
                      </Link>
                      
                      <Link href={`/products/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9"
                        >
                          <Package className="w-4 h-4 text-emerald-500" />
                          <span className="truncate">Продукти</span>
                        </Button>
                      </Link>
                      
                      <Link href={`/briefs/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9"
                        >
                          <ClipboardList className="w-4 h-4 text-teal-500" />
                          <span className="truncate">Брифи</span>
                        </Button>
                      </Link>
                      
                      <Link href={`/quiz/${brand.id}`} className="contents">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start gap-2 h-9 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="truncate">Де Я?</span>
                        </Button>
                      </Link>
                      
                      {hasActiveGame ? (
                        <Button
                          size="sm"
                          onClick={() => handleContinueGame(activeBrandGame.id)}
                          className="w-full justify-start gap-2 h-9 bg-blue-600 hover:bg-blue-700"
                        >
                          <Play className="w-4 h-4" />
                          <span className="truncate">Продовжити</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartGame(brand.id)}
                          className="w-full justify-start gap-2 h-9"
                        >
                          <Gamepad2 className="w-4 h-4 text-green-500" />
                          <span className="truncate">{completedBrandGames > 0 ? 'Нова гра' : 'Почати'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            <Card 
              className="border-dashed border-2 border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group min-h-[200px] flex items-center justify-center"
              onClick={() => setCreateBrandOpen(true)}
            >
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                  <Plus className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Новий бренд
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Створити ще один бренд
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <CreateBrandDialog 
        open={createBrandOpen} 
        onOpenChange={setCreateBrandOpen}
        onBrandCreated={() => {
          setCreateBrandOpen(false);
          queryClientHook.invalidateQueries({ queryKey: ['/api/user/brands'] });
        }}
      />
    </div>
  );
}
