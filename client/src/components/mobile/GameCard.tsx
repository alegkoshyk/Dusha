import { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import type { GameCard as GameCardType } from '@shared/schema';

interface GameCardProps {
  card: GameCardType;
  response?: any;
  onResponse: (response: any) => void;
  onNext: () => void;
  onPrevious?: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  progress: number;
  totalCards: number;
}

export function GameCard({ 
  card, 
  response, 
  onResponse, 
  onNext, 
  onPrevious, 
  canGoNext,
  canGoPrevious,
  progress,
  totalCards 
}: GameCardProps) {
  const [currentResponse, setCurrentResponse] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [validation, setValidation] = useState<{ isValid: boolean; message?: string }>({ isValid: true });

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
  }, [card.id, response]);

  useEffect(() => {
    validateResponse();
  }, [currentResponse, selectedOptions]);

  const validateResponse = () => {
    if (!card.validation) {
      setValidation({ isValid: true });
      return;
    }

    const { minLength, maxLength, minSelections, maxSelections } = card.validation;

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
    if (card.type === 'values' || card.type === 'choice') {
      if (minSelections && selectedOptions.length < minSelections) {
        setValidation({ 
          isValid: false, 
          message: `Оберіть мінімум ${minSelections} варіантів` 
        });
        return;
      }
      if (maxSelections && selectedOptions.length > maxSelections) {
        setValidation({ 
          isValid: false, 
          message: `Максимум ${maxSelections} варіантів` 
        });
        return;
      }
    }

    setValidation({ isValid: true });
  };

  const handleSubmit = () => {
    if (!validation.isValid) return;

    const responseData = card.type === 'values' || card.type === 'archetype' 
      ? selectedOptions 
      : card.type === 'choice' 
        ? selectedOptions[0] 
        : currentResponse.trim();

    onResponse(responseData);
  };

  const handleOptionToggle = (optionId: string) => {
    if (card.type === 'choice' || card.type === 'archetype') {
      setSelectedOptions([optionId]);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      {/* Header */}
      <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {canGoPrevious && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onPrevious}
                  className="p-2"
                  data-testid="button-previous"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {card.title}
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getDifficultyColor(card.difficulty)}>
                {getDifficultyLabel(card.difficulty)}
              </Badge>
              {card.rewards?.xp && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {card.rewards.xp} XP
                </Badge>
              )}
            </div>
          </div>
          
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Прогрес: {Math.round(progress)}% • Картка {totalCards - Math.floor((100 - progress) / 100 * totalCards)} з {totalCards}
          </p>
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
              {/* Intro card - just description, no input */}
              {card.id === 'soul-start' && (
                <div className="text-center py-8">
                  <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 text-white rounded-full mb-4">
                      <Star className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Готові до подорожі?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Натисніть "Далі", щоб розпочати створення карти вашого бренду
                  </p>
                </div>
              )}

              {/* Text Input */}
              {(card.type === 'text' || card.type === 'reflection') && (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Введіть вашу відповідь..."
                    value={currentResponse}
                    onChange={(e) => setCurrentResponse(e.target.value)}
                    className="min-h-[120px] resize-none"
                    data-testid="input-response"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      {card.validation?.minLength && `Мінімум ${card.validation.minLength} символів`}
                    </span>
                    <span>{currentResponse.length}/{card.validation?.maxLength || '∞'}</span>
                  </div>
                </div>
              )}

              {/* Choice Options */}
              {(card.type === 'choice' || card.type === 'archetype') && card.options && (
                <RadioGroup value={selectedOptions[0]} onValueChange={(value) => handleOptionToggle(value)}>
                  <div className="grid gap-3">
                    {card.options.map((option) => (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={option.id}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedOptions.includes(option.id)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                          data-testid={`option-${option.id}`}
                        >
                          <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
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

              {/* Multiple Selection Options */}
              {card.type === 'values' && card.options && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Оберіть {card.validation?.minSelections} - {card.validation?.maxSelections} варіантів
                    </p>
                    <span className="text-sm text-gray-500">
                      {selectedOptions.length} вибрано
                    </span>
                  </div>
                  
                  <div className="grid gap-3">
                    {card.options.map((option) => (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Label
                          htmlFor={option.id}
                          className={`
                            flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                            ${selectedOptions.includes(option.id)
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }
                          `}
                          data-testid={`option-${option.id}`}
                        >
                          <Checkbox
                            id={option.id}
                            checked={selectedOptions.includes(option.id)}
                            onCheckedChange={() => handleOptionToggle(option.id)}
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
                <div>
                  {canGoPrevious && (
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
                </div>
                
                <Button
                  onClick={card.id === 'soul-start' ? onNext : handleSubmit}
                  disabled={card.id === 'soul-start' ? false : (!validation.isValid || (!currentResponse && selectedOptions.length === 0))}
                  className="flex items-center gap-2 min-w-[120px]"
                  data-testid="button-next"
                >
                  {card.id === 'soul-start' ? (
                    <>
                      Почати гру
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : validation.isValid ? (
                    <>
                      Далі
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Заповніть поле
                      <AlertCircle className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}