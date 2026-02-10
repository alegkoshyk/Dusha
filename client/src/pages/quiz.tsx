import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, ArrowRight, RotateCcw, Trophy, Sparkles, CheckCircle2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  id: number;
  category: string;
  question: string;
  options: { text: string; score: number }[];
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    category: "Ідентичність",
    question: "Чи можете ви одним реченням сформулювати, що робить ваш бренд унікальним?",
    options: [
      { text: "Так, це чітко визначено і всі в команді знають", score: 3 },
      { text: "Приблизно, але не зовсім чітко", score: 2 },
      { text: "Ні, це досі розмито", score: 1 },
      { text: "Я навіть не замислювався про це", score: 0 },
    ],
  },
  {
    id: 2,
    category: "Ідентичність",
    question: "Чи є у вашого бренду чітко визначені цінності?",
    options: [
      { text: "Так, ми живемо за ними щодня", score: 3 },
      { text: "Вони записані, але не завжди дотримуємось", score: 2 },
      { text: "Є якісь ідеї, але нічого конкретного", score: 1 },
      { text: "Ні, ми про це не думали", score: 0 },
    ],
  },
  {
    id: 3,
    category: "Візуальна мова",
    question: "Наскільки послідовний візуальний стиль вашого бренду?",
    options: [
      { text: "Повністю — логотип, кольори, шрифти єдині скрізь", score: 3 },
      { text: "Переважно, але бувають відхилення", score: 2 },
      { text: "Кожного разу виглядає по-різному", score: 1 },
      { text: "У нас немає визначеного стилю", score: 0 },
    ],
  },
  {
    id: 4,
    category: "Візуальна мова",
    question: "Чи впізнають ваш бренд без логотипу — лише за кольорами та стилем?",
    options: [
      { text: "Так, наш стиль дуже впізнаваний", score: 3 },
      { text: "Скоріше так, деякі елементи впізнавані", score: 2 },
      { text: "Навряд чи", score: 1 },
      { text: "Точно ні", score: 0 },
    ],
  },
  {
    id: 5,
    category: "Аудиторія",
    question: "Наскільки добре ви знаєте свою цільову аудиторію?",
    options: [
      { text: "Ми маємо детальні портрети та дослідження", score: 3 },
      { text: "Загальне уявлення є", score: 2 },
      { text: "Продаємо всім, хто купує", score: 1 },
      { text: "Не знаю, хто наш клієнт", score: 0 },
    ],
  },
  {
    id: 6,
    category: "Аудиторія",
    question: "Чи отримуєте ви зворотній зв'язок від клієнтів регулярно?",
    options: [
      { text: "Так, є система збору та аналізу відгуків", score: 3 },
      { text: "Іноді, коли хтось пише", score: 2 },
      { text: "Рідко, лише коли є скарги", score: 1 },
      { text: "Ніколи не збираємо", score: 0 },
    ],
  },
  {
    id: 7,
    category: "Комунікація",
    question: "Чи є у вашого бренду унікальний тон голосу?",
    options: [
      { text: "Так, він прописаний і використовується скрізь", score: 3 },
      { text: "Інтуїтивно, але не формалізовано", score: 2 },
      { text: "Кожен пише як хоче", score: 1 },
      { text: "Ми про це не думали", score: 0 },
    ],
  },
  {
    id: 8,
    category: "Комунікація",
    question: "Як часто ви комунікуєте з аудиторією?",
    options: [
      { text: "Регулярно, за контент-планом", score: 3 },
      { text: "Коли є що сказати", score: 2 },
      { text: "Рідко та хаотично", score: 1 },
      { text: "Майже ніколи", score: 0 },
    ],
  },
  {
    id: 9,
    category: "Стратегія",
    question: "Чи маєте ви бренд-стратегію на наступний рік?",
    options: [
      { text: "Так, детальний план з KPI", score: 3 },
      { text: "Загальне бачення є", score: 2 },
      { text: "Діємо за обставинами", score: 1 },
      { text: "Ні, живемо одним днем", score: 0 },
    ],
  },
  {
    id: 10,
    category: "Стратегія",
    question: "Чи відрізняється ваш бренд від конкурентів у свідомості клієнтів?",
    options: [
      { text: "Так, ми чітко позиціоновані", score: 3 },
      { text: "Дещо, але не критично", score: 2 },
      { text: "Ми схожі на конкурентів", score: 1 },
      { text: "Клієнти нас плутають з іншими", score: 0 },
    ],
  },
];

