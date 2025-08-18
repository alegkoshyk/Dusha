import type { GameField, GameCard, GameFieldLevel, GameLevel } from "@shared/schema";

// Mobile game field configuration
export const brandGameField: GameField = {
  id: "soul-of-brand",
  name: "Душа Бренду",
  description: "Трансформаційна подорож створення вашого унікального бренду",
  levels: [
    {
      id: "soul",
      name: "Душа Бренду",
      description: "Відкрийте глибинну суть та цінності вашого бренду",
      color: "#8B5CF6", // Purple
      icon: "💜",
      position: { x: 0, y: 0 },
      cards: ["soul-start", "soul-values", "soul-mission", "soul-story", "soul-purpose", "soul-emotion"],
      unlockRequirements: {}
    },
    {
      id: "mind",
      name: "Розум Бренду", 
      description: "Розробіть стратегію та позиціонування бренду",
      color: "#3B82F6", // Blue
      icon: "🧠",
      position: { x: 0, y: 1 },
      cards: ["mind-start", "mind-audience", "mind-problem", "mind-solution", "mind-archetype", "mind-positioning", "mind-promise"],
      unlockRequirements: {
        previousLevel: "soul",
        cardsCompleted: 5
      }
    },
    {
      id: "body",
      name: "Тіло Бренду",
      description: "Втіліть бренд в конкретні продукти та дії",
      color: "#10B981", // Green
      icon: "💪",
      position: { x: 0, y: 2 },
      cards: ["body-start", "body-products", "body-channels", "body-tone", "body-visual", "body-action-plan", "body-resources"],
      unlockRequirements: {
        previousLevel: "mind",
        cardsCompleted: 6
      }
    }
  ]
};

