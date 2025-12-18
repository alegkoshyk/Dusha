import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Eye, 
  Calendar,
  Trophy,
  Heart,
  Brain,
  Dumbbell,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'wouter';
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
import { useAuth } from '@/hooks/useAuth';
import type { GameSession, UserBrand } from '@shared/schema';

function getLevelIcon(level: string) {
  switch (level) {
    case 'soul': return <Heart className="w-4 h-4 text-red-500" />;
    case 'mind': return <Brain className="w-4 h-4 text-blue-500" />;
    case 'body': return <Dumbbell className="w-4 h-4 text-green-500" />;
    default: return null;
  }
}

function getLevelName(level: string) {
  switch (level) {
    case 'soul': return 'Душа';
    case 'mind': return 'Розум';
    case 'body': return 'Тіло';
    default: return level;
  }
}

export default function BrandMaps() {
  const { user } = useAuth();

  const { data: brands = [], isLoading: brandsLoading } = useQuery<UserBrand[]>({
    queryKey: ['/api/user/brands'],
    enabled: !!user,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ['/api/user/game-sessions'],
    enabled: !!user,
  });

  const isLoading = brandsLoading || sessionsLoading;

  const getBrandForSession = (brandId: string | null) => {
    if (!brandId) return null;
    return brands.find(b => b.id === brandId);
  };

  const completedSessions = sessions.filter(s => s.completed);
  const inProgressSessions = sessions.filter(s => !s.completed && s.progress > 0);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <BrandSoulSpinner size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-page-title">
            Карти брендів
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Перегляньте свої бренди та спілкуйтесь з AI-консультантом
          </p>
        </div>
      </div>

      {completedSessions.length === 0 && inProgressSessions.length === 0 && (
        <Card className="text-center py-16" data-testid="card-empty-state">
          <CardContent>
            <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Поки що немає карт брендів
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Завершіть гру "Душа Бренду", щоб отримати карту бренду та доступ до AI-чату
            </p>
            <Link href="/dashboard">
              <Button data-testid="button-start-game">
                Почати нову гру
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {completedSessions.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Завершені бренди
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedSessions.map(session => {
              const brand = getBrandForSession(session.brandId);
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow" data-testid={`card-completed-brand-${session.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold" data-testid={`text-brand-name-${session.id}`}>
                        {brand?.name || 'Бренд'}
                      </CardTitle>
                      <Badge variant="default" className="bg-green-500">
                        Завершено
                      </Badge>
                    </div>
                    {brand?.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                        {brand.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span>{session.totalXp || 0} XP</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(session.completed!).toLocaleDateString('uk-UA')}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link href={`/brand-board/${session.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm" data-testid={`button-view-map-${session.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          Карта
                        </Button>
                      </Link>
                      <Link href={`/brand-chat/${session.id}`} className="flex-1">
                        <Button className="w-full" size="sm" data-testid={`button-chat-${session.id}`}>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          AI Чат
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {inProgressSessions.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-500" />
            В процесі
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inProgressSessions.map(session => {
              const brand = getBrandForSession(session.brandId);
              return (
                <Card key={session.id} className="hover:shadow-lg transition-shadow opacity-80" data-testid={`card-inprogress-brand-${session.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold">
                        {brand?.name || 'Бренд'}
                      </CardTitle>
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getLevelIcon(session.currentLevel)}
                        {getLevelName(session.currentLevel)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Прогрес</span>
                        <span className="font-medium">{session.progress}%</span>
                      </div>
                      <Progress value={session.progress} className="h-2" />
                    </div>
                    
                    <Link href={`/game/${session.id}`}>
                      <Button className="w-full" size="sm" data-testid={`button-continue-${session.id}`}>
                        Продовжити гру
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
