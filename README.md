# Душа Бренду - Brand Transformation Game

Трансформаційна гра для розробки ідентичності бренду через три рівні: Душа (цінності), Розум (стратегія), та Тіло (втілення).

## 🚀 Quick Start

### Локальна розробка

1. **Клонуйте репозиторій:**
```bash
git clone https://github.com/alegkoshyk/Dusha.git
cd Dusha
```

2. **Встановіть залежності:**
```bash
npm install
```

3. **Налаштуйте змінні середовища:**
```bash
cp .env.example .env
# Відредагуйте .env та додайте ваші дані
```

4. **Запустіть проект:**
```bash
npm run dev
```

Проект буде доступний на http://localhost:5000

## 📦 Технології

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Build**: Vite, esbuild
- **Deploy**: Vercel

## 🗄️ База даних

Проект використовує PostgreSQL через Supabase. Схема бази даних включає:

- **Користувачі**: `users`, `user_profiles`, `user_settings`, `user_brands`
- **Гра**: `game_levels`, `game_cards`, `card_properties`, `card_relations`
- **Прогрес**: `game_sessions`, `card_responses`

### Міграції

```bash
# Згенерувати нові міграції
npx drizzle-kit generate

# Застосувати міграції
npm run db:push
```

## 🚢 Deployment

Детальну інструкцію з деплою дивіться в [DEPLOYMENT.md](./DEPLOYMENT.md)

### Швидкий деплой на Vercel:

1. Підключіть репозиторій до Vercel
2. Додайте змінні середовища
3. Натисніть Deploy!

## 📝 Доступні команди

```bash
# Розробка
npm run dev

# Білд
npm run build

# Продакшн
npm start

# Перевірка типів
npm run check

# Міграції БД
npm run db:push
```

## 🏗️ Структура проекту

```
Dusha/
├── client/           # React frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── lib/
├── server/           # Express backend
│   ├── index.ts     # Entry point
│   ├── routes.ts    # API routes
│   ├── auth.ts      # Authentication
│   └── db.ts        # Database connection
├── shared/           # Shared types & schemas
│   └── schema.ts    # Database schema
├── migrations/       # SQL migrations
└── public/          # Static assets
```

## 🔐 Безпека

- Ніколи не комітьте `.env` файл
- Використовуйте сильні паролі для `SESSION_SECRET`
- Регулярно оновлюйте залежності

## 📄 Ліцензія

MIT

## 👥 Контакти

- Email: hello@redcats.agency
- Website: https://redcats.agency