// Enhanced mobile game cards with branching and positioning
export const mobileGameCards: GameCard[] = [
  // SOUL LEVEL CARDS
  {
    id: "soul-start",
    level: "soul",
    position: { x: 1, y: 0 },
    title: "Про Гру",
    description: "Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду.",
    shortDescription: "Інформація про гру",
    type: "info",
    difficulty: "easy",
    estimatedTime: 3,
    required: true,
    nextCards: [
      {
        cardId: "soul-values",
        label: "Розпочати гру"
      }
    ],
    rewards: {
      xp: 10,
      unlocks: ["soul-values"]
    }
  },
  
  {
    id: "soul-intro",
    level: "soul",
    position: { x: 2, y: 0 },
    title: "Про Гру",
    description: "Ця гра допоможе вам пройти через три рівні розвитку бренду: Душа (цінності), Розум (стратегія) та Тіло (втілення). Кожен рівень розкриває нові аспекти вашого бренду.",
    shortDescription: "Інформація про гру",
    type: "reflection",
    difficulty: "easy",
    estimatedTime: 3,
    required: false,
    nextCards: [
      {
        cardId: "soul-values",
        label: "Розпочати з цінностей"
      }
    ],
    rewards: {
      xp: 5,
      unlocks: ["soul-values"]
    }
  },

  {
    id: "soul-values",
    level: "soul",
    position: { x: 1, y: 1 },
    title: "Цінності Душі",
    description: "Оберіть 3-5 цінностей, які найкраще описують основу вашого бренду",
    shortDescription: "Основні цінності",
    hint: "Згадайте моменти, коли ви відчували найбільшу гордість за свою роботу",
    type: "values",
    difficulty: "medium",
    estimatedTime: 8,
    required: true,
    validation: {
      minSelections: 3,
      maxSelections: 5
    },
    options: [
      { id: "innovation", label: "Інноваційність", icon: "🚀", description: "Прагнення до нових рішень", color: "#8B5CF6" },
      { id: "honesty", label: "Чесність", icon: "🤝", description: "Відкритість та прозорість", color: "#3B82F6" },
      { id: "creativity", label: "Креативність", icon: "🎨", description: "Творчий підхід", color: "#EC4899" },
      { id: "quality", label: "Якість", icon: "⭐", description: "Високі стандарти", color: "#F59E0B" },
      { id: "helping", label: "Допомога", icon: "❤️", description: "Бажання допомагати", color: "#EF4444" },
      { id: "sustainability", label: "Екологічність", icon: "🌱", description: "Турбота про довкілля", color: "#10B981" },
      { id: "excellence", label: "Досконалість", icon: "💎", description: "Найкращі результати", color: "#6366F1" },
      { id: "reliability", label: "Надійність", icon: "🛡️", description: "Стабільність", color: "#64748B" },
      { id: "freedom", label: "Свобода", icon: "🕊️", description: "Незалежність", color: "#0EA5E9" },
      { id: "community", label: "Спільнота", icon: "👥", description: "Зв'язки між людьми", color: "#8B5CF6" }
    ],
    nextCards: [
      {
        condition: "values.length >= 4",
        cardId: "soul-deep-values",
        label: "Глибше дослідження цінностей"
      },
      {
        cardId: "soul-mission",
        label: "Перейти до місії"
      }
    ],
    rewards: {
      xp: 25,
      unlocks: ["soul-mission", "soul-deep-values"]
    }
  },

  {
    id: "soul-deep-values",
    level: "soul", 
    position: { x: 2, y: 1 },
    title: "Глибина Цінностей",
    description: "Розкажіть, як обрані цінності проявляються у вашій щоденній роботі",
    shortDescription: "Як живуть цінності",
    type: "reflection",
    difficulty: "medium",
    estimatedTime: 10,
    required: false,
    unlockRequirements: {
      responses: { "soul-values": { length: ">= 4" } }
    },
    validation: {
      minLength: 100,
      maxLength: 500
    },
    nextCards: [
      {
        cardId: "soul-mission",
        label: "До місії бренду"
      }
    ],
    rewards: {
      xp: 30,
      badges: ["values-explorer"]
    }
  },

  {
    id: "soul-mission",
    level: "soul",
    position: { x: 1, y: 2 },
    title: "Місія Душі",
    description: "Сформулюйте місію вашого бренду в одному реченні",
    shortDescription: "Місія бренду",
    hint: "Заради чого існує ваш бренд? Яку вищу мету він переслідує?",
    type: "text",
    difficulty: "hard",
    estimatedTime: 15,
    required: true,
    validation: {
      minLength: 20,
      maxLength: 200
    },
    nextCards: [
      {
        condition: "mission.includes('допомагати') || mission.includes('змінювати')",
        cardId: "soul-impact",
        label: "Дослідити вплив"
      },
      {
        cardId: "soul-story",
        label: "До історії бренду"
      }
    ],
    rewards: {
      xp: 35,
      unlocks: ["soul-story", "soul-impact"]
    }
  },

  {
    id: "soul-impact",
    level: "soul",
    position: { x: 2, y: 2 },
    title: "Вплив на Світ",
    description: "Як ваш бренд змінює світ на краще?",
    shortDescription: "Позитивний вплив",
    type: "reflection",
    difficulty: "medium",
    estimatedTime: 8,
    required: false,
    unlockRequirements: {
      responses: { "soul-mission": { pattern: "допомагати|змінювати|покращувати" } }
    },
    validation: {
      minLength: 50,
      maxLength: 300
    },
    nextCards: [
      {
        cardId: "soul-story",
        label: "Розказати історію"
      }
    ],
    rewards: {
      xp: 20,
      badges: ["world-changer"]
    }
  },

  {
    id: "soul-archetype",
    level: "soul",
    position: { x: 3, y: 1 },
    title: "Архетип Бренду",
    description: "Який архетип найкраще описує сутність вашого бренду?",
    shortDescription: "Виберіть архетип",
    hint: "Архетип визначає характер та поведінку вашого бренду в спілкуванні з аудиторією",
    type: "archetype",
    difficulty: "hard", 
    estimatedTime: 10,
    required: true,
    options: [
      { id: "innocent", label: "Невинний", icon: "🌟", description: "Оптимізм, довіра, чистота намірів" },
      { id: "sage", label: "Мудрець", icon: "🧠", description: "Знання, розуміння, істина" },
      { id: "explorer", label: "Дослідник", icon: "🌍", description: "Свобода, пригоди, автентичність" },
      { id: "hero", label: "Герой", icon: "⚡", description: "Мужність, майстерність, тріумф" },
      { id: "rebel", label: "Бунтар", icon: "🔥", description: "Революція, свобода, зміни" },
      { id: "magician", label: "Маг", icon: "✨", description: "Перетворення, візія, харизма" },
      { id: "everyman", label: "Простодушний", icon: "👥", description: "Належність, реалізм, емпатія" },
      { id: "lover", label: "Коханець", icon: "❤️", description: "Пристрасть, близькість, відданість" },
      { id: "jester", label: "Блазень", icon: "🎭", description: "Веселощі, легкість, момент" },
      { id: "caregiver", label: "Піклувальник", icon: "🤗", description: "Служіння, співчуття, щедрість" },
      { id: "ruler", label: "Правитель", icon: "👑", description: "Відповідальність, лідерство, контроль" },
      { id: "creator", label: "Творець", icon: "🎨", description: "Творчість, уява, артистизм" }
    ],
    validation: {
      minSelections: 1,
      maxSelections: 1
    },
    nextCards: [
      {
        cardId: "soul-purpose",
        label: "Визначити мету"
      }
    ],
    rewards: {
      xp: 40,
      badges: ["archetype-master"]
    }
  },

  {
    id: "soul-story",
    level: "soul",
    position: { x: 1, y: 3 },
    title: "Історія Бренду",
    description: "Розкажіть унікальну історію створення вашого бренду",
    shortDescription: "Історія створення",
    hint: "Що надихнуло вас? Які особисті переживання лежать в основі?",
    type: "reflection",
    difficulty: "hard",
    estimatedTime: 20,
    required: true,
    validation: {
      minLength: 100,
      maxLength: 800
    },
    nextCards: [
      {
        cardId: "soul-purpose",
        label: "Знайти призначення"
      }
    ],
    rewards: {
      xp: 40,
      unlocks: ["soul-purpose"]
    }
  },

  {
    id: "soul-purpose",
    level: "soul",
    position: { x: 1, y: 4 },
    title: "Призначення Бренду",
    description: "Яка глибинна потреба людей рухає вашим брендом?",
    shortDescription: "Глибинне призначення",
    hint: "Що ви даруєте світу, окрім продуктів чи послуг?",
    type: "reflection",
    difficulty: "hard",
    estimatedTime: 12,
    required: true,
    validation: {
      minLength: 50,
      maxLength: 400
    },
    nextCards: [
      {
        cardId: "soul-emotion",
        label: "Емоційна суть"
      }
    ],
    rewards: {
      xp: 35,
      unlocks: ["soul-emotion"]
    }
  },

  {
    id: "soul-emotion",
    level: "soul",
    position: { x: 1, y: 5 },
    title: "Емоційна Суть",
    description: "Яку головну емоцію має викликати ваш бренд?",
    shortDescription: "Емоція бренду",
    type: "choice",
    difficulty: "medium",
    estimatedTime: 5,
    required: true,
    options: [
      { id: "inspiration", label: "Натхнення", icon: "✨", description: "Мотивувати на великі справи", nextCard: "mind-start" },
      { id: "comfort", label: "Комфорт", icon: "🏠", description: "Безпека та затишок", nextCard: "mind-start" },
      { id: "excitement", label: "Захоплення", icon: "🎉", description: "Радість та адреналін", nextCard: "mind-start" },
      { id: "trust", label: "Довіра", icon: "🤲", description: "Впевненість та надійність", nextCard: "mind-start" },
      { id: "empowerment", label: "Розширення можливостей", icon: "💪", description: "Відчуття сили", nextCard: "mind-start" },
      { id: "peace", label: "Спокій", icon: "🧘", description: "Гармонія та рівновага", nextCard: "mind-start" }
    ],
    rewards: {
      xp: 30,
      unlocks: ["mind-start"],
      badges: ["soul-complete"]
    }
  },

  // MIND LEVEL CARDS
  {
    id: "mind-start",
    level: "mind",
    position: { x: 1, y: 0 },
    title: "Розум Бренду",
    description: "Вітаємо в другому рівні! Тепер ми розробимо стратегію вашого бренду",
    shortDescription: "Початок стратегії",
    type: "choice",
    difficulty: "easy",
    estimatedTime: 2,
    required: true,
    unlockRequirements: {
      previousCards: ["soul-emotion"]
    },
    options: [
      {
        id: "ready-strategy",
        label: "Готовий до стратегії!",
        icon: "🎯",
        description: "Почати розробку стратегії",
        nextCard: "mind-audience"
      }
    ],
    rewards: {
      xp: 15,
      unlocks: ["mind-audience"]
    }
  },

  {
    id: "mind-audience",
    level: "mind",
    position: { x: 1, y: 1 },
    title: "Цільова Аудиторія",
    description: "Створіть детальний портрет вашого ідеального клієнта",
    shortDescription: "Ідеальний клієнт",
    hint: "Дайте йому ім'я, опишіть день, мрії та страхи",
    type: "audience",
    difficulty: "medium",
    estimatedTime: 15,
    required: true,
    validation: {
      minLength: 100,
      maxLength: 600
    },
    nextCards: [
      {
        cardId: "mind-problem",
        label: "Знайти проблему"
      }
    ],
    rewards: {
      xp: 40,
      unlocks: ["mind-problem"]
    }
  },

  {
    id: "mind-problem",
    level: "mind",
    position: { x: 1, y: 2 },
    title: "Проблема Аудиторії",
    description: "Яку головну проблему вашої цільової аудиторії ви вирішуєте?",
    shortDescription: "Ключова проблема",
    hint: "Від чого страждають ваші клієнти?",
    type: "reflection",
    difficulty: "medium",
    estimatedTime: 10,
    required: true,
    validation: {
      minLength: 50,
      maxLength: 400
    },
    nextCards: [
      {
        cardId: "mind-solution",
        label: "Створити рішення"
      }
    ],
    rewards: {
      xp: 35,
      unlocks: ["mind-solution"]
    }
  },

  {
    id: "mind-solution",
    level: "mind",
    position: { x: 1, y: 3 },
    title: "Унікальне Рішення",
    description: "Як саме ваш бренд вирішує цю проблему?",
    shortDescription: "Ваше рішення",
    hint: "Що робить ваше рішення особливим?",
    type: "text",
    difficulty: "hard",
    estimatedTime: 15,
    required: true,
    validation: {
      minLength: 60,
      maxLength: 500
    },
    nextCards: [
      {
        cardId: "mind-archetype",
        label: "Обрати архетип"
      }
    ],
    rewards: {
      xp: 45,
      unlocks: ["mind-archetype"]
    }
  },

  {
    id: "mind-archetype",
    level: "mind",
    position: { x: 1, y: 4 },
    title: "Архетип Бренду",
    description: "Оберіть архетип, який найкраще описує особистість вашого бренду",
    shortDescription: "Особистість бренду",
    type: "archetype",
    difficulty: "medium",
    estimatedTime: 8,
    required: true,
    options: [
      { id: "innocent", label: "Невинний", icon: "👼", description: "Оптимістичний, чесний" },
      { id: "sage", label: "Мудрець", icon: "🧙‍♂️", description: "Інтелектуальний, духовний" },
      { id: "explorer", label: "Дослідник", icon: "🗺️", description: "Вільний, амбітний" },
      { id: "hero", label: "Герой", icon: "🦸", description: "Мужній, рішучий" },
      { id: "rebel", label: "Бунтар", icon: "⚡", description: "Революційний, дикий" },
      { id: "magician", label: "Маг", icon: "🔮", description: "Харизматичний, ідеалістичний" },
      { id: "everyman", label: "Звичайна людина", icon: "👤", description: "Реалістичний, дружелюбний" },
      { id: "lover", label: "Коханець", icon: "💕", description: "Пристрасний, романтичний" },
      { id: "jester", label: "Блазень", icon: "🤹", description: "Веселий, грайливий" },
      { id: "caregiver", label: "Піклувальник", icon: "🤗", description: "Турботливий, щедрий" },
      { id: "ruler", label: "Правитель", icon: "👑", description: "Лідер, аристократичний" },
      { id: "creator", label: "Творець", icon: "🎨", description: "Креативний, артистичний" }
    ],
    nextCards: [
      {
        cardId: "mind-positioning",
        label: "Позиціонування"
      }
    ],
    rewards: {
      xp: 30,
      unlocks: ["mind-positioning"]
    }
  },

  {
    id: "mind-positioning",
    level: "mind",
    position: { x: 1, y: 5 },
    title: "Позиціонування",
    description: "Яке місце займаєте серед конкурентів?",
    shortDescription: "Місце на ринку",
    type: "choice",
    difficulty: "medium",
    estimatedTime: 6,
    required: true,
    options: [
      { id: "premium", label: "Преміум", icon: "💎", description: "Висока якість, ексклюзивність" },
      { id: "accessible", label: "Доступний", icon: "🤝", description: "Демократичні ціни" },
      { id: "innovative", label: "Інноваційний", icon: "🚀", description: "Технологічний лідер" },
      { id: "reliable", label: "Надійний", icon: "🛡️", description: "Стабільність, довіра" },
      { id: "boutique", label: "Бутік", icon: "🌟", description: "Персональний підхід" },
      { id: "disruptor", label: "Революціонер", icon: "⚡", description: "Змінює правила гри" }
    ],
    nextCards: [
      {
        cardId: "mind-promise",
        label: "Обіцянка бренду"
      }
    ],
    rewards: {
      xp: 25,
      unlocks: ["mind-promise"]
    }
  },

  {
    id: "mind-promise",
    level: "mind",
    position: { x: 1, y: 6 },
    title: "Обіцянка Бренду",
    description: "Яку конкретну обіцянку ви даєте клієнтам?",
    shortDescription: "Гарантія результату",
    hint: "Має бути конкретною та вимірюваною",
    type: "text",
    difficulty: "hard",
    estimatedTime: 12,
    required: true,
    validation: {
      minLength: 30,
      maxLength: 250
    },
    nextCards: [
      {
        cardId: "body-start",
        label: "До втілення"
      }
    ],
    rewards: {
      xp: 40,
      unlocks: ["body-start"],
      badges: ["mind-complete"]
    }
  },

  // BODY LEVEL CARDS  
  {
    id: "body-start",
    level: "body",
    position: { x: 1, y: 0 },
    title: "Тіло Бренду",
    description: "Останній етап! Втілимо ваш бренд у конкретні дії та продукти",
    shortDescription: "Втілення бренду",
    type: "choice",
    difficulty: "easy",
    estimatedTime: 2,
    required: true,
    unlockRequirements: {
      previousCards: ["mind-promise"]
    },
    options: [
      {
        id: "ready-implementation",
        label: "Готовий втілювати!",
        icon: "🏗️",
        description: "Почати втілення бренду",
        nextCard: "body-products"
      }
    ],
    rewards: {
      xp: 15,
      unlocks: ["body-products"]
    }
  },

  {
    id: "body-products",
    level: "body",
    position: { x: 1, y: 1 },
    title: "Продукти та Послуги",
    description: "Перелічіть ключові продукти або послуги вашого бренду",
    shortDescription: "Що ви пропонуєте",
    hint: "Як вони втілюють цінності бренду?",
    type: "text",
    difficulty: "medium",
    estimatedTime: 12,
    required: true,
    validation: {
      minLength: 50,
      maxLength: 600
    },
    nextCards: [
      {
        cardId: "body-channels",
        label: "Канали комунікації"
      }
    ],
    rewards: {
      xp: 35,
      unlocks: ["body-channels"]
    }
  },

  {
    id: "body-channels",
    level: "body",
    position: { x: 1, y: 2 },
    title: "Канали Комунікації",
    description: "Оберіть канали для спілкування з аудиторією",
    shortDescription: "Де знайти клієнтів",
    type: "values",
    difficulty: "medium",
    estimatedTime: 8,
    required: true,
    validation: {
      minSelections: 2,
      maxSelections: 5
    },
    options: [
      { id: "website", label: "Веб-сайт", icon: "🌐", description: "Власний сайт" },
      { id: "social-media", label: "Соцмережі", icon: "📱", description: "Instagram, Facebook, LinkedIn" },
      { id: "email", label: "Email маркетинг", icon: "📧", description: "Розсилки" },
      { id: "content", label: "Контент", icon: "📝", description: "Блог, подкасти, відео" },
      { id: "events", label: "Події", icon: "🎪", description: "Конференції, воркшопи" },
      { id: "partnerships", label: "Партнерства", icon: "🤝", description: "Співпраця з брендами" },
      { id: "advertising", label: "Реклама", icon: "📺", description: "Платна реклама" },
      { id: "pr", label: "PR", icon: "📰", description: "Зв'язки з громадськістю" }
    ],
    nextCards: [
      {
        cardId: "body-tone",
        label: "Тон спілкування"
      }
    ],
    rewards: {
      xp: 30,
      unlocks: ["body-tone"]
    }
  },

  {
    id: "body-tone",
    level: "body",
    position: { x: 1, y: 3 },
    title: "Тон Спілкування",
    description: "Яким тоном ваш бренд спілкується з аудиторією?",
    shortDescription: "Стиль комунікації",
    type: "choice",
    difficulty: "easy",
    estimatedTime: 5,
    required: true,
    options: [
      { id: "friendly", label: "Дружелюбний", icon: "😊", description: "Теплий, як розмова з другом" },
      { id: "professional", label: "Професійний", icon: "👔", description: "Офіційний, експертний" },
      { id: "inspiring", label: "Надихаючий", icon: "✨", description: "Мотиваційний, енергійний" },
      { id: "caring", label: "Турботливий", icon: "🤗", description: "Емпатичний, підтримуючий" },
      { id: "bold", label: "Сміливий", icon: "⚡", description: "Впевнений, провокативний" },
      { id: "sophisticated", label: "Витончений", icon: "🎩", description: "Елегантний, культурний" }
    ],
    nextCards: [
      {
        cardId: "body-visual",
        label: "Візуальний стиль"
      }
    ],
    rewards: {
      xp: 20,
      unlocks: ["body-visual"]
    }
  },

  {
    id: "body-visual",
    level: "body",
    position: { x: 1, y: 4 },
    title: "Візуальний Стиль",
    description: "Опишіть візуальний стиль вашого бренду",
    shortDescription: "Дизайн бренду",
    hint: "Кольори, форми, настрій дизайну",
    type: "reflection",
    difficulty: "medium",
    estimatedTime: 10,
    required: true,
    validation: {
      minLength: 40,
      maxLength: 300
    },
    nextCards: [
      {
        cardId: "body-pricing",
        label: "Ціноутворення"
      }
    ],
    rewards: {
      xp: 25,
      unlocks: ["body-pricing"]
    }
  },

  {
    id: "body-pricing",
    level: "body",
    position: { x: 1, y: 5 },
    title: "Стратегія Цін",
    description: "Як ви будете ціноутворювати свої продукти?",
    shortDescription: "Ціноутворення",
    type: "choice",
    difficulty: "medium",
    estimatedTime: 7,
    required: true,
    options: [
      { id: "value-based", label: "За цінністю", icon: "💎", description: "Ціна відповідає користі" },
      { id: "competition-based", label: "За ринком", icon: "📊", description: "Орієнтир на конкурентів" },
      { id: "cost-plus", label: "Витрати + прибуток", icon: "📈", description: "Фіксований розмір прибутку" },
      { id: "penetration", label: "Проникнення", icon: "🎯", description: "Низькі ціни для захоплення ринку" },
      { id: "premium", label: "Преміум", icon: "👑", description: "Високі ціни за статус" },
      { id: "freemium", label: "Freemium", icon: "🆓", description: "Безкоштовна база + платні функції" }
    ],
    nextCards: [
      {
        cardId: "body-metrics",
        label: "Показники успіху"
      }
    ],
    rewards: {
      xp: 25,
      unlocks: ["body-metrics"]
    }
  },

  {
    id: "body-metrics",
    level: "body",
    position: { x: 1, y: 6 },
    title: "Показники Успіху",
    description: "Якими показниками ви будете вимірювати успіх бренду?",
    shortDescription: "KPI та метрики",
    type: "values",
    difficulty: "medium",
    estimatedTime: 8,
    required: true,
    validation: {
      minSelections: 3,
      maxSelections: 6
    },
    options: [
      { id: "revenue", label: "Дохід", icon: "💰", description: "Загальний обіг" },
      { id: "profit", label: "Прибуток", icon: "📈", description: "Чистий прибуток" },
      { id: "customers", label: "Клієнти", icon: "👥", description: "Кількість клієнтів" },
      { id: "retention", label: "Утримання", icon: "🔄", description: "Відсоток повернень" },
      { id: "satisfaction", label: "Задоволеність", icon: "😊", description: "NPS, відгуки" },
      { id: "awareness", label: "Впізнаваність", icon: "👁️", description: "Brand awareness" },
      { id: "market-share", label: "Частка ринку", icon: "🏆", description: "Позиція на ринку" },
      { id: "social-impact", label: "Соціальний вплив", icon: "🌍", description: "Користь для суспільства" }
    ],
    nextCards: [
      {
        cardId: "body-launch",
        label: "План запуску"
      }
    ],
    rewards: {
      xp: 30,
      unlocks: ["body-launch"]
    }
  },

  {
    id: "body-launch",
    level: "body",
    position: { x: 1, y: 7 },
    title: "План Запуску",
    description: "Опишіть перші кроки для запуску вашого бренду",
    shortDescription: "Перші дії",
    hint: "Що зробите в перші 30-90 днів?",
    type: "text",
    difficulty: "hard",
    estimatedTime: 15,
    required: true,
    validation: {
      minLength: 100,
      maxLength: 500
    },
    nextCards: [
      {
        cardId: "body-complete",
        label: "Завершити гру"
      }
    ],
    rewards: {
      xp: 50,
      unlocks: ["body-complete"]
    }
  },

  {
    id: "body-complete",
    level: "body",
    position: { x: 1, y: 8 },
    title: "Ваш Бренд Готовий!",
    description: "Вітаємо! Ви створили повну стратегію свого бренду",
    shortDescription: "Завершення гри",
    type: "completion",
    difficulty: "easy",
    estimatedTime: 3,
    required: true,
    options: [
      {
        id: "celebrate",
        label: "Святкувати успіх!",
        icon: "🎉",
        description: "Ваш бренд готовий до запуску",
        nextCard: null
      }
    ],
    rewards: {
      xp: 100,
      badges: ["brand-master", "game-complete"],
      completesGame: true
    }
  }
];

