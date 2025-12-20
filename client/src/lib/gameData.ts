// Local game card type for static game data
export type StaticGameLevel = "soul" | "mind" | "body";

export interface StaticGameCard {
  id: string;
  level: StaticGameLevel;
  order: number;
  title: string;
  description: string;
  hint?: string;
  type: "text" | "choice" | "values" | "reflection" | "completion" | "archetype";
  required: boolean;
  validation?: {
    minLength?: number;
    maxLength?: number;
    minSelections?: number;
    maxSelections?: number;
  };
  options?: Array<{
    id: string;
    label: string;
    icon: string;
    description: string;
  }>;
}

// Game cards data based on the Ukrainian brand transformation guide
export const gameCards: StaticGameCard[] = [
  // SOUL LEVEL CARDS (Душа бренду)
  {
    id: "soul-values",
    level: "soul",
    order: 1,
    title: "Цінності Душі",
    description: "Які три цінності найкраще описують основу вашого бренду? Подумайте про те, що справді важливо для вас і вашої місії.",
    hint: "Згадайте моменти, коли ви відчували найбільшу гордість за свою роботу. Які цінності ви проявляли в ці моменти?",
    type: "values",
    required: true,
    validation: {
      minSelections: 1,
      maxSelections: 3,
    },
    options: [
      { id: "innovation", label: "Інноваційність", icon: "🚀", description: "Прагнення до нових рішень та технологій" },
      { id: "honesty", label: "Чесність", icon: "🤝", description: "Відкритість та прозорість у всіх діях" },
      { id: "creativity", label: "Креативність", icon: "🎨", description: "Творчий підхід до вирішення задач" },
      { id: "quality", label: "Якість", icon: "⭐", description: "Високі стандарти в усьому, що робимо" },
      { id: "helping", label: "Допомога", icon: "❤️", description: "Бажання допомагати іншим людям" },
      { id: "sustainability", label: "Екологічність", icon: "🌱", description: "Турбота про довкілля та майбутнє" },
      { id: "excellence", label: "Досконалість", icon: "💎", description: "Прагнення до найкращих результатів" },
      { id: "reliability", label: "Надійність", icon: "🛡️", description: "Стабільність та передбачуваність" },
      { id: "freedom", label: "Свобода", icon: "🕊️", description: "Незалежність та автономія" },
      { id: "community", label: "Спільнота", icon: "👥", description: "Створення зв'язків між людьми" },
      { id: "wisdom", label: "Мудрість", icon: "📚", description: "Глибокі знання та розуміння" },
      { id: "beauty", label: "Краса", icon: "🌸", description: "Естетика та гармонія" },
    ],
  },
  {
    id: "soul-mission",
    level: "soul",
    order: 2,
    title: "Місія Душі",
    description: "Сформулюйте місію вашого бренду. Заради чого існує ваш бренд? Яку вищу мету він переслідує в світі?",
    hint: "Уявіть, що ваш бренд звертається до світу зі словами: 'Наше призначення – ...' Яку проблему ви прагнете вирішити?",
    type: "text",
    required: true,
    validation: {
      minLength: 20,
      maxLength: 200,
    },
  },
  {
    id: "soul-story",
    level: "soul",
    order: 3,
    title: "Історія Бренду",
    description: "Розкажіть унікальну історію свого бренду. Що надихнуло вас на створення цього проекту? Які особисті переживання лежать в основі?",
    hint: "Найкращі історії брендів - це особисті історії засновників. Поділіться тим моментом, коли ви зрозуміли своє призначення.",
    type: "reflection",
    required: true,
    validation: {
      minLength: 50,
      maxLength: 500,
    },
  },
  {
    id: "soul-purpose",
    level: "soul",
    order: 4,
    title: "Призначення Бренду",
    description: "Яка глибинна потреба людей рухає вашим брендом? Що ви даруєте світу, окрім продуктів чи послуг?",
    hint: "Подумайте не про те, що ви продаєте, а про те, що ви змінюєте в житті людей. Яку емоцію чи відчуття ви створюєте?",
    type: "reflection",
    required: true,
    validation: {
      minLength: 30,
      maxLength: 300,
    },
  },
  {
    id: "soul-emotion",
    level: "soul",
    order: 5,
    title: "Емоційна Суть",
    description: "Яку головну емоцію має викликати ваш бренд у людей? Як люди мають себе відчувати, взаємодіючи з вами?",
    type: "choice",
    required: true,
    options: [
      { id: "inspiration", label: "Натхнення", icon: "✨", description: "Мотивувати людей на великі справи" },
      { id: "comfort", label: "Комфорт", icon: "🏠", description: "Створювати відчуття безпеки та затишку" },
      { id: "excitement", label: "Захоплення", icon: "🎉", description: "Приносити радість та адреналін" },
      { id: "trust", label: "Довіра", icon: "🤲", description: "Викликати впевненість та надійність" },
      { id: "empowerment", label: "Розширення можливостей", icon: "💪", description: "Давати людям відчуття сили" },
      { id: "peace", label: "Спокій", icon: "🧘", description: "Приносити гармонію та рівновагу" },
    ],
  },

  // MIND LEVEL CARDS (Розум бренду)
  {
    id: "mind-audience",
    level: "mind",
    order: 1,
    title: "Цільова Аудиторія",
    description: "Опишіть вашого ідеального клієнта. Хто ця людина? Якого віку, статі, професії? Які в неї потреби та болі?",
    hint: "Створіть детальний портрет однієї конкретної людини. Дайте їй ім'я, опишіть її день, мрії та страхи.",
    type: "text",
    required: true,
    validation: {
      minLength: 50,
      maxLength: 400,
    },
  },
  {
    id: "mind-problem",
    level: "mind",
    order: 2,
    title: "Проблема Аудиторії",
    description: "Яку головну проблему вашої цільової аудиторії ви вирішуєте? Чому це важливо для них?",
    hint: "Найкращі бренди вирішують реальні, болючі проблеми. Подумайте, від чого страждають ваші клієнти.",
    type: "reflection",
    required: true,
    validation: {
      minLength: 30,
      maxLength: 300,
    },
  },
  {
    id: "mind-solution",
    level: "mind",
    order: 3,
    title: "Унікальне Рішення",
    description: "Як саме ваш бренд вирішує цю проблему? Що робить ваше рішення особливим та відмінним від конкурентів?",
    type: "text",
    required: true,
    validation: {
      minLength: 40,
      maxLength: 350,
    },
  },
  {
    id: "mind-archetype",
    level: "mind",
    order: 4,
    title: "Архетип Бренду",
    description: "Який архетип найкраще описує особистість вашого бренду? Це допоможе визначити тон комунікації.",
    type: "archetype",
    required: true,
    options: [
      { id: "innocent", label: "Невинний", icon: "👼", description: "Чарівний, оптимістичний, чесний. Прагне бути щасливим." },
      { id: "sage", label: "Мудрець", icon: "🧙‍♂️", description: "Допитливий, інтелектуальний, духовний. Прагне зрозуміти світ." },
      { id: "explorer", label: "Дослідник", icon: "🗺️", description: "Вільний, амбітний, піонер. Прагне знайти себе через подорожі." },
      { id: "hero", label: "Герой", icon: "🦸", description: "Мужній, рішучий, почесний. Прагне довести свою цінність." },
      { id: "rebel", label: "Бунтар", icon: "⚡", description: "Революційний, дикий, руйнівний. Прагне змінити світ." },
      { id: "magician", label: "Маг", icon: "🔮", description: "Харизматичний, уявний, ідеалістичний. Прагне зрозуміти закони всесвіту." },
      { id: "everyman", label: "Звичайна людина", icon: "👤", description: "Реалістичний, емпатичний, дружелюбний. Прагне належати." },
      { id: "lover", label: "Коханець", icon: "💕", description: "Пристрасний, відданий, романтичний. Прагне знайти і дарувати кохання." },
      { id: "jester", label: "Блазень", icon: "🤹", description: "Веселий, безтурботний, грайливий. Прагне насолоджуватися життям." },
      { id: "caregiver", label: "Піклувальник", icon: "🤗", description: "Турботливий, щедрий, співчутливий. Прагне допомагати іншим." },
      { id: "ruler", label: "Правитель", icon: "👑", description: "Відповідальний, лідер, аристократичний. Прагне контролювати." },
      { id: "creator", label: "Творець", icon: "🎨", description: "Креативний, уявний, артистичний. Прагне створити щось цінне." },
    ],
  },
  {
    id: "mind-positioning",
    level: "mind",
    order: 5,
    title: "Позиціонування",
    description: "Як ви хочете, щоб вас сприймали на ринку? Яке місце займаєте серед конкурентів?",
    type: "choice",
    required: true,
    options: [
      { id: "premium", label: "Преміум", icon: "💎", description: "Висока якість, ексклюзивність, статус" },
      { id: "accessible", label: "Доступний", icon: "🤝", description: "Демократичні ціни, для широкої аудиторії" },
      { id: "innovative", label: "Інноваційний", icon: "🚀", description: "Технологічний лідер, новаторські рішення" },
      { id: "reliable", label: "Надійний", icon: "🛡️", description: "Стабільність, довіра, перевірена якість" },
      { id: "boutique", label: "Бутік", icon: "🌟", description: "Персональний підхід, унікальність, крафт" },
      { id: "disruptor", label: "Революціонер", icon: "⚡", description: "Руйнує стандарти, змінює правила гри" },
    ],
  },
  {
    id: "mind-promise",
    level: "mind",
    order: 6,
    title: "Обіцянка Бренду",
    description: "Яку конкретну обіцянку ви даєте своїм клієнтам? Що вони гарантовано отримають, звернувшись до вас?",
    hint: "Обіцянка має бути конкретною, вимірюваною та такою, яку ви можете виконати. Наприклад: 'Зекономимо вам 2 години щодня'.",
    type: "text",
    required: true,
    validation: {
      minLength: 20,
      maxLength: 200,
    },
  },

  // BODY LEVEL CARDS (Тіло бренду)
  {
    id: "body-products",
    level: "body",
    order: 1,
    title: "Продукти та Послуги",
    description: "Перелічіть ваші ключові продукти або послуги. Як вони втілюють цінності та місію вашого бренду?",
    type: "text",
    required: true,
    validation: {
      minLength: 30,
      maxLength: 400,
    },
  },
  {
    id: "body-channels",
    level: "body",
    order: 2,
    title: "Канали Комунікації",
    description: "Через які канали ви будете спілкуватися зі своєю аудиторією?",
    type: "values",
    required: true,
    validation: {
      minSelections: 2,
      maxSelections: 5,
    },
    options: [
      { id: "website", label: "Веб-сайт", icon: "🌐", description: "Власний сайт з повною інформацією" },
      { id: "social-media", label: "Соціальні мережі", icon: "📱", description: "Instagram, Facebook, LinkedIn, TikTok" },
      { id: "email", label: "Email маркетинг", icon: "📧", description: "Розсилки та персональні повідомлення" },
      { id: "content", label: "Контент маркетинг", icon: "📝", description: "Блог, подкасти, відео" },
      { id: "events", label: "Події", icon: "🎪", description: "Конференції, воркшопи, зустрічі" },
      { id: "partnerships", label: "Партнерства", icon: "🤝", description: "Співпраця з іншими брендами" },
      { id: "advertising", label: "Реклама", icon: "📺", description: "Платна реклама в медіа" },
      { id: "pr", label: "PR", icon: "📰", description: "Зв'язки з громадськістю, ЗМІ" },
      { id: "direct", label: "Прямі продажі", icon: "💬", description: "Особисті зустрічі, телефонні дзвінки" },
    ],
  },
  {
    id: "body-tone",
    level: "body",
    order: 3,
    title: "Тон Спілкування",
    description: "Яким тоном ваш бренд спілкується з аудиторією? Це впливає на всі тексти та комунікацію.",
    type: "choice",
    required: true,
    options: [
      { id: "friendly", label: "Дружелюбний", icon: "😊", description: "Теплий, доступний, як розмова з другом" },
      { id: "professional", label: "Професійний", icon: "👔", description: "Офіційний, експертний, ділový" },
      { id: "inspiring", label: "Надихаючий", icon: "✨", description: "Мотиваційний, енергійний, позитивний" },
      { id: "caring", label: "Турботливий", icon: "🤗", description: "Емпатичний, підтримуючий, розуміючий" },
      { id: "bold", label: "Сміливий", icon: "⚡", description: "Впевнений, рішучий, провокативний" },
      { id: "sophisticated", label: "Витончений", icon: "🎩", description: "Елегантний, розумний, культурний" },
    ],
  },
  {
    id: "body-visual-style",
    level: "body",
    order: 4,
    title: "Візуальний Стиль",
    description: "Опишіть візуальний стиль вашого бренду. Які кольори, форми, настрій передаватиме ваш дизайн?",
    hint: "Подумайте про емоції, які має викликати ваш дизайн. Він має бути спокійним чи енергійним? Мінімалістичним чи деталізованим?",
    type: "reflection",
    required: true,
    validation: {
      minLength: 40,
      maxLength: 300,
    },
  },
  {
    id: "body-first-steps",
    level: "body",
    order: 5,
    title: "Перші Кроки",
    description: "Якими будуть ваші три перші конкретні кроки для реалізації бренду? Що ви зробите в найближчий місяць?",
    type: "text",
    required: true,
    validation: {
      minLength: 50,
      maxLength: 400,
    },
  },
  {
    id: "body-resources",
    level: "body",
    order: 6,
    title: "Необхідні Ресурси",
    description: "Які ресурси (людські, фінансові, технічні) знадобляться для втілення вашого бренду?",
    type: "reflection",
    required: false,
    validation: {
      minLength: 20,
      maxLength: 300,
    },
  },
];

