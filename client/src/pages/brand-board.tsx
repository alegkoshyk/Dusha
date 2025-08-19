import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Download, Share, MapPin, Heart, Brain, Dumbbell } from 'lucide-react';
import { Header } from '@/components/Header';
import React from 'react';

interface CardResponse {
  cardId: string;
  cardTitle: string;
  response: any;
  responseType: string;
  createdAt: string;
  level: string;
}

interface BrandMapResponse {
  soul: {
    values: string[];
    mission: string;
    story: string;
    purpose: string;
    emotion: string;
    deepValues: string[];
    impact: string;
    archetype: string;
  };
  mind: {
    archetype: string;
    positioning: string;
    promise: string;
    solution: string;
    problem: string;
    audience: string;
  };
  body: {
    channels: string[];
    visual: string;
    pricing: string;
    tone: string[];
    metrics: string[];
    launch: string;
  };
}

export default function BrandBoard() {
  const { sessionId } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: brandMap, isLoading, error } = useQuery<BrandMapResponse>({
    queryKey: [`/api/game-sessions/${sessionId}/brand-map`],
    enabled: !!sessionId
  });

  const { data: cardResponses, isLoading: responsesLoading } = useQuery<CardResponse[]>({
    queryKey: [`/api/game-sessions/${sessionId}/responses`],
    enabled: !!sessionId
  });

  // Auto-complete game session when visiting brand board
  const completeGameMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/game-sessions/${sessionId}/complete`, {
        method: 'POST'
      });
    },
    onSuccess: () => {
      // Invalidate session cache to update completion status
      queryClient.invalidateQueries({ queryKey: [`/api/game-sessions/${sessionId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/game-sessions'] });
    }
  });

  // Auto-complete on mount if not already completed
  React.useEffect(() => {
    if (sessionId && brandMap && !completeGameMutation.isPending) {
      completeGameMutation.mutate();
    }
  }, [sessionId, brandMap]);

  const handleBack = () => {
    setLocation('/dashboard');
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log('Download PDF');
  };

  const handleShare = () => {
    // TODO: Implement sharing functionality
    console.log('Share brand board');
  };

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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Дошку бренду не знайдено
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Схоже, що гра ще не завершена або сталася помилка.
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Повернутися до Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Дошка Бренду
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Ваша повна карта бренду зібрана в одному місці
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Поділитися
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Завантажити PDF
            </Button>
          </div>
        </div>

        {/* Debug: Show loading state and error */}
        {responsesLoading && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p>Завантажую відповіді...</p>
          </div>
        )}
        
        {!responsesLoading && !cardResponses && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p>Помилка завантаження відповідей</p>
          </div>
        )}

        {/* All Responses Map */}
        {cardResponses && (
          <Card className="mb-8 border-orange-200 dark:border-orange-800">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
              <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                <MapPin className="w-6 h-6" />
                Карта всіх відповідей ({cardResponses?.length || 0} відповідей)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {['soul', 'mind', 'body'].map((level) => {
                  const levelResponses = cardResponses.filter(r => r.level === level);
                  const levelIcon = level === 'soul' ? Heart : level === 'mind' ? Brain : Dumbbell;
                  const levelColor = level === 'soul' ? 'purple' : level === 'mind' ? 'blue' : 'green';
                  const LevelIcon = levelIcon;
                  
                  return (
                    <div key={level} 
                         className={`border-2 rounded-lg p-4 ${
                           level === 'soul' 
                             ? 'border-purple-200 dark:border-purple-800' 
                             : level === 'mind' 
                             ? 'border-blue-200 dark:border-blue-800'
                             : 'border-green-200 dark:border-green-800'
                         }`}>
                      <div className={`flex items-center gap-2 mb-4 ${
                        level === 'soul' 
                          ? 'text-purple-800 dark:text-purple-200' 
                          : level === 'mind' 
                          ? 'text-blue-800 dark:text-blue-200'
                          : 'text-green-800 dark:text-green-200'
                      }`}>
                        <LevelIcon className="w-5 h-5" />
                        <h3 className="font-semibold">
                          {level === 'soul' ? 'Душа' : level === 'mind' ? 'Розум' : 'Тіло'} ({levelResponses.length})
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                          {levelResponses.map((response, index) => (
                            <div key={response.cardId} 
                                 className={`p-3 rounded-lg border ${
                                   level === 'soul' 
                                     ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' 
                                     : level === 'mind' 
                                     ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                     : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                 }`}>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className={`font-medium text-sm ${
                                  level === 'soul' 
                                    ? 'text-purple-900 dark:text-purple-100' 
                                    : level === 'mind' 
                                    ? 'text-blue-900 dark:text-blue-100'
                                    : 'text-green-900 dark:text-green-100'
                                }`}>
                                  {response.cardTitle}
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                  {index + 1}
                                </Badge>
                              </div>
                              <div className={`text-sm ${
                                level === 'soul' 
                                  ? 'text-purple-700 dark:text-purple-300' 
                                  : level === 'mind' 
                                  ? 'text-blue-700 dark:text-blue-300'
                                  : 'text-green-700 dark:text-green-300'
                              }`}>
                                {Array.isArray(response.response) ? (
                                  <div className="flex flex-wrap gap-1">
                                    {response.response.map((item: string, i: number) => (
                                      <span key={i} className={`px-2 py-1 rounded text-xs ${
                                        level === 'soul' 
                                          ? 'bg-purple-100 dark:bg-purple-800' 
                                          : level === 'mind' 
                                          ? 'bg-blue-100 dark:bg-blue-800'
                                          : 'bg-green-100 dark:bg-green-800'
                                      }`}>
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{response.response}</p>
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

        {/* Brand Map Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Soul Section */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  S
                </div>
                Душа Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.soul?.values?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цінності</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap?.soul?.values?.map((value: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                        {value}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {brandMap?.soul?.mission && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Місія</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.soul.mission}</p>
                </div>
              )}
              
              {brandMap?.soul?.story && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Історія</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.soul.story}</p>
                </div>
              )}
              
              {brandMap?.soul?.archetype && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Архетип</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.soul.archetype}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mind Section */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  M
                </div>
                Розум Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.mind?.positioning && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Позиціонування</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.mind.positioning}</p>
                </div>
              )}
              
              {brandMap?.mind?.promise && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Обіцянка</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.mind.promise}</p>
                </div>
              )}
              
              {brandMap?.mind?.audience && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цільова аудиторія</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.mind.audience}</p>
                </div>
              )}
              
              {brandMap?.mind?.problem && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Проблема</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.mind.problem}</p>
                </div>
              )}
              
              {brandMap?.mind?.solution && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Рішення</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.mind.solution}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body Section */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  B
                </div>
                Тіло Бренду
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {brandMap?.body?.channels?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Канали комунікації</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap?.body?.channels?.map((channel: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                        {channel}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {brandMap?.body?.visual && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Візуальний стиль</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.body.visual}</p>
                </div>
              )}
              
              {brandMap?.body?.pricing && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Ціноутворення</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.body.pricing}</p>
                </div>
              )}
              
              {brandMap?.body?.tone?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Тон голосу</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap?.body?.tone?.map((tone: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                        {tone}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {brandMap?.body?.metrics?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Метрики успіху</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap?.body?.metrics?.map((metric: string, index: number) => (
                      <span key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {brandMap?.body?.launch && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">План запуску</h4>
                  <p className="text-gray-600 dark:text-gray-400">{brandMap.body.launch}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}