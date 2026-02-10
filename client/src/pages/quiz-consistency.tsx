import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, RotateCcw, Heart, X, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface ConsistencyQuestion {
  id: number;
  block: string;
  blockIcon: string;
  question: string;
}

const consistencyQuestions: ConsistencyQuestion[] = [
  { id: 1, block: "Ясність", blockIcon: "🧭", question: "Я можу одним простим реченням пояснити, хто я і для кого я." },
  { id: 2, block: "Ясність", blockIcon: "🧭", question: "Моє позиціонування не змінюється залежно від аудиторії або настрою." },
  { id: 3, block: "Ясність", blockIcon: "🧭", question: "Я чітко розумію, яку трансформацію отримує людина після взаємодії з моїм брендом." },
  { id: 4, block: "Ясність", blockIcon: "🧭", question: "Я знаю, чому саме я, а не «ще один спеціаліст / продукт»." },
  { id: 5, block: "Автентичність", blockIcon: "❤️", question: "Те, що я транслюю назовні, відповідає тому, як я живу всередині." },
  { id: 6, block: "Автентичність", blockIcon: "❤️", question: "Я не відчуваю сорому або внутрішнього спротиву, коли дивлюся на свій контент / сайт / сторінку." },
  { id: 7, block: "Автентичність", blockIcon: "❤️", question: "Мій бренд говорить моїми словами, а не мовою трендів чи «як треба»." },
  { id: 8, block: "Автентичність", blockIcon: "❤️", question: "Я відчуваю енергію, а не виснаження, після прояву від імені бренду." },
  { id: 9, block: "Форма і стійкість", blockIcon: "🧱", question: "У мого бренду є стала візуальна та вербальна форма (стиль, тон, ритм)." },
  { id: 10, block: "Форма і стійкість", blockIcon: "🧱", question: "Люди можуть впізнати мій бренд без пояснень." },
  { id: 11, block: "Форма і стійкість", blockIcon: "🧱", question: "Я регулярно проявляюся (контент, комунікація, продукт), а не ривками." },
  { id: 12, block: "Форма і стійкість", blockIcon: "🧱", question: "Мій бренд виглядає так само сильно, як я його відчуваю всередині." },
  { id: 13, block: "Прояв і відповідальність", blockIcon: "🔥", question: "Я не ховаюся за продуктом — я присутній(я) в бренді як особистість." },
  { id: 14, block: "Прояв і відповідальність", blockIcon: "🔥", question: "Я готовий(а) бути видимим(ою), навіть якщо це викликає реакцію або критику." },
  { id: 15, block: "Прояв і відповідальність", blockIcon: "🔥", question: "Я не чекаю «ідеального моменту», щоб говорити від бренду." },
  { id: 16, block: "Прояв і відповідальність", blockIcon: "🔥", question: "Я усвідомлюю, що мій бренд — це мій вибір і моя відповідальність, а не випадковість." },
];

interface ResultInfo {
  level: string;
  title: string;
  emoji: string;
  diagnosis: string;
  focus: string;
  gradient: string;
}

