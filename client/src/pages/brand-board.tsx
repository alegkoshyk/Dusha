import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, Share, MapPin, Heart, Brain, Dumbbell, Edit2, Save, ChevronRight, Lightbulb, Check } from 'lucide-react';
import { Header } from '@/components/Header';
import { useState } from 'react';

interface CardOption {
  id: string;
  name: string;
  value: string;
  description?: string;
  icon?: string;
}

interface CardResponse {
  cardId: string;
  cardTitle: string;
  cardDescription?: string;
  cardType?: string;
  cardHint?: string;
  response: any;
  responseType: string;
  createdAt: string;
  level: string;
  options?: CardOption[];
}

interface BrandMapResponse {
  soul: { values: string[]; mission: string; story: string; purpose: string; archetype: string; };
  mind: { archetype: string; positioning: string; promise: string; solution: string; problem: string; audience: string; };
  body: { channels: string[]; visual: string; pricing: string; tone: string[]; metrics: string[]; launch: string; };
}

export default function BrandBoard() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCard, setSelectedCard] = useState<CardResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResponse, setEditedResponse] = useState<string | string[]>('');

  const { data: brandMap, isLoading, error } = useQuery<BrandMapResponse>({
    queryKey: [`/api/game-sessions/${sessionId}/brand-map`],
    enabled: !!sessionId
  });

  const { data: cardResponses, isLoading: responsesLoading } = useQuery<CardResponse[]>({
    queryKey: [`/api/game-sessions/${sessionId}/responses`],
    enabled: !!sessionId
  });

  const saveResponseMutation = useMutation({
    mutationFn: async ({ cardId, response }: { cardId: string; response: any }) => {
      const res = await apiRequest('POST', `/api/game-sessions/${sessionId}/responses`, {
        cardId,
        response,
        responseType: selectedCard?.cardType === 'text' ? 'text' : 'choice'
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/game-sessions/${sessionId}/responses`] });
      queryClient.invalidateQueries({ queryKey: [`/api/game-sessions/${sessionId}/brand-map`] });
      setIsEditing(false);
      setSelectedCard(null);
    }
  });

  const handleCardClick = (response: CardResponse) => {
    setSelectedCard(response);
    if (Array.isArray(response.response)) {
      setEditedResponse([...response.response]);
    } else {
      setEditedResponse(String(response.response || ''));
    }
    setIsEditing(false);
  };

  const handleOptionToggle = (optionValue: string) => {
    if (!Array.isArray(editedResponse)) {
      setEditedResponse([optionValue]);
      return;
    }
    if (editedResponse.includes(optionValue)) {
      setEditedResponse(editedResponse.filter(v => v !== optionValue));
    } else {
      setEditedResponse([...editedResponse, optionValue]);
    }
  };

  const handleSave = () => {
    if (!selectedCard) return;
    saveResponseMutation.mutate({
      cardId: selectedCard.cardId,
      response: editedResponse
    });
  };

  const handleBack = () => setLocation('/dashboard');

  const getLevelColors = (level: string) => {
    if (level === 'soul') return {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-900 dark:text-purple-100',
      textLight: 'text-purple-700 dark:text-purple-300',
      badge: 'bg-purple-100 dark:bg-purple-800',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-md',
      gradient: 'from-purple-500 to-pink-500'
    };
    if (level === 'mind') return {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-900 dark:text-blue-100',
      textLight: 'text-blue-700 dark:text-blue-300',
      badge: 'bg-blue-100 dark:bg-blue-800',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:shadow-md',
      gradient: 'from-blue-500 to-cyan-500'
    };
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-900 dark:text-green-100',
      textLight: 'text-green-700 dark:text-green-300',
      badge: 'bg-green-100 dark:bg-green-800',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/40 hover:shadow-md',
      gradient: 'from-green-500 to-emerald-500'
    };
  };

  const isChoiceCard = (cardType?: string) => 
    ['choice', 'values', 'archetype', 'multiselect'].includes(cardType || '');

  if (isLoading || responsesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Завантаження дошки бренду...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !brandMap) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Дошку бренду не знайдено</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Схоже, що гра ще не завершена або сталася помилка.</p>
            <Button onClick={handleBack}><ArrowLeft className="w-4 h-4 mr-2" />Повернутися до Dashboard</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack} data-testid="button-back">
              <ArrowLeft className="w-4 h-4 mr-2" />Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Дошка Бренду</h1>
              <p className="text-gray-600 dark:text-gray-400">Ваша повна карта бренду зібрана в одному місці</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" data-testid="button-share"><Share className="w-4 h-4 mr-2" />Поділитися</Button>
            <Button data-testid="button-download-pdf"><Download className="w-4 h-4 mr-2" />Завантажити PDF</Button>
          </div>
        </div>

        {cardResponses && (
          <Card className="mb-8 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <MapPin className="w-6 h-6" />
                Карта всіх відповідей ({cardResponses?.length || 0} відповідей)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Натисніть на картку, щоб переглянути або відредагувати відповідь
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['soul', 'mind', 'body'].map((level) => {
                  const levelResponses = cardResponses.filter(r => r.level === level);
                  const LevelIcon = level === 'soul' ? Heart : level === 'mind' ? Brain : Dumbbell;
                  const colors = getLevelColors(level);
                  
                  return (
                    <div key={level} className={`border-2 rounded-lg p-4 ${colors.border}`}>
                      <div className={`flex items-center gap-2 mb-4 ${colors.text}`}>
                        <LevelIcon className="w-5 h-5" />
                        <h3 className="font-semibold">
                          {level === 'soul' ? 'Душа' : level === 'mind' ? 'Розум' : 'Тіло'} ({levelResponses.length})
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        {levelResponses.map((response, index) => (
                          <div 
                            key={response.cardId}
                            onClick={() => handleCardClick(response)}
                            data-testid={`card-response-${response.cardId}`}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${colors.bg} ${colors.border} ${colors.hover}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className={`font-medium text-sm ${colors.text}`}>{response.cardTitle}</h4>
                              <div className="flex items-center gap-1">
                                <Badge variant="secondary" className="text-xs">{index + 1}</Badge>
                                <ChevronRight className={`w-4 h-4 ${colors.textLight}`} />
                              </div>
                            </div>
                            <div className={`text-sm ${colors.textLight} line-clamp-2`}>
                              {Array.isArray(response.response) ? (
                                <div className="flex flex-wrap gap-1">
                                  {response.response.slice(0, 3).map((item: string, i: number) => (
                                    <span key={i} className={`px-2 py-0.5 rounded text-xs ${colors.badge}`}>{item}</span>
                                  ))}
                                  {response.response.length > 3 && (
                                    <span className="text-xs opacity-60">+{response.response.length - 3}</span>
                                  )}
                                </div>
                              ) : (
                                <p className="whitespace-pre-wrap break-words truncate">{response.response}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">S</div>
                Душа Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.soul?.values?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цінності</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap.soul.values.map((value: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">{value}</span>
                    ))}
                  </div>
                </div>
              )}
              {brandMap?.soul?.mission && (
                <div><h4 className="font-semibold text-gray-900 dark:text-white mb-2">Місія</h4><p className="text-gray-600 dark:text-gray-400">{brandMap.soul.mission}</p></div>
              )}
              {brandMap?.soul?.archetype && (
                <div><h4 className="font-semibold text-gray-900 dark:text-white mb-2">Архетип</h4><p className="text-gray-600 dark:text-gray-400">{brandMap.soul.archetype}</p></div>
              )}
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">M</div>
                Розум Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.mind?.positioning && (
                <div><h4 className="font-semibold text-gray-900 dark:text-white mb-2">Позиціонування</h4><p className="text-gray-600 dark:text-gray-400">{brandMap.mind.positioning}</p></div>
              )}
              {brandMap?.mind?.promise && (
                <div><h4 className="font-semibold text-gray-900 dark:text-white mb-2">Обіцянка</h4><p className="text-gray-600 dark:text-gray-400">{brandMap.mind.promise}</p></div>
              )}
              {brandMap?.mind?.audience && (
                <div><h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цільова аудиторія</h4><p className="text-gray-600 dark:text-gray-400">{brandMap.mind.audience}</p></div>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">B</div>
                Тіло Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.body?.channels?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Канали комунікації</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap.body.channels.map((channel: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">{channel}</span>
                    ))}
                  </div>
                </div>
              )}
              {brandMap?.body?.tone?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Тон голосу</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap.body.tone.map((tone: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">{tone}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Card Modal */}
      <Dialog open={!!selectedCard} onOpenChange={() => { setSelectedCard(null); setIsEditing(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedCard && (
            <>
              {/* Card Header with Level Color */}
              <div className={`-mx-6 -mt-6 px-6 py-4 mb-4 bg-gradient-to-r ${getLevelColors(selectedCard.level).gradient} rounded-t-lg`}>
                <div className="flex items-center gap-3 text-white">
                  {selectedCard.level === 'soul' && <Heart className="w-6 h-6" />}
                  {selectedCard.level === 'mind' && <Brain className="w-6 h-6" />}
                  {selectedCard.level === 'body' && <Dumbbell className="w-6 h-6" />}
                  <div>
                    <Badge variant="secondary" className="mb-1 bg-white/20 text-white border-0">
                      {selectedCard.level === 'soul' ? 'Душа' : selectedCard.level === 'mind' ? 'Розум' : 'Тіло'}
                    </Badge>
                    <h2 className="text-xl font-bold">{selectedCard.cardTitle}</h2>
                  </div>
                </div>
              </div>

              {/* Card Description */}
              {selectedCard.cardDescription && (
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
                    {selectedCard.cardDescription}
                  </p>
                </div>
              )}

              {/* Hint */}
              {selectedCard.cardHint && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex gap-3">
                    <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-amber-800 dark:text-amber-200 text-sm">{selectedCard.cardHint}</p>
                  </div>
                </div>
              )}

              {/* Response Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {isEditing ? 'Редагування відповіді' : 'Ваша відповідь'}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {selectedCard.createdAt && new Date(selectedCard.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                </div>

                {isEditing ? (
                  // Edit Mode
                  isChoiceCard(selectedCard.cardType) && selectedCard.options?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedCard.options.map((option) => {
                        const isSelected = Array.isArray(editedResponse) && editedResponse.includes(option.name);
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleOptionToggle(option.name)}
                            data-testid={`option-${option.value}`}
                            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                isSelected ? 'bg-blue-500 text-white' : 'border-2 border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && <Check className="w-3 h-3" />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  {option.icon && <span className="text-lg">{option.icon}</span>}
                                  <span className="font-medium text-gray-900 dark:text-white">{option.name}</span>
                                </div>
                                {option.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      value={typeof editedResponse === 'string' ? editedResponse : ''}
                      onChange={(e) => setEditedResponse(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Введіть вашу відповідь..."
                      data-testid="textarea-edit-response"
                    />
                  )
                ) : (
                  // View Mode
                  <div className={`p-4 rounded-lg ${getLevelColors(selectedCard.level).bg} ${getLevelColors(selectedCard.level).border} border`}>
                    {Array.isArray(selectedCard.response) ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedCard.response.map((item: string, i: number) => (
                          <span key={i} className={`px-3 py-1.5 rounded-full text-sm font-medium ${getLevelColors(selectedCard.level).badge} ${getLevelColors(selectedCard.level).text}`}>
                            {item}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={`whitespace-pre-wrap ${getLevelColors(selectedCard.level).text}`}>{selectedCard.response}</p>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 mt-6">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                      Скасувати
                    </Button>
                    <Button onClick={handleSave} disabled={saveResponseMutation.isPending} data-testid="button-save-response">
                      <Save className="w-4 h-4 mr-2" />
                      {saveResponseMutation.isPending ? 'Збереження...' : 'Зберегти'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setSelectedCard(null)} data-testid="button-close-modal">
                      Закрити
                    </Button>
                    <Button onClick={() => setIsEditing(true)} data-testid="button-edit-response">
                      <Edit2 className="w-4 h-4 mr-2" />
                      Редагувати
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
