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
import { BrandSoulSpinner } from '@/components/BrandSoulSpinner';
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

  // Get cards from API
  const { data: rawApiCards = [] } = useQuery<any[]>({
    queryKey: ["/api/game-cards"],
    enabled: true,
  });
  
  // Sort cards stably by level and positionY for consistent navigation
  const apiCards = [...rawApiCards].sort((a, b) => {
    const levelOrder: Record<string, number> = { 'soul': 0, 'mind': 1, 'body': 2 };
    const levelDiff = (levelOrder[a.levelId] || 0) - (levelOrder[b.levelId] || 0);
    if (levelDiff !== 0) return levelDiff;
    return (a.positionY || 0) - (b.positionY || 0);
  });
  
  // Get session responses from API
  const { data: sessionResponses = {} } = useQuery<Record<string, any>>({
    queryKey: ["/api/game-sessions", activeSessionId, "responses-map"],
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
        responses: sessionResponses || {},
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
    
    if (cardFromUrl && apiCards && apiCards.find(c => c.id === cardFromUrl)) {
      setCurrentCardId(cardFromUrl);
      setViewMode('card');
    } else if (!cardFromUrl) {
      // No card in URL, show field view
      setViewMode('field');
    }
  }, [location]);

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async ({ cardId, response, timeSpent, isWithinTimeLimit, earnedXP }: { 
      cardId: string; 
      response: any; 
      timeSpent?: number; 
      isWithinTimeLimit?: boolean; 
      earnedXP?: number; 
    }) => {
      return apiRequest(
        'POST',
        `/api/game-sessions/${activeSessionId}/responses`,
        { cardId, response, timeSpent, isWithinTimeLimit, earnedXP }
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
    if (!apiCards) return 0;
    const levelCards = apiCards.filter(card => card.levelId === level);
    const completed = levelCards.filter(card => completedCards.includes(card.id)).length;
    return Math.round((completed / levelCards.length) * 100);
  };

  const handleCardSelect = (cardId: string) => {
    setCurrentCardId(cardId);
    setViewMode('card');
    setLocation(`/game/${activeSessionId}?card=${cardId}`);
  };

  const handleGoBack = () => {
    setViewMode('field');
    setCurrentCardId('');
    setLocation(`/game/${activeSessionId}`);
  };

  const handleCardResponse = async (response: any, timeData?: { timeSpent: number; isWithinTimeLimit: boolean; earnedXP: number }) => {
    if (!currentCardId) return;

    console.log("Mobile-game handleCardResponse - timeData received:", timeData); // Debug log

    try {
      const requestData = { 
        cardId: currentCardId, 
        response,
        ...(timeData && {
          timeSpent: timeData.timeSpent,
          isWithinTimeLimit: timeData.isWithinTimeLimit,
          earnedXP: timeData.earnedXP
        })
      };
      
      console.log("Mobile-game requestData to send:", requestData); // Debug log
      
      await submitResponseMutation.mutateAsync(requestData);

      // Показуємо результат таймера в повідомленні
      let description = "Ваша відповідь успішно збережена.";
      if (timeData) {
        if (timeData.isWithinTimeLimit) {
          description += ` Ви встигли! Отримано ${timeData.earnedXP} XP.`;
        } else {
          description += " Час вийшов, але відповідь збережена.";
        }
      }

      toast({
        title: "Відповідь збережена!",
        description,
        variant: timeData?.isWithinTimeLimit === false ? "destructive" : "default",
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
    if (!currentCard) {
      console.log("handleNextCard: currentCard not found for", currentCardId);
      return;
    }

    const cardLevel = (currentCard as any).level || (currentCard as any).levelId;
    console.log("handleNextCard: currentCardId =", currentCardId, "currentCard.level =", cardLevel);

    // PRIORITY 1: Use nextCards from mobileGameCards definition (most reliable)
    const nextOptions = getNextCardOptions(currentCardId, playerProgress.responses);
    console.log("handleNextCard: nextOptions =", nextOptions);
    
    if (nextOptions.length > 0) {
      console.log("handleNextCard: navigating to", nextOptions[0]);
      handleCardSelect(nextOptions[0]);
      return;
    }

    // PRIORITY 2: For API cards, find next card based on position
    if (apiCards) {
      if (currentCardId === 'soul-start') {
        // After soul-start, go to soul-values
        const valuesCard = apiCards.find(card => card.id === 'soul-values');
        if (valuesCard) {
          handleCardSelect('soul-values');
          return;
        }
      }
      
      // Find next card in the same level (fallback for cards without nextCards)
      const currentIndex = apiCards.findIndex(card => card.id === currentCardId);
      if (currentIndex >= 0 && currentIndex < apiCards.length - 1) {
        const nextCard = apiCards[currentIndex + 1];
        if (nextCard && nextCard.levelId === cardLevel) {
          handleCardSelect(nextCard.id);
          return;
        }
      }
    }
    
    // PRIORITY 3: Check if level is complete and move to next level
    const levelCards = mobileGameCards.filter(card => (card as any).level === cardLevel);
    const levelCompleted = levelCards.every(card => 
      playerProgress.completedCards.includes(card.id) || !card.required
    );

    if (levelCompleted) {
      // Move to next level or complete game
      if (cardLevel === 'soul') {
        const firstMindCard = mobileGameCards.find(card => (card as any).level === 'mind');
        if (firstMindCard) {
          handleCardSelect(firstMindCard.id);
        }
      } else if (cardLevel === 'mind') {
        const firstBodyCard = mobileGameCards.find(card => (card as any).level === 'body');
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
  };

  const handlePreviousCard = () => {
    if (!apiCards || !currentCardId) {
      setViewMode('field');
      setLocation(`/game/${activeSessionId}`);
      return;
    }
    
    // Find current card and its level
    const currentCard = apiCards.find(c => c.id === currentCardId);
    if (!currentCard) {
      setViewMode('field');
      setLocation(`/game/${activeSessionId}`);
      return;
    }
    
    // Get cards in the same level
    const levelCards = apiCards.filter(c => c.levelId === currentCard.levelId);
    const currentIndexInLevel = levelCards.findIndex(c => c.id === currentCardId);
    
    if (currentIndexInLevel > 0) {
      // Go to previous card in the same level
      const prevCard = levelCards[currentIndexInLevel - 1];
      handleCardSelect(prevCard.id);
    } else {
      // First card in level - return to field
      setViewMode('field');
      setLocation(`/game/${activeSessionId}`);
    }
  };

  const handleSkipCard = async (reason: string) => {
    if (!currentCardId || !activeSessionId) return;
    
    try {
      // Save skip reason to session
      await apiRequest('POST', `/api/game-sessions/${activeSessionId}/responses`, {
        cardId: currentCardId,
        response: { skipped: true, reason },
        responseType: 'skip'
      });
      
      // Invalidate responses-map to update UI immediately
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", activeSessionId, "responses-map"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", activeSessionId] });
      
      toast({
        title: "Картку пропущено",
        description: "Ви можете повернутися до неї пізніше",
      });
      
      // Navigate to next card
      handleNextCard();
    } catch (error) {
      console.error('Error skipping card:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося пропустити картку",
        variant: "destructive",
      });
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

  // Get current card from API cards
  const currentCard = currentCardId && apiCards ? apiCards.find(c => c.id === currentCardId) : null;
  const gameProgress = apiCards ? Math.round((playerProgress.completedCards.length / apiCards.length) * 100) : 0;

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BrandSoulSpinner size={48} className="mx-auto mb-4" />
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
  if (viewMode === 'card' && currentCard && apiCards) {
    const cardIndex = apiCards.findIndex(card => card.id === currentCardId);
    const cardProgress = ((cardIndex + 1) / apiCards.length) * 100;
    
    // Підрахунок прогресу конкретного рівня
    const levelCards = apiCards.filter(card => card.levelId === currentCard.levelId);
    const levelCardIds = levelCards.map(card => card.id);
    const currentCardIndexInLevel = levelCards.findIndex(card => card.id === currentCardId);
    
    // Визначаємо пропущені картки - API повертає response з skipped: true
    const skippedCardsInLevel = levelCards
      .filter(card => {
        const resp = sessionResponses?.[card.id];
        return resp && resp.skipped === true;
      })
      .map(card => card.id);
    
    const completedLevelCards = levelCards.filter(card => 
      playerProgress.completedCards.includes(card.id) && !skippedCardsInLevel.includes(card.id)
    );
    const levelProgress = Math.round((completedLevelCards.length / levelCards.length) * 100);

    // Can go back if not the first card in this level
    const canGoBack = currentCardIndexInLevel > 0;
    
    console.log('Card view debug:', {
      currentCardId,
      currentCardIndexInLevel,
      levelCardIds,
      skippedCardsInLevel,
      canGoBack,
      sessionResponses: sessionResponses ? Object.keys(sessionResponses) : []
    });
    
    return (
      <GameCard
        card={currentCard}
        response={sessionResponses ? sessionResponses[currentCardId] : undefined}
        onResponse={handleCardResponse}
        onNext={handleNextCard}
        onPrevious={handlePreviousCard}
        onBackToLevel={handleReturnToField}
        onSkip={handleSkipCard}
        canGoNext={true}
        canGoPrevious={canGoBack}
        progress={cardProgress}
        totalCards={apiCards.length}
        levelProgress={levelProgress}
        completedCardsInLevel={completedLevelCards.length}
        totalCardsInLevel={levelCards.length}
        currentCardIndexInLevel={currentCardIndexInLevel}
        skippedCardsInLevel={skippedCardsInLevel}
        levelCardIds={levelCardIds}
        completedCardIds={playerProgress.completedCards}
      />
    );
  }

  // Field view (default)
  return (
    <GameField
      playerProgress={playerProgress}
      onCardSelect={handleCardSelect}
      onLevelChange={handleLevelChange}
      sessionResponses={sessionResponses}
    />
  );
}