function getResultInfo(yesCount: number): ResultInfo {
  if (yesCount >= 13) {
    return {
      level: "manifested",
      title: "ПРОЯВЛЕНИЙ ЦІЛІСНИЙ БРЕНД",
      emoji: "✅",
      diagnosis: "Твій бренд живе. Душа, розум і тіло узгоджені. Ти не граєш роль — ти є.",
      focus: "Масштабування, глибина, передача сенсу іншим, система.",
      gradient: "from-green-500/20 to-emerald-500/20",
    };
  } else if (yesCount >= 9) {
    return {
      level: "unfixed",
      title: "БРЕНД Є, АЛЕ НЕ ЗАКРІПЛЕНИЙ",
      emoji: "🟡",
      diagnosis: "Є сильна суть, але консистентність кульгає. Бренд з'являється і зникає.",
      focus: "Ритм. Сталість. Узгодження форми з внутрішнім станом. Менше сумнівів — більше повторюваності.",
      gradient: "from-yellow-500/20 to-amber-500/20",
    };
  } else if (yesCount >= 5) {
    return {
      level: "hidden",
      title: "ВНУТРІШНІЙ БРЕНД БЕЗ ПРОЯВУ",
      emoji: "🟠",
      diagnosis: "Усередині — багато. Назовні — мало. Бренд живе в голові або серці, але не в реальності.",
      focus: "Прояв. Дозвіл собі бути видимим. Почати говорити, навіть неідеально.",
      gradient: "from-orange-500/20 to-red-500/20",
    };
  } else {
    return {
      level: "gap",
      title: "РОЗРИВ МІЖ СУТТЮ І ФОРМОЮ",
      emoji: "🔴",
      diagnosis: "Або бренд ще не народився, або ти живеш у чужій формі. Є або страх, або відсутність ясності.",
      focus: "Не форма. Не маркетинг. Повернення до себе → потім бренд.",
      gradient: "from-red-500/20 to-slate-500/20",
    };
  }
}

const blockColors: Record<string, string> = {
  "Ясність": "from-sky-500 to-blue-600",
  "Автентичність": "from-rose-500 to-pink-600",
  "Форма і стійкість": "from-amber-500 to-orange-600",
  "Прояв і відповідальність": "from-red-500 to-orange-500",
};

