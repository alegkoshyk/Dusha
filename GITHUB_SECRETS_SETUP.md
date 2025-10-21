# 🚀 Швидке налаштування GitHub Secrets для Vercel

## Ваші дані для налаштування:

```
VERCEL_TOKEN: kqlU44Oes9iE1aCCZ1QFthsq
VERCEL_ORG_ID: team_tN5DePrxGjvCvCAvNnsF5GqR
VERCEL_PROJECT_ID: prj_Utp8tBiIRdrAZsilmK52ETcddVab
```

---

## Крок 1: Відкрийте GitHub Secrets

1. Перейдіть до вашого репозиторію: https://github.com/alegkoshyk/Dusha
2. Натисніть **Settings** (вкладка вгорі)
3. В лівому меню виберіть **Secrets and variables** → **Actions**
4. Натисніть зелену кнопку **"New repository secret"**

---

## Крок 2: Додайте три секрети

### Секрет 1: VERCEL_TOKEN

1. В полі **Name** введіть:
   ```
   VERCEL_TOKEN
   ```

2. В полі **Secret** вставте:
   ```
   kqlU44Oes9iE1aCCZ1QFthsq
   ```

3. Натисніть **"Add secret"**

---

### Секрет 2: VERCEL_ORG_ID

1. Натисніть **"New repository secret"** знову
2. В полі **Name** введіть:
   ```
   VERCEL_ORG_ID
   ```

3. В полі **Secret** вставте:
   ```
   team_tN5DePrxGjvCvCAvNnsF5GqR
   ```

4. Натисніть **"Add secret"**

---

### Секрет 3: VERCEL_PROJECT_ID

1. Натисніть **"New repository secret"** знову
2. В полі **Name** введіть:
   ```
   VERCEL_PROJECT_ID
   ```

3. В полі **Secret** вставте:
   ```
   prj_Utp8tBiIRdrAZsilmK52ETcddVab
   ```

4. Натисніть **"Add secret"**

---

## Крок 3: Перевірка

Після додавання всіх трьох секретів ви маєте побачити їх в списку:

- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID

---

## Крок 4: Запустіть деплой

### Автоматичний деплой:

Просто зробіть push до репозиторію:

```bash
git push origin claude/project-setup-011CULd18UvoZW3mZzNv1tg2
```

GitHub Actions автоматично запустить деплой!

### Ручний запуск:

1. Перейдіть до **Actions** (вкладка вгорі)
2. Виберіть workflow **"Vercel Preview Deployment"**
3. Натисніть **"Run workflow"**
4. Виберіть вашу гілку
5. Натисніть зелену кнопку **"Run workflow"**

---

## Крок 5: Перегляньте результат

1. Перейдіть до **Actions**
2. Побачите workflow що виконується
3. Клацніть на нього щоб побачити деталі
4. Після завершення отримаєте URL деплою!

---

## 📝 Альтернатива: Швидкі команди для локального терміналу

Якщо у вас встановлений **GitHub CLI** (`gh`), можете виконати:

```bash
# Спочатку авторизуйтесь
gh auth login

# Додайте секрети однією командою
gh secret set VERCEL_TOKEN -b "kqlU44Oes9iE1aCCZ1QFthsq"
gh secret set VERCEL_ORG_ID -b "team_tN5DePrxGjvCvCAvNnsF5GqR"
gh secret set VERCEL_PROJECT_ID -b "prj_Utp8tBiIRdrAZsilmK52ETcddVab"

# Перевірте що додано
gh secret list
```

---

## ✅ Готово!

Тепер кожен push автоматично запускатиме деплой на Vercel через GitHub Actions!

**Preview deployments:** Кожен push до будь-якої гілки крім main
**Production deployment:** Push до main гілки

---

## 🔍 Де дивитися деплой?

**На GitHub:**
- Actions → Виберіть workflow → Побачите логи

**На Vercel:**
- https://vercel.com/dashboard
- Виберіть проект "Dusha"
- Побачите всі деплої

---

## Потрібна допомога?

Email: hello@redcats.agency
