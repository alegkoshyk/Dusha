# Душа Бренду — Аудит Архітектури для SaaS
**Дата:** 27.02.2026
**Мета:** Підготовка до масштабування як high-load SaaS для маркетологів, дизайнерів, агенцій та брендів

---

## Загальна Оцінка

| Категорія | Оцінка | Статус |
|---|---|---|
| База даних | 6/10 | ⚠️ Потребує індексів та пулінгу |
| Серверна архітектура | 5/10 | ⚠️ Single-process, не масштабується |
| Безпека | 4/10 | 🔴 Критичні проблеми |
| Кешування | 1/10 | 🔴 Відсутнє |
| Файлове сховище | 7/10 | ✅ R2 налаштований добре |
| Фонові задачі | 3/10 | 🔴 Немає черги задач |
| API дизайн | 6/10 | ⚠️ Немає пагінації |
| Фронтенд | 5/10 | ⚠️ Немає code splitting |
| Моніторинг | 2/10 | 🔴 Тільки базове логування |
| Multi-tenancy | 7/10 | ✅ Ручні перевірки, але консистентні |
| **ЗАГАЛОМ** | **4.6/10** | 🔴 **НЕ ГОТОВИЙ ДО ПРОДАКШН НАВАНТАЖЕННЯ** |

**Поточна ємність:** ~100 одночасних користувачів
**Ціль:** 10,000+ одночасних користувачів

---

## 🔴 КРИТИЧНІ ПРОБЛЕМИ (виправити негайно)

### 1. Безпека сесій та cookies

**Файл:** `server/auth.ts:19, 26`

```typescript
// ПРОБЛЕМА 1: Дефолтний секрет
secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production"

// ПРОБЛЕМА 2: httpOnly вимкнено — JavaScript може вкрасти cookies
httpOnly: false, // "для iPad сумісності"

// ПРОБЛЕМА 3: SameSite=none без гарантованого Secure
sameSite: isProduction ? "none" : "lax"
```

**Наслідки:** Будь-який XSS → повне захоплення акаунту всіх користувачів.

**Виправлення:**
```typescript
// Встановити SESSION_SECRET у .env (мінімум 64 символи)
// Увімкнути httpOnly
httpOnly: true,
// Для iPad — використовувати token-based auth окремо, без компромісу cookies
```

---

### 2. Відсутність Rate Limiting

**Файл:** `server/routes.ts` — 245 endpoints, жодного rate limit

**Відкриті для атаки:**
- `POST /api/auth/login` — brute force паролів
- `POST /api/auth/register` — спам акаунтів
- `POST /api/generate-ai-image` — виснаження OpenAI балансу
- `POST /api/brands/:id/generate-persona` — безкоштовне AI генерування

**Виправлення:**
```typescript
import rateLimit from 'express-rate-limit';

// Для auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use('/api/auth/login', authLimiter);

// Для AI endpoints
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 5 });
app.use('/api/generate-ai-image', aiLimiter);
```

---

### 3. Відсутність кешування

**Поточний стан:** Кожен запит → база даних.

**Що кешується НУЛЬОВИЙ раз:**
- Перевірка підписки (виконується на кожен запит)
- Статичні ігрові картки та рівні (рідко змінюються)
- Список брендів користувача
- Налаштування системи з БД

**Виправлення:** Додати Redis:
```typescript
// Сесії → Redis (замість PostgreSQL)
// Підписки → Redis TTL 5 хвилин
// Картки/рівні → Redis TTL 1 година
// Ліміти квот → Redis TTL 1 хвилина
```

**Очікуваний ефект:** Зменшення навантаження на БД на 70-80%.

---

## 🔴 БАЗА ДАНИХ

### 4. Відсутні індекси

**Файл:** `shared/schema.ts`

**Є індекси на:**
- `users.email`, `users.google_id`, `users.apple_id`
- `sessions.expire`
- `user_subscriptions.user_id`, `user_subscriptions.status`

**ВІДСУТНІ критичні індекси:**
```sql
-- Немає: brandId на game_sessions → повний scan при кожному запиті бренду
CREATE INDEX idx_game_sessions_brand_id ON game_sessions(brand_id);

-- Немає: userId на ai_usage_logs → звіти = повна таблиця
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);

-- Немає: compound index для частих запитів
CREATE INDEX idx_user_brands_user_status ON user_brands(user_id, created_at DESC);
```

