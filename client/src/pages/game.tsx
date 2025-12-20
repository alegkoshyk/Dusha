import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import GameHeader from "@/components/game/GameHeader";
import LevelNavigation from "@/components/game/LevelNavigation";
import GameCard from "@/components/game/GameCard";
import BrandMapPreview from "@/components/game/BrandMapPreview";
import FloatingActions from "@/components/game/FloatingActions";
import HelpModal from "@/components/game/HelpModal";
import { gameCards, getCardById, getCardsByLevel, getNextCard, getPreviousCard, type StaticGameLevel, type StaticGameCard } from "@/lib/gameData";

interface GameSessionData {
  id: string;
  currentLevel: StaticGameLevel;
  currentCard: string;
  progress: number;
  completedCards: string[];
  totalXp: number;
}

interface CardResponseData {
  cardId: string;
  response: any;
}

interface LocalBrandMap {
  soul: { values: string[]; mission?: string; story?: string; purpose?: string };
  mind: { targetAudience?: string; brandIdea?: string; archetype?: string; promise?: string; positioning?: string };
  body: { products: string[]; channels: string[]; tone?: string; visualStyle?: string };
}

export default function Game() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Get game session
  const { data: session, isLoading, error } = useQuery<GameSessionData>({
    queryKey: ["/api/game-sessions", sessionId],
    enabled: !!sessionId,
  });

  // Get card responses for session
  const { data: responsesData = [] } = useQuery<CardResponseData[]>({
    queryKey: ["/api/game-sessions", sessionId, "responses"],
    enabled: !!sessionId,
  });

  // Convert responses array to map
  const responses: Record<string, any> = {};
  responsesData.forEach(r => {
    responses[r.cardId] = r.response;
  });

  // Save card response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async ({ cardId, response }: { cardId: string; response: Record<string, any> }) => {
      if (!sessionId) throw new Error("No session ID");
      const res = await apiRequest("POST", `/api/game-sessions/${sessionId}/responses`, {
        cardId,
        response,
        responseType: "text",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId, "responses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId, "brand-map"] });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося зберегти відповідь. Спробуйте ще раз.",
        variant: "destructive",
      });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async ({ currentLevel, currentCard, progress }: { 
      currentLevel: StaticGameLevel; 
      currentCard: string; 
      progress: number 
    }) => {
      if (!sessionId) throw new Error("No session ID");
      const res = await apiRequest("POST", `/api/game-sessions/${sessionId}/progress`, {
        currentLevel,
        currentCard,
        progress,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId] });
    },
  });

  // Get brand map
  const { data: brandMap } = useQuery<LocalBrandMap>({
    queryKey: ["/api/game-sessions", sessionId, "brand-map"],
    enabled: !!sessionId,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити гру. Перевірте з'єднання з інтернетом.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  if (isLoading || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-soul-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl">♥</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Завантаження гри...</p>
        </div>
      </div>
    );
  }

  // Get current card by ID
  const currentCard = getCardById(session.currentCard);
  const currentLevelCards = getCardsByLevel(session.currentLevel);
  const totalCards = gameCards.length;
  const completedCards = Object.keys(responses).length;
  const progress = Math.round((completedCards / totalCards) * 100);

  // Get current card index in level for display
  const currentCardIndex = currentCard ? currentLevelCards.findIndex(c => c.id === currentCard.id) + 1 : 1;

  const handleCardSubmit = async (cardId: string, cardResponses: Record<string, any>) => {
    await saveResponseMutation.mutateAsync({ cardId, response: cardResponses });
    
    if (!currentCard) return;

    // Move to next card
    const nextCard = getNextCard(currentCard);
    if (nextCard) {
      await updateProgressMutation.mutateAsync({
        currentLevel: nextCard.level,
        currentCard: nextCard.id,
        progress: Math.round(((completedCards + 1) / totalCards) * 100),
      });
    } else {
      // Game completed
      await apiRequest("POST", `/api/game-sessions/${sessionId}/complete`);
      toast({
        title: "Вітаємо!",
        description: "Ви завершили гру. Ваша карта бренду готова!",
      });
    }
  };

  const handlePreviousCard = async () => {
    if (!currentCard) return;

    const prevCard = getPreviousCard(currentCard);
    if (prevCard) {
      await updateProgressMutation.mutateAsync({
        currentLevel: prevCard.level,
        currentCard: prevCard.id,
        progress,
      });
    }
  };

  // Check if we can go back
  const canGoBack = currentCard ? getPreviousCard(currentCard) !== null : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <GameHeader 
        level={session.currentLevel}
        progress={progress}
        sessionId={sessionId!}
      />
      
      <LevelNavigation 
        currentLevel={session.currentLevel}
        completedLevels={[]}
        progress={progress}
      />

      {currentCard && (
        <div className="level-transition">
          <GameCard
            card={currentCard}
            responses={responses[currentCard.id] || {}}
            onSubmit={(cardResponses) => handleCardSubmit(currentCard.id, cardResponses)}
            onPrevious={canGoBack ? handlePreviousCard : undefined}
            isLoading={saveResponseMutation.isPending || updateProgressMutation.isPending}
            cardNumber={currentCardIndex}
            totalCards={currentLevelCards.length}
          />
        </div>
      )}

      {brandMap && (
        <BrandMapPreview 
          brandMap={brandMap}
          currentLevel={session.currentLevel}
        />
      )}

      <FloatingActions
        onHelpClick={() => setHelpModalOpen(true)}
        sessionId={sessionId!}
        canExport={!!brandMap && Object.keys(brandMap.soul).length > 0}
      />

      <HelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </div>
  );
}
