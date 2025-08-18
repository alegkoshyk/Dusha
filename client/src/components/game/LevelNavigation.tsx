import { Heart, Brain, ServerCog } from "lucide-react";
import type { GameLevel } from "@shared/schema";

interface LevelNavigationProps {
  currentLevel: GameLevel;
  completedLevels: GameLevel[];
  progress: number;
}

export default function LevelNavigation({ currentLevel, completedLevels, progress }: LevelNavigationProps) {
  const levels = [
    {
      id: "soul" as GameLevel,
      name: "Душа Бренду",
      description: "Місія, цінності та історія",
      icon: Heart,
      colorClass: "soul",
    },
    {
      id: "mind" as GameLevel,
      name: "Розум Бренду", 
      description: "Стратегія та позиціонування",
      icon: Brain,
      colorClass: "mind",
    },
    {
      id: "body" as GameLevel,
      name: "Тіло Бренду",
      description: "Реалізація та дії",
      icon: ServerCog,
      colorClass: "body",
    },
  ];

  const getLevelStatus = (levelId: GameLevel) => {
    if (completedLevels.includes(levelId)) return "completed";
    if (currentLevel === levelId) return "active";
    return "locked";
  };

  const getLevelProgress = (levelId: GameLevel) => {
    if (completedLevels.includes(levelId)) return 100;
    if (currentLevel === levelId) return Math.min(progress, 100);
    return 0;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {levels.map((level) => {
          const status = getLevelStatus(level.id);
          const levelProgress = getLevelProgress(level.id);
          const Icon = level.icon;
          
          return (
            <div
              key={level.id}
              className={`
                bg-white dark:bg-card rounded-xl border-2 p-6 text-center cursor-pointer 
                hover:shadow-lg transition-all duration-300
                ${status === "active" 
                  ? `border-${level.colorClass}-200 level-active` 
                  : status === "completed"
                  ? `border-${level.colorClass}-200`
                  : "border-gray-200 opacity-60"
                }
              `}
              data-testid={`level-${level.id}`}
            >
              <div className={`w-16 h-16 bg-${level.colorClass}-500 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className="text-white text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {level.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {level.description}
              </p>
              
              {/* Progress dots */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                {[1, 2, 3].map((dot) => (
                  <div
                    key={dot}
                    className={`w-2 h-2 rounded-full ${
                      dot <= Math.ceil(levelProgress / 33.33)
                        ? `bg-${level.colorClass}-500`
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
              
              <span 
                className={`text-xs font-medium ${
                  status === "active" 
                    ? `text-${level.colorClass}-600`
                    : status === "completed"
                    ? "text-green-600"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                data-testid={`status-${level.id}`}
              >
                {status === "active" && "Поточний рівень"}
                {status === "completed" && "Завершено"}
                {status === "locked" && "Заблоковано"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
