import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Clock, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameLevel } from "@shared/schema";

interface GameHeaderProps {
  level: GameLevel;
  progress: number;
  sessionId: string;
}

export default function GameHeader({ level, progress, sessionId }: GameHeaderProps) {
  const [duration, setDuration] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const saveProgressMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/game-sessions/${sessionId}`, {
        updatedAt: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Прогрес збережено",
        description: "Ваші відповіді успішно збережені",
      });
    },
    onError: () => {
      toast({
        title: "Помилка збереження",
        description: "Не вдалося зберегти прогрес",
        variant: "destructive",
      });
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} хв`;
  };

  const getLevelColor = (level: GameLevel) => {
    switch (level) {
      case "soul": return "from-soul-500 to-soul-600";
      case "mind": return "from-mind-500 to-mind-600";
      case "body": return "from-body-500 to-body-600";
      default: return "from-soul-500 to-mind-500";
    }
  };

  return (
    <header className="bg-white dark:bg-card shadow-sm border-b border-gray-200 dark:border-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${getLevelColor(level)} rounded-xl flex items-center justify-center`}>
              <Heart className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="title-game">
                Душа Бренду
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Трансформаційна гра для розвитку бренду
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span data-testid="text-duration">{formatDuration(duration)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveProgressMutation.mutate()}
              disabled={saveProgressMutation.isPending}
              data-testid="button-save-progress"
            >
              <Save className="w-4 h-4 mr-2" />
              {saveProgressMutation.isPending ? "Збереження..." : "Зберегти прогрес"}
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Прогрес гри
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-progress">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="progress-fill bg-gradient-to-r from-soul-500 via-mind-500 to-body-500 h-2 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
