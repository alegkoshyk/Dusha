import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Play, 
  Eye, 
  Trash2, 
  Calendar,
  Trophy,
  Zap,
  Heart,
  Brain,
  Dumbbell,
  Users,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { CreateBrandDialog } from '@/components/brands/CreateBrandDialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { UserBrand, GameSession } from '@shared/schema';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createBrandOpen, setCreateBrandOpen] = useState(false);

  // Завантаження брендів користувача
  const { data: brands = [], isLoading: brandsLoading } = useQuery<UserBrand[]>({
    queryKey: ['/api/user/brands'],
    enabled: !!user,
  });

  // Завантаження активних сесій
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: !!user,
  });

  // Мутація для видалення бренду
  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId: string) => {
      return apiRequest('DELETE', `/api/user/brands/${brandId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/brands'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
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

  // Мутація для видалення ігрової сесії
  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      return apiRequest('DELETE', `/api/game-sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
      toast({
        title: "Гру видалено",
        description: "Ігрова сесія успішно видалена",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити гру",
        variant: "destructive",
      });
    },
  });

  // Мутація для створення нової гри
  const createGameMutation = useMutation({
    mutationFn: async (brandId: string) => {
      return apiRequest('POST', '/api/game-sessions', { brandId });
    },
    onSuccess: (session: GameSession) => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
      setLocation(`/game/${session.id}`);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити нову гру",
        variant: "destructive",
      });
    },
  });

  const handleDeleteBrand = (brandId: string, brandName: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити бренд "${brandName}"? Всі дані будуть втрачені.`)) {
      deleteBrandMutation.mutate(brandId);
    }
  };

  const handleDeleteSession = (sessionId: string, brandName: string) => {
    if (window.confirm(`Ви впевнені, що хочете видалити гру для бренду "${brandName}"? Це дію неможливо скасувати.`)) {
      deleteSessionMutation.mutate(sessionId);
    }
  };

  const handleStartGame = (brandId: string) => {
    createGameMutation.mutate(brandId);
  };

  const handleContinueGame = (sessionId: string) => {
    setLocation(`/game/${sessionId}`);
  };

  const handleViewResults = (sessionId: string) => {
    setLocation(`/game/${sessionId}/results`);
  };

  // Статистика
  const totalBrands = brands.length;
  const completedGames = sessions.filter(s => s.completed).length;
  const activeGames = sessions.filter(s => !s.completed).length;
  const totalXP = sessions.reduce((sum, s) => sum + (s.totalXp || 0), 0);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return Heart;
      case 'mind': return Brain;
      case 'body': return Dumbbell;
      default: return BookOpen;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'soul': return 'text-purple-600 bg-purple-100';
      case 'mind': return 'text-blue-600 bg-blue-100';
      case 'body': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelName = (level: string) => {
    switch (level) {
      case 'soul': return 'Душа';
      case 'mind': return 'Розум';
      case 'body': return 'Тіло';
      default: return 'Невідомо';
    }
  };

  if (brandsLoading || sessionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження дашборду...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Дашборд
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Керуйте своїми брендами та грами
              </p>
            </div>
            <Button 
              onClick={() => setCreateBrandOpen(true)}
              className="flex items-center gap-2"
              data-testid="button-create-brand"
            >
              <Plus className="w-4 h-4" />
              Новий бренд
            </Button>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalBrands}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Брендів</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full mx-auto mb-2">
                  <Trophy className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{completedGames}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Завершено</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full mx-auto mb-2">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeGames}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Активних</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full mx-auto mb-2">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalXP}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Всього XP</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="brands" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="brands">Мої бренди</TabsTrigger>
            <TabsTrigger value="games">Активні ігри</TabsTrigger>
            <TabsTrigger value="completed">Завершені ігри</TabsTrigger>
          </TabsList>
          
          <TabsContent value="brands" className="space-y-4">
            {brands.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="mb-4">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Ще немає брендів
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Створіть свій перший бренд, щоб розпочати подорож самопізнання
                    </p>
                  </div>
                  <Button 
                    onClick={() => setCreateBrandOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Створити перший бренд
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Карта створення нового бренду */}
                <Card 
                  className="border-dashed border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => setCreateBrandOpen(true)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center h-48">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                        <Plus className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Створити новий бренд
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Почніть подорож створення нового бренду
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {brands.map((brand) => {
                  const brandSessions = sessions.filter(s => s.brandId === brand.id);
                  const completedBrandGames = brandSessions.filter(s => s.completed).length;
                  const activeBrandGame = brandSessions.find(s => !s.completed);
                  
                  // Обчислення прогресу
                  const totalCards = 15; // загальна кількість карток в грі
                  const rawProgress = activeBrandGame?.progress || 0;
                  // Обмежуємо прогрес до максимум 100%
                  const progress = Math.min(Math.round(rawProgress), 100);
                  
                  const hasActiveGame = !!activeBrandGame;
                  const isCompleted = !hasActiveGame && completedBrandGames > 0;
                  
                  return (
                    <Card 
                      key={brand.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => hasActiveGame ? handleContinueGame(activeBrandGame.id) : handleStartGame(brand.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                              {brand.name}
                            </CardTitle>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {brand.description || 'Опис агентства йосього улюбленого шоку'}
                            </p>
                            
                            {/* Статус */}
                            <div className="flex items-center gap-2 mt-2">
                              {hasActiveGame && (
                                <Badge variant="secondary" className="text-xs">
                                  Активний
                                </Badge>
                              )}
                              {isCompleted && (
                                <Badge variant="default" className="text-xs bg-green-100 text-green-700">
                                  Завершено
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBrand(brand.id, brand.name);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`delete-brand-${brand.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 pb-4">
                        <div className="space-y-4">
                          {/* Progress Display */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Прогрес</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>

                          {/* Current Level Info */}
                          {activeBrandGame && (
                            <div className="flex items-center gap-2">
                              {React.createElement(getLevelIcon(activeBrandGame.currentLevel || 'soul'), {
                                className: "w-4 h-4"
                              })}
                              <Badge variant="outline" className={getLevelColor(activeBrandGame.currentLevel || 'soul')}>
                                {getLevelName(activeBrandGame.currentLevel || 'soul')}
                              </Badge>
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(brand.createdAt).toLocaleDateString('uk-UA')}
                            </div>
                            {completedBrandGames > 0 && (
                              <div className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                {completedBrandGames} завершено
                              </div>
                            )}
                          </div>

                          {/* Action Button - стилізований як на дизайні */}
                          <div className="pt-2" onClick={(e) => e.stopPropagation()}>
                            {hasActiveGame ? (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleContinueGame(activeBrandGame.id)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                  data-testid={`continue-game-${brand.id}`}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Продовжити
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => handleViewResults(activeBrandGame.id)}
                                  className="p-2"
                                  data-testid={`view-results-${brand.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleStartGame(brand.id)}
                                variant="outline"
                                className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                                data-testid={`start-game-${brand.id}`}
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Нова гра
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="games" className="space-y-4">
            {sessions.filter(s => !s.completed).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Немає активних ігор
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Розпочніть нову гру з одного з ваших брендів
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessions.filter(s => !s.completed).map((session) => {
                  const brand = brands.find(b => b.id === session.brandId);
                  const LevelIcon = getLevelIcon(session.currentLevel);
                  const rawSessionProgress = session.progress || 0;
                  // Обмежуємо прогрес до максимум 100%
                  const progressPercentage = Math.min(Math.round(rawSessionProgress), 100);
                  
                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${getLevelColor(session.currentLevel)}`}>
                            <LevelIcon className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {brand?.name || 'Невідомий бренд'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Поточний рівень: {getLevelName(session.currentLevel)}
                                </p>
                              </div>
                              <Badge variant="outline">
                                {progressPercentage}% завершено
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-600 dark:text-gray-400">Прогрес</span>
                                  <span className="text-gray-900 dark:text-white font-medium">
                                    {(session.completedCards as string[])?.length || 0}/15 карток
                                  </span>
                                </div>
                                <Progress value={progressPercentage} className="h-2" />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-4 h-4" />
                                    <span>{session.totalXp || 0} XP</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(session.updatedAt).toLocaleDateString('uk-UA')}</span>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    onClick={() => handleContinueGame(session.id)}
                                    data-testid={`continue-session-${session.id}`}
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    Продовжити
                                  </Button>
                                  {progressPercentage > 0 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewResults(session.id)}
                                      data-testid={`view-session-results-${session.id}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id, brand?.name || 'Невідомий бренд');
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2"
                                    data-testid={`delete-session-${session.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-4">
            {sessions.filter(s => s.completed).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Ще немає завершених ігор
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Завершіть вашу першу гру, щоб побачити результати тут
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessions.filter(s => s.completed).map((session) => {
                  const brand = brands.find(b => b.id === session.brandId);
                  const completionDate = new Date(session.updatedAt);
                  
                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-lg bg-green-100 text-green-600">
                            <Trophy className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {brand?.name || 'Невідомий бренд'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Гра завершена • {completionDate.toLocaleDateString('uk-UA')}
                                </p>
                              </div>
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Завершено
                              </Badge>
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Heart className="w-4 h-4 text-purple-500" />
                                  <span>{(session.completedCards as string[])?.filter(c => c.startsWith('soul-')).length || 0} Душа</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Brain className="w-4 h-4 text-blue-500" />
                                  <span>{(session.completedCards as string[])?.filter(c => c.startsWith('mind-')).length || 0} Розум</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Dumbbell className="w-4 h-4 text-green-500" />
                                  <span>{(session.completedCards as string[])?.filter(c => c.startsWith('body-')).length || 0} Тіло</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Zap className="w-4 h-4 text-yellow-500" />
                                  <span>{session.totalXp || 0} XP</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Всього відповідей: {(session.completedCards as string[])?.length || 0}
                                </p>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleViewResults(session.id)}
                                    data-testid={`view-completed-results-${session.id}`}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Карта бренду
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSession(session.id, brand?.name || 'Невідомий бренд');
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2"
                                    data-testid={`delete-completed-session-${session.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleStartGame(brand?.id || '')}
                                    data-testid={`restart-game-${session.id}`}
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    Нова гра
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Brand Dialog */}
      <CreateBrandDialog 
        open={createBrandOpen} 
        onOpenChange={setCreateBrandOpen}
        onBrandCreated={(brand) => {
          setCreateBrandOpen(false);
          queryClient.invalidateQueries({ queryKey: ['/api/user/brands'] });
          toast({
            title: "Бренд створено",
            description: `Бренд "${brand.name}" успішно створено`,
          });
        }}
      />
    </div>
  );
}