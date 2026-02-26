import { useState, useEffect, useLayoutEffect } from 'react';
import { resolveMediaUrl } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
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

  const activeSessions = sessions.filter(s => !s.completed);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'soul': return Heart;
      case 'mind': return Brain;
      case 'body': return Dumbbell;
      default: return Heart;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'soul': return 'text-pink-500';
      case 'mind': return 'text-blue-500';
      case 'body': return 'text-green-500';
      default: return 'text-gray-500';
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 overflow-hidden">
      <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-6 min-h-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {greeting()}, {userName}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Душа Бренду</p>
          </div>
          <Link href="/brands">
            <Button size="sm" className="shrink-0">
              <Plus className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Бренд</span>
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 mb-3 shrink-0">
          {[
            { icon: Users, value: totalBrands, label: 'брендів', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/40' },
            { icon: Trophy, value: completedGames, label: 'завершено', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/40' },
            { icon: TrendingUp, value: activeGames, label: 'активних', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
            { icon: Zap, value: totalXP, label: 'XP', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/40' },
          ].map(({ icon: Icon, value, label, color, bg }) => (
            <div key={label} className="flex-1 flex items-center gap-1.5 px-2 py-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-xl border border-gray-200/60 dark:border-gray-700/60">
              <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate leading-none mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Main content — 2 columns, fill remaining space */}
        <div className="flex-1 grid sm:grid-cols-2 gap-3 min-h-0">

          {/* Мої бренди */}
          <div className="flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Мої бренди</span>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="h-6 px-1.5 text-blue-600 text-xs">
                  Всі <ArrowRight className="w-3 h-3 ml-0.5" />
                </Button>
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto">
              {brands.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                  <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ще немає брендів</p>
                  <Link href="/brands">
                    <Button size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Створити
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {brands.map((brand) => {
                    const brandSessions = sessions.filter(s => s.brandId === brand.id);
                    const activeSession = brandSessions.find(s => !s.completed);
                    const isCompleted = !activeSession && brandSessions.some(s => s.completed);
                    const progress = activeSession ? Math.min(Math.round(activeSession.progress || 0), 100) : 0;
                    const LevelIcon = activeSession ? getLevelIcon(activeSession.currentLevel) : null;

                    return (
                      <div
                        key={brand.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/brand/${brand.id}`)}
                      >
                        {brand.logo ? (
                          <img src={resolveMediaUrl(brand.logo)} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">{brand.name.charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm leading-tight">{brand.name}</p>
                          {activeSession && LevelIcon ? (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Play className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                              <Progress value={progress} className="h-1 flex-1" />
                              <span className="text-[10px] text-gray-400">{progress}%</span>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 truncate leading-tight">{brand.description || 'Без опису'}</p>
                          )}
                        </div>
                        {isCompleted ? (
                          <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 px-1.5 shrink-0">✓</Badge>
                        ) : activeSession && LevelIcon ? (
                          <LevelIcon className={`w-3.5 h-3.5 shrink-0 ${getLevelColor(activeSession.currentLevel)}`} />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Активні ігри */}
          <div className="flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-200/60 dark:border-gray-700/60 overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
              <span className="font-semibold text-sm text-gray-900 dark:text-white">Активні ігри</span>
              {activeSessions.length > 0 && (
                <Link href="/brands">
                  <Button variant="ghost" size="sm" className="h-6 px-1.5 text-blue-600 text-xs">
                    Всі <ArrowRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {activeSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                  <TrendingUp className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Немає активних ігор</p>
                  <Link href="/brands">
                    <Button size="sm" className="h-7 text-xs">
                      <Plus className="w-3 h-3 mr-1" />
                      Почати гру
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                  {activeSessions.map((session) => {
                    const brand = brands.find(b => b.id === session.brandId);
                    const progress = Math.min(Math.round(session.progress || 0), 100);
                    const LevelIcon = getLevelIcon(session.currentLevel);

                    return (
                      <div
                        key={session.id}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/game/${session.id}`)}
                      >
                        {brand?.logo ? (
                          <img src={resolveMediaUrl(brand.logo)} alt="" className="w-8 h-8 rounded-lg object-contain bg-white border shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-sm">{brand?.name?.charAt(0) || '?'}</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate text-sm leading-tight">{brand?.name || 'Бренд'}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Progress value={progress} className="h-1 flex-1" />
                            <span className="text-[10px] text-gray-400">{progress}%</span>
                          </div>
                        </div>
                        <LevelIcon className={`w-3.5 h-3.5 shrink-0 ${getLevelColor(session.currentLevel)}`} />
                        <Play className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

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
