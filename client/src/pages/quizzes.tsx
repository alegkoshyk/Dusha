import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Brain, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface QuizInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  questionsCount: number;
  duration: string;
  gradient: string;
  route: string;
  tag: string;
}

export default function Quizzes() {
  const { brandId } = useParams<{ brandId: string }>();

  const { data: latestResult } = useQuery<{ totalScore: number; resultLevel: string } | null>({
    queryKey: ["/api/brands", brandId, "quiz-results", "latest"],
    enabled: !!brandId,
  });

  const quizzes: QuizInfo[] = [
    {
      id: "brand-assessment",
      title: "Де Я?",
      subtitle: "Оцінка стану бренду",
      description: "10 питань у 5 категоріях: ідентичність, візуальна мова, аудиторія, комунікація, стратегія. Дізнайтесь рівень розвитку вашого бренду.",
      icon: "📊",
      questionsCount: 10,
      duration: "3 хв",
      gradient: "from-purple-500 to-pink-500",
      route: `/quiz/${brandId}`,
      tag: "Аналітика",
    },
    {
      id: "soul-readiness",
      title: "Готовність до Бренду з Душею",
      subtitle: "Свайп-квіз",
      description: "14 глибоких питань про зв'язок із собою, сутність, страхи та намір. Свайпай як у Tinder — вправо «Так», вліво «Ні».",
      icon: "🔥",
      questionsCount: 14,
      duration: "5 хв",
      gradient: "from-orange-500 to-red-500",
      route: `/quiz-soul/${brandId}`,
      tag: "Трансформація",
    },
    {
      id: "brand-consistency",
      title: "Консистентність і проявлення",
      subtitle: "Свайп-квіз",
      description: "16 питань у 4 блоках: ясність, автентичність, форма і стійкість, прояв і відповідальність. Чесна діагностика стану бренду.",
      icon: "🧭",
      questionsCount: 16,
      duration: "5 хв",
      gradient: "from-green-500 to-emerald-500",
      route: `/quiz-consistency/${brandId}`,
      tag: "Діагностика",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/brand/${brandId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Квізи</h1>
            <p className="text-sm text-muted-foreground">Оцініть та дослідіть свій бренд</p>
          </div>
        </div>

        <div className="space-y-4">
          {quizzes.map((quiz, idx) => (
            <motion.div
              key={quiz.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={quiz.route}>
                <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer border-border/50 group">
                  <div className="flex flex-col sm:flex-row">
                    <div className={`bg-gradient-to-br ${quiz.gradient} p-6 sm:p-8 flex items-center justify-center sm:w-32 shrink-0`}>
                      <span className="text-5xl group-hover:scale-110 transition-transform">{quiz.icon}</span>
                    </div>
                    <CardContent className="p-4 sm:p-5 flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">{quiz.subtitle}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {quiz.tag}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          {quiz.questionsCount} питань
                        </span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {quiz.duration}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {latestResult && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Останній результат</p>
                    <p className="text-xs text-muted-foreground">
                      Бал: {latestResult.totalScore} • Рівень: {latestResult.resultLevel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
