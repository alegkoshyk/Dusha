# Інструкція з деплою на Vercel

## Крок 1: Підготовка бази даних Supabase

### 1.1 Застосуйте SQL дамп
1. Відкрийте https://supabase.com
2. Виберіть ваш проект
3. Перейдіть до **SQL Editor** (ліва панель)
4. Створіть новий запит
5. Вставте SQL дамп, який ви надали раніше
6. Натисніть **RUN** (або F5)

Це створить всі таблиці та імпортує дані.

---

## Крок 2: Деплой на Vercel через GitHub

### 2.1 Підключіть репозиторій до Vercel
1. Перейдіть на https://vercel.com
2. Залогіньтеся (або зареєструйтесь)
3. Натисніть **"Add New..."** → **"Project"**
4. Натисніть **"Import Git Repository"**
5. Авторизуйте GitHub (якщо потрібно)
6. Знайдіть та оберіть репозиторій **alegkoshyk/Dusha**
7. Натисніть **"Import"**

### 2.2 Налаштування проекту
Vercel автоматично виявить налаштування з `vercel.json`, але перевірте:

**Framework Preset:** `Other` (або залиште автовизначення)

**Build & Development Settings:**
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### 2.3 Додайте змінні середовища (Environment Variables)

**ВАЖЛИВО!** Додайте наступні змінні:

```
DATABASE_URL
postgresql://postgres:0KgTlDIWYEW9yBMX@db.qtcnxhzuctgmbnctjaaq.supabase.co:5432/postgres

SESSION_SECRET
dusha-brand-game-secret-key-2025

NODE_ENV
production
```

**Як додати:**
1. Прокрутіть до секції **"Environment Variables"**
2. Додайте кожну змінну окремо:
   - Name: `DATABASE_URL`
   - Value: `postgresql://postgres:0KgTlDIWYEW9yBMX@db.qtcnxhzuctgmbnctjaaq.supabase.co:5432/postgres`
3. Повторіть для `SESSION_SECRET` та `NODE_ENV`

### 2.4 Деплой!
1. Натисніть **"Deploy"**
2. Дочекайтеся завершення білду (2-3 хвилини)
3. Отримайте посилання на ваш сайт!

---

## Крок 3: Автоматичні деплої

Після налаштування:
- Кожен **push** до гілки створить **Preview Deployment**
- Push до **main** гілки створить **Production Deployment**
- Ви отримуватимете унікальні URL для кожного деплою

---

## Корисні команди

### Локальна розробка:
```bash
npm run dev
```

### Білд проекту:
```bash
npm run build
```

### Запуск продакшн версії локально:
```bash
npm start
```

### Міграції бази даних:
```bash
npm run db:push
```

---

## Troubleshooting

### Проблема: Білд падає з помилкою "DATABASE_URL is not set"
**Рішення:** Перевірте, чи додали змінні середовища в Vercel (Крок 2.3)

### Проблема: База даних не підключається
**Рішення:**
1. Перевірте правильність DATABASE_URL
2. Переконайтеся що Supabase проект активний
3. Перевірте що дамп виконано успішно

### Проблема: 500 Internal Server Error
**Рішення:**
1. Перевірте логи у Vercel Dashboard → Functions
2. Перевірте чи всі таблиці створені в Supabase
3. Перевірте змінні середовища

---

## Контакти

Email: hello@redcats.agency
Репозиторій: https://github.com/alegkoshyk/Dusha
