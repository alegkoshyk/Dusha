# ✅ Фінальний чеклист для запуску Dusha

## Статус проекту
- ✅ Код задеплоєно на Vercel: https://dusha-tnxf.vercel.app/
- ✅ База даних Supabase налаштована з SQL дампом
- ⚠️ Потрібно перевірити Environment Variables

---

## Крок 1: Перевірка Environment Variables у Vercel

1. Відкрийте https://vercel.com
2. Перейдіть до проекту **Dusha**
3. Натисніть **Settings** (у верхній панелі)
4. Виберіть **Environment Variables** (ліва панель)

### Перевірте що ЦІ ТРИ змінні додані:

```
DATABASE_URL
postgresql://postgres:0KgTlDIWYEW9yBMX@db.qtcnxhzuctgmbnctjaaq.supabase.co:5432/postgres

SESSION_SECRET
dusha-brand-game-secret-key-2025

NODE_ENV
production
```

### Якщо змінних НЕМАЄ:
1. Натисніть **Add New**
2. **Name**: `DATABASE_URL`
3. **Value**: `postgresql://postgres:0KgTlDIWYEW9yBMX@db.qtcnxhzuctgmbnctjaaq.supabase.co:5432/postgres`
4. **Environment**: оберіть **Production**, **Preview**, та **Development**
5. Натисніть **Save**
6. Повторіть для інших двох змінних

---

## Крок 2: Редеплой після додавання змінних

1. Перейдіть до **Deployments** (верхня панель)
2. Знайдіть останній деплой
3. Натисніть **три крапки (...)** → **Redeploy**
4. Підтвердіть **Redeploy**
5. Дочекайтесь завершення (1-2 хвилини)

---

## Крок 3: Тестування сайту

Відкрийте https://dusha-tnxf.vercel.app/ та перевірте:

### ✅ Головна сторінка:
- [ ] Сторінка завантажується без помилок
- [ ] Немає білого екрану або 500 помилки

### ✅ Реєстрація:
- [ ] Можна створити новий акаунт
- [ ] Перенаправлення після реєстрації працює

### ✅ Логін:
- [ ] Можна увійти в систему
- [ ] Сесія зберігається

### ✅ Гра:
- [ ] Можна створити новий бренд
- [ ] Картки завантажуються
- [ ] Відповіді зберігаються

---

## Якщо виникли помилки

### Помилка 500 Internal Server Error:
1. Перейдіть до **Deployments**
2. Натисніть на останній деплой
3. Відкрийте **Function Logs** (у деталях деплою)
4. Перевірте логи помилок

### База даних не підключається:
1. Перевірте що DATABASE_URL правильний
2. Перевірте що Supabase проект активний
3. Зайдіть у Supabase → SQL Editor → виконайте `SELECT * FROM users LIMIT 1;`

---

## Контакти

Якщо щось не працює, надішліть скріншот з:
- Vercel Function Logs
- Браузерної консолі (F12 → Console)
- Помилки з Supabase (якщо є)

Email: hello@redcats.agency
