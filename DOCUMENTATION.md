# Душа Бренду — Повна Технічна Документація

## Зміст

1. [Огляд проекту](#огляд-проекту)
2. [Стек технологій](#стек-технологій)
3. [Структура проекту](#структура-проекту)
4. [Змінні оточення](#змінні-оточення)
5. [Локальний запуск](#локальний-запуск)
6. [База даних](#база-даних)
7. [Архітектура](#архітектура)
8. [API маршрути](#api-маршрути)
9. [Аутентифікація](#аутентифікація)
10. [AI інтеграції](#ai-інтеграції)
11. [Файлове сховище (Cloudflare R2)](#файлове-сховище-cloudflare-r2)
12. [Платіжна система](#платіжна-система)
13. [Мобільний додаток (Capacitor)](#мобільний-додаток-capacitor)
14. [Фронтенд](#фронтенд)
15. [Адмін-панель](#адмін-панель)
16. [Функціональні модулі](#функціональні-модулі)

---

## Огляд проекту

**Душа Бренду** (Brand Soul) — трансформаційна гра для підприємців і маркетологів. Допомагає побудувати ідентичність бренду через інтерактивну подорож трьома рівнями:

- **Душа** — цінності, місія, історія
- **Розум** — стратегія, позиціонування, аудиторія
- **Тіло** — реалізація, продукти, канали

Результат: комплексна карта бренду (Brand Map), яку можна експортувати в PDF.

---

## Стек технологій

### Frontend
| Технологія | Версія | Призначення |
|---|---|---|
| React | 18.3 | UI фреймворк |
| TypeScript | 5.6 | Типізація |
| Vite | 5.4 | Збірка та HMR |
| Tailwind CSS | 3.4 | Стилізація |
| shadcn/ui + Radix UI | — | Компонентна бібліотека |
| Wouter | 3.3 | Маршрутизація |
| TanStack Query | 5.x | Серверний стейт |
| React Hook Form + Zod | — | Форми та валідація |
| Framer Motion | 11.x | Анімації |
| tldraw | 4.x | Візуальне полотно |
| Lucide React | — | Іконки |

### Backend
| Технологія | Версія | Призначення |
|---|---|---|
| Node.js | 20.x | Рантайм |
| Express.js | 4.21 | HTTP сервер |
| TypeScript | 5.6 | Типізація |
| Drizzle ORM | 0.39 | ORM для PostgreSQL |
| Neon Serverless | 0.10 | PostgreSQL драйвер |
| express-session | 1.18 | Сесії |
| connect-pg-simple | 10.x | Сесії в PostgreSQL |
| bcryptjs | 3.x | Хешування паролів |
| OpenAI SDK | 6.x | AI генерація |
| @google/genai | 1.x | Gemini AI |
| @anthropic-ai/sdk | 0.71 | Claude AI |
| @aws-sdk/client-s3 | 3.x | Cloudflare R2 (S3-compatible) |
| jsPDF | 3.x | PDF експорт |

### Інфраструктура
| Сервіс | Призначення |
|---|---|
| PostgreSQL (Neon) | Основна БД |
| Cloudflare R2 | Зберігання медіа-файлів |
| Monobank API | Платежі (UAH) |
| NanoBanana API | Генерація/апскейл зображень |

---

## Структура проекту

```
/
├── client/                        # Frontend (React + Vite)
│   ├── index.html                 # HTML entry point
│   └── src/
│       ├── App.tsx                # Головний роутер
│       ├── index.css              # Глобальні стилі + CSS vars
│       ├── main.tsx               # Entry point
│       ├── components/
│       │   ├── ui/                # shadcn/ui компоненти (~50 файлів)
│       │   ├── auth/              # LoginForm.tsx, RegisterForm.tsx
│       │   ├── brands/            # CreateBrandDialog, EditBrandDialog, BrandSelector, BrandColorPicker
│       │   ├── game/              # GameCard, GameHeader, BrandMapPreview, FloatingActions, etc.
│       │   ├── mobile/            # BottomNav, GameCard (mobile), GameField
│       │   ├── progress/          # LevelProgress
│       │   ├── Header.tsx         # Desktop навігація
│       │   ├── ThemeToggle.tsx    # Перемикач темної теми
│       │   ├── BrandSoulLogo.tsx  # Лого
│       │   ├── BrandSoulSpinner.tsx # Спінер завантаження
│       │   ├── OnboardingModal.tsx # Онбординг
│       │   ├── UserDropdown.tsx   # Дропдаун користувача
│       │   ├── ProductDialog.tsx  # Діалог продукту
│       │   ├── ProductDetailDialog.tsx
│       │   ├── ProductPersonasDialog.tsx
│       │   ├── ProductPersonasPreview.tsx
│       │   ├── PersonaDetailCard.tsx
│       │   └── CreateSegmentDialog.tsx
│       ├── contexts/
│       │   └── ThemeContext.tsx    # Dark/light theme provider
│       ├── hooks/
│       │   ├── useAuth.ts         # Хук аутентифікації
│       │   ├── useAdminAuth.ts    # Хук адмін-авторизації
│       │   ├── useBrands.ts       # Хук роботи з брендами
│       │   ├── useDeepLinks.ts    # Deep links для мобілки
│       │   ├── useMobile.ts       # Визначення мобільного пристрою
│       │   ├── use-mobile.tsx     # Медіа-запити
│       │   └── use-toast.ts       # Тост-повідомлення
│       ├── lib/
│       │   ├── queryClient.ts     # TanStack Query config + apiRequest helpers
│       │   ├── utils.ts           # cn(), resolveMediaUrl(), etc.
│       │   ├── platform.ts        # Визначення платформи (web/ios/android)
│       │   ├── gameData.ts        # Дані гри (десктоп)
│       │   ├── mobileGameData.ts  # Дані гри (мобілка)
│       │   └── pdfExport.ts       # PDF генерація
│       └── pages/
│           ├── dashboard.tsx      # Головна сторінка
│           ├── auth.tsx           # Авторизація
│           ├── brands.tsx         # Список брендів
│           ├── brand-edit.tsx     # Паспорт бренду
│           ├── brand-chat.tsx     # AI чат бренду (2500+ рядків)
│           ├── brand-canvas.tsx   # tldraw полотно (обгортка)
│           ├── brand-canvas-editor.tsx # tldraw компонент
│           ├── brand-board.tsx    # Карта бренду
│           ├── brand-maps.tsx     # Список карт
│           ├── brand-analysis.tsx # AI аналіз бренду
│           ├── game.tsx           # Класична гра
│           ├── mobile-game.tsx    # Мобільна гра
│           ├── results.tsx        # Результати
│           ├── products.tsx       # Продукти бренду
│           ├── target-audience.tsx # Цільова аудиторія
│           ├── agents.tsx         # AI агенти
│           ├── briefs.tsx         # Конструктор брифів
│           ├── brief-public.tsx   # Публічний бриф
│           ├── brief-responses.tsx # Відповіді на бриф
│           ├── name-generator.tsx # AI генератор назв
│           ├── media-library.tsx  # Медіа-бібліотека
│           ├── quiz.tsx           # Квіз "Де Я?"
│           ├── quiz-soul.tsx      # Квіз "Готовність до Бренду з Душею"
│           ├── quiz-consistency.tsx # Квіз "Консистентність"
│           ├── quizzes.tsx        # Список квізів
│           ├── pricing.tsx        # Тарифні плани
│           ├── PaymentCallback.tsx # Callback оплати
│           ├── profile.tsx        # Профіль
│           ├── settings.tsx       # Налаштування
│           ├── home.tsx           # Landing page
│           ├── not-found.tsx      # 404
│           └── admin/
│               ├── AdminDashboard.tsx    # Адмін головна
│               ├── CardsManagement.tsx   # Управління картками
│               ├── CardTypes.tsx         # Типи карток
│               ├── CardOptionSets.tsx    # Набори опцій
│               ├── OptionsList.tsx       # Список опцій
│               ├── Users.tsx            # Користувачі
│               ├── Settings.tsx         # Налаштування AI
│               ├── SubscriptionPlans.tsx # Тарифні плани
│               ├── Transactions.tsx     # Транзакції
│               ├── BrandAnalysisSettings.tsx
│               ├── BrandAnalysisTemplates.tsx
│               ├── BrandSpace.tsx
│               ├── VisualMap.tsx
│               └── DatabaseSync.tsx
│
├── server/                        # Backend (Express + TypeScript)
│   ├── index.ts                   # Entry point, Express setup, middleware
│   ├── routes.ts                  # ВСІ API маршрути (~9400 рядків)
│   ├── storage.ts                 # IStorage інтерфейс + DatabaseStorage (~3500 рядків)
│   ├── db.ts                      # Neon PostgreSQL підключення
│   ├── auth.ts                    # Сесії, requireAuth middleware, token auth
│   ├── oauthProviders.ts          # Google OAuth, Apple Sign-In
│   ├── openai.ts                  # AI функції (OpenAI, Gemini, Anthropic) (~1700 рядків)
│   ├── r2Storage.ts               # Cloudflare R2 сервіс (upload/download/delete)
│   ├── objectStorage.ts           # GCS (Legacy, тільки для міграції)
│   ├── nanobanana.ts              # NanoBanana API (генерація/апскейл зображень)
│   ├── monobank.ts                # Monobank Acquiring API
│   ├── billingScheduler.ts        # Перевірка підписок за розкладом
│   ├── encryption.ts              # AES шифрування API ключів
│   ├── migrate-to-r2.ts           # Скрипт міграції GCS → R2
│   ├── vite.ts                    # Vite dev server integration
│   └── replit_integrations/       # Replit-specific AI integrations
│       ├── chat/                  # Chat integration (index.ts, routes.ts, storage.ts)
│       ├── image/                 # Image generation (client.ts, index.ts, routes.ts)
│       └── batch/                 # Batch processing (index.ts, utils.ts)
│
├── shared/                        # Shared types (frontend + backend)
│   ├── schema.ts                  # Drizzle ORM схема + Zod schemas (~1800 рядків)
│   └── models/
│       └── chat.ts                # Chat types
│
├── migrations/                    # Drizzle міграції (автогенеровані)
│   ├── 0000_parched_sinister_six.sql
│   └── meta/
├── scripts/
│   └── create-admin.js            # Скрипт створення адміна
├── assets/                        # Статичні ресурси
├── attached_assets/               # Завантажені ассети
├── android/                       # Capacitor Android проект
├── ios/                           # Capacitor iOS проект
├── tests/                         # Тести
│
├── package.json                   # Dependencies + scripts
├── tsconfig.json                  # TypeScript config
├── vite.config.ts                 # Vite config (aliases: @, @shared, @assets)
├── drizzle.config.ts              # Drizzle Kit config
├── tailwind.config.ts             # Tailwind + dark mode + shadcn/ui
├── postcss.config.js              # PostCSS
├── capacitor.config.ts            # Capacitor mobile config
├── components.json                # shadcn/ui config
└── .replit                        # Replit config
```

---

## Змінні оточення

### Обов'язкові (без них проект не запуститься)

```env
# PostgreSQL — рядок підключення
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### AI Провайдери (потрібен хоча б один для AI-функцій)

```env
# OpenAI (основний AI провайдер — GPT-4o)
OPENAI_API_KEY=sk-...

# Google Gemini (альтернативний — gemini-2.0-flash)
AI_INTEGRATIONS_GEMINI_API_KEY=...
AI_INTEGRATIONS_GEMINI_BASE_URL=...

# Anthropic Claude (альтернативний)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (для пошуку)
PERPLEXITY_API_KEY=pplx-...
```

### Аутентифікація (OAuth, опціонально)

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Apple Sign-In
APPLE_CLIENT_ID=...       # Service ID (наприклад site.brandsoul)
APPLE_TEAM_ID=...         # 10-символьний Team ID
APPLE_KEY_ID=...          # Key ID з Apple Developer Console
APPLE_PRIVATE_KEY=...     # PEM формат ES256 ключ (повний текст з -----BEGIN/END-----)

# Сесії (якщо не задано, використовується дефолтний ключ)
SESSION_SECRET=your-random-secret-string-at-least-32-chars
```

### Cloudflare R2 (файлове сховище, опціонально)

```env
R2_ACCOUNT_ID=...              # Cloudflare Account ID
R2_ACCESS_KEY_ID=...           # R2 API Token Access Key
R2_SECRET_ACCESS_KEY=...       # R2 API Token Secret Key
R2_BUCKET_NAME=...             # Назва бакету
R2_PUBLIC_URL=https://...      # Публічний URL бакету (якщо є Custom Domain)
```

### Monobank (платежі, опціонально)

```env
MONOBANK_TOKEN=...             # Token з Monobank Acquiring
PAYMENT_SANDBOX_MODE=true      # true = тестовий режим, false = бойовий
```

### tldraw (візуальне полотно, опціонально)

```env
VITE_TLDRAW_LICENSE_KEY=...    # Фронтенд змінна (prefix VITE_)
```

### Системні

```env
NODE_ENV=development           # development | production
PORT=5000                      # Порт сервера (за замовчуванням 5000)
```

---

## Локальний запуск

### Передумови

- **Node.js** >= 20.x (рекомендовано LTS)
- **PostgreSQL** >= 16 (локально або віддалено: Neon, Supabase, Railway, Docker)
- **npm** (поставляється з Node.js)
- **Git**

### Крок 1: Клонування та встановлення залежностей

```bash
git clone <repository-url>
cd brand-soul
npm install
```

Якщо є проблеми з optional dependencies (bufferutil):
```bash
npm install --ignore-optional
```

### Крок 2: PostgreSQL

#### Варіант A: Локальний PostgreSQL

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16
createdb brandsoul

# Ubuntu/Debian
sudo apt install postgresql-16
sudo -u postgres createdb brandsoul
```

#### Варіант B: Docker PostgreSQL

```bash
docker run -d \
  --name brandsoul-db \
  -e POSTGRES_DB=brandsoul \
  -e POSTGRES_USER=brandsoul \
  -e POSTGRES_PASSWORD=brandsoul \
  -p 5432:5432 \
  postgres:16

# DATABASE_URL=postgresql://brandsoul:brandsoul@localhost:5432/brandsoul
```

#### Варіант C: Neon (хмарний, безкоштовний)

1. Зареєструватися на https://neon.tech
2. Створити проект
3. Скопіювати connection string

### Крок 3: Налаштування `.env`

Створіть файл `.env` в корені проекту:

```env
# === ОБОВ'ЯЗКОВО ===
DATABASE_URL=postgresql://user:password@localhost:5432/brandsoul

# === AI (потрібен хоча б один для AI-функцій) ===
OPENAI_API_KEY=sk-...

# === РЕКОМЕНДОВАНО ===
SESSION_SECRET=my-super-secret-random-string-change-me

# === ОПЦІОНАЛЬНО (додати за потреби) ===
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
# R2_ACCOUNT_ID=...
# R2_ACCESS_KEY_ID=...
# R2_SECRET_ACCESS_KEY=...
# R2_BUCKET_NAME=...
# R2_PUBLIC_URL=...
# MONOBANK_TOKEN=...
# PAYMENT_SANDBOX_MODE=true
```

### Крок 4: Ініціалізація бази даних

```bash
npm run db:push
```

Це створить усі таблиці автоматично. Drizzle Kit порівнює схему з `shared/schema.ts` і синхронізує з базою.

Якщо є конфлікти:
```bash
npm run db:push --force
```

### Крок 5: Створення адмін-користувача

#### Варіант A: Через скрипт

```bash
node scripts/create-admin.js
```

#### Варіант B: Через UI + SQL

1. Зареєструватися через http://localhost:5000 (email/password)
2. Задати роль адміна:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

### Крок 6: Запуск

```bash
npm run dev
```

Це запустить:
- **Express сервер** на порту 5000 (API)
- **Vite dev server** з HMR (фронтенд, через middleware)

Відкрийте **http://localhost:5000** в браузері.

### Крок 7: Seed даних (необов'язково)

При першому запуску сервер автоматично засіває:
- 3 тарифних плани (free, pro, premium)
- 12 преміум-фіч
- 8 категорій типів аудиторій

Картки гри потрібно створити через адмін-панель (`/rcadmin/cards`).

---

## Збірка та деплой

### Збірка

```bash
npm run build
```

Створює:
- `dist/public/` — зібраний фронтенд (Vite)
- `dist/index.js` — зібраний бекенд (esbuild, ESM)

### Запуск продакшену

```bash
NODE_ENV=production npm run start
```

### Перевірка типів

```bash
npm run check
```

---

## База даних

### Підключення (server/db.ts)

```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

// В production використовує PRODUCTION_DATABASE_URL, інакше DATABASE_URL
const databaseUrl = isProduction && process.env.PRODUCTION_DATABASE_URL 
  ? process.env.PRODUCTION_DATABASE_URL 
  : process.env.DATABASE_URL;

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });
```

Драйвер `@neondatabase/serverless` сумісний із звичайним PostgreSQL — для локальної розробки не потрібен спеціальний сервер.

### Основні таблиці

| Таблиця | Призначення | PK тип |
|---|---|---|
| `users` | Користувачі (email, password hash, role, subscription) | UUID |
| `user_profiles` | Профілі (avatar, bio, locale, onboarding) | UUID |
| `user_brands` | Бренди (назва, опис, лого, кольори, тон, цінності) | UUID |
| `game_levels` | Рівні гри (Душа, Розум, Тіло) | UUID |
| `game_cards` | Картки гри (питання, описи, підказки) | UUID |
| `card_properties` | Властивості карток | UUID |
| `card_relations` | Зв'язки між картками | UUID |
| `game_sessions` | Ігрові сесії | UUID |
| `card_responses` | Відповіді на картки | UUID |
| `card_option_sets` | Набори опцій (архетипи, цінності, канали) | UUID |
| `card_option_items` | Елементи опцій | UUID |
| `brand_chats` | Чат-треди бренду (name, agentId, productIds, audienceIds) | UUID |
| `brand_chat_messages` | Повідомлення чатів (role, content, imageUrl) | UUID |
| `products` | Продукти бренду | UUID |
| `agents` | AI агенти | UUID |
| `target_audiences` | Цільові аудиторії | UUID |
| `audience_segments` | Сегменти аудиторій | UUID |
| `brand_name_sessions` | Сесії генератора назв | UUID |
| `brand_name_results` | Результати генерації назв | UUID |
| `briefs` | Брифи | UUID |
| `brief_fields` | Поля брифів | UUID |
| `brief_responses` | Відповіді на брифи | UUID |
| `quiz_results` | Результати квізів | UUID |
| `subscription_plans` | Тарифні плани | UUID |
| `premium_features` | Преміум-функції | UUID |
| `payment_transactions` | Транзакції | UUID |
| `app_settings` | Налаштування додатку (key-value) | serial |
| `sessions` | Express сесії (автостворення) | varchar |

### Drizzle ORM паттерн

Кожна таблиця в `shared/schema.ts` має:

```typescript
// 1. Таблиця
export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash"),
  role: varchar("role", { length: 50 }).default("user"),
  // ...
});

// 2. Зв'язки (relations)
export const usersRelations = relations(usersTable, ({ one, many }) => ({
  profile: one(userProfilesTable, { ... }),
  brands: many(userBrandsTable),
}));

// 3. Insert schema (Zod валідація)
export const insertUserSchema = createInsertSchema(usersTable)
  .omit({ id: true, createdAt: true });

// 4. Types
export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
```

### Команди БД

```bash
npm run db:push          # Синхронізація схеми → БД (рекомендовано)
npm run db:push --force  # Примусова синхронізація (при конфліктах)
```

---

## Архітектура

### Загальна схема

```
Browser / Mobile App (Capacitor)
    │
    ├── Vite Dev Server (HMR, static files) ← тільки в dev
    │
    ▼
Express Server (port 5000)
    │
    ├── Middleware: session, json parser, logging
    │
    ├── /api/auth/*      → auth.ts, oauthProviders.ts
    ├── /api/user/*       → routes.ts → storage.ts → PostgreSQL
    ├── /api/brands/*     → routes.ts → storage.ts → PostgreSQL
    ├── /api/brand-chats/* → routes.ts → storage.ts → PostgreSQL + openai.ts
    ├── /api/r2/*         → r2Storage.ts → Cloudflare R2
    ├── /api/payments/*   → monobank.ts → Monobank API
    ├── /api/admin/*      → routes.ts (requireAdmin) → storage.ts
    │
    ├── AI calls (server/openai.ts):
    │   ├── OpenAI API (GPT-4o, GPT-4o-mini)
    │   ├── Google Gemini (gemini-2.0-flash)
    │   ├── Anthropic Claude (claude-sonnet)
    │   └── Fallback chain: OpenAI → Gemini → Anthropic
    │
    ├── Image generation (server/nanobanana.ts):
    │   └── NanoBanana API (text-to-image, upscale)
    │
    └── Static files / Vite middleware
```

### Storage паттерн

`server/storage.ts` — єдина точка доступу до БД. Ніколи не пишіть SQL напряму в маршрутах.

```typescript
// Інтерфейс (~100+ методів)
export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Brands
  getUserBrands(userId: string): Promise<UserBrand[]>;
  createBrand(brand: InsertUserBrand): Promise<UserBrand>;
  updateBrand(id: string, updates: Partial<UserBrand>): Promise<UserBrand>;
  deleteBrand(id: string): Promise<void>;
  
  // Brand Chats
  getBrandChats(brandId: string, userId: string): Promise<BrandChat[]>;
  createBrandChat(chat: InsertBrandChat): Promise<BrandChat>;
  updateBrandChat(id: string, updates: Partial<BrandChat>): Promise<BrandChat>;
  deleteBrandChat(id: string): Promise<void>;
  
  // ... Products, Audiences, Agents, Sessions, Cards, etc.
}

export class DatabaseStorage implements IStorage {
  // Реалізація всіх методів через Drizzle ORM
}

export const storage = new DatabaseStorage();
```

### Потік запиту

```
1. Client: apiRequestJson('POST', '/api/brands/123/products', { name: 'Widget' })
2. Express: router.post('/api/brands/:brandId/products', requireAuth, handler)
3. Handler: validates body with Zod → calls storage.createProduct(...)
4. Storage: db.insert(productsTable).values(data).returning()
5. Handler: returns JSON response
6. Client: TanStack Query invalidates cache → UI updates
```

---

## API маршрути

Усі маршрути визначені в `server/routes.ts` (~9400 рядків). Захищені через `requireAuth` middleware.

### Аутентифікація `/api/auth`

| Метод | URL | Опис | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Реєстрація (email, password, name) | - |
| POST | `/api/auth/login` | Вхід (email, password) | - |
| POST | `/api/auth/logout` | Вихід | - |
| GET | `/api/auth/me` | Поточний користувач | + |
| POST | `/api/auth/google` | Google OAuth callback | - |
| POST | `/api/auth/apple` | Apple Sign-In callback | - |

### Користувач `/api/user`

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/user/profile` | Профіль |
| PATCH | `/api/user/profile` | Оновити профіль |
| GET | `/api/user/brands` | Бренди |
| POST | `/api/user/brands` | Створити бренд |
| GET | `/api/user/stats` | Статистика |
| GET | `/api/user/game-sessions` | Ігрові сесії |

### Бренди `/api/brands`

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/brands/:id` | Отримати бренд |
| PATCH | `/api/brands/:id` | Оновити бренд |
| DELETE | `/api/brands/:id` | Видалити бренд |
| GET | `/api/brands/:id/passport` | Повний паспорт бренду |

### Чат бренду `/api/brand-chats`

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/brands/:brandId/brand-chats` | Список чатів бренду |
| POST | `/api/brands/:brandId/brand-chats` | Створити чат |
| PATCH | `/api/brand-chats/:chatId` | Оновити (ім'я, контекст: agentId, productIds, audienceIds) |
| DELETE | `/api/brand-chats/:chatId` | Видалити чат |
| GET | `/api/brand-chats/:chatId/messages` | Повідомлення чату |
| POST | `/api/brand-chats/:chatId/messages` | Надіслати повідомлення (AI відповідь) |

### Продукти `/api/products`

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/brands/:brandId/products` | Список |
| POST | `/api/brands/:brandId/products` | Створити |
| PATCH | `/api/products/:id` | Оновити |
| DELETE | `/api/products/:id` | Видалити |
| POST | `/api/brands/:brandId/generate-product` | AI генерація |

### Цільова аудиторія

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/brands/:brandId/target-audiences` | Список |
| POST | `/api/brands/:brandId/target-audiences` | Створити |
| GET/PATCH/DELETE | `/api/target-audiences/:id` | CRUD |
| GET/POST | `/api/target-audiences/:audienceId/segments` | Сегменти |
| PATCH/DELETE | `/api/audience-segments/:id` | CRUD сегменту |
| POST | `/api/brands/:brandId/generate-persona` | AI генерація персони |

### AI Агенти `/api/agents`

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/agents` | Список |
| POST | `/api/agents` | Створити |
| PATCH | `/api/agents/:id` | Оновити |
| DELETE | `/api/agents/:id` | Видалити |
| POST | `/api/generate-agent` | AI генерація |

### Генератор назв `/api/name-generator`

| Метод | URL | Опис |
|---|---|---|
| POST | `/api/name-generator/generate` | Генерувати назви (brief → AI → domain/social checks) |
| POST | `/api/name-generator/generate-more/:sessionId` | Додаткова генерація в існуючу сесію |
| POST | `/api/name-generator/analyze/:sessionId` | Детальний AI аналіз (trademark, linguistic) |
| GET | `/api/name-generator/sessions` | Історія сесій |
| GET | `/api/name-generator/sessions/:id` | Сесія з результатами |
| PATCH | `/api/name-generator/results/:id/favorite` | Toggle обране |
| DELETE | `/api/name-generator/sessions/:id` | Видалити сесію |

### Брифи `/api/briefs`

| Метод | URL | Опис |
|---|---|---|
| GET/POST | `/api/briefs` | Список / створити |
| GET/PATCH/DELETE | `/api/briefs/:id` | CRUD |
| GET | `/api/brands/:brandId/briefs` | Брифи бренду |
| GET | `/api/briefs/:id/responses` | Відповіді на бриф |
| POST | `/api/briefs/generate` | AI генерація структури |
| GET | `/api/public/brief/:slug` | Публічний доступ (без auth) |
| POST | `/api/public/brief/:slug/verify` | Перевірка пароля |
| POST | `/api/public/brief/:slug/submit` | Відправка відповіді |

### Квізи

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/brands/:brandId/quiz-results` | Усі результати |
| GET | `/api/brands/:brandId/quiz-results/latest` | Останній результат |
| POST | `/api/brands/:brandId/quiz-results` | Зберегти результат |

### Гра

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/levels` | Рівні |
| GET | `/api/cards` | Картки |
| GET/POST | `/api/game-sessions` | Список / створити сесію |
| GET | `/api/game-sessions/:id` | Деталі сесії |
| POST | `/api/card-responses` | Зберегти відповідь |

### Файли (R2) `/api/r2`

| Метод | URL | Опис |
|---|---|---|
| POST | `/api/r2/upload` | Завантажити (base64 або multipart) |
| GET | `/api/r2/:key(*)` | Отримати файл (проксі) |
| DELETE | `/api/r2/:key(*)` | Видалити файл |

### Платежі `/api/payments`

| Метод | URL | Опис |
|---|---|---|
| POST | `/api/payments/create` | Створити інвойс Monobank |
| POST | `/api/payments/webhook` | Webhook від Monobank |
| GET | `/api/payments/:invoiceId/status` | Статус оплати |

### Адмін `/api/admin` (requireAdmin)

| Метод | URL | Опис |
|---|---|---|
| GET | `/api/admin/settings` | Налаштування |
| PATCH | `/api/admin/settings` | Оновити (AI контексти, промпти) |
| GET | `/api/admin/users` | Список користувачів |
| PATCH | `/api/admin/users/:id` | Оновити (роль, підписка) |
| GET | `/api/admin/payments` | Транзакції |
| POST | `/api/admin/migrate-media-urls` | Міграція медіа GCS→R2 |

---

## Аутентифікація

### Способи входу

1. **Email/Password** — bcryptjs хешування, сесія в PostgreSQL
2. **Google OAuth 2.0** — через `google-auth-library`, verifyIdToken
3. **Apple Sign-In** — JWT client secret з ES256 підписом (DER→raw conversion)
4. **Token-based** — для iPad/Safari/mobile, зберігається в localStorage

### Сесії (server/auth.ts)

```typescript
export const sessionMiddleware = session({
  store: new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key",
  cookie: {
    secure: isProduction,          // HTTPS в production
    httpOnly: false,               // false для iPad сумісності
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 днів
    sameSite: isProduction ? "none" : "lax",
  },
});
```

### Middleware

```typescript
// Перевірка аутентифікації (session або token)
requireAuth(req, res, next)

// Перевірка адмін-ролі
requireAdmin(req, res, next)
```

### Файли

| Файл | Опис |
|---|---|
| `server/auth.ts` | Session config, requireAuth, requireAdmin, token auth |
| `server/oauthProviders.ts` | Google/Apple OAuth (registerOAuthRoutes) |
| `client/src/hooks/useAuth.ts` | React хук (login, register, logout, user state) |
| `client/src/pages/auth.tsx` | UI сторінка входу/реєстрації |

---

## AI інтеграції

### Файл: `server/openai.ts` (~1700 рядків)

### Провайдери та fallback

```
Пріоритет: OpenAI (GPT-4o) → Gemini (gemini-2.0-flash) → Anthropic (Claude)

isAIConfigured()   → перевірка наявності хоча б одного ключа
isOpenAIConfigured() → перевірка OpenAI конкретно
```

### Основні AI функції

| Функція | Вхід | Вихід |
|---|---|---|
| `sendBrandChatMessage()` | Повідомлення + контекст бренду | AI відповідь |
| `generateBrandInsights()` | Дані бренду | JSON аналіз |
| `analyzeBrandLevel()` | Рівень + відповіді | JSON рекомендації |
| `generateCardResponse()` | Картка + контекст | Текстова відповідь |
| `generateAudiencePersona()` | Бренд + параметри | JSON персони |
| `generateSegmentData()` | Аудиторія + параметри | JSON сегменту |
| `generateProductData()` | Бренд + параметри | JSON продукту |
| `generateAgentData()` | Бренд + параметри | JSON агента |
| `generateQuickBrandNames()` | Brief (ніша, тон, ЦА) | JSON масив назв |
| `generateBrandNames()` | Brief + повний аналіз | JSON з scores |
| `analyzeBrandName()` | Назва + brief | JSON (trademark, linguistic) |

### JSON парсинг

Усі AI відповіді обробляються через:

```typescript
function cleanJsonResponse(text: string): string {
  // Знімає ```json ... ``` markdown обгортку
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
  if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}
```

### NanoBanana API (server/nanobanana.ts)

- Text-to-image генерація
- Апскейл зображень
- Асинхронна модель: create task → poll status → get result
- Зберігає результат в R2

---

## Файлове сховище (Cloudflare R2)

### Файл: `server/r2Storage.ts`

S3-сумісний клієнт через `@aws-sdk/client-s3`.

### Функції

```typescript
uploadToR2(data, key, contentType)  → R2 proxy URL
downloadFromR2(key)                 → Buffer + contentType
deleteFromR2(key)                   → void
isR2Configured()                    → boolean
```

### Структура бакету

```
bucket/
├── canvas/{brandId}/data.json         # tldraw дані
├── chat-images/{sessionId}/{ts}.ext   # Згенеровані зображення
├── logos/{brandId}/{uuid}.ext         # Логотипи
├── avatars/{userId}/{uuid}.ext        # Аватари
├── products/{productId}/{uuid}.ext    # Зображення продуктів
├── templates/{templateId}/{uuid}.ext  # Шаблони
├── chat/{userId}/{uuid}.ext           # Завантажені в чат
├── merch/{brandId}/{uuid}.ext         # Мерч мокапи
└── attachments/{userId}/{uuid}.ext    # Вкладення
```

### URL формат

БД зберігає проксі URL: `/api/r2/{key}` — backend проксює до R2. На фронтенді `resolveMediaUrl()` з `lib/utils.ts` резолвить URL.

---

## Платіжна система

### Monobank Acquiring (server/monobank.ts)

| Параметр | Значення |
|---|---|
| Валюта | UAH (копійки) |
| Sandbox | `PAYMENT_SANDBOX_MODE=true` |
| Webhook | `POST /api/payments/webhook` |
| Верифікація | X-Sign header (dev: дозволено без підпису) |

### Потік оплати

```
1. User обирає план → POST /api/payments/create
2. Backend створює інвойс в Monobank → повертає pageUrl
3. User переходить на сторінку оплати Monobank
4. Після оплати → Monobank POST /api/payments/webhook
5. Backend оновлює підписку користувача
6. User повертається на /payment/callback
```

### Тарифні плани

| План | Slug | Опис |
|---|---|---|
| Безкоштовний | free | Базові функції |
| Професійний | pro | AI чат, брифи, квізи |
| Преміум | premium | Усі функції |

---

## Мобільний додаток (Capacitor)

### Конфігурація (capacitor.config.ts)

```typescript
{
  appId: 'site.brandsoul',
  appName: 'Душа Бренду',
  webDir: 'dist/public',   // Збірка Vite
  plugins: {
    SplashScreen: { launchShowDuration: 2000, launchAutoHide: true },
    StatusBar: { style: 'dark', backgroundColor: '#ffffff' },
  }
}
```

### Збірка

```bash
npm run build          # 1. Збірка web
npx cap sync           # 2. Синхронізація з нативними проектами
npx cap open ios       # 3a. Відкрити в Xcode (потрібен Mac)
npx cap open android   # 3b. Відкрити в Android Studio
```

### Визначення платформи (client/src/lib/platform.ts)

```typescript
isNativeApp()      // Capacitor native
isIOSApp()         // iOS
isAndroidApp()     // Android
isWebApp()         // Браузер
```

### Платіжна стратегія

- **iOS**: Apple In-App Purchase (вимога Apple)
- **Android/Web**: Monobank

---

## Фронтенд

### Маршрутизація (client/src/App.tsx)

Використовує **Wouter** для client-side routing:

| Шлях | Компонент | Опис |
|---|---|---|
| `/` | Dashboard | Головна з тайлами |
| `/brands` | Brands | Список брендів |
| `/brand-chat/brand/:brandId` | BrandChat | AI чат |
| `/brand-edit/:brandId` | BrandEdit | Паспорт бренду |
| `/products/:brandId` | Products | Продукти |
| `/target-audience/:brandId` | TargetAudience | ЦА |
| `/agents` | Agents | AI агенти |
| `/canvas/:brandId` | BrandCanvas | tldraw |
| `/brand-analysis/:brandId` | BrandAnalysis | AI аналіз |
| `/name-generator` | NameGenerator | Генератор назв |
| `/briefs/:brandId` | Briefs | Конструктор |
| `/brief/:slug` | BriefPublic | Публічний бриф (без auth) |
| `/quizzes/:brandId` | Quizzes | Список квізів |
| `/quiz/:brandId` | Quiz | "Де Я?" |
| `/quiz-soul/:brandId` | QuizSoul | "Душа" |
| `/quiz-consistency/:brandId` | QuizConsistency | "Консистентність" |
| `/pricing` | Pricing | Тарифи |
| `/profile` | Profile | Профіль |
| `/settings` | Settings | Налаштування |
| `/rcadmin/*` | Admin* | Адмін-панель |

### Навігація

- **Desktop**: `Header.tsx` — верхня навігація (ховається на сторінці чату)
- **Mobile**: `BottomNav.tsx` — нижня навігація (ховається на сторінці чату)
- **Чат**: своя навігація (back button, sidebar)

### Стилізація

- **Tailwind CSS** з `darkMode: ["class"]`
- **CSS змінні** в `client/src/index.css` (`:root` та `.dark`)
- **shadcn/ui** компоненти в `components/ui/` (~50 файлів)
- Шрифти: Inter, DM Sans, Fira Code, Geist Mono
- `ThemeContext.tsx` — перемикання теми

### API клієнт (client/src/lib/queryClient.ts)

```typescript
// Базові helpers
apiRequest(method, url, body?)        // Повертає raw Response
apiRequestJson(method, url, body?)    // Повертає JSON (auto-parse)

// TanStack Query defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // GET запит до queryKey[0] як URL
      },
    },
  },
});
```

### Використання

```typescript
// Отримання даних
const { data, isLoading } = useQuery<Product[]>({
  queryKey: ['/api/brands', brandId, 'products'],
});

// Мутація
const mutation = useMutation({
  mutationFn: (data) => apiRequestJson('POST', `/api/brands/${brandId}/products`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/brands', brandId, 'products'] });
  },
});
```

### Імпорти (aliases в vite.config.ts)

```typescript
import { Button } from '@/components/ui/button';    // → client/src/components/ui/button
import { User } from '@shared/schema';               // → shared/schema
import logoPath from '@assets/logo.png';              // → attached_assets/logo.png
```

---

## Адмін-панель

Доступна за `/rcadmin`. Потрібна роль `admin` в таблиці `users`.

### Сторінки

| Шлях | Компонент | Опис |
|---|---|---|
| `/rcadmin` | AdminDashboard | Статистика |
| `/rcadmin/cards` | CardsManagement | Картки гри (CRUD, drag&drop) |
| `/rcadmin/card-types` | CardTypes | Типи карток |
| `/rcadmin/card-option-sets` | CardOptionSets | Набори опцій |
| `/rcadmin/options-list` | OptionsList | Список опцій |
| `/rcadmin/users` | Users | Управління користувачами |
| `/rcadmin/settings` | Settings | AI налаштування |
| `/rcadmin/plans` | SubscriptionPlans | Тарифні плани |
| `/rcadmin/transactions` | Transactions | Транзакції Monobank |

### AI налаштування через адмін

В розділі `/rcadmin/settings` можна задати:
- `BRAND_NAME_GENERATOR_CONTEXT` — контекст для AI генератора назв
- Інші AI контексти та промпти
- Зберігаються в таблиці `app_settings`

---

## Функціональні модулі

### 1. Ігрова механіка (Game)
- Три рівні: Душа → Розум → Тіло
- Картки з питаннями, підказками, опціями
- Набори опцій (архетипи, цінності, канали) з min/max правилами
- Прогрес-бар, XP, таймер
- Збереження відповідей в реальному часі
- Експорт карти бренду в PDF (jsPDF)

### 2. AI Чат бренду (Brand Chat)
- Мульти-тредовий (кілька чатів на бренд)
- Контекст чату: AI агент, продукти, аудиторії, ігрова сесія
- Налаштування зберігаються в БД, відновлюються при переключенні чатів
- Бейджі контексту в сайдбарі (фіолетовий=агент, помаранчевий=продукти, блакитний=аудиторії)
- Редагування назви чату через іконку олівця
- Генерація зображень через NanoBanana
- Завантаження зображень
- Мерч мокапи, шаблони
- Повноекранний режим (без header/bottom nav)

### 3. Генератор назв (Name Generator)
- Бриф: ніша, цінності, тон, ЦА, ключові слова, мова
- AI генерація 10-20 варіантів з поясненнями
- Перевірка доменів (DNS: .com, .ua, .io, .net, .store)
- Перевірка соцмереж (HTTP: Instagram, Facebook, Telegram, TikTok)
- AI аналіз trademark ризику (low/medium/high)
- Лінгвістичний аналіз (1-10)
- Загальний скор (0-100)
- "Генерувати ще" — обрані залишаються, нові з'являються нижче
- "Створити бренд" з обраної назви
- Історія сесій

### 4. Брифи (Briefs)
- Конструктор полів (drag & drop)
- Типи полів: short_text, long_text, multiple_choice (з custom option), dropdown
- AI генерація структури брифу
- Публічний доступ за slug (unique URL)
- Захист паролем (bcrypt)
- Збір та перегляд відповідей

### 5. Квізи (Quizzes)
- **"Де Я?"** — 10 питань, 5 категорій, 4 варіанти відповіді
- **"Готовність до Бренду з Душею"** — 14 swipe-питань, 4 рівні результату
- **"Консистентність і проявлення"** — 16 swipe-питань в 4 блоках
- Framer Motion анімації (drag threshold ±100px)

### 6. Візуальне полотно (Canvas)
- tldraw v4 — нескінченне полотно
- Lazy-loaded для уникнення конфліктів React
- Збереження/завантаження в Cloudflare R2

### 7. Цільова аудиторія (Target Audience)
- Демографія, психографія, поведінкові дані
- AI генерація персон на основі бренду
- Сегменти з детальними персонами
- AI портрети

### 8. Продукти (Products)
- CRUD з зображеннями (R2)
- Категорії, ціни, опис, характеристики
- AI генерація даних продукту
- Прив'язка до чату як контекст

### 9. AI Агенти (Agents)
- Кастомні AI персонажі з промптами
- Тон, стиль, спеціалізація
- Використовуються як контекст в чаті
- AI генерація параметрів агента

### 10. AI Аналіз бренду (Brand Analysis)
- Детальний аналіз по секціях
- Рекомендації на основі відповідей гри
- Візуалізація результатів

---

## Команди розробки

```bash
npm run dev          # Dev сервер (Express + Vite HMR) → http://localhost:5000
npm run build        # Збірка: Vite → dist/public, esbuild → dist/index.js
npm run start        # Production сервер (NODE_ENV=production)
npm run check        # TypeScript перевірка (tsc --noEmit)
npm run db:push      # Синхронізація Drizzle схеми з PostgreSQL
```

---

## Troubleshooting

### "DATABASE_URL must be set"
Переконайтеся, що `DATABASE_URL` задана в `.env` або в оточенні системи.

### "Invalid hook call" warning в консолі
Відоме попередження через `tldraw` / `@xyflow/react` — вони імпортують свою копію React. Не впливає на функціональність.

### AI функції не працюють
Потрібен хоча б один AI ключ: `OPENAI_API_KEY`, `AI_INTEGRATIONS_GEMINI_API_KEY`, або `ANTHROPIC_API_KEY`. Без них проект запуститься, але AI-залежні функції (чат, генератор назв, аналіз) повертатимуть помилку.

### Файли не завантажуються / не відображаються
Перевірте R2 конфігурацію: усі 4 змінні (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) мають бути задані. Без них завантаження працюватиме, але збереження в R2 буде повертати помилку.

### Google OAuth не працює
1. Правильні `GOOGLE_CLIENT_ID` і `GOOGLE_CLIENT_SECRET`
2. Redirect URI в Google Console має включати ваш домен
3. В dev: `http://localhost:5000`

### Apple Sign-In не працює
1. Правильний PEM ключ в `APPLE_PRIVATE_KEY` (повний текст з `-----BEGIN/END-----`)
2. `APPLE_CLIENT_ID` = Service ID
3. `APPLE_TEAM_ID` = 10-символьний Team ID
4. `APPLE_KEY_ID` = Key ID з Apple Developer Console

### Порт зайнятий
За замовчуванням порт 5000. Змініть: `PORT=3000 npm run dev`

### Drizzle push конфліктує
```bash
npm run db:push --force    # Примусова синхронізація
```

### Vite HMR не працює
Перезапустіть dev сервер: `Ctrl+C` → `npm run dev`

---

## Для Claude Code

### Мінімальний `.env` для локального запуску

```env
DATABASE_URL=postgresql://user:password@localhost:5432/brandsoul
OPENAI_API_KEY=sk-your-key
SESSION_SECRET=change-me-to-random-string
```

### Послідовність команд

```bash
# 1. Встановити залежності
npm install

# 2. Створити базу (якщо PostgreSQL локальний)
createdb brandsoul

# 3. Синхронізувати схему
npm run db:push

# 4. Запустити
npm run dev

# 5. Відкрити http://localhost:5000
# 6. Зареєструватися через UI
# 7. (Опціонально) Зробити себе адміном:
#    psql brandsoul -c "UPDATE users SET role = 'admin' WHERE email = 'your@email.com';"
```

### Особливості архітектури для Claude Code

1. **Один файл маршрутів** — `server/routes.ts` (~9400 рядків). Усі API тут.
2. **Один файл storage** — `server/storage.ts` (~3500 рядків). Інтерфейс IStorage + реалізація.
3. **Один файл схеми** — `shared/schema.ts` (~1800 рядків). Drizzle таблиці + Zod.
4. **Великий файл чату** — `client/src/pages/brand-chat.tsx` (~2500 рядків).
5. **Vite middleware** — фронтенд і бекенд на одному порту (5000).
6. **Не змінювати**: `vite.config.ts`, `server/vite.ts`, `drizzle.config.ts`.
7. **Усі ID — UUID** (генеруються через `gen_random_uuid()`).
8. **TanStack Query v5** — тільки object form: `useQuery({ queryKey: [...] })`.
9. **Wouter** (не react-router) — `useLocation`, `Link`, `Route`.