type ResultLevel = "beginner" | "developing" | "strong" | "master";

interface ResultInfo {
  level: ResultLevel;
  title: string;
  emoji: string;
  description: string;
  color: string;
  gradient: string;
  advice: string;
}

function getResultInfo(score: number): ResultInfo {
  const maxScore = quizQuestions.length * 3;
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    return {
      level: "master",
      title: "Бренд-майстер",
      emoji: "👑",
      description: "Ваш бренд — сильний, впізнаваний та стратегічно побудований. Ви знаєте свою аудиторію, маєте чітку ідентичність та послідовну комунікацію.",
      color: "text-yellow-500",
      gradient: "from-yellow-500/20 to-amber-500/20",
      advice: "Продовжуйте розвиватись! Зосередьтесь на інноваціях та масштабуванні бренду на нові ринки.",
    };
  } else if (percentage >= 55) {
    return {
      level: "strong",
      title: "Впевнений бренд",
      emoji: "💪",
      description: "У вашого бренду є міцна основа, але є простір для вдосконалення. Деякі аспекти потребують більшої уваги та систематизації.",
      color: "text-green-500",
      gradient: "from-green-500/20 to-emerald-500/20",
      advice: "Зверніть увагу на слабкі місця та створіть план покращення. Гра «Душа Бренду» допоможе структурувати роботу.",
    };
  } else if (percentage >= 30) {
    return {
      level: "developing",
      title: "Бренд у розвитку",
      emoji: "🌱",
      description: "Ваш бренд знаходиться на етапі становлення. Є базові елементи, але потрібна серйозна робота над стратегією та ідентичністю.",
      color: "text-blue-500",
      gradient: "from-blue-500/20 to-indigo-500/20",
      advice: "Починайте з основ — визначте цінності, місію та цільову аудиторію. Гра «Душа Бренду» — ідеальний старт!",
    };
  } else {
    return {
      level: "beginner",
      title: "Початківець",
      emoji: "🚀",
      description: "Ваш бренд поки що на стартовій позиції. Але це чудова нагода побудувати його правильно з самого початку!",
      color: "text-purple-500",
      gradient: "from-purple-500/20 to-pink-500/20",
      advice: "Не хвилюйтесь — всі великі бренди починали з нуля. Пройдіть гру «Душа Бренду», щоб закласти фундамент.",
    };
  }
}