// Helper functions for mobile game
export const getGameCard = (cardId: string): GameCard | undefined => {
  return mobileGameCards.find(card => card.id === cardId);
};

export const getCardsForLevel = (level: GameLevel): GameCard[] => {
  return mobileGameCards.filter(card => card.level === level);
};

export const getUnlockedCards = (completedCards: string[], responses: Record<string, any>): string[] => {
  const unlocked = new Set<string>(['soul-start']); // Start with first card
  
  // Add cards unlocked by rewards from completed cards
  for (const completedCardId of completedCards) {
    const completedCard = getGameCard(completedCardId);
    if (completedCard?.rewards?.unlocks) {
      completedCard.rewards.unlocks.forEach(cardId => unlocked.add(cardId));
    }
  }
  
  // Check each card for unlock requirements
  for (const card of mobileGameCards) {
    // Skip if already unlocked
    if (unlocked.has(card.id)) continue;
    
    // Check if card requirements are met
    if (card.unlockRequirements) {
      const { previousCards, responses: requiredResponses } = card.unlockRequirements;
      
      let canUnlock = true;
      
      // Check previous cards requirement
      if (previousCards && !previousCards.every(cardId => completedCards.includes(cardId))) {
        canUnlock = false;
      }
      
      // Check response requirements
      if (canUnlock && requiredResponses) {
        for (const [cardId, requirement] of Object.entries(requiredResponses)) {
          if (!responses[cardId] || !checkResponseRequirement(responses[cardId], requirement)) {
            canUnlock = false;
            break;
          }
        }
      }
      
      if (canUnlock) {
        unlocked.add(card.id);
      }
    } else {
      // If no requirements, unlock it (for basic progression)
      unlocked.add(card.id);
    }
  }
  
  return Array.from(unlocked);
};