// Helper functions for game logic
export const getCardsByLevel = (level: StaticGameLevel): StaticGameCard[] => {
  return gameCards.filter(card => card.level === level).sort((a, b) => a.order - b.order);
};

export const getCardById = (cardId: string): StaticGameCard | undefined => {
  return gameCards.find(card => card.id === cardId);
};

export const getCardByLevelAndOrder = (level: StaticGameLevel, order: number): StaticGameCard | undefined => {
  return gameCards.find(card => card.level === level && card.order === order);
};

export const getNextCard = (currentCard: StaticGameCard): StaticGameCard | null => {
  const levelCards = getCardsByLevel(currentCard.level);
  const currentIndex = levelCards.findIndex(card => card.id === currentCard.id);
  
  if (currentIndex < levelCards.length - 1) {
    return levelCards[currentIndex + 1];
  }
  
  // Move to next level
  const nextLevel = getNextLevel(currentCard.level);
  if (nextLevel) {
    const nextLevelCards = getCardsByLevel(nextLevel);
    return nextLevelCards[0] || null;
  }
  
  return null;
};

export const getPreviousCard = (currentCard: StaticGameCard): StaticGameCard | null => {
  const levelCards = getCardsByLevel(currentCard.level);
  const currentIndex = levelCards.findIndex(card => card.id === currentCard.id);
  
  if (currentIndex > 0) {
    return levelCards[currentIndex - 1];
  }
  
  // Move to previous level
  const previousLevel = getPreviousLevel(currentCard.level);
  if (previousLevel) {
    const previousLevelCards = getCardsByLevel(previousLevel);
    return previousLevelCards[previousLevelCards.length - 1] || null;
  }
  
  return null;
};

export const getNextLevel = (currentLevel: StaticGameLevel): StaticGameLevel | null => {
  switch (currentLevel) {
    case "soul": return "mind";
    case "mind": return "body";
    case "body": return null;
    default: return null;
  }
};

export const getPreviousLevel = (currentLevel: StaticGameLevel): StaticGameLevel | null => {
  switch (currentLevel) {
    case "body": return "mind";
    case "mind": return "soul";
    case "soul": return null;
    default: return null;
  }
};

export const calculateProgress = (responses: Record<string, any>): number => {
  const totalCards = gameCards.length;
  const completedCards = Object.keys(responses).length;
  return Math.round((completedCards / totalCards) * 100);
};

export const getLevelProgress = (level: StaticGameLevel, responses: Record<string, any>): number => {
  const levelCards = getCardsByLevel(level);
  const completedCards = levelCards.filter(card => responses[card.id]).length;
  return Math.round((completedCards / levelCards.length) * 100);
};
