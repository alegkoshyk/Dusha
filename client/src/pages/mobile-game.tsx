import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GameField } from '@/components/mobile/GameField';
import { GameCard } from '@/components/mobile/GameCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Home, Download, Eye } from 'lucide-react';
import UserDropdown from '@/components/UserDropdown';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { GameSession, GameLevel } from '@shared/schema';

interface PlayerProgress {
  sessionId: string;
  currentCard: string;
  completedCards: string[];
  unlockedCards: string[];
  responses: Record<string, any>;
  achievements: string[];
  totalXP: number;
  levelProgress: { soul: number; mind: number; body: number };
}

import { 
  mobileGameCards, 
  getGameCard, 
  getUnlockedCards, 
  getNextCardOptions,
  calculateTotalXP,
  getEarnedBadges 
} from '@/lib/mobileGameData';

type ViewMode = 'field' | 'card' | 'complete';

export default function MobileGame() {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [location, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('field');
  const [currentCardId, setCurrentCardId] = useState<string>('soul-start');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get active session if no sessionId provided
  const { data: userSessions } = useQuery({
    queryKey: ["/api/user/game-sessions"],
    enabled: !sessionId,
  });

  const activeSessionId = sessionId || (userSessions && Array.isArray(userSessions) && userSessions.length > 0 ? userSessions[0].id : null);

  // Get game session
  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ["/api/game-sessions", activeSessionId],
    enabled: !!activeSessionId,
  });

  // Get brand map for completion check
  const { data: brandMap, isLoading: brandMapLoading } = useQuery({
    queryKey: ["/api/game-sessions", activeSessionId, "brand-map"],
    enabled: !!activeSessionId,
  });

  // Get card parameter from URL
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const cardFromUrl = urlParams.get('card');

  // Initialize player progress
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress>({
    sessionId: activeSessionId || '',
    currentCard: 'soul-start',
    completedCards: [],
    unlockedCards: ['soul-start'],
    responses: {},
    achievements: [],
    totalXP: 0,
    levelProgress: { soul: 0, mind: 0, body: 0 }
  });

  // Update progress when session data changes
  useEffect(() => {
    if (session) {
      const completedCards = Array.isArray(session.completedCards) ? session.completedCards : [];
      const unlockedCards = getUnlockedCards(completedCards, {});
      
      setPlayerProgress({
        sessionId: session.id,
        currentCard: session.currentCard || 'soul-start',
        completedCards,
        unlockedCards,
        responses: {},
        achievements: getEarnedBadges(completedCards),
        totalXP: calculateTotalXP(completedCards),
        levelProgress: {
          soul: calculateLevelProgress('soul', completedCards),
          mind: calculateLevelProgress('mind', completedCards),
          body: calculateLevelProgress('body', completedCards)
        }
      });

      // Check if game is complete
      if (session.completed) {
        setViewMode('complete');
      }
    }
  }, [session]);

  // Check for current card from URL or session
  useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const cardFromUrl = urlParams.get('card');
    
    if (cardFromUrl && mobileGameCards.find(c => c.id === cardFromUrl)) {
      setCurrentCardId(cardFromUrl);
      setViewMode('card');
    } else if (!cardFromUrl) {
      // No card in URL, show field view
      setViewMode('field');
    }
  }, [location]);

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async ({ cardId, response }: { cardId: string; response: any }) => {
      return apiRequest(
        'POST',
        `/api/game-sessions/${activeSessionId}/responses`,
        { cardId, response }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", activeSessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", activeSessionId, "brand-map"] });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти відповідь. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (progress: number) => {
      return apiRequest(
        'POST',
        `/api/game-sessions/${activeSessionId}/progress`,
        { progress }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", activeSessionId] });
    }
  });

  const calculateLevelProgress = (level: string, completedCards: string[]): number => {
    const levelCards = mobileGameCards.filter(card => card.levelId === level);
    const completed = levelCards.filter(card => completedCards.includes(card.id)).length;
    return Math.round((completed / levelCards.length) * 100);
  };

  const handleCardSelect = (cardId: string) => {
    setCurrentCardId(cardId);
    setViewMode('card');
    setLocation(`/game/${sessionId}?card=${cardId}`);
  };

  const handleGoBack = () => {
    setViewMode('field');
    setCurrentCardId('');
    setLocation(`/game/${sessionId}`);
  };

  const handleCardResponse = async (response: any) => {
    if (!currentCardId) return;

    try {
      const requestData = { 
        cardId: currentCardId, 
        response 
      };
      
      await submitResponseMutation.mutateAsync(requestData);

      toast({
        title: "Відповідь збережена!",
        description: "Ваша відповідь успішно збережена.",
      });

      // Автоматично переходимо до наступної карти або повертаємося на поле
      handleNextCard();

    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти відповідь. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  const handleNextCard = () => {
    if (!currentCardId) return;

    const currentCard = getGameCard(currentCardId);
    if (!currentCard) return;

    // Get next card options based on branching logic
    const nextOptions = getNextCardOptions(currentCardId, playerProgress.responses);
    
    if (nextOptions.length > 0) {
      handleCardSelect(nextOptions[0]);
    } else {
      // No more cards, check if level is complete
      const levelCards = mobileGameCards.filter(card => card.levelId === currentCard.levelId);
      const levelCompleted = levelCards.every(card => 
        playerProgress.completedCards.includes(card.id) || !card.required
      );

      if (levelCompleted) {
        // Move to next level or complete game
        if (currentCard.levelId === 'soul') {
          const firstMindCard = mobileGameCards.find(card => card.levelId === 'mind');
          if (firstMindCard) {
            handleCardSelect(firstMindCard.id);
          }
        } else if (currentCard.levelId === 'mind') {
          const firstBodyCard = mobileGameCards.find(card => card.levelId === 'body');
          if (firstBodyCard) {
            handleCardSelect(firstBodyCard.id);
          }
        } else {
          // Game complete
          setViewMode('complete');
          setLocation(`/game/${activeSessionId}/results`);
        }
      } else {
        // Return to field view
        setViewMode('field');
        setLocation(`/game/${activeSessionId}`);
      }
    }
  };

  const handlePreviousCard = () => {
    const completedCards = playerProgress.completedCards;
    if (completedCards.length > 0) {
      const previousCardId = completedCards[completedCards.length - 1];
      handleCardSelect(previousCardId);
    } else {
      setViewMode('field');
      setLocation(`/game/${activeSessionId}`);
    }
  };

  const handleReturnToField = () => {
    setViewMode('field');
    setCurrentCardId('');
    setLocation(`/game/${activeSessionId}`);
  };

  const handleLevelChange = (level: GameLevel) => {
    // Update session current level if needed
    if (session && session.currentLevel !== level.id) {
      apiRequest(
        'PATCH',
        `/api/game-sessions/${activeSessionId}`,
        { currentLevel: level }
      );
    }
  };

  const currentCard = currentCardId ? getGameCard(currentCardId) : null;
  const gameProgress = Math.round((playerProgress.completedCards.length / mobileGameCards.length) * 100);

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Завантаження гри...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Сесію гри не знайдено</p>
          <Button onClick={() => setLocation('/')}>
            <Home className="w-4 h-4 mr-2" />
            На головну
          </Button>
        </div>
      </div>
    );
  }

  // Game completion view
  if (viewMode === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 text-white rounded-full mb-4">
                <Trophy className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Вітаємо! Гра завершена!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Ви успішно пройшли всі рівні та створили унікальну карту бренду
              </p>
            </div>

            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{playerProgress.totalXP}</p>
                    <p className="text-sm text-gray-600">Всього XP</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{playerProgress.completedCards.length}</p>
                    <p className="text-sm text-gray-600">Карток пройдено</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{playerProgress.achievements.length}</p>
                    <p className="text-sm text-gray-600">Досягнень</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Button 
                onClick={() => setLocation(`/game/${sessionId}/results`)}
                size="lg"
                className="w-full"
                data-testid="button-view-results"
              >
                <Eye className="w-5 h-5 mr-2" />
                Переглянути карту бренду
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full"
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                На головну
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Card view
  if (viewMode === 'card' && currentCard) {
    const cardIndex = mobileGameCards.findIndex(card => card.id === currentCardId);
    const cardProgress = ((cardIndex + 1) / mobileGameCards.length) * 100;
    
    // Підрахунок прогресу конкретного рівня
    const levelCards = mobileGameCards.filter(card => card.levelId === currentCard.levelId);
    const completedLevelCards = levelCards.filter(card => playerProgress.completedCards.includes(card.id));
    const levelProgress = Math.round((completedLevelCards.length / levelCards.length) * 100);

    return (
      <GameCard
        card={currentCard}
        response={playerProgress.responses[currentCardId]}
        onResponse={handleCardResponse}
        onNext={handleNextCard}
        onPrevious={handleGoBack}
        canGoNext={true}
        canGoPrevious={true}
        progress={cardProgress}
        totalCards={mobileGameCards.length}
        levelProgress={levelProgress}
        completedCardsInLevel={completedLevelCards.length}
        totalCardsInLevel={levelCards.length}
      />
    );
  }

  // Field view (default)
  return (
    <GameField
      playerProgress={playerProgress}
      onCardSelect={handleCardSelect}
      onLevelChange={handleLevelChange}
    />
  );
}