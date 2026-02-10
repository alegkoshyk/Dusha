import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, RotateCcw, Heart, X, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";

interface SoulQuestion {
  id: number;
  block: string;
  blockIcon: string;
  question: string;
}

const soulQuestions: SoulQuestion[] = [
  { id: 1, block: "Зв'язок із Собою", blockIcon: "🔥", question: "Чи відчуваю я себе достатньо добре, щоб довіряти своєму внутрішньому баченню, навіть коли ніхто не розуміє мене?" },
  { id: 2, block: "Зв'язок із Собою", blockIcon: "🔥", question: "Чи я знаю, що для мене — істинне, а що — маска, яку я надягаю, щоб «відповідати»?" },
  { id: 3, block: "Зв'язок із Собою", blockIcon: "🔥", question: "Чи дозволяю я собі бути вразливим(ою) у присутності інших, якщо це служить правді мого бренду?" },
  { id: 4, block: "Сутність і Сенс", blockIcon: "🌀", question: "Чи маю я щось, що пережив(ла), і вважаю, що це варто трансформувати у продукт або послання?" },
  { id: 5, block: "Сутність і Сенс", blockIcon: "🌀", question: "Чи можу я сказати: «Я несу людям щось більше, ніж просто послугу/товар — я ділюся досвідом, енергією, ідеєю»?" },
  { id: 6, block: "Сутність і Сенс", blockIcon: "🌀", question: "Чи відчуваю я, що суть того, що я хочу створити, вже є в мені — залишилось тільки їй дати форму?" },
  { id: 7, block: "Тінь і Страх", blockIcon: "🪞", question: "Чи зустрічався я зі страхом бути смішним, непрофесійним або «недостатньо добрим», коли починав говорити від себе?" },
  { id: 8, block: "Тінь і Страх", blockIcon: "🪞", question: "Чи можу я чесно сказати, що я не продаю себе — я ділюся собою?" },
  { id: 9, block: "Тінь і Страх", blockIcon: "🪞", question: "Чи готовий(а) я визнати, що частину свого шляху я йшов(ла), граючи роль, яка не моя?" },
  { id: 10, block: "Намір і Готовність", blockIcon: "🎯", question: "Чи я хочу, щоб мій бренд мав місію, навіть якщо це означає довший шлях?" },
  { id: 11, block: "Намір і Готовність", blockIcon: "🎯", question: "Чи я готовий(а) дати собі час і простір, щоб народити не просто «продукт», а живий, цілісний прояв?" },
  { id: 12, block: "Намір і Готовність", blockIcon: "🎯", question: "Чи я готовий(а) пройти період сумнівів, хаосу, трансформацій, аби вийти на автентичний бренд?" },
  { id: 13, block: "Свобода прояву", blockIcon: "🕊", question: "Чи вірю я, що прояв моєї душі — це не слабкість, а моя справжня сила?" },
  { id: 14, block: "Свобода прояву", blockIcon: "🕊", question: "Чи готовий(а) я говорити не лише «що я роблю», а «чому я тут» — навіть якщо це незручно?" },
];

interface ResultInfo {
  level: string;
  title: string;
  emoji: string;
  description: string;
  recommendation: string;
  gradient: string;
}

function getResultInfo(yesCount: number): ResultInfo {
  if (yesCount >= 12) {
    return {
      level: "ready",
      title: "ТИ ГОТОВИЙ(А) ЙТИ ГЛИБОКО",
      emoji: "🔥",
      description: "У тебе відкритий канал прояву, але головне — ти вже чуєш себе.",
      recommendation: "Не зупиняйся на логіці, не спрощуй — твій бренд уже живий, дозволь йому розгорнутись.",
      gradient: "from-amber-500/20 to-orange-500/20",
    };
  } else if (yesCount >= 8) {
    return {
      level: "threshold",
      title: "НА ПОРОЗІ СПРАВЖНЬОГО",
      emoji: "🌱",
      description: "Є зв'язок, є біль, є сенс — але ще є частини, де ти себе стримуєш або боїшся.",
      recommendation: "Пропрацюй бар'єри. Дай собі простір і глибше увійди в енергію місії.",
      gradient: "from-green-500/20 to-emerald-500/20",
    };
  } else if (yesCount >= 4) {
    return {
      level: "searching",
      title: "ПОКИ ЩО ШУКАЄШ СЕБЕ",
      emoji: "🌀",
      description: "Ти відчуваєш поклик, але все ще більше в голові, ніж у серці. Бренд може бути красивим, але не наповненим.",
      recommendation: "Не поспішай із формою. Почни з внутрішньої архітектури: хто я, чому, навіщо?",
      gradient: "from-blue-500/20 to-indigo-500/20",
    };
  } else {
    return {
      level: "beginning",
      title: "ТИ ЩЕ НЕ В СОБІ",
      emoji: "🌑",
      description: "Ти або ще не дозволив(ла) собі відчути глибину, або тримаєшся за старі ролі. Це не критика — це маркер.",
      recommendation: "Не починай бренд. Почни шлях до себе. Він найперший.",
      gradient: "from-purple-500/20 to-slate-500/20",
    };
  }
}

const blockColors: Record<string, string> = {
  "Зв'язок із Собою": "from-orange-500 to-red-500",
  "Сутність і Сенс": "from-indigo-500 to-purple-500",
  "Тінь і Страх": "from-slate-500 to-gray-700",
  "Намір і Готовність": "from-amber-500 to-yellow-600",
  "Свобода прояву": "from-sky-400 to-blue-500",
};

function SwipeCard({
  question,
  onSwipe,
  isTop,
}: {
  question: SoulQuestion;
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
            Питання {question.id} / {soulQuestions.length}
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

export default function QuizSoul() {
  const { brandId } = useParams<{ brandId: string }>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, boolean>>({});
  const [showResult, setShowResult] = useState(false);

  const saveResultMutation = useMutation({
    mutationFn: async (data: { answers: Record<number, boolean>; totalScore: number; resultLevel: string }) => {
      return apiRequest("POST", `/api/brands/${brandId}/quiz-results`, {
        answers: data.answers,
        totalScore: data.totalScore,
        resultLevel: `soul_${data.resultLevel}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "quiz-results"] });
    },
  });

  const handleSwipe = useCallback(
    (answer: boolean) => {
      const newAnswers = { ...answers, [soulQuestions[currentIndex].id]: answer };
      setAnswers(newAnswers);

      if (currentIndex < soulQuestions.length - 1) {
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
                      animate={{ width: `${(yesCount / soulQuestions.length) * 100}%` }}
                      transition={{ delay: 1, duration: 1.2, ease: "easeOut" }}
                      className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-right">
                    {yesCount} / {soulQuestions.length}
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
                  className="bg-muted/50 rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="font-semibold text-sm">Рекомендація</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{resultInfo.recommendation}</p>
                </motion.div>

                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.6 }}
                  className="flex flex-col sm:flex-row gap-3 pt-2"
                >
                  <Button onClick={handleRestart} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Пройти знову
                  </Button>
                  <Link href={`/quizzes/${brandId}`}>
                    <Button className="flex-1 w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
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

  const remaining = soulQuestions.length - currentIndex;

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
          <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
            Готовність до Бренду з Душею
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
              question={soulQuestions[currentIndex]}
              onSwipe={handleSwipe}
              isTop={true}
            />
          )}
        </div>

        <div className="flex justify-center gap-1 mt-4 flex-wrap max-w-xs mx-auto">
          {soulQuestions.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all ${
                idx < currentIndex
                  ? answers[soulQuestions[idx].id]
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
