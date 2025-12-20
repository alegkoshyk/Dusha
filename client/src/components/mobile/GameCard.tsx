import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Star,
  Zap,
  Trophy,
  Eye,
  Plus,
  Timer,
  SkipForward,
  HelpCircle,
  FastForward,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import type { GameCard as GameCardType, CardProperty } from '@shared/schema';

interface ExtendedGameCard extends GameCardType {
  properties?: CardProperty[];
  options?: any[];
}

interface GameCardProps {
  card: ExtendedGameCard;
  response?: any;
  onResponse: (response: any, timeData?: { timeSpent: number; isWithinTimeLimit: boolean; earnedXP: number }) => void;
  onNext: () => void;
  onPrevious?: () => void;
  onBackToLevel?: () => void;
  onSkip?: (reason: string) => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
  totalCards: number;
  levelProgress?: number;
  completedCardsInLevel?: number;
  totalCardsInLevel?: number;
}

const SKIP_REASONS = [
  { id: 'dont_know', label: 'Не знаю', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'no_time', label: 'Не хочу витрачати на це час', icon: <Clock className="w-4 h-4" /> },
  { id: 'dont_understand', label: 'Не розумію як це допоможе', icon: <AlertCircle className="w-4 h-4" /> },
  { id: 'quick_pass', label: 'Хочу швидко пройти гру', icon: <FastForward className="w-4 h-4" /> },
];

