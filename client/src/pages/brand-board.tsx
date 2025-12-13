import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, Share, MapPin, Heart, Brain, Dumbbell, Edit2, Save, ChevronRight, Lightbulb, Check, Sparkles, Loader2, AlertCircle, CheckCircle, CircleDot, ArrowRight, TrendingUp, Settings, History, Clock, Star } from 'lucide-react';
import { Header } from '@/components/Header';
import { useState } from 'react';

interface BrandAiAnalysis {
  id: string;
  brandId: string;
  userId: string;
  analysisType: string;
  content: any;
  score: number | null;
  insights: string[] | null;
  recommendations: string[] | null;
  strengths: string[] | null;
  weaknesses: string[] | null;
  provider: string | null;
  model: string | null;
  tokensUsed: number | null;
  generationTimeMs: number | null;
  createdAt: string;
}

interface GameSessionData {
  id: string;
  brandId: string;
  userId: string;
  currentLevel: string;
  currentCard: string;
  progress: number;
  totalXp: number;
}

interface LevelInsight {
  level: string;
  levelName: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  consistencyScore: number;
}

interface ChecklistItem {
  text: string;
  status: 'done' | 'needs_improvement' | 'missing';
  priority: 'high' | 'medium' | 'low';
}

interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

interface BrandInsights {
  overallScore: number;
  overallSummary: string;
  brandName: string;
  levels: LevelInsight[];
  checklist: ChecklistCategory[];
  nextSteps: string[];
}

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

  const { data: sessionData } = useQuery<GameSessionData>({
    queryKey: ['/api/game-sessions', sessionId],
    enabled: !!sessionId
  });

  const { data: aiAnalysisHistory } = useQuery<BrandAiAnalysis[]>({
    queryKey: ['/api/brands', sessionData?.brandId, 'ai-analyses'],
    enabled: !!sessionData?.brandId
  });

  const [aiInsights, setAiInsights] = useState<BrandInsights | null>(null);
  const [showAnalysisHistory, setShowAnalysisHistory] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/game-sessions/${sessionId}/ai-insights`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate insights');
      }
      return res.json();
    },
    onSuccess: (data: BrandInsights) => {
      setAiInsights(data);
      setAiError(null);
      // Invalidate analyses history to show new saved analysis
      if (sessionData?.brandId) {
        queryClient.invalidateQueries({ queryKey: ['/api/brands', sessionData.brandId, 'ai-analyses'] });
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('not configured') || error.message.includes('API key')) {
        setAiError('api_key_missing');
      } else {
        setAiError('generic');
      }
    }
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
      
      <div className="container mx-auto px-4 py-4 md:py-8">
        {/* Mobile-friendly header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          {/* Top row: Back button and title */}
          <div className="flex items-start gap-3">
            <Button variant="outline" size="sm" onClick={handleBack} data-testid="button-back" className="flex-shrink-0">
              <ArrowLeft className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Назад</span>
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">Дошка Бренду</h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 line-clamp-2">Ваша повна карта бренду зібрана в одному місці</p>
            </div>
          </div>
          
          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('ai-analysis-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30"
              data-testid="button-ai-analyses"
            >
              <Sparkles className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">AI аналізи</span>
            </Button>
            <Button variant="outline" size="sm" data-testid="button-share">
              <Share className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Поділитися</span>
            </Button>
            <Button size="sm" data-testid="button-download-pdf">
              <Download className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Завантажити PDF</span>
            </Button>
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

        {/* AI Insights Section */}
        <Card id="ai-analysis-section" className="mt-8 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="flex items-center gap-2 text-indigo-800 dark:text-indigo-200">
                <Sparkles className="w-6 h-6" />
                AI Аналіз Бренду
              </CardTitle>
              <div className="flex items-center gap-2">
                {aiAnalysisHistory && aiAnalysisHistory.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalysisHistory(true)}
                    className="text-indigo-600 border-indigo-300 hover:bg-indigo-50 dark:text-indigo-300 dark:border-indigo-700 dark:hover:bg-indigo-900/30"
                    data-testid="button-view-history"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Історія ({aiAnalysisHistory.length})
                  </Button>
                )}
                <Button
                  onClick={() => generateInsightsMutation.mutate()}
                  disabled={generateInsightsMutation.isPending || aiError === 'api_key_missing'}
                  className={`${aiError === 'api_key_missing' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                  data-testid="button-generate-ai"
                >
                {generateInsightsMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Аналізую...</>
                ) : aiError === 'api_key_missing' ? (
                  <><Settings className="w-4 h-4 mr-2" />API не налаштовано</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />{aiInsights ? 'Оновити аналіз' : 'Отримати AI аналіз'}</>
                )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {aiError === 'api_key_missing' && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">OpenAI не налаштовано</h4>
                    <p className="text-sm text-amber-600 dark:text-amber-300 mb-2">
                      Для використання AI аналізу необхідно налаштувати OpenAI API ключ.
                    </p>
                    <p className="text-xs text-amber-500 dark:text-amber-400">
                      Зверніться до адміністратора для налаштування (Налаштування → AI Налаштування)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {aiError === 'generic' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 dark:text-red-200">Помилка генерації</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      Не вдалося отримати AI аналіз. Спробуйте ще раз пізніше.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!aiInsights && !generateInsightsMutation.isPending && !aiError && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Отримайте персоналізований аналіз вашого бренду
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  AI проаналізує ваші відповіді та надасть рекомендації для покращення бренд-стратегії
                </p>
              </div>
            )}

            {generateInsightsMutation.isPending && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Аналізую вашу бренд-стратегію...</p>
              </div>
            )}

            {aiInsights && (
              <div className="space-y-8">
                {/* Overall Score with Brand Name */}
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                      <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" 
                        strokeDasharray={`${(aiInsights.overallScore / 100) * 251.2} 251.2`}
                        className="text-indigo-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{aiInsights.overallScore}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Аналіз бренду: {aiInsights.brandName || 'Ваш бренд'}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Загальна оцінка консистентності</p>
                    <p className="text-gray-600 dark:text-gray-400">{aiInsights.overallSummary}</p>
                  </div>
                </div>

                {/* Level Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {aiInsights.levels.map((level) => {
                    const colors = level.level === 'soul' 
                      ? { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', accent: 'bg-purple-500' }
                      : level.level === 'mind'
                      ? { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', accent: 'bg-blue-500' }
                      : { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', accent: 'bg-green-500' };

                    return (
                      <Card key={level.level} className={`${colors.border}`}>
                        <CardHeader className={`${colors.bg} py-3`}>
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-sm font-medium ${colors.text}`}>{level.levelName}</CardTitle>
                            <Badge className={`${colors.accent} text-white`}>{level.consistencyScore}/100</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                          <p className="text-sm text-gray-600 dark:text-gray-400">{level.summary}</p>
                          
                          {level.strengths.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Сильні сторони:</h5>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                {level.strengths.slice(0, 3).map((s, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {level.weaknesses.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Потребує уваги:</h5>
                              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                {level.weaknesses.slice(0, 3).map((w, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CircleDot className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <span>{w}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Checklist */}
                {aiInsights.checklist.length > 0 && (
                  <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <CardHeader className="bg-gray-50 dark:bg-gray-800/50">
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <TrendingUp className="w-5 h-5" />
                        Чекліст консистентності бренду
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {aiInsights.checklist.map((category, idx) => (
                          <div key={idx} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">{category.category}</h4>
                            <ul className="space-y-1.5">
                              {category.items.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  {item.status === 'done' ? (
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                  ) : item.status === 'needs_improvement' ? (
                                    <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                                  ) : (
                                    <CircleDot className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                  )}
                                  <span className={`${item.status === 'done' ? 'text-gray-600 dark:text-gray-400' : item.status === 'needs_improvement' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'}`}>
                                    {item.text}
                                    {item.priority === 'high' && <Badge variant="outline" className="ml-2 text-xs py-0">!</Badge>}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Next Steps */}
                {aiInsights.nextSteps.length > 0 && (
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                      <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <ArrowRight className="w-5 h-5" />
                        Наступні кроки
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <ul className="space-y-3">
                        {aiInsights.nextSteps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-700 dark:text-amber-300 text-sm font-medium flex-shrink-0">
                              {idx + 1}
                            </span>
                            <p className="text-gray-700 dark:text-gray-300">{step}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Analysis History Section */}
        {aiAnalysisHistory && aiAnalysisHistory.length > 0 && (
          <Card className="mt-6 border-gray-200 dark:border-gray-700">
            <CardHeader 
              className="bg-gray-50 dark:bg-gray-800/50 cursor-pointer"
              onClick={() => setShowAnalysisHistory(!showAnalysisHistory)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <History className="w-5 h-5" />
                  Історія AI аналізів ({aiAnalysisHistory.length})
                </CardTitle>
                <ChevronRight className={`w-5 h-5 transition-transform ${showAnalysisHistory ? 'rotate-90' : ''}`} />
              </div>
            </CardHeader>
            {showAnalysisHistory && (
              <CardContent className="p-4">
                <div className="space-y-3">
                  {aiAnalysisHistory.map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (analysis.content) {
                          setAiInsights(analysis.content as BrandInsights);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(analysis.createdAt).toLocaleDateString('uk-UA', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          {analysis.score && (
                            <Badge 
                              variant="outline" 
                              className={`flex items-center gap-1 ${
                                analysis.score >= 80 ? 'border-green-500 text-green-600' :
                                analysis.score >= 60 ? 'border-yellow-500 text-yellow-600' :
                                'border-red-500 text-red-600'
                              }`}
                            >
                              <Star className="w-3 h-3" />
                              {analysis.score}/100
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">{analysis.analysisType === 'full' ? 'Повний аналіз' : analysis.analysisType}</Badge>
                      </div>

                      {/* Key Metrics Row */}
                      <div className="flex flex-wrap gap-3 mt-3 mb-2">
                        {analysis.strengths && Array.isArray(analysis.strengths) && (
                          <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircle className="w-3 h-3" />
                            <span>{analysis.strengths.length} сильних сторін</span>
                          </div>
                        )}
                        {analysis.weaknesses && Array.isArray(analysis.weaknesses) && (
                          <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
                            <AlertCircle className="w-3 h-3" />
                            <span>{analysis.weaknesses.length} слабких сторін</span>
                          </div>
                        )}
                        {analysis.recommendations && Array.isArray(analysis.recommendations) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                            <Lightbulb className="w-3 h-3" />
                            <span>{analysis.recommendations.length} рекомендацій</span>
                          </div>
                        )}
                      </div>
                      
                      {analysis.insights && Array.isArray(analysis.insights) && analysis.insights.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Наступні кроки:</h5>
                          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            {analysis.insights.slice(0, 2).map((insight: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <Sparkles className="w-3 h-3 text-indigo-500 mt-1 flex-shrink-0" />
                                <span className="line-clamp-1">{insight}</span>
                              </li>
                            ))}
                            {analysis.insights.length > 2 && (
                              <li className="text-xs text-indigo-500">+{analysis.insights.length - 2} більше...</li>
                            )}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        {analysis.provider && (
                          <div className="text-xs text-gray-400">
                            {analysis.provider} {analysis.model && `• ${analysis.model}`}
                          </div>
                        )}
                        <span className="text-xs text-indigo-500 hover:text-indigo-600">Натисніть для перегляду →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}
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