const categoryColors: Record<string, string> = {
  "Ідентичність": "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  "Візуальна мова": "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  "Аудиторія": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  "Комунікація": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Стратегія": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

export default function Quiz() {
  const { brandId } = useParams<{ brandId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);

  const { data: latestResult } = useQuery({
    queryKey: ["/api/brands", brandId, "quiz-results", "latest"],
    queryFn: async () => {
      const res = await fetch(`/api/brands/${brandId}/quiz-results/latest`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!brandId,
  });

  const saveResultMutation = useMutation({
    mutationFn: async (data: { answers: Record<number, number>; totalScore: number; resultLevel: string }) => {
      return apiRequest("POST", `/api/brands/${brandId}/quiz-results`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "quiz-results"] });
    },
  });

  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;
  const question = quizQuestions[currentQuestion];
  const totalScore = Object.values(answers).reduce((sum, s) => sum + s, 0);

  const handleSelectOption = useCallback((optionIndex: number) => {
    setSelectedOption(optionIndex);
    setAnswers((prev) => ({ ...prev, [question.id]: question.options[optionIndex].score }));

    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setDirection(1);
        setCurrentQuestion((prev) => prev + 1);
        setSelectedOption(null);
      } else {
        const finalScore = Object.values({ ...answers, [question.id]: question.options[optionIndex].score }).reduce((sum, s) => sum + s, 0);
        const resultInfo = getResultInfo(finalScore);
        setShowResult(true);
        saveResultMutation.mutate({
          answers: { ...answers, [question.id]: question.options[optionIndex].score },
          totalScore: finalScore,
          resultLevel: resultInfo.level,
        });
      }
    }, 600);
  }, [currentQuestion, question, answers, saveResultMutation]);

  const handlePrev = useCallback(() => {
    if (currentQuestion > 0) {
      setDirection(-1);
      setCurrentQuestion((prev) => prev - 1);
      setSelectedOption(null);
    }
  }, [currentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResult(false);
    setSelectedOption(null);
    setDirection(1);
  }, []);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const resultInfo = getResultInfo(totalScore);
  const maxScore = quizQuestions.length * 3;

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <Card className="overflow-hidden border-0 shadow-xl">
              <div className={`bg-gradient-to-r ${resultInfo.gradient} p-8 text-center`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-7xl mb-4"
                >
                  {resultInfo.emoji}
                </motion.div>
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-3xl font-bold mb-2"
                >
                  {resultInfo.title}
                </motion.h1>
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-xl font-semibold">
                    {totalScore} / {maxScore} балів
                  </span>
                </motion.div>
              </div>

              <CardContent className="p-6 space-y-6">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(totalScore / maxScore) * 100}%` }}
                      transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                      className="h-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-right">
                    {Math.round((totalScore / maxScore) * 100)}%
                  </p>
                </motion.div>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="text-muted-foreground leading-relaxed"
                >
                  {resultInfo.description}
                </motion.p>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="bg-muted/50 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold text-sm">Порада</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{resultInfo.advice}</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="space-y-3"
                >
                  <h3 className="font-semibold text-sm">Результати за категоріями</h3>
                  {["Ідентичність", "Візуальна мова", "Аудиторія", "Комунікація", "Стратегія"].map((cat) => {
                    const catQuestions = quizQuestions.filter((q) => q.category === cat);
                    const catScore = catQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
                    const catMax = catQuestions.length * 3;
                    const catPercent = Math.round((catScore / catMax) * 100);
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>{cat}</span>
                          <span className="text-muted-foreground">{catScore}/{catMax}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${catPercent}%` }}
                            transition={{ delay: 1.8, duration: 0.8 }}
                            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="flex flex-col sm:flex-row gap-3 pt-4"
                >
                  <Button onClick={handleRestart} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Пройти знову
                  </Button>
                  <Link href={`/brand/${brandId}`}>
                    <Button className="flex-1 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                      <Star className="h-4 w-4 mr-2" />
                      До бренду
                    </Button>
                  </Link>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/brand/${brandId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentQuestion + 1} / {quizQuestions.length}
          </span>
        </div>

        <div className="mb-2">
          <Progress value={progress} className="h-2" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Душа Бренду: Де Я?
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Оцініть поточний стан вашого бренду</p>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4">
                  <Badge className={categoryColors[question.category] || "bg-gray-100"}>
                    {question.category}
                  </Badge>
                </div>

                <h2 className="text-xl font-semibold mb-6 leading-relaxed">
                  {question.question}
                </h2>

                <div className="space-y-3">
                  {question.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isPreviouslySelected = answers[question.id] === option.score && selectedOption === null;
                    return (
                      <motion.button
                        key={idx}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => handleSelectOption(idx)}
                        disabled={selectedOption !== null}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                          isSelected
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-500/10 scale-[1.02]"
                            : isPreviouslySelected
                            ? "border-purple-300 bg-purple-50/50 dark:bg-purple-500/5"
                            : "border-muted hover:border-purple-300 hover:bg-muted/50"
                        } ${selectedOption !== null && !isSelected ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 transition-all duration-300 ${
                              isSelected
                                ? "bg-purple-500 text-white"
                                : isPreviouslySelected
                                ? "bg-purple-200 text-purple-700 dark:bg-purple-800 dark:text-purple-200"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isSelected ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-sm leading-relaxed">{option.text}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
          <div className="flex gap-1">
            {quizQuestions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentQuestion
                    ? "bg-purple-500 w-6"
                    : idx < currentQuestion && answers[quizQuestions[idx].id] !== undefined
                    ? "bg-purple-300"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="w-20" />
        </div>

        {latestResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-muted-foreground">
              Ваш попередній результат: {getResultInfo(latestResult.totalScore).title} ({latestResult.totalScore}/{maxScore})
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