---

### 5. Велетенські JSON колонки

**Проблема:** `user_brands.canvas_data` — зберігає знімок tldraw полотна.
**Розмір:** 5-10 МБ на бренд.

```typescript
// ЗАРАЗ: canvas_data в кожному SELECT * FROM user_brands
const brands = await db.query.userBrandsTable.findMany({ where: eq(...) });
// → тягне 10MB canvas для кожного бренду в КОЖНОМУ запиті списку

// ТРЕБА: зберігати в R2, в БД тільки посилання
const brands = await db.select({
  id: userBrandsTable.id,
  name: userBrandsTable.name,
  // canvasUrl замість canvasData
}).from(userBrandsTable);
```

**Виправлення:**
- Перенести `canvas_data` повністю в R2 (вже є `uploadCanvasData` в `r2Storage.ts`)
- Зберігати в БД тільки `canvas_updated_at` та `canvas_url`

---

### 6. N+1 запити та відсутність пагінації

**Файл:** `server/routes.ts`

**Критичні місця без пагінації:**
```typescript
// Повертає ВСІ бренди, без ліміту
GET /api/user/brands → getGameSessionsByBrand(brandId) — ВСІ сесії

// Повертає ВСІ аудиторії
GET /api/brands/:brandId/target-audiences → getTargetAudiences(brandId)

// Повертає ВСІ відповіді на картки
getCardResponses(sessionId) — без ліміту
```

**Виправлення:**
```typescript
// Додати до всіх list-endpoints
const page = parseInt(req.query.page as string) || 1;
const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
const offset = (page - 1) * limit;

const [items, total] = await Promise.all([
  storage.getItems({ limit, offset }),
  storage.countItems()
]);

res.json({ items, total, page, totalPages: Math.ceil(total / limit) });
```

---

## ⚠️ СЕРВЕРНА АРХІТЕКТУРА

### 7. Single-process монолітна архітектура

**Файл:** `server/index.ts:96-103`

```typescript
server.listen({ port, host: "0.0.0.0", reusePort: true });
```

**Проблема:** Один процес, одне ядро CPU, одна точка відмови.
**Пропускна здатність:** ~50-100 RPS на 4vCPU.

**Виправлення (без зміни коду):**
```bash
# Запуск через PM2 cluster mode
npm install -g pm2
pm2 start npm --name "dusha" -i max -- run start

# або через Node cluster API (вимагає refactoring)
```

**Довготерміново:** Перейти на stateless API з горизонтальним масштабуванням (Docker + Kubernetes або Railway/Render multiple instances).

---

### 8. Фоновий білінг на setInterval

**Файл:** `server/billingScheduler.ts`

```typescript
// ПРОБЛЕМА: Примітивний scheduler без відмовостійкості
setInterval(() => checkSubscriptionStatuses(), 60 * 60 * 1000);
```

**Проблеми:**
- Якщо процес впав — білінг зупинився
- При горизонтальному масштабуванні — кожен інстанс запускає білінг (подвійне списання!)
- Обробка йде серіально — 1000+ підписок = блокування event loop
- Немає retry при збої платежу

**Виправлення:**
```typescript
// Використати Bull Queue з Redis
import Queue from 'bull';
const billingQueue = new Queue('billing', { redis: redisConfig });

// Distributed lock через Redis
// Тільки один інстанс виконує задачу
billingQueue.process(async (job) => {
  await checkSubscriptionStatuses();
});

// Додати cron
billingQueue.add({}, { repeat: { cron: '0 * * * *' } });
```

---

## ⚠️ МОНІТОРИНГ ТА СПОСТЕРЕЖУВАНІСТЬ

### 9. Практично відсутній моніторинг

**Файл:** `server/index.ts:17-45`

**Є:**
- ✅ Простий request logger (метод + статус + час)

**Немає:**
- ❌ Трекінг помилок (Sentry, Bugsnag)
- ❌ Метрики (Prometheus, Datadog)
- ❌ Health check endpoint (`/health`, `/ready`)
- ❌ Structured logging (Winston, Pino)
- ❌ Correlation ID для трейсингу запитів
- ❌ Алерти на помилки білінгу

**Негайне виправлення — додати `/health`:**
```typescript
app.get('/health', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', db: 'unavailable' });
  }
});
```

---

