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
import { gameCards } from "@/lib/gameData";
import type { GameSession, GameLevel } from "@shared/schema";

export default function Game() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Get or create game session
  const { data: session, isLoading, error } = useQuery<GameSession>({
    queryKey: ["/api/game-sessions", sessionId],
    enabled: !!sessionId,
  });

  // Save card response mutation
  const saveResponseMutation = useMutation({
    mutationFn: async ({ cardId, responses }: { cardId: string; responses: Record<string, any> }) => {
      if (!sessionId) throw new Error("No session ID");
      const response = await apiRequest("POST", `/api/game-sessions/${sessionId}/responses`, {
        cardId,
        responses,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId] });
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
      currentLevel: GameLevel; 
      currentCard: number; 
      progress: number 
    }) => {
      if (!sessionId) throw new Error("No session ID");
      const response = await apiRequest("POST", `/api/game-sessions/${sessionId}/progress`, {
        currentLevel,
        currentCard,
        progress,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-sessions", sessionId] });
    },
  });

  // Get brand map
  const { data: brandMap } = useQuery<BrandMap>({
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

  const currentLevelCards = gameCards.filter(card => card.level === session.currentLevel);
  const currentCard = currentLevelCards.find(card => card.order === session.currentCard);
  const totalCards = gameCards.length;
  const completedCards = Object.keys(session.responses as Record<string, any> || {}).length;
  const progress = Math.round((completedCards / totalCards) * 100);

  const handleCardSubmit = async (cardId: string, responses: Record<string, any>) => {
    await saveResponseMutation.mutateAsync({ cardId, responses });
    
    // Move to next card or level
    const nextCard = currentLevelCards.find(card => card.order === session.currentCard + 1);
    if (nextCard) {
      // Move to next card in current level
      await updateProgressMutation.mutateAsync({
        currentLevel: session.currentLevel as GameLevel,
        currentCard: session.currentCard + 1,
        progress: Math.round(((completedCards + 1) / totalCards) * 100),
      });
    } else {
      // Move to next level
      let nextLevel: GameLevel | null = null;
      if (session.currentLevel === "soul") nextLevel = "mind";
      else if (session.currentLevel === "mind") nextLevel = "body";
      
      if (nextLevel) {
        await updateProgressMutation.mutateAsync({
          currentLevel: nextLevel,
          currentCard: 1,
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
    }
  };

  const handlePreviousCard = async () => {
    if (session.currentCard > 1) {
      // Go to previous card in current level
      await updateProgressMutation.mutateAsync({
        currentLevel: session.currentLevel as GameLevel,
        currentCard: session.currentCard - 1,
        progress,
      });
    } else {
      // Go to previous level
      let previousLevel: GameLevel | null = null;
      let previousCard = 1;
      
      if (session.currentLevel === "mind") {
        previousLevel = "soul";
        const soulCards = gameCards.filter(card => card.level === "soul");
        previousCard = soulCards.length;
      } else if (session.currentLevel === "body") {
        previousLevel = "mind";
        const mindCards = gameCards.filter(card => card.level === "mind");
        previousCard = mindCards.length;
      }
      
      if (previousLevel) {
        await updateProgressMutation.mutateAsync({
          currentLevel: previousLevel,
          currentCard: previousCard,
          progress,
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <GameHeader 
        level={session.currentLevel as GameLevel}
        progress={progress}
        sessionId={sessionId!}
      />
      
      <LevelNavigation 
        currentLevel={session.currentLevel as GameLevel}
        completedLevels={[]}
        progress={progress}
      />

      {currentCard && (
        <div className="level-transition">
          <GameCard
            card={currentCard}
            responses={(session.responses as Record<string, any>)?.[currentCard.id] || {}}
            onSubmit={(responses) => handleCardSubmit(currentCard.id, responses)}
            onPrevious={session.currentCard > 1 || session.currentLevel !== "soul" ? handlePreviousCard : undefined}
            isLoading={saveResponseMutation.isPending || updateProgressMutation.isPending}
            cardNumber={session.currentCard}
            totalCards={currentLevelCards.length}
          />
        </div>
      )}

      {brandMap && (
        <BrandMapPreview 
          brandMap={brandMap}
          currentLevel={session.currentLevel as GameLevel}
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
