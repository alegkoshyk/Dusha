# Налаштування автоматичного деплою на Vercel

## Метод 1: GitHub Integration (Рекомендований - найпростіший)

### Переваги:
- ✅ Автоматичний деплой при кожному push
- ✅ Preview deployments для PR
- ✅ Немає потреби в GitHub Actions
- ✅ Інтеграція з Vercel Dashboard

### Інструкція:

1. **Підключіть репозиторій до Vercel:**
   - Перейдіть на https://vercel.com/new
   - Натисніть "Import Git Repository"
   - Авторизуйте GitHub (якщо потрібно)
   - Виберіть репозиторій `alegkoshyk/Dusha`
   - Натисніть "Import"

2. **Налаштуйте проект:**
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Додайте Environment Variables:**
   ```
   DATABASE_URL=postgresql://postgres:0KgTlDIWYEW9yBMX@db.qtcnxhzuctgmbnctjaaq.supabase.co:5432/postgres
   SESSION_SECRET=dusha-brand-game-secret-key-2025
   NODE_ENV=production
   ```

4. **Deploy!**
   - Натисніть "Deploy"
   - Готово! Тепер кожен push автоматично деплоїться

---

## Метод 2: GitHub Actions (Більше контролю)

### Переваги:
- ✅ Повний контроль над процесом деплою
- ✅ Можливість додати додаткові кроки (тести, лінтинг)
- ✅ Налаштування різних workflow для різних гілок

### Інструкція:

#### Крок 1: Отримайте Vercel credentials

1. **Vercel Token:**
   - Перейдіть на https://vercel.com/account/tokens
   - Натисніть "Create Token"
   - Назвіть токен (наприклад "GitHub Actions")
   - Скопіюйте токен

2. **Project ID:**
   - Перейдіть на https://vercel.com/dashboard
   - Виберіть ваш проект (або створіть новий)
   - Перейдіть до Settings → General
   - Знайдіть "Project ID" і скопіюйте

3. **Organization ID:**
   - В налаштуваннях проекту
   - Прокрутіть до секції "Organization ID"
   - Скопіюйте ID

#### Крок 2: Додайте GitHub Secrets

1. Перейдіть до вашого репозиторію на GitHub
2. Settings → Secrets and variables → Actions
3. Натисніть "New repository secret"
4. Додайте три секрети:

   **VERCEL_TOKEN**
   ```
   [ваш токен з Vercel]
   ```

   **VERCEL_ORG_ID**
   ```
   [ваш Organization ID]
   ```

   **VERCEL_PROJECT_ID**
   ```
   [ваш Project ID]
   ```

#### Крок 3: Push workflow файли

Workflow файли вже створені:
- `.github/workflows/vercel-deploy.yml` - для main гілки
- `.github/workflows/vercel-preview.yml` - для інших гілок

Просто зробіть commit і push:
```bash
git add .github/
git commit -m "Add Vercel deployment workflows"
git push
```

#### Крок 4: Перевірте деплой

1. Перейдіть до GitHub → Actions
2. Побачите запущені workflows
3. Після успішного виконання - проект буде на Vercel!

---

## Порівняння методів

| Характеристика | GitHub Integration | GitHub Actions |
|----------------|-------------------|----------------|
| Складність налаштування | Дуже проста | Середня |
| Час налаштування | 5 хвилин | 15 хвилин |
| Кастомізація | Обмежена | Повна |
| Тести перед деплоєм | Ні | Так (можна додати) |
| Контроль процесу | Vercel | GitHub |
| Preview Deployments | Автоматично | Потрібен окремий workflow |

---

## Рекомендації

**Для більшості проектів:** Використовуйте **GitHub Integration** (Метод 1)
- Швидко
- Просто
- Надійно
- Автоматичні preview deployments

**Для складних проектів:** Використовуйте **GitHub Actions** (Метод 2)
- Додаткові кроки (тести, лінтинг)
- Повний контроль
- Інтеграція з іншими сервісами

---

## Troubleshooting

### Помилка: "Missing VERCEL_TOKEN"
**Рішення:** Перевірте що додали всі три секрети в GitHub Settings → Secrets

### Помилка: "Unauthorized"
**Рішення:** Токен невалідний або застарів. Створіть новий на https://vercel.com/account/tokens

### Деплой не запускається автоматично
**Рішення:**
1. Перевірте що workflow файли в `.github/workflows/`
2. Перевірте GitHub Actions permissions в Settings → Actions → General
3. Переконайтеся що Actions enabled для репозиторію

---

## Додаткові налаштування

### Додати тести перед деплоєм

Відредагуйте `.github/workflows/vercel-deploy.yml`:

```yaml
jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      # Додайте ці кроки ПЕРЕД деплоєм
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linter
        run: npm run check

      # Потім продовжуйте з деплоєм...
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      ...
```

---

## Контакти

Email: hello@redcats.agency