## ⚠️ ФРОНТЕНД

### 10. Відсутність Code Splitting

**Файл:** `vite.config.ts`

**Проблема:** Весь бандл (~2-3MB) завантажується при першому відкритті.
Включає: tldraw (~500KB), Framer Motion, recharts, rete — навіть якщо користувач відкрив тільки dashboard.

**Виправлення:**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-ui': ['react', 'react-dom', 'wouter'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-canvas': ['tldraw'],
        'vendor-charts': ['recharts'],
        'vendor-motion': ['framer-motion'],
      }
    }
  }
}

// В компонентах
const BrandCanvas = lazy(() => import('./pages/brand-canvas'));
const NameGenerator = lazy(() => import('./pages/name-generator'));
```

**Очікуваний ефект:** Перший завантаження зменшиться з 2-3MB до 300-500KB.

---

### 11. Токен авторизації в localStorage

**Файл:** `client/src/lib/queryClient.ts:16`

```typescript
const authToken = localStorage.getItem('authToken');
```

**Проблема:** localStorage доступний будь-якому JavaScript на сторінці.
XSS атака → вкрадені токени всіх активних користувачів.

**Виправлення:** Якщо потрібен токен (наприклад для мобільних) — зберігати в httpOnly cookie або SecureStore (Capacitor).

---

## ✅ ЩО ЗРОБЛЕНО ДОБРЕ

1. **Cloudflare R2** — правильно налаштований, immutable cache headers, організовані шляхи
2. **Drizzle ORM** — типобезпечні запити, немає SQL injection
3. **Multi-tenancy перевірки** — на кожному endpoint перевіряється `brand.userId === currentUser.id`
4. **Квоти сховища** — система обліку медіа (є перевірки перед upload)
5. **PostgreSQL для сесій** — сесії не в пам'яті, можна масштабувати
6. **OAuth (Google, Apple)** — підтримується для зручного входу
7. **Типізація TypeScript** — strict mode включено
8. **Zod валідація** — є на endpoint'ах реєстрації/входу

---

## ПЛАН ДІЙ

### Тиждень 1 — Безпека та стабільність
- [ ] Встановити `SESSION_SECRET` в production environment
- [ ] Встановити `express-rate-limit`, додати ліміти на auth та AI endpoints
- [ ] Увімкнути `httpOnly: true` для cookies
- [ ] Додати `/health` endpoint
- [ ] Додати Sentry для трекінгу помилок

### Місяць 1 — Продуктивність
- [ ] Додати Redis (Upstash — безкоштовний tier є): кешування підписок, сесій, карток
- [ ] Додати пагінацію до всіх list-endpoints
- [ ] Додати відсутні індекси БД (`game_sessions.brand_id` та ін.)
- [ ] Перенести `canvas_data` з БД у R2
- [ ] Налаштувати code splitting у Vite

### Місяць 2-3 — Масштабування
- [ ] Замінити `setInterval` billing на Bull Queue (Redis)
- [ ] Налаштувати PM2 cluster mode або контейнеризацію
- [ ] Додати structured logging (Pino або Winston)
- [ ] Профілювання slow queries (EXPLAIN ANALYZE)
- [ ] Перевірити race condition у системі квот (SELECT FOR UPDATE)

### Квартал 2 — Enterprise
- [ ] Горизонтальне масштабування (multiple instances + load balancer)
- [ ] CDN для статики (Cloudflare Pages або Vercel)
- [ ] Окремий мікросервіс для AI генерації (async queue)
- [ ] Database read replicas для звітів та аналітики
- [ ] Row-Level Security в PostgreSQL

---

## Технічний Борг (не критично, але важливо)

| Проблема | Файл | Пріоритет |
|---|---|---|
| Відсутній CORS конфіг | `server/index.ts` | Середній |
| `throw err` після `res.status()` | `server/index.ts:80` | Низький |
| Inconsistent error format (`error` vs `message`) | `server/routes.ts` | Низький |
| Немає request correlation ID | `server/index.ts` | Середній |
| Race condition у quota check | `server/routes.ts:2502` | Середній |
| Нема retry в queryClient | `client/src/lib/queryClient.ts` | Низький |
| URL validation для image fetch | `server/r2Storage.ts:229` | Середній |

---

*Документ створено на основі аудиту вихідного коду. Оновлювати при кожному значному рефакторингу.*