export function GameCard({ 
  card, 
  response, 
  onResponse, 
  onNext, 
  onPrevious,
  onBackToLevel,
  onSkip,
  canGoNext,
  canGoPrevious,
  progress,
  totalCards,
  levelProgress = 0,
  completedCardsInLevel = 0,
  totalCardsInLevel = 1
}: GameCardProps) {
  const [, setLocation] = useLocation();
  const activeSessionId = new URLSearchParams(window.location.search).get('sessionId') || window.location.pathname.split('/').pop();
  const [currentResponse, setCurrentResponse] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });
  const [showSkipModal, setShowSkipModal] = useState(false);
  
  // Таймер логіка
  const [timeLeft, setTimeLeft] = useState((card.estimatedTime || 3) * 60); // Конвертуємо хвилини в секунди
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [startTime] = useState(() => Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Ініціалізація таймера
  useEffect(() => {
    if (isTimerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isTimerActive, timeLeft]);

  // Ініціалізація та оновлення відповіді при зміні карти або збереженої відповіді
  useEffect(() => {
    if (response !== undefined && response !== null) {
      if (typeof response === 'string') {
        setCurrentResponse(response);
        setSelectedOptions(response ? [response] : []);
      } else if (Array.isArray(response)) {
        setCurrentResponse('');
        setSelectedOptions(response);
      } else {
        setCurrentResponse('');
        setSelectedOptions([]);
      }
    } else {
      // Очищаємо форму для нової карти без збереженої відповіді
      setCurrentResponse('');
      setSelectedOptions([]);
    }

    // Скидаємо таймер для нової карти
    setTimeLeft((card.estimatedTime || 3) * 60);
    setIsTimerActive(true);
  }, [card.id, response]);

  useEffect(() => {
    validateResponse();
  }, [currentResponse, selectedOptions]);

  const validateResponse = () => {
    if (!card.validation) {
      setValidation({ isValid: true });
      return;
    }

    const validation = card.validation as any || {};
    const { minLength, maxLength, minSelections, maxSelections } = validation;

    // Text validation
    if (card.type === 'text' || card.type === 'reflection') {
      if (minLength && currentResponse.length < minLength) {
        setValidation({ 
          isValid: false, 
          message: `Мінімум ${minLength} символів (поточно: ${currentResponse.length})` 
        });
        return;
      }
      if (maxLength && currentResponse.length > maxLength) {
        setValidation({ 
          isValid: false, 
          message: `Максимум ${maxLength} символів (поточно: ${currentResponse.length})` 
        });
        return;
      }
    }

    // Selection validation
    if (card.type === 'values' || card.type === 'choice' || card.type === 'archetype') {
      if (minSelections && selectedOptions.length < minSelections) {
        setValidation({ 
          isValid: false, 
          message: `Оберіть мінімум ${minSelections} варіант${minSelections === 1 ? '' : minSelections < 5 ? 'и' : 'ів'}` 
        });
        return;
      }
      if (maxSelections && selectedOptions.length > maxSelections) {
        setValidation({ 
          isValid: false, 
          message: `Максимум ${maxSelections} варіант${maxSelections === 1 ? '' : maxSelections < 5 ? 'и' : 'ів'}` 
        });
        return;
      }
    }

    setValidation({ isValid: true });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTimeData = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const isWithinTimeLimit = timeLeft > 0;
    const baseXP = (card.rewards as any)?.xp || 0;
    const earnedXP = isWithinTimeLimit ? baseXP : 0;
    
    return { timeSpent, isWithinTimeLimit, earnedXP };
  };

  const handleSubmit = () => {
    // For info cards, submit immediately to mark as completed
    if (card.type === 'info' || card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start') {
      onResponse('completed');
      return;
    }

    if (!validation.isValid) return;

    setIsTimerActive(false);

    const responseData = (card.type === 'values' || card.type === 'archetype')
      ? selectedOptions 
      : card.type === 'choice'
        ? selectedOptions[0] 
        : currentResponse.trim();

    const timeData = calculateTimeData();
    console.log("GameCard handleSubmit - timeData:", timeData); // Debug log
    onResponse(responseData, timeData);
  };

  const handleOptionToggle = (optionId: string) => {
    if (card.type === 'choice') {
      setSelectedOptions([optionId]);
    } else if (card.type === 'archetype') {
      // Archetype cards support multiple selection (like values)
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else if (card.type === 'values') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 border-green-600';
      case 'medium': return 'text-yellow-600 border-yellow-600';
      case 'hard': return 'text-red-600 border-red-600';
      default: return 'text-gray-600 border-gray-600';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Легко';
      case 'medium': return 'Середньо';
      case 'hard': return 'Складно';
      default: return 'Невідомо';
    }
  };

  // Отримуємо кольори для прогрес-бару рівня
  const getLevelColors = (level: string) => {
    switch (level) {
      case 'soul': return {
        bg: 'from-purple-500 to-pink-500',
        text: 'text-purple-600'
      };
      case 'mind': return {
        bg: 'from-blue-500 to-cyan-500',
        text: 'text-blue-600'
      };
      case 'body': return {
        bg: 'from-green-500 to-emerald-500',
        text: 'text-green-600'
      };
      default: return {
        bg: 'from-gray-500 to-gray-600',
        text: 'text-gray-600'
      };
    }
  };

  const levelColors = getLevelColors(card.levelId);
  const levelName = card.levelId === 'soul' ? 'Душа бренду' : card.levelId === 'mind' ? 'Розум бренду' : 'Тіло бренду';

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {/* Back to level button - always visible */}
              {onBackToLevel && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToLevel}
                  className="p-2"
                  data-testid="button-back-to-level"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {card.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Таймер */}
              {card.type !== 'info' && (
                <Badge 
                  variant={timeLeft > 30 ? "secondary" : timeLeft > 0 ? "destructive" : "outline"} 
                  className="flex items-center gap-1"
                >
                  <Timer className="w-3 h-3" />
                  {formatTime(timeLeft)}
                </Badge>
              )}
              
              <Badge variant="outline" className={getDifficultyColor(card.difficulty)}>
                {getDifficultyLabel(card.difficulty)}
              </Badge>
              
              {card.rewards && typeof card.rewards === 'object' && 'xp' in card.rewards && (
                <Badge 
                  variant={timeLeft > 0 ? "secondary" : "outline"} 
                  className={`flex items-center gap-1 ${timeLeft <= 0 ? 'opacity-50' : ''}`}
                >
                  <Zap className="w-3 h-3" />
                  {timeLeft > 0 ? (card.rewards as any).xp : 0} XP
                </Badge>
              )}
            </div>
          </div>
          
          {/* Посекційний прогрес зверху */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium ${levelColors.text}`}>
                {levelName}
              </span>
              <Badge variant="outline" className="text-xs">
                {completedCardsInLevel}/{totalCardsInLevel} карток
              </Badge>
            </div>
            
            {/* Посекційний прогрес */}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalCardsInLevel }, (_, index) => (
                <div
                  key={index}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    index < completedCardsInLevel
                      ? 'bg-green-500 shadow-sm'
                      : index === completedCardsInLevel
                      ? `bg-gradient-to-r ${levelColors.bg} shadow-sm animate-pulse`
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>
            
            {/* Прогрес категорії */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Прогрес категорії</span>
              <span>{levelProgress}%</span>
            </div>
            <Progress value={levelProgress} className="h-1" />
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Card className="max-w-2xl mx-auto shadow-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Приблизно {card.estimatedTime} хвилин
                  </span>
                  {card.required && (
                    <Badge variant="outline" className="border-orange-500 text-orange-600">
                      Обов'язково
                    </Badge>
                  )}
                </div>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {card.description}
                </p>
                
                {card.hint && (
                  <div className="mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHint(!showHint)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto font-normal"
                      data-testid="button-hint"
                    >
                      <Lightbulb className="w-4 h-4 mr-1" />
                      {showHint ? 'Сховати підказку' : 'Показати підказку'}
                    </Button>
                    
                    <AnimatePresence>
                      {showHint && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                        >
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            💡 {card.hint}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Intro and completion cards - just description, no input */}
              {(card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.id === 'body-complete') && (
                <div className="text-center py-8">
                  <div className={`mb-6 p-6 bg-gradient-to-br rounded-xl border ${
                    card.id === 'soul-start' 
                      ? 'from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800'
                      : card.id === 'body-complete'
                      ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                      : 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800'
                  }`}>
                    <div className={`inline-flex items-center justify-center w-16 h-16 text-white rounded-full mb-4 ${
                      card.id === 'soul-start' ? 'bg-purple-500' : 
                      card.id === 'body-complete' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {card.id === 'body-complete' ? <Trophy className="w-8 h-8" /> : <Star className="w-8 h-8" />}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {card.id === 'soul-start' ? 'Готові до подорожі?' : 
                       card.id === 'mind-start' ? 'Розум Бренду' :
                       card.id === 'body-start' ? 'Тіло Бренду' :
                       card.id === 'body-complete' ? '🎉 Вітаємо! Гра завершена!' : levelName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {card.id === 'body-complete' 
                      ? 'Оберіть дію для продовження:'
                      : 'Натисніть "Далі", щоб розпочати створення карти вашого бренду'
                    }
                  </p>
                  
                  {/* Completion actions */}
                  {card.id === 'body-complete' && (
                    <div className="flex flex-col gap-3 mt-6">
                      <Button 
                        onClick={async () => {
                          // Mark card as completed and mark game as completed
                          onResponse('completed');
                          try {
                            await apiRequest('POST', `/api/game-sessions/${activeSessionId}/complete`);
                            console.log('Game session marked as completed');
                          } catch (error) {
                            console.error('Error completing game session:', error);
                          }
                          setLocation(`/brand-board/${activeSessionId}`);
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        data-testid="button-view-brand-board"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Переглянути Дошку Бренду
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={async () => {
                          // Mark card as completed and mark game as completed
                          onResponse('completed');
                          try {
                            await apiRequest('POST', `/api/game-sessions/${activeSessionId}/complete`);
                            console.log('Game session marked as completed');
                          } catch (error) {
                            console.error('Error completing game session:', error);
                          }
                          setLocation('/dashboard');
                        }}
                        className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:border-green-400 dark:text-green-400 dark:hover:bg-green-900/20"
                        data-testid="button-new-game"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Почати нову гру
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Text Input */}
              {(card.type === 'text' || card.type === 'reflection' || card.type === 'audience') && !(card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.id === 'body-complete' || card.type === 'info') && (
                <div className="space-y-2">
                  {/* Для карт цільової аудиторії - коротший інпут */}
                  {(card.id === 'mind-audience' || card.id === 'mind-target') ? (
                    <Input
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Наприклад: Молоді професіонали 25-35 років, які цінують якість..."
                      className="w-full"
                      data-testid="input-audience"
                    />
                  ) : (
                    <Textarea
                      placeholder="Введіть вашу відповідь..."
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      className="min-h-[120px] resize-none"
                      data-testid="input-response"
                    />
                  )}
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {card.validation && 'minLength' in card.validation && `Мінімум ${(card.validation as any).minLength} символів`}
                    </span>
                    <span>{currentResponse.length}/{(card.validation && 'maxLength' in card.validation) ? (card.validation as any).maxLength : '∞'}</span>
                  </div>
                </div>
              )}

              {/* Choice Options (Single Select) */}
              {card.type === 'choice' && (card.options || card.properties) && (
                <RadioGroup value={selectedOptions[0]} onValueChange={(value) => handleOptionToggle(value)}>
                  <div className="grid gap-3">
                    {((card.options as any[]) || (card.properties && card.properties.filter(prop => prop.type === 'option'))).map((option: any) => (
                      <motion.div
                        key={option.id || option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={option.id || option.key}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedOptions.includes(option.id || option.key)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                          data-testid={`option-${option.id || option.key}`}
                        >
                          <RadioGroupItem value={option.id || option.key} id={option.id || option.key} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {option.icon && <span className="text-lg">{option.icon}</span>}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </span>
                            </div>
                            {option.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {/* Archetype Options (Multiple Select) */}
              {card.type === 'archetype' && card.properties && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Оберіть {((card.validation as any)?.minSelections || 1)} - {((card.validation as any)?.maxSelections || 3)} архетипів
                    </p>
                    <span className="text-sm text-gray-500">
                      {selectedOptions.length} вибрано
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {card.properties.filter(prop => prop.type === 'option').map((option: any) => (
                      <motion.div
                        key={option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={option.key}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedOptions.includes(option.key)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                          data-testid={`option-${option.key}`}
                        >
                          <Checkbox 
                            id={option.key}
                            checked={selectedOptions.includes(option.key)}
                            onCheckedChange={() => handleOptionToggle(option.key)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {option.icon && <span className="text-lg">{option.icon}</span>}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </span>
                            </div>
                            {option.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Values Options (Multiple Select) */}
              {card.type === 'values' && card.properties && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Оберіть {((card.validation as any)?.minSelections || 3)}{((card.validation as any)?.maxSelections ? ` - ${(card.validation as any).maxSelections}` : '+')} {card.id === 'body-products' ? 'варіантів' : card.id === 'body-channels' ? 'каналів' : 'цінностей'}
                    </p>
                    <span className="text-sm text-gray-500">
                      {selectedOptions.length} вибрано
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {card.properties.filter(prop => prop.type === 'option').map((option: any) => (
                      <motion.div
                        key={option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={option.key}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedOptions.includes(option.key)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                          data-testid={`option-${option.key}`}
                        >
                          <Checkbox 
                            id={option.key}
                            checked={selectedOptions.includes(option.key)}
                            onCheckedChange={() => handleOptionToggle(option.key)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {option.icon && <span className="text-lg">{option.icon}</span>}
                              <span className="font-medium text-gray-900 dark:text-white">
                                {option.label}
                              </span>
                            </div>
                            {option.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </p>
                            )}
                          </div>
                        </Label>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timer Warning Message */}
              {card.type !== 'info' && timeLeft <= 30 && timeLeft > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg"
                >
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Залишилось часу: {formatTime(timeLeft)}. Поспішайте, щоб отримати бонусні XP!
                  </span>
                </motion.div>
              )}

              {/* Time's Up Message */}
              {card.type !== 'info' && timeLeft === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    Час вийшов! Відповідь буде збережена, але бонусні XP не нараховуються.
                  </span>
                </motion.div>
              )}

              {/* Validation Message */}
              {!validation.isValid && validation.message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700 dark:text-red-300">
                    {validation.message}
                  </span>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="flex gap-2">
                  {canGoPrevious && onPrevious && (
                    <Button
                      variant="outline"
                      onClick={onPrevious}
                      className="flex items-center gap-2"
                      data-testid="button-previous-bottom"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Назад
                    </Button>
                  )}
                  
                  {onSkip && card.type !== 'info' && card.id !== 'soul-start' && card.id !== 'mind-start' && card.id !== 'body-start' && card.id !== 'body-complete' && (
                    <Button
                      variant="ghost"
                      onClick={() => setShowSkipModal(true)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
                      data-testid="button-skip"
                    >
                      <SkipForward className="w-4 h-4" />
                      Пропустити
                    </Button>
                  )}
                </div>
                
                {card.id !== 'body-complete' && (
                  <Button
                    onClick={(card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.type === 'info') ? 
                      () => { 
                        // Mark info cards as completed
                        if (card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.type === 'info') {
                          handleSubmit();
                        } else {
                          onNext();
                        }
                      } : handleSubmit}
                    disabled={(card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.type === 'info') ? false : 
                      (card.type === 'values' || card.type === 'choice' || card.type === 'archetype') ? 
                        (selectedOptions.length === 0 || 
                         (card.validation && typeof card.validation === 'object' && 'minSelections' in card.validation && 
                          selectedOptions.length < (card.validation as any).minSelections)) : 
                        (!currentResponse || currentResponse.trim().length === 0)
                    }
                    className="flex items-center gap-2 min-w-[120px]"
                    data-testid="button-next"
                  >
                  {(card.id === 'soul-start' || card.id === 'mind-start' || card.id === 'body-start' || card.type === 'info') ? (
                    <>
                      {card.id === 'soul-start' ? 'Почати гру' : card.type === 'info' ? 'Почати рівень' : 'Почати рівень'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    // Логіка для різних типів карт
                    (card.type === 'values' || card.type === 'choice' || card.type === 'archetype') ? 
                      (selectedOptions.length > 0 && 
                       (!card.validation || !('minSelections' in card.validation) || 
                        selectedOptions.length >= (card.validation as any).minSelections) ? (
                        <>
                          Зберегти відповідь
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          {selectedOptions.length === 0 ? 'Оберіть варіанти' : 
                           `Оберіть ще ${(card.validation as any)?.minSelections - selectedOptions.length} варіант(и)`}
                          <AlertCircle className="w-4 h-4" />
                        </>
                      )) :
                      (currentResponse && currentResponse.trim().length > 0) ? (
                        <>
                          Зберегти відповідь
                          <ArrowRight className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Заповніть поле
                          <AlertCircle className="w-4 h-4" />
                        </>
                      )
                  )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skip Reason Modal */}
      <Dialog open={showSkipModal} onOpenChange={setShowSkipModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SkipForward className="w-5 h-5 text-gray-500" />
              Чому пропускаєте?
            </DialogTitle>
            <DialogDescription>
              Оберіть причину, щоб ми могли покращити гру
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {SKIP_REASONS.map((reason) => (
              <Button
                key={reason.id}
                variant="outline"
                onClick={() => {
                  if (onSkip) {
                    onSkip(reason.id);
                  }
                  setShowSkipModal(false);
                }}
                className="w-full justify-start gap-3 h-auto py-3 px-4 text-left"
                data-testid={`skip-reason-${reason.id}`}
              >
                {reason.icon}
                <span>{reason.label}</span>
              </Button>
            ))}
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setShowSkipModal(false)}
            className="w-full"
            data-testid="button-cancel-skip"
          >
            <X className="w-4 h-4 mr-2" />
            Скасувати
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}