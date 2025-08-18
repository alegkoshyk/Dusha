import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Lock, 
  CheckCircle, 
  Star, 
  Clock, 
  Trophy,
  Zap,
  Heart,
  Brain,
  Dumbbell
} from 'lucide-react';
import type { GameCard, GameLevel, PlayerProgress } from '@shared/schema';
import { brandGameField, mobileGameCards, getUnlockedCards, calculateTotalXP, getEarnedBadges } from '@/lib/mobileGameData';
import { LevelProgress } from '@/components/progress/LevelProgress';
import UserDropdown from '@/components/UserDropdown';

interface GameFieldProps {
  playerProgress: PlayerProgress;
  onCardSelect: (cardId: string) => void;
  onLevelChange: (level: GameLevel) => void;
}

const levelIcons = {
  soul: Heart,
  mind: Brain,
  body: Dumbbell
};

const levelColors = {
  soul: 'from-purple-500 to-pink-500',
  mind: 'from-blue-500 to-cyan-500', 
  body: 'from-green-500 to-emerald-500'
};

export function GameField({ playerProgress, onCardSelect, onLevelChange }: GameFieldProps) {
  const [selectedLevel, setSelectedLevel] = useState<GameLevel>(playerProgress.currentLevel || 'soul');
  const [unlockedCards, setUnlockedCards] = useState<string[]>([]);
  
  useEffect(() => {
    const unlocked = getUnlockedCards(playerProgress.completedCards, playerProgress.responses);
    setUnlockedCards(unlocked);
  }, [playerProgress.completedCards, playerProgress.responses]);

  const currentLevelData = brandGameField.levels.find(l => l.id === selectedLevel);
  const currentLevelCards = mobileGameCards.filter(card => 
    card.level === selectedLevel && unlockedCards.includes(card.id)
  );

  const totalXP = calculateTotalXP(playerProgress.completedCards);
  const earnedBadges = getEarnedBadges(playerProgress.completedCards);

  const isCardCompleted = (cardId: string) => playerProgress.completedCards.includes(cardId);
  const isCardUnlocked = (cardId: string) => unlockedCards.includes(cardId);
  const isCardCurrent = (cardId: string) => cardId === playerProgress.currentCard;

  const getLevelProgress = (level: GameLevel) => {
    const levelCards = mobileGameCards.filter(card => card.level === level);
    const completed = levelCards.filter(card => isCardCompleted(card.id)).length;
    return Math.round((completed / levelCards.length) * 100);
  };

  const isLevelUnlocked = (level: GameLevel) => {
    const levelData = brandGameField.levels.find(l => l.id === level);
    if (!levelData?.unlockRequirements) return true;
    
    const { previousLevel, cardsCompleted } = levelData.unlockRequirements;
    if (previousLevel && getLevelProgress(previousLevel as GameLevel) < 100) return false;
    if (cardsCompleted && playerProgress.completedCards.length < cardsCompleted) return false;
    
    return true;
  };

  const handleLevelSelect = (level: GameLevel) => {
    if (isLevelUnlocked(level)) {
      setSelectedLevel(level);
      onLevelChange(level);
    }
  };

  const getCardStatusIcon = (card: GameCard) => {
    if (isCardCompleted(card.id)) return CheckCircle;
    if (isCardCurrent(card.id)) return Play;
    if (!isCardUnlocked(card.id)) return Lock;
    return Play;
  };

  const getCardStatusColor = (card: GameCard) => {
    if (isCardCompleted(card.id)) return 'text-green-500';
    if (isCardCurrent(card.id)) return 'text-blue-500';
    if (!isCardUnlocked(card.id)) return 'text-gray-400';
    return 'text-purple-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header with Player Stats */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Душа Бренду
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Трансформаційна гра
              </p>
            </div>
            
            <UserDropdown />
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalXP} XP
                </span>
              </div>
              
              {earnedBadges.length > 0 && (
                <div className="flex items-center gap-1">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  <Badge variant="secondary">{earnedBadges.length}</Badge>
                </div>
              )}
              
              <UserDropdown />
            </div>
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="container mx-auto px-4 py-4">
        <LevelProgress 
          levelProgress={playerProgress.levelProgress}
          totalProgress={Math.round((playerProgress.completedCards.length / mobileGameCards.length) * 100)}
        />
      </div>

      {/* Level Selection Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-2 mb-6">
          {brandGameField.levels.map((level) => {
            const LevelIcon = levelIcons[level.id as GameLevel];
            const isUnlocked = isLevelUnlocked(level.id as GameLevel);
            const progress = getLevelProgress(level.id as GameLevel);
            const isSelected = selectedLevel === level.id;
            
            return (
              <button
                key={level.id}
                onClick={() => handleLevelSelect(level.id as GameLevel)}
                disabled={!isUnlocked}
                className={`
                  relative p-4 rounded-xl transition-all duration-200
                  ${isSelected 
                    ? `bg-gradient-to-br ${levelColors[level.id as GameLevel]} text-white shadow-lg scale-105` 
                    : isUnlocked 
                      ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                      : 'bg-gray-100 dark:bg-gray-800 opacity-50 cursor-not-allowed'
                  }
                `}
                data-testid={`level-${level.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <LevelIcon className={`w-6 h-6 ${isSelected ? 'text-white' : isUnlocked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                    {level.name}
                  </span>
                  {isUnlocked && (
                    <Progress 
                      value={progress} 
                      className={`w-full h-1 ${isSelected ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'}`}
                    />
                  )}
                  {!isUnlocked && (
                    <Lock className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current Level Info */}
        {currentLevelData && (
          <Card className="mb-6 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${levelColors[selectedLevel]} text-white`}>
                  <span className="text-2xl">{currentLevelData.icon}</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {currentLevelData.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {currentLevelData.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Прогрес: {getLevelProgress(selectedLevel)}%
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Карток: {currentLevelCards.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards Grid */}
        <ScrollArea className="h-[60vh]">
          <div className="grid gap-4">
            <AnimatePresence>
              {currentLevelCards.map((card, index) => {
                const StatusIcon = getCardStatusIcon(card);
                const statusColor = getCardStatusColor(card);
                const completed = isCardCompleted(card.id);
                const current = isCardCurrent(card.id);
                const unlocked = isCardUnlocked(card.id);
                
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className={`
                        transition-all duration-200 cursor-pointer hover:shadow-lg
                        ${current ? 'ring-2 ring-blue-500 shadow-lg' : ''}
                        ${completed ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''}
                        ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]'}
                      `}
                      onClick={() => unlocked && onCardSelect(card.id)}
                      data-testid={`card-${card.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${completed ? 'bg-green-100 dark:bg-green-900' : current ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {card.title}
                              </h3>
                              <div className="flex items-center gap-2 ml-2">
                                {card.rewards?.xp && (
                                  <Badge variant="secondary" className="text-xs">
                                    {card.rewards.xp} XP
                                  </Badge>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${
                                    card.difficulty === 'easy' ? 'text-green-600 border-green-600' :
                                    card.difficulty === 'medium' ? 'text-yellow-600 border-yellow-600' :
                                    'text-red-600 border-red-600'
                                  }`}
                                >
                                  {card.difficulty === 'easy' ? 'Легко' :
                                   card.difficulty === 'medium' ? 'Середньо' : 'Складно'}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                              {card.shortDescription || card.description}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{card.estimatedTime} хв</span>
                                </div>
                                {card.required && (
                                  <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                                    Обов'язково
                                  </Badge>
                                )}
                              </div>
                              
                              {unlocked && !completed && (
                                <Button 
                                  size="sm" 
                                  variant={current ? "default" : "outline"}
                                  className="h-8"
                                  data-testid={`play-card-${card.id}`}
                                >
                                  {current ? 'Продовжити' : 'Грати'}
                                </Button>
                              )}
                              
                              {completed && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs font-medium">Завершено</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}