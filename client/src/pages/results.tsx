import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Download, Home, Heart, Brain, ServerCog, Share2 } from "lucide-react";
import { exportToPDF } from "@/lib/pdfExport";
import { useToast } from "@/hooks/use-toast";
import type { BrandMap, GameSession } from "@shared/schema";

export default function Results() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ["/api/game-sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: brandMap, isLoading: brandMapLoading } = useQuery<BrandMap>({
    queryKey: ["/api/game-sessions", sessionId, "brand-map"],
    enabled: !!sessionId,
  });

  const handleExportPDF = async () => {
    if (!brandMap || !session) return;
    
    try {
      await exportToPDF(brandMap, session);
      toast({
        title: "Експорт успішний",
        description: "Карта бренду збережена у PDF файл",
      });
    } catch (error) {
      toast({
        title: "Помилка експорту",
        description: "Не вдалося створити PDF файл",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Моя карта бренду - Душа Бренду",
          text: "Я створив карту свого бренду за допомогою гри 'Душа Бренду'",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Посилання скопійовано",
        description: "URL результатів скопійовано в буфер обміну",
      });
    }
  };

  if (sessionLoading || brandMapLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-soul-500 to-body-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-xl">♥</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Генерація карти бренду...</p>
        </div>
      </div>
    );
  }

  if (!session || !brandMap) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Сесію не знайдено
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Схоже, що дані вашої гри недоступні або застарілі
          </p>
          <Button asChild>
            <a href="/">
              <Home className="w-4 h-4 mr-2" />
              На головну
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-soul-500 via-mind-500 to-body-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4" data-testid="title-results">
              Ваша карта бренду готова!
            </h1>
            <p className="text-lg text-white/80 mb-6">
              Вітаємо з завершенням гри "Душа Бренду". Ваша унікальна стратегія розвитку бренду сформована.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={handleExportPDF}
                className="bg-white text-soul-600 hover:bg-white/90"
                data-testid="button-export-pdf"
              >
                <Download className="w-4 h-4 mr-2" />
                Завантажити PDF
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Поділитися
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Brand Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Soul Section */}
          <Card className="border-2 border-soul-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-soul-500 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-soul-700">Душа Бренду</CardTitle>
                  <CardDescription>Сенс, цінності та місія</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brandMap.soul.mission && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Місія</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-mission">
                    {brandMap.soul.mission}
                  </p>
                </div>
              )}

              {brandMap.soul.values.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цінності</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap.soul.values.map((value, index) => (
                      <Badge key={index} variant="secondary" className="bg-soul-100 text-soul-700">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {brandMap.soul.story && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Історія</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-story">
                    {brandMap.soul.story}
                  </p>
                </div>
              )}

              {brandMap.soul.purpose && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Призначення</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-purpose">
                    {brandMap.soul.purpose}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mind Section */}
          <Card className="border-2 border-mind-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-mind-500 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-mind-700">Розум Бренду</CardTitle>
                  <CardDescription>Стратегія та позиціонування</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brandMap.mind.brandIdea && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Бренд-ідея</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-brand-idea">
                    {brandMap.mind.brandIdea}
                  </p>
                </div>
              )}

              {brandMap.mind.targetAudience && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Цільова аудиторія</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-target-audience">
                    {brandMap.mind.targetAudience}
                  </p>
                </div>
              )}

              {brandMap.mind.archetype && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Архетип</h4>
                  <Badge className="bg-mind-100 text-mind-700">
                    {brandMap.mind.archetype}
                  </Badge>
                </div>
              )}

              {brandMap.mind.promise && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Обіцянка клієнтам</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-promise">
                    {brandMap.mind.promise}
                  </p>
                </div>
              )}

              {brandMap.mind.positioning && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Позиціонування</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-positioning">
                    {brandMap.mind.positioning}
                  </p>
                </div>
              )}

              {brandMap.mind.uniqueValue && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Унікальна цінність</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-unique-value">
                    {brandMap.mind.uniqueValue}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body Section */}
          <Card className="border-2 border-body-200">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-body-500 rounded-full flex items-center justify-center">
                  <ServerCog className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-body-700">Тіло Бренду</CardTitle>
                  <CardDescription>Реалізація та дії</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {brandMap.body.products.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Продукти/Послуги</h4>
                  <div className="space-y-1">
                    {brandMap.body.products.map((product, index) => (
                      <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        • {product}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {brandMap.body.channels.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Канали комунікації</h4>
                  <div className="flex flex-wrap gap-2">
                    {brandMap.body.channels.map((channel, index) => (
                      <Badge key={index} variant="outline" className="border-body-300 text-body-700">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {brandMap.body.visualStyle && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Візуальний стиль</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-visual-style">
                    {brandMap.body.visualStyle}
                  </p>
                </div>
              )}

              {brandMap.body.toneOfVoice && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Тон спілкування</h4>
                  <Badge className="bg-body-100 text-body-700">
                    {brandMap.body.toneOfVoice}
                  </Badge>
                </div>
              )}

              {brandMap.body.actions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Перші кроки</h4>
                  <div className="space-y-1">
                    {brandMap.body.actions.map((action, index) => (
                      <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
                        {index + 1}. {action}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {brandMap.body.resources && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Необхідні ресурси</h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300" data-testid="text-resources">
                    {brandMap.body.resources}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Separator className="my-12" />

        {/* Next Steps */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Наступні кроки
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
            Ваша карта бренду — це дороговказ для розвитку бізнесу. Використовуйте її для прийняття стратегічних рішень, 
            планування продуктів та комунікації з клієнтами.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleExportPDF} size="lg" data-testid="button-export-final">
              <Download className="w-5 h-5 mr-2" />
              Завантажити карту бренду
            </Button>
            <Button variant="outline" size="lg" asChild data-testid="button-home">
              <a href="/">
                <Home className="w-5 h-5 mr-2" />
                Почати нову гру
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
