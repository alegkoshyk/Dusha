import { useState, useEffect, useLayoutEffect } from 'react';
import { resolveMediaUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Play, 
  Trophy,
  Zap,
  Heart,
  Brain,
  Dumbbell,
  Users,
  TrendingUp,
  ArrowRight,
  Map,
  Image,
  Search,
  MessageSquare,
  Bot,
  Sparkles
} from 'lucide-react';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingModal } from '@/components/OnboardingModal';
import type { UserBrand, GameSession, UserProfile } from '@shared/schema';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile & { hasApiKey: boolean }>({
    queryKey: ['/api/user/profile'],
    enabled: !!user,
  });

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (profile && !profile.onboardingCompleted && !profile.onboardingSkipped) {
      setShowOnboarding(true);
    }
  }, [profile]);

  const { data: brands = [], isLoading: brandsLoading } = useQuery<UserBrand[]>({
    queryKey: ['/api/user/brands'],
    enabled: !!user,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: !!user,
  });

  const { data: userStats } = useQuery<{totalXp: number; totalGames: number; completedGames: number}>({
    queryKey: ['/api/user/stats'],
    enabled: !!user,
  });

  const totalBrands = brands.length;
  const completedGames = userStats?.completedGames || sessions.filter(s => s.completed).length;
  const activeGames = sessions.filter(s => !s.completed).length;
  const totalXP = userStats?.totalXp || sessions.reduce((sum, s) => sum + (s.totalXp || 0), 0);

  const activeSessions = sessions.filter(s => !s.completed).slice(0, 3);
  const recentBrands = brands.slice(0, 3);

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
      case 'soul': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300';
      case 'mind': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'body': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (brandsLoading || sessionsLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BrandSoulSpinner size={48} className="mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Завантаження...</p>
        </div>
      </div>
    );
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброго ранку';
    if (hour < 18) return 'Доброго дня';
    return 'Доброго вечора';
  };

  const userName = profile?.firstName || user?.firstName || 'Користувач';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 pb-24 md:pb-8 overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {greeting()}, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ласкаво просимо до Душі Бренду
          </p>
        </div>

        {/* Compact stats row */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shrink-0">
            <div className="w-7 h-7 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">{totalBrands}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">брендів</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shrink-0">
            <div className="w-7 h-7 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">{completedGames}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">завершено</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shrink-0">
            <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">{activeGames}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">активних</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full border border-gray-200 dark:border-gray-700 shrink-0">
            <div className="w-7 h-7 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white">{totalXP}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">XP</span>
          </div>
        </div>

        {/* Quick actions — grid on all screens */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 mb-6">
          <Link href="/brands" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
                      Мої бренди
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{totalBrands} брендів</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/brand-maps" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      Карти
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Візуалізації</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/media" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shrink-0">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors leading-tight">
                      Медіа
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Бібліотека</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/brand-analysis" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                      Аналіз
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Дослідження</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/agents" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors leading-tight">
                      AI Агенти
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Помічники</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/name-generator" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-800">
              <CardContent className="p-3">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                      Назви
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Генератор</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Мої бренди</CardTitle>
                <Link href="/brands">
                  <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 px-2">
                    <span className="hidden sm:inline">Всі</span> <ArrowRight className="w-4 h-4 sm:ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {recentBrands.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Ще немає брендів</p>
                  <Link href="/brands">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Створити бренд
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {recentBrands.map((brand) => {
                    const brandSessions = sessions.filter(s => s.brandId === brand.id);
                    const activeSession = brandSessions.find(s => !s.completed);
                    const isCompleted = !activeSession && brandSessions.some(s => s.completed);
                    const progress = activeSession ? Math.min(Math.round(activeSession.progress || 0), 100) : 0;
                    const LevelIcon = activeSession ? getLevelIcon(activeSession.currentLevel) : null;
                    
                    return (
                      <div 
                        key={brand.id}
                        className="rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer overflow-hidden"
                        onClick={() => setLocation(`/brand/${brand.id}`)}
                      >
                        <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3">
                          {brand.logo ? (
                            <img src={resolveMediaUrl(brand.logo)} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white border flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-bold text-sm sm:text-base">{brand.name.charAt(0)}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">{brand.name}</p>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              {brand.description || 'Без опису'}
                            </p>
                          </div>
                          {isCompleted && (
                            <Badge className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 flex-shrink-0 px-1.5 sm:px-2">Готово</Badge>
                          )}
                          <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </div>
                        {activeSession && LevelIcon && (
                          <div 
                            className="flex items-center gap-2 px-2 sm:px-3 pb-2 sm:pb-3 pt-0"
                            onClick={(e) => { e.stopPropagation(); setLocation(`/game/${activeSession.id}`); }}
                          >
                            <Play className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Progress value={progress} className="h-1.5 flex-1" />
                              <span className="text-xs text-gray-500">{progress}%</span>
                            </div>
                            <Badge variant="outline" className={`${getLevelColor(activeSession.currentLevel)} text-[10px] sm:text-xs px-1.5 sm:px-2`}>
                              <LevelIcon className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">{getLevelName(activeSession.currentLevel)}</span>
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="pb-3 px-3 sm:px-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">Активні ігри</CardTitle>
                {activeSessions.length > 0 && (
                  <Link href="/brands">
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 px-2">
                      <span className="hidden sm:inline">Всі</span> <ArrowRight className="w-4 h-4 sm:ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {activeSessions.length === 0 ? (
                <div className="text-center py-6">
                  <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">Немає активних ігор</p>
                  <Link href="/brands">
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Почати гру
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {activeSessions.map((session) => {
                    const brand = brands.find(b => b.id === session.brandId);
                    const progress = Math.min(Math.round(session.progress || 0), 100);
                    const LevelIcon = getLevelIcon(session.currentLevel);
                    
                    return (
                      <div 
                        key={session.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/game/${session.id}`)}
                      >
                        {brand?.logo ? (
                          <img src={resolveMediaUrl(brand.logo)} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white border flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm sm:text-base">{brand?.name?.charAt(0) || '?'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm sm:text-base">{brand?.name || 'Бренд'}</p>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="h-1.5 flex-1" />
                            <span className="text-xs text-gray-500">{progress}%</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={`${getLevelColor(session.currentLevel)} hidden sm:flex`}>
                          <LevelIcon className="w-3 h-3 mr-1" />
                          {getLevelName(session.currentLevel)}
                        </Badge>
                        <LevelIcon className={`w-4 h-4 sm:hidden flex-shrink-0 ${session.currentLevel === 'soul' ? 'text-pink-500' : session.currentLevel === 'mind' ? 'text-blue-500' : 'text-green-500'}`} />
                        <Play className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <OnboardingModal 
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
        initialFirstName={profile?.firstName || user?.firstName || undefined}
        initialLastName={profile?.lastName || user?.lastName || undefined}
      />
    </div>
  );
}