export const getNextCardOptions = (currentCardId: string, responses: Record<string, any>): string[] => {
  const card = getGameCard(currentCardId);
  if (!card) return [];
  
  // Check for branching paths
  if (card.nextCards) {
    for (const nextOption of card.nextCards) {
      if (!nextOption.condition || evaluateCondition(nextOption.condition, responses)) {
        return [nextOption.cardId];
      }
    }
  }
  
  // Check option-based next cards
  if (card.options) {
    const response = responses[currentCardId];
    if (response && typeof response === 'string') {
      const option = card.options.find(opt => opt.id === response);
      if (option?.nextCard) {
        return [option.nextCard];
      }
    }
  }
  
  return [];
};

export const calculateTotalXP = (completedCards: string[]): number => {
  return completedCards.reduce((total, cardId) => {
    const card = getGameCard(cardId);
    return total + (card?.rewards?.xp || 0);
  }, 0);
};

export const getEarnedBadges = (completedCards: string[]): string[] => {
  const badges = new Set<string>();
  
  for (const cardId of completedCards) {
    const card = getGameCard(cardId);
    if (card?.rewards?.badges) {
      card.rewards.badges.forEach(badge => badges.add(badge));
    }
  }
  
  return Array.from(badges);
};

// Utility functions
function checkResponseRequirement(response: any, requirement: any): boolean {
  if (typeof requirement === 'object' && requirement.length) {
    return Array.isArray(response) && response.length >= parseInt(requirement.length.replace('>= ', ''));
  }
  if (typeof requirement === 'object' && requirement.pattern) {
    return typeof response === 'string' && new RegExp(requirement.pattern).test(response);
  }
  return true;
}

function evaluateCondition(condition: string, responses: Record<string, any>): boolean {
  try {
    // Simple condition evaluation for demo
    // In production, use a proper expression evaluator
    return eval(condition.replace(/(\w+)/g, (match) => {
      return responses[match] ? JSON.stringify(responses[match]) : 'null';
    }));
  } catch {
    return false;
  }
}