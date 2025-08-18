import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, Dumbbell, CheckCircle } from "lucide-react";

interface LevelProgressProps {
  levelProgress: {
    soul: number;
    mind: number;
    body: number;
  };
  totalProgress: number;
}

export function LevelProgress({ levelProgress, totalProgress }: LevelProgressProps) {
  const levels = [
    {
      id: 'soul' as const,
      name: 'Душа',
      icon: Heart,
      color: 'purple',
      progress: levelProgress.soul
    },
    {
      id: 'mind' as const, 
      name: 'Розум',
      icon: Brain,
      color: 'blue',
      progress: levelProgress.mind
    },
    {
      id: 'body' as const,
      name: 'Тіло', 
      icon: Dumbbell,
      color: 'green',
      progress: levelProgress.body
    }
  ];

  const getColorClasses = (color: string, progress: number) => {
    const isCompleted = progress >= 100;
    switch (color) {
      case 'purple':
        return {
          bg: isCompleted ? 'bg-purple-100' : 'bg-purple-50',
          text: isCompleted ? 'text-purple-800' : 'text-purple-600',
          icon: isCompleted ? 'text-purple-600' : 'text-purple-500',
          progress: 'from-purple-500 to-pink-500'
        };
      case 'blue':
        return {
          bg: isCompleted ? 'bg-blue-100' : 'bg-blue-50', 
          text: isCompleted ? 'text-blue-800' : 'text-blue-600',
          icon: isCompleted ? 'text-blue-600' : 'text-blue-500',
          progress: 'from-blue-500 to-cyan-500'
        };
      case 'green':
        return {
          bg: isCompleted ? 'bg-green-100' : 'bg-green-50',
          text: isCompleted ? 'text-green-800' : 'text-green-600', 
          icon: isCompleted ? 'text-green-600' : 'text-green-500',
          progress: 'from-green-500 to-emerald-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          icon: 'text-gray-500',
          progress: 'from-gray-500 to-gray-600'
        };
    }
  };

  return (
    <div className="grid gap-3">
      {levels.map((level) => {
        const colors = getColorClasses(level.color, level.progress);
        const IconComponent = level.icon;
        const isCompleted = level.progress >= 100;

        return (
          <div
            key={level.id}
            className={`${colors.bg} rounded-lg p-4 border transition-colors`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`${colors.icon} relative`}>
                  <IconComponent className="w-5 h-5" />
                  {isCompleted && (
                    <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                  )}
                </div>
                <span className={`font-medium ${colors.text}`}>
                  {level.name}
                </span>
              </div>
              <Badge 
                variant={isCompleted ? "default" : "secondary"}
                className={isCompleted ? "bg-green-600" : ""}
              >
                {level.progress}%
              </Badge>
            </div>
            {isCompleted && (
              <p className="text-sm text-green-700 mt-2 font-medium">
                ✓ Рівень завершено
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}