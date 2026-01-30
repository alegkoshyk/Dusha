import { useState, useEffect, useLayoutEffect } from 'react';
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
  MessageSquare
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
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {greeting()}, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ласкаво просимо до Душі Бренду
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full mx-auto mb-2">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalBrands}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Брендів</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-full mx-auto mb-2">
                <Trophy className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{completedGames}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Завершено</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full mx-auto mb-2">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{activeGames}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Активних</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-400 rounded-full mx-auto mb-2">
                <Zap className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalXP}</p>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">XP</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link href="/brands" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Мої бренди
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{totalBrands} брендів</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/brand-maps" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Карти брендів
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Візуалізації</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/media" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                    <Image className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                      Медіа
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Бібліотека</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/brand-analysis" className="contents">
            <Card className="hover:shadow-lg transition-all cursor-pointer group border-2 border-transparent hover:border-emerald-200 dark:hover:border-emerald-800">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Аналіз
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Дослідження</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
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
                          <img src={brand.logo} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white border flex-shrink-0" />
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
                    const hasActiveGame = brandSessions.some(s => !s.completed);
                    const isCompleted = !hasActiveGame && brandSessions.some(s => s.completed);
                    
                    return (
                      <div 
                        key={brand.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/brand/${brand.id}`)}
                      >
                        {brand.logo ? (
                          <img src={brand.logo} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain bg-white border flex-shrink-0" />
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
                        {hasActiveGame && (
                          <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0 px-1.5 sm:px-2">Актив</Badge>
                        )}
                        {isCompleted && (
                          <Badge className="text-[10px] sm:text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 flex-shrink-0 px-1.5 sm:px-2">Готово</Badge>
                        )}
                        <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
