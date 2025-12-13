# Душа Бренду - Повна Документація

## Зміст
1. [Огляд проекту](#огляд-проекту)
2. [Основні можливості](#основні-можливості)
3. [Для користувачів](#для-користувачів)
4. [Адміністративна панель](#адміністративна-панель)
5. [Технічна архітектура](#технічна-архітектура)
6. [API Документація](#api-документація)
7. [База даних](#база-даних)
8. [Автентифікація](#автентифікація)
9. [Конфігурація та розгортання](#конфігурація-та-розгортання)

---

## Огляд проекту

**Душа Бренду** — це інтерактивна трансформаційна гра для підприємців та маркетологів, яка допомагає відкрити та сформулювати ідентичність бренду.

### Концепція гри

Гра проводить користувачів через три рівні самопізнання бренду:

1. **🔴 Душа (Soul)** — Глибинні цінності, місія та історія бренду
2. **🔵 Розум (Mind)** — Стратегія, позиціонування та цільова аудиторія  
3. **🟢 Тіло (Body)** — Реалізація: продукти, канали та комунікації

### Кінцевий результат

Після проходження гри користувач отримує:
- **Brand Map** — візуальна карта бренду з усіма відповідями
- **PDF експорт** — можливість завантажити брендбук у форматі PDF
- **Історія прогресу** — можливість повернутися та редагувати відповіді

---

## Основні можливості

### Для кінцевих користувачів
- ✅ Реєстрація та вхід через email/пароль
- ✅ Вхід через Google та Apple (OAuth 2.0)
- ✅ Створення кількох брендів в одному акаунті
- ✅ Інтерактивне проходження ігрових карток
- ✅ Збереження прогресу в реальному часі
- ✅ Перегляд Brand Map
- ✅ Експорт результатів у PDF
- ✅ XP система та нагороди
- ✅ Таймер на картках з бонусами за швидкі відповіді

### Для адміністраторів
- ✅ Повне керування ігровим контентом (картки, рівні)
- ✅ Управління користувачами
- ✅ Керування наборами опцій для карток
- ✅ Drag & drop для зміни порядку
- ✅ Синхронізація бази даних
- ✅ Налаштування системи

---

## Для користувачів

### Початок роботи

1. **Реєстрація**
   - Відкрийте сайт https://brandsoul.site
   - Натисніть "Зареєструватися"
   - Введіть email, ім'я та пароль (мін. 8 символів)
   - Або скористайтесь входом через Google/Apple

2. **Створення бренду**
   - На дашборді натисніть "Створити бренд"
   - Введіть назву вашого бренду
   - (Опціонально) додайте опис

3. **Початок гри**
   - Виберіть бренд і натисніть "Почати гру"
   - Гра автоматично почнеться з рівня "Душа"

### Ігровий процес

#### Типи карток:

| Тип | Опис | Приклад |
|-----|------|---------|
| **text** | Вільний текст | Опишіть місію бренду |
| **choice** | Вибір одного варіанту | Оберіть архетип |
| **values** | Множинний вибір | Виберіть 3-5 цінностей |
| **reflection** | Рефлексія | Підсумуйте ваші думки |
| **archetype** | Архетип бренду | Вибір з 12 архетипів |

#### Прогрес:

- Прогрес зберігається автоматично після кожної відповіді
- Можна вийти та повернутися пізніше
- Картки можна переглядати та редагувати
- Завершені рівні відображаються на дашборді

### Brand Map

Після завершення всіх рівнів відкривається повна карта бренду:

```
┌─────────────────────────────────────────────┐
│                   ДУША                       │
│  • Місія: [текст]                           │
│  • Цінності: [список]                       │
│  • Історія: [текст]                         │
├─────────────────────────────────────────────┤
│                   РОЗУМ                      │
│  • Цільова аудиторія: [опис]                │
│  • Позиціонування: [текст]                  │
│  • Архетип: [вибір]                         │
│  • Унікальна пропозиція: [текст]            │
├─────────────────────────────────────────────┤
│                   ТІЛО                       │
│  • Продукти/послуги: [список]               │
│  • Канали комунікації: [список]             │
│  • Тон голосу: [опис]                       │
│  • Візуальний стиль: [опис]                 │
└─────────────────────────────────────────────┘
```

### Експорт у PDF

1. Відкрийте завершену гру
2. Натисніть "Експорт PDF"
3. Файл автоматично завантажиться

---

## Адміністративна панель

**URL:** `/rcadmin`

### Доступ

Для входу в адмін-панель потрібен акаунт з роллю `admin`.

### Розділи адмін-панелі

#### 1. Dashboard (`/rcadmin`)
- Загальна статистика системи
- Кількість користувачів, брендів, ігор
- Швидкі дії

#### 2. Управління картками (`/rcadmin/cards`)
- Перегляд усіх ігрових карток
- Редагування заголовків, описів, підказок
- Зміна порядку карток (drag & drop)
- Налаштування складності та часу
- Прив'язка до рівнів

#### 3. Типи карток (`/rcadmin/card-types`)
- Налаштування типів карток
- Правила валідації
- Іконки та кольори

#### 4. Набори опцій (`/rcadmin/card-option-sets`)
- Створення наборів для вибору (архетипи, цінності, канали)
- Налаштування min/max вибору
- Управління варіантами в наборах

#### 5. Користувачі (`/rcadmin/users`)
- Перегляд всіх користувачів
- Зміна ролі (user/admin)
- Блокування/розблокування
- Видалення користувачів

#### 6. Синхронізація БД (`/rcadmin/db-sync`)
- Синхронізація схеми бази даних
- Імпорт/експорт даних
- Діагностика

#### 7. Налаштування (`/rcadmin/settings`)
- Загальні налаштування системи

---

## Технічна архітектура

### Стек технологій

```
┌─────────────────────────────────────────────┐
│                 FRONTEND                     │
│  React 18 + TypeScript + Vite               │
│  TailwindCSS + shadcn/ui + Radix UI         │
│  TanStack Query + React Hook Form + Wouter  │
├─────────────────────────────────────────────┤
│                 BACKEND                      │
│  Node.js + Express.js + TypeScript          │
│  Drizzle ORM + PostgreSQL (Neon)            │
│  Express Sessions + OAuth 2.0               │
├─────────────────────────────────────────────┤
│               INFRASTRUCTURE                 │
│  Replit Hosting + Neon PostgreSQL           │
│  Custom Domain: brandsoul.site              │
└─────────────────────────────────────────────┘
```

### Структура проекту

```
├── client/                 # Frontend React додаток
│   ├── src/
│   │   ├── components/     # UI компоненти
│   │   │   ├── auth/       # Форми логіну/реєстрації
│   │   │   ├── brands/     # Компоненти брендів
│   │   │   ├── game/       # Ігрові компоненти
│   │   │   ├── mobile/     # Мобільна версія
│   │   │   ├── progress/   # Прогрес-бари
│   │   │   └── ui/         # shadcn/ui компоненти
│   │   ├── contexts/       # React контексти
│   │   ├── hooks/          # Кастомні хуки
│   │   ├── lib/            # Утиліти
│   │   ├── pages/          # Сторінки
│   │   │   └── admin/      # Адмін-панель
│   │   ├── App.tsx         # Головний компонент
│   │   └── main.tsx        # Entry point
│   └── index.html
│
├── server/                 # Backend Express сервер
│   ├── auth.ts             # Автентифікація та сесії
│   ├── db.ts               # Підключення до БД
│   ├── index.ts            # Entry point сервера
│   ├── oauthProviders.ts   # Google/Apple OAuth
│   ├── routes.ts           # API маршрути
│   ├── storage.ts          # Інтерфейс бази даних
│   └── vite.ts             # Vite middleware
│
├── shared/                 # Спільний код
│   └── schema.ts           # Drizzle схема + Zod валідація
│
└── scripts/                # Утиліти
    └── create-admin.js     # Створення адміна
```

---

## API Документація

### Автентифікація

#### POST /api/auth/register
Реєстрація нового користувача

**Request:**
```json
{
  "email": "user@example.com",
  "firstName": "Ім'я",
  "lastName": "Прізвище",
  "password": "пароль123",
  "confirmPassword": "пароль123"
}
```

**Response:** `201 Created`
```json
{
  "message": "Користувач успішно зареєстрований",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ім'я",
    "lastName": "Прізвище",
    "role": "user"
  }
}
```

#### POST /api/auth/login
Вхід в систему

**Request:**
```json
{
  "email": "user@example.com",
  "password": "пароль123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Успішний вхід в систему",
  "user": {...},
  "authToken": "auth_token_string"
}
```

#### GET /api/auth/me
Отримання поточного користувача

**Response:** `200 OK`
```json
{
  "user": {...},
  "profile": {...},
  "settings": {...}
}
```

#### POST /api/auth/logout
Вихід з системи

---

### OAuth

#### GET /api/auth/google
Ініціює OAuth flow з Google

#### GET /api/auth/apple
Ініціює OAuth flow з Apple

#### GET /api/auth/providers
Перевірка доступних провайдерів

**Response:**
```json
{
  "google": true,
  "apple": true,
  "email": true
}
```

---

### Бренди

#### GET /api/user/brands
Отримати всі бренди користувача

#### POST /api/user/brands
Створити новий бренд

**Request:**
```json
{
  "name": "Назва бренду",
  "description": "Опис"
}
```

#### DELETE /api/user/brands/:brandId
Видалити бренд

---

### Ігрові сесії

#### GET /api/user/game-sessions
Отримати всі сесії користувача

#### POST /api/game-sessions
Створити нову ігрову сесію

**Request:**
```json
{
  "brandId": "uuid"
}
```

#### GET /api/game-sessions/:sessionId
Отримати деталі сесії

#### DELETE /api/game-sessions/:sessionId
Видалити сесію

#### PATCH /api/game-sessions/:sessionId/progress
Оновити прогрес

**Request:**
```json
{
  "currentLevel": "soul",
  "currentCard": "soul-mission",
  "progress": 50
}
```

---

### Картки та відповіді

#### GET /api/game-sessions/:sessionId/cards
Отримати всі картки для сесії

#### POST /api/game-sessions/:sessionId/response
Зберегти відповідь на картку

**Request:**
```json
{
  "cardId": "soul-mission",
  "response": "Наша місія - ...",
  "timeSpent": 120,
  "isWithinTimeLimit": true
}
```

#### GET /api/game-sessions/:sessionId/responses
Отримати всі відповіді сесії

---

### Brand Map

#### GET /api/game-sessions/:sessionId/brand-map
Отримати Brand Map для сесії

**Response:**
```json
{
  "soul": {
    "mission": "Текст місії",
    "values": ["цінність1", "цінність2"],
    "story": "Історія бренду"
  },
  "mind": {
    "targetAudience": "Опис ЦА",
    "positioning": "Позиціонування",
    "archetype": "Творець"
  },
  "body": {
    "products": ["продукт1", "продукт2"],
    "channels": ["Instagram", "Website"],
    "toneOfVoice": "Дружній та експертний"
  }
}
```

---

### Адмін API

#### GET /api/admin/cards
Отримати всі картки (тільки для адміністраторів)

#### PUT /api/admin/cards/:cardId
Оновити картку

#### GET /api/admin/users
Отримати список користувачів

#### DELETE /api/admin/users/:userId
Видалити користувача

---

## База даних

### Схема таблиць

#### users
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Первинний ключ |
| email | VARCHAR(255) | Унікальний email |
| passwordHash | VARCHAR(255) | Хеш пароля |
| firstName | VARCHAR(100) | Ім'я |
| lastName | VARCHAR(100) | Прізвище |
| avatar | TEXT | URL аватара |
| role | VARCHAR(20) | user / admin |
| isActive | BOOLEAN | Активний акаунт |
| googleId | VARCHAR(255) | Google OAuth ID |
| appleId | VARCHAR(255) | Apple OAuth ID |
| authProvider | VARCHAR(50) | email / google / apple |
| createdAt | TIMESTAMP | Дата створення |
| lastLoginAt | TIMESTAMP | Останній вхід |

#### user_brands
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Первинний ключ |
| userId | UUID → users | Власник |
| name | VARCHAR(200) | Назва бренду |
| description | TEXT | Опис |
| status | VARCHAR(20) | active / archived / completed |
| totalProgress | INTEGER | Загальний прогрес (0-100) |
| createdAt | TIMESTAMP | Дата створення |

#### game_levels
| Поле | Тип | Опис |
|------|-----|------|
| id | TEXT | soul / mind / body |
| name | TEXT | Назва рівня |
| description | TEXT | Опис |
| order | INTEGER | Порядок |
| color | TEXT | Колір рівня |
| icon | TEXT | Іконка |

#### game_cards
| Поле | Тип | Опис |
|------|-----|------|
| id | TEXT | ID картки (soul-mission) |
| levelId | TEXT → game_levels | Рівень |
| title | TEXT | Заголовок |
| description | TEXT | Повний опис |
| shortDescription | TEXT | Короткий опис |
| hint | TEXT | Підказка |
| type | ENUM | text/choice/values/reflection/archetype |
| difficulty | ENUM | easy/medium/hard |
| estimatedTime | INTEGER | Час у секундах |
| required | BOOLEAN | Обов'язкова картка |
| positionX | INTEGER | Позиція X |
| positionY | INTEGER | Позиція Y |
| validation | JSON | Правила валідації |
| rewards | JSON | XP та нагороди |

#### game_sessions
| Поле | Тип | Опис |
|------|-----|------|
| id | UUID | Первинний ключ |
| userId | UUID → users | Користувач |
| brandId | UUID → user_brands | Бренд |
| currentLevel | ENUM | soul/mind/body |
| currentCard | TEXT | Поточна картка |
| completedCards | JSON | Масив завершених |
| progress | INTEGER | Прогрес (0-100) |
| totalXp | INTEGER | Набрано XP |
| completed | TIMESTAMP | Дата завершення |

#### card_responses
| Поле | Тип | Опис |
|------|-----|------|
| id | SERIAL | Первинний ключ |
| sessionId | UUID → game_sessions | Сесія |
| cardId | TEXT → game_cards | Картка |
| response | JSON | Відповідь |
| responseType | ENUM | text/choice/values |
| timeSpent | INTEGER | Час у секундах |
| isWithinTimeLimit | BOOLEAN | Вклався в ліміт |
| earnedXP | INTEGER | Нараховано XP |
| submittedAt | TIMESTAMP | Дата відповіді |

---

## Автентифікація

### Email/Password
- Пароль хешується за допомогою bcrypt
- Мінімальна довжина пароля: 8 символів
- Сесія зберігається в PostgreSQL

### Google OAuth
**Необхідні credentials:**
- `GOOGLE_CLIENT_ID` - Client ID з Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - Client Secret

**Callback URL:** `https://brandsoul.site/api/auth/google/callback`

### Apple OAuth
**Необхідні credentials:**
- `APPLE_CLIENT_ID` - Service ID (напр. `site.brandsoul`)
- `APPLE_TEAM_ID` - Team ID з Apple Developer
- `APPLE_KEY_ID` - Key ID
- `APPLE_PRIVATE_KEY` - Приватний ключ (.p8)

**Callback URL:** `https://brandsoul.site/api/auth/apple/callback`

**Налаштування в Apple Developer:**
1. Створіть App ID з підтримкою Sign In with Apple
2. Створіть Service ID та налаштуйте Return URL
3. Створіть Key з підтримкою Sign In with Apple
4. Завантажте .p8 файл

---

## Конфігурація та розгортання

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...
DEVELOPMENT_DATABASE_URL=postgresql://...
PRODUCTION_DATABASE_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# Apple OAuth
APPLE_CLIENT_ID=site.brandsoul
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
```

### Запуск локально

```bash
# Встановлення залежностей
npm install

# Запуск dev сервера
npm run dev

# База даних
npm run db:push  # Синхронізація схеми
```

### Публікація

1. Перевірте, що всі зміни працюють локально
2. Натисніть "Publish" у Replit
3. Перевірте production URL

### Створення адміністратора

```bash
node scripts/create-admin.js
```

Або вручну в базі даних:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## Підтримка

- **Email:** hello@redcats.agency
- **Сайт:** https://brandsoul.site

---

*Документація оновлена: Грудень 2024*