function SwipeCard({
  question,
  onSwipe,
  isTop,
}: {
  question: ConsistencyQuestion;
  onSwipe: (answer: boolean) => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const yesOpacity = useTransform(x, [0, 100], [0, 1]);
  const noOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 100;
      if (info.offset.x > threshold) {
        animate(x, 500, { duration: 0.3 });
        setTimeout(() => onSwipe(true), 300);
      } else if (info.offset.x < -threshold) {
        animate(x, -500, { duration: 0.3 });
        setTimeout(() => onSwipe(false), 300);
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
      }
    },
    [onSwipe, x]
  );

  const gradientClass = blockColors[question.block] || "from-purple-500 to-pink-500";

  if (!isTop) {
    return (
      <motion.div
        className="absolute inset-0"
        style={{ scale: 0.95, y: 10 }}
      >
        <div className="w-full h-full rounded-3xl bg-card border shadow-lg" />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 cursor-grab active:cursor-grabbing touch-none"
      style={{ x, rotate, zIndex: 10 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full h-full rounded-3xl bg-card border shadow-2xl overflow-hidden flex flex-col relative">
        <motion.div
          className="absolute top-6 left-6 z-20 border-4 border-green-500 rounded-xl px-4 py-2 bg-green-500/10"
          style={{ opacity: yesOpacity, rotate: -12 }}
        >
          <span className="text-green-500 font-black text-2xl tracking-wider">ТАК</span>
        </motion.div>

        <motion.div
          className="absolute top-6 right-6 z-20 border-4 border-red-500 rounded-xl px-4 py-2 bg-red-500/10"
          style={{ opacity: noOpacity, rotate: 12 }}
        >
          <span className="text-red-500 font-black text-2xl tracking-wider">НІ</span>
        </motion.div>

        <div className={`bg-gradient-to-br ${gradientClass} p-6 pt-8`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{question.blockIcon}</span>
            <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
              {question.block}
            </Badge>
          </div>
          <div className="text-white/60 text-sm font-medium">
            Питання {question.id} / {consistencyQuestions.length}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 md:p-8">
          <p className="text-lg md:text-xl font-medium leading-relaxed text-center text-foreground">
            {question.question}
          </p>
        </div>

        <div className="p-6 flex items-center justify-center gap-8">
          <button
            onClick={() => {
              animate(x, -500, { duration: 0.3 });
              setTimeout(() => onSwipe(false), 300);
            }}
            className="w-16 h-16 rounded-full border-2 border-red-400 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors active:scale-90"
          >
            <X className="w-8 h-8 text-red-500" />
          </button>
          <button
            onClick={() => {
              animate(x, 500, { duration: 0.3 });
              setTimeout(() => onSwipe(true), 300);
            }}
            className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors active:scale-90"
          >
            <Heart className="w-8 h-8 text-green-500" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function QuizConsistency() {
  const { brandId } = useParams<{ brandId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const saveResultMutation = useMutation({
    mutationFn: async (data: { answers: Record<number, boolean>; totalScore: number; resultLevel: string }) => {
      return apiRequest("POST", `/api/brands/${brandId}/quiz-results`, {
        answers: data.answers,
        totalScore: data.totalScore,
        resultLevel: `consistency_${data.resultLevel}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "quiz-results"] });
    },
  });

  const handleSwipe = useCallback(
    (answer: boolean) => {
      const newAnswers = { ...answers, [consistencyQuestions[currentIndex].id]: answer };
      setAnswers(newAnswers);

      if (currentIndex < consistencyQuestions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        const yesCount = Object.values(newAnswers).filter(Boolean).length;
        const resultInfo = getResultInfo(yesCount);
        setShowResult(true);
        saveResultMutation.mutate({
          answers: newAnswers,
          totalScore: yesCount,
          resultLevel: resultInfo.level,
        });
      }
    },
    [currentIndex, answers, saveResultMutation]
  );

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setAnswers({});
    setShowResult(false);
  }, []);

  const yesCount = Object.values(answers).filter(Boolean).length;
  const noCount = Object.values(answers).filter((v) => v === false).length;
  const resultInfo = getResultInfo(yesCount);

  if (showResult) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className={`rounded-3xl bg-gradient-to-br ${resultInfo.gradient} p-1`}>
              <div className="rounded-[calc(1.5rem-4px)] bg-card p-6 space-y-6">
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    {resultInfo.emoji}
                  </motion.div>
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl font-bold mb-2"
                  >
                    {resultInfo.title}
                  </motion.h2>
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-4 text-sm text-muted-foreground"
                  >
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-green-500" /> {yesCount} Так
                    </span>
                    <span className="flex items-center gap-1">
                      <X className="h-4 w-4 text-red-500" /> {noCount} Ні
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="w-full bg-muted rounded-full h-3 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(yesCount / consistencyQuestions.length) * 100}%` }}
                      transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                      className="h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-right">
                    {yesCount} / {consistencyQuestions.length}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold">Діагноз</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{resultInfo.diagnosis}</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Фокус для росту</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{resultInfo.focus}</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                >
                  <Button onClick={handleRestart} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Пройти знову
                  </Button>
                  <Link href={`/quizzes/${brandId}`}>
                    <Button className="flex-1 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      Всі квізи
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const remaining = consistencyQuestions.length - currentIndex;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 p-4 md:p-8">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/quizzes/${brandId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Квізи
            </Button>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-green-600">
              <Heart className="h-3 w-3" /> {yesCount}
            </span>
            <span className="flex items-center gap-1 text-red-500">
              <X className="h-3 w-3" /> {noCount}
            </span>
          </div>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
            Консистентність і проявлення
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Свайпай вправо — Так, вліво — Ні</p>
        </div>

        <div className="relative w-full" style={{ height: "420px" }}>
          {remaining > 1 && (
            <motion.div
              className="absolute inset-0"
              style={{ scale: 0.95, y: 10, zIndex: 1 }}
            >
              <div className="w-full h-full rounded-3xl bg-card border shadow-lg opacity-60" />
            </motion.div>
          )}
          {remaining > 0 && (
            <SwipeCard
              key={currentIndex}
              question={consistencyQuestions[currentIndex]}
              onSwipe={handleSwipe}
              isTop={true}
            />
          )}
        </div>

        <div className="flex justify-center gap-1 mt-4 flex-wrap max-w-xs mx-auto">
          {consistencyQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx < currentIndex
                  ? answers[consistencyQuestions[idx].id]
                    ? "bg-green-500"
                    : "bg-red-400"
                  : idx === currentIndex
                  ? "bg-foreground w-4"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
