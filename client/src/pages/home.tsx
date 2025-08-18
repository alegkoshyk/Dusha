import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Brain, ServerCog, Play, BookOpen, Users, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GameSession } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/game-sessions", {
        currentLevel: "soul",
        currentCard: 1,
        responses: {},
        progress: 0,
      });
      return response.json() as Promise<GameSession>;
    },
    onSuccess: (session) => {
      setLocation(`/game/${session.id}`);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося створити нову гру. Спробуйте ще раз.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-soul-500 to-mind-500 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-4" data-testid="title-main">
              Душа Бренду
            </h1>
            <p className="text-xl text-soul-100 mb-8 max-w-2xl mx-auto">
              Мобільна трансформаційна гра з полем рівнів та розгалуженими картками для створення унікального бренду
            </p>
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="bg-white text-soul-600 hover:bg-soul-50 px-8 py-4 text-lg shadow-lg"
                onClick={() => createSessionMutation.mutate()}
                disabled={createSessionMutation.isPending}
                data-testid="button-start-game"
              >
                <Play className="w-5 h-5 mr-2" />
                {createSessionMutation.isPending ? "Завантаження..." : "🎮 Почати мобільну гру"}
              </Button>
              <p className="text-sm text-soul-200">
                Нова версія з інтерактивним полем та унікальними переходами між картками
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Game Overview */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Як працює гра
          </h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Мобільна гра з полем рівнів, де кожна картка має унікальні параметри та можливості переходів. 
            Розгалужена система з досягненнями, XP та персоналізованими шляхами розвитку бренду.
          </p>
        </div>

        {/* Game Levels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Soul Level */}
          <Card className="border-2 border-soul-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-soul-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-soul-700">Душа Бренду</CardTitle>
              <CardDescription>
                Місія, цінності та історія вашого бренду
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Визначення ключових цінностей</li>
                <li>• Формулювання місії</li>
                <li>• Створення історії бренду</li>
                <li>• Розкриття призначення</li>
              </ul>
            </CardContent>
          </Card>

          {/* Mind Level */}
          <Card className="border-2 border-mind-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-mind-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-mind-700">Розум Бренду</CardTitle>
              <CardDescription>
                Стратегія, позиціонування та унікальна пропозиція
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Визначення цільової аудиторії</li>
                <li>• Формування бренд-ідеї</li>
                <li>• Вибір архетипу бренду</li>
                <li>• Створення обіцянки клієнтам</li>
              </ul>
            </CardContent>
          </Card>

          {/* Body Level */}
          <Card className="border-2 border-body-200 hover:shadow-lg transition-all duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-body-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ServerCog className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-body-700">Тіло Бренду</CardTitle>
              <CardDescription>
                Практична реалізація та конкретні дії
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <li>• Планування продуктів/послуг</li>
                <li>• Вибір каналів комунікації</li>
                <li>• Розробка візуального стилю</li>
                <li>• Визначення перших кроків</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Що ви отримаєте
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-soul-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-soul-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Цілісна стратегія
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Повна карта бренду з усіма ключовими елементами для розвитку бізнесу
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-mind-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-mind-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Розуміння аудиторії
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Чіткий портрет вашого ідеального клієнта та способи з ним взаємодії
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-body-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-body-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                План дій
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Конкретні кроки для втілення вашої бренд-стратегії в життя
              </p>
            </div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="text-center mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl font-bold text-soul-600">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Рівня гри</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-mind-600">~20</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Карток на рівень</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-body-600">2-3</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Години гри</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">PDF</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Експорт результатів</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
