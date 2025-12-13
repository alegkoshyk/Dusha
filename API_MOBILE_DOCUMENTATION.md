# Душа Бренду - API Documentation for Mobile Development

Ця документація призначена для розробки нативних мобільних додатків (iOS/Android) з використанням API серверу "Душа Бренду".

## Базова інформація

| Параметр | Значення |
|----------|----------|
| **Base URL** | `https://brandsoul.site/api` |
| **Формат даних** | JSON |
| **Кодування** | UTF-8 |
| **Автентифікація** | Bearer Token або Cookie Session |

---

## Автентифікація

### Механізм автентифікації

API підтримує два методи автентифікації:

1. **Auth Token** (рекомендовано для мобільних додатків)
   - Зберігайте токен в Keychain (iOS) або EncryptedSharedPreferences (Android)
   - Передавайте в header: `Authorization: Bearer <token>`

2. **Session Cookie** (альтернатива)
   - Автоматично встановлюється після логіну
   - Потребує підтримки cookies в HTTP клієнті

### Headers для всіх запитів

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <auth_token>  // Якщо є токен
```

---

## API Endpoints

### 1. Реєстрація

**POST** `/api/auth/register`

Створення нового акаунту користувача.

**Request Body:**
```json
{
  "email": "string (required, email format)",
  "firstName": "string (required, max 100 chars)",
  "lastName": "string (optional, max 100 chars)",
  "password": "string (required, min 8 chars)",
  "confirmPassword": "string (required, must match password)"
}
```

**Success Response:** `201 Created`
```json
{
  "message": "Користувач успішно зареєстрований",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "Ім'я",
    "lastName": "Прізвище",
    "role": "user",
    "isActive": true,
    "avatar": null,
    "createdAt": "2024-12-13T10:00:00.000Z"
  }
}
```

**Error Responses:**

| Code | Body | Опис |
|------|------|------|
| 400 | `{"error": "Користувач з такою email адресою вже існує"}` | Email зайнятий |
| 400 | `{"error": "Помилка реєстрації користувача"}` | Невалідні дані |

---

### 2. Вхід в систему

**POST** `/api/auth/login`

Автентифікація користувача.

**Request Body:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```

**Success Response:** `200 OK`
```json
{
  "message": "Успішний вхід в систему",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "Ім'я",
    "lastName": "Прізвище",
    "role": "user",
    "isActive": true,
    "avatar": "https://...",
    "googleId": null,
    "appleId": null,
    "authProvider": "email",
    "createdAt": "2024-12-13T10:00:00.000Z",
    "lastLoginAt": "2024-12-13T15:30:00.000Z"
  },
  "authToken": "auth_uuid_timestamp_randomstring"
}
```

> **ВАЖЛИВО для iOS/Android:** Збережіть `authToken` в secure storage для подальших запитів.

**Error Responses:**

| Code | Body |
|------|------|
| 401 | `{"error": "Неправильний email або пароль"}` |
| 400 | `{"error": "Помилка входу в систему"}` |

---

### 3. Отримати поточного користувача

**GET** `/api/auth/me`

Перевірка автентифікації та отримання даних користувача.

**Headers:**
```http
Authorization: Bearer <auth_token>
```

**Success Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "firstName": "Ім'я",
    "lastName": "Прізвище",
    "role": "user",
    "isActive": true,
    "avatar": "https://...",
    "googleId": null,
    "appleId": null,
    "authProvider": "email",
    "createdAt": "2024-12-13T10:00:00.000Z",
    "lastLoginAt": "2024-12-13T15:30:00.000Z"
  },
  "profile": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "bio": "Про себе",
    "company": "Назва компанії",
    "position": "Посада",
    "website": "https://...",
    "socialLinks": {},
    "skills": [],
    "interests": [],
    "achievements": [],
    "totalXp": 150,
    "level": 2,
    "createdAt": "2024-12-13T10:00:00.000Z"
  },
  "settings": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "language": "uk",
    "theme": "light",
    "notifications": {"email": true, "push": true},
    "gamePreferences": {}
  }
}
```

**Error Responses:**

| Code | Body |
|------|------|
| 401 | `{"error": "Authentication required", "message": "Потрібна авторизація"}` |
| 404 | `{"error": "Користувач не знайдений"}` |

---

### 4. Вихід з системи

**POST** `/api/auth/logout`

Завершення сесії користувача.

**Success Response:** `200 OK`
```json
{
  "message": "Успішний вихід з системи"
}
```

---

### 5. OAuth провайдери (для інформації)

**GET** `/api/auth/providers`

Перевірка доступних методів автентифікації.

**Response:** `200 OK`
```json
{
  "google": true,
  "apple": true,
  "email": true
}
```

> **Примітка:** Для OAuth в мобільних додатках використовуйте нативні SDK:
> - iOS: `AuthenticationServices` (Apple), `GoogleSignIn` (Google)
> - Android: `Credential Manager` (Google), `Sign In with Apple` library

---

## Бренди користувача

### 6. Отримати всі бренди

**GET** `/api/user/brands`

**Headers:**
```http
Authorization: Bearer <auth_token>
```

**Success Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "userId": "uuid-string",
    "name": "Назва бренду",
    "description": "Опис бренду",
    "logo": null,
    "status": "active",
    "totalProgress": 45,
    "completedAt": null,
    "createdAt": "2024-12-13T10:00:00.000Z",
    "updatedAt": "2024-12-13T12:00:00.000Z"
  }
]
```

**Brand Status Values:**
- `active` - Активний бренд
- `archived` - В архіві
- `completed` - Гра завершена

---

### 7. Створити бренд

**POST** `/api/user/brands`

**Headers:**
```http
Authorization: Bearer <auth_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "string (required, max 200 chars)",
  "description": "string (optional)"
}
```

**Success Response:** `201 Created`
```json
{
  "id": "uuid-string",
  "userId": "uuid-string",
  "name": "Новий бренд",
  "description": "Опис",
  "logo": null,
  "status": "active",
  "totalProgress": 0,
  "completedAt": null,
  "createdAt": "2024-12-13T16:00:00.000Z",
  "updatedAt": "2024-12-13T16:00:00.000Z"
}
```

---

### 8. Видалити бренд

**DELETE** `/api/user/brands/:brandId`

**Parameters:**
- `brandId` (path) - UUID бренду

**Success Response:** `200 OK`
```json
{
  "message": "Бренд успішно видалено"
}
```

---

## Ігрові сесії

### 9. Отримати всі сесії користувача

**GET** `/api/user/game-sessions`

**Headers:**
```http
Authorization: Bearer <auth_token>
```

**Success Response:** `200 OK`
```json
[
  {
    "id": "uuid-string",
    "userId": "uuid-string",
    "brandId": "uuid-string",
    "currentLevel": "soul",
    "currentCard": "soul-mission",
    "completedCards": ["soul-start", "soul-values"],
    "progress": 25,
    "totalXp": 50,
    "earnedBadges": [],
    "completed": null,
    "createdAt": "2024-12-13T10:00:00.000Z",
    "updatedAt": "2024-12-13T14:00:00.000Z"
  }
]
```

**Level Values:**
- `soul` - Рівень "Душа"
- `mind` - Рівень "Розум"
- `body` - Рівень "Тіло"

---

### 10. Створити нову ігрову сесію

**POST** `/api/game-sessions`

**Request Body:**
```json
{
  "brandId": "uuid-string (required)"
}
```

**Success Response:** `201 Created`
```json
{
  "id": "uuid-string",
  "userId": "uuid-string",
  "brandId": "uuid-string",
  "currentLevel": "soul",
  "currentCard": "soul-start",
  "completedCards": [],
  "progress": 0,
  "totalXp": 0,
  "earnedBadges": [],
  "completed": null,
  "createdAt": "2024-12-13T16:00:00.000Z",
  "updatedAt": "2024-12-13T16:00:00.000Z"
}
```

---

### 11. Отримати деталі сесії

**GET** `/api/game-sessions/:sessionId`

**Parameters:**
- `sessionId` (path) - UUID сесії

**Success Response:** `200 OK`
```json
{
  "session": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "brandId": "uuid-string",
    "currentLevel": "soul",
    "currentCard": "soul-mission",
    "completedCards": ["soul-start"],
    "progress": 15,
    "totalXp": 25,
    "earnedBadges": [],
    "completed": null,
    "createdAt": "2024-12-13T10:00:00.000Z",
    "updatedAt": "2024-12-13T14:00:00.000Z"
  },
  "brand": {
    "id": "uuid-string",
    "name": "Назва бренду",
    "description": "Опис"
  },
  "responses": [
    {
      "cardId": "soul-start",
      "response": {"text": "Відповідь користувача"},
      "submittedAt": "2024-12-13T12:00:00.000Z"
    }
  ]
}
```

---

### 12. Видалити сесію

**DELETE** `/api/game-sessions/:sessionId`

**Success Response:** `200 OK`
```json
{
  "message": "Сесію успішно видалено"
}
```

---

### 13. Оновити прогрес сесії

**PATCH** `/api/game-sessions/:sessionId/progress`

**Request Body:**
```json
{
  "currentLevel": "soul | mind | body (optional)",
  "currentCard": "string (optional)",
  "progress": "number 0-100 (required)"
}
```

**Success Response:** `200 OK`
```json
{
  "id": "uuid-string",
  "currentLevel": "mind",
  "currentCard": "mind-audience",
  "progress": 50,
  "updatedAt": "2024-12-13T16:00:00.000Z"
}
```

---

## Картки та відповіді

### 14. Отримати картки для сесії

**GET** `/api/game-sessions/:sessionId/cards`

Повертає всі картки, згруповані по рівнях.

**Success Response:** `200 OK`
```json
{
  "levels": [
    {
      "id": "soul",
      "name": "Душа",
      "description": "Глибинні цінності та місія бренду",
      "order": 1,
      "color": "#DC2626",
      "icon": "heart"
    },
    {
      "id": "mind",
      "name": "Розум",
      "description": "Стратегія та позиціонування",
      "order": 2,
      "color": "#2563EB",
      "icon": "brain"
    },
    {
      "id": "body",
      "name": "Тіло",
      "description": "Реалізація та комунікації",
      "order": 3,
      "color": "#16A34A",
      "icon": "zap"
    }
  ],
  "cards": [
    {
      "id": "soul-start",
      "levelId": "soul",
      "title": "Вітання",
      "description": "Повний опис картки...",
      "shortDescription": "Короткий опис",
      "hint": "Підказка для користувача",
      "type": "text",
      "difficulty": "easy",
      "estimatedTime": 60,
      "required": true,
      "positionX": 1,
      "positionY": 1,
      "validation": {"minLength": 10, "maxLength": 500},
      "rewards": {"xp": 10, "badge": null}
    },
    {
      "id": "soul-values",
      "levelId": "soul",
      "title": "Цінності бренду",
      "description": "Оберіть 3-5 цінностей...",
      "shortDescription": "Ваші цінності",
      "hint": null,
      "type": "values",
      "difficulty": "medium",
      "estimatedTime": 180,
      "required": true,
      "positionX": 2,
      "positionY": 1,
      "validation": {"minSelection": 3, "maxSelection": 5},
      "rewards": {"xp": 25, "badge": "values-master"}
    }
  ],
  "properties": [
    {
      "id": 1,
      "cardId": "soul-values",
      "type": "option",
      "key": "innovation",
      "label": "Інновації",
      "icon": "💡",
      "description": "Прагнення до нового",
      "value": null
    },
    {
      "id": 2,
      "cardId": "soul-values",
      "type": "option",
      "key": "quality",
      "label": "Якість",
      "icon": "⭐",
      "description": "Найвищі стандарти",
      "value": null
    }
  ]
}
```

**Card Types:**

| Type | Опис | Response Format |
|------|------|-----------------|
| `text` | Вільний текст | `{"text": "..."}` |
| `choice` | Один вибір | `{"selected": "option_key"}` |
| `values` | Множинний вибір | `{"values": ["key1", "key2", "key3"]}` |
| `reflection` | Рефлексія | `{"text": "..."}` |
| `archetype` | Архетип бренду | `{"archetype": "creator"}` |
| `completion` | Завершення | `{"completed": true}` |

---

### 15. Зберегти відповідь на картку

**POST** `/api/game-sessions/:sessionId/response`

**Request Body:**
```json
{
  "cardId": "string (required)",
  "response": "object (required, format depends on card type)",
  "timeSpent": "number (optional, seconds)",
  "isWithinTimeLimit": "boolean (optional)"
}
```

**Examples by card type:**

Text card:
```json
{
  "cardId": "soul-mission",
  "response": {"text": "Наша місія - допомагати людям..."},
  "timeSpent": 120
}
```

Values card:
```json
{
  "cardId": "soul-values",
  "response": {"values": ["innovation", "quality", "trust"]},
  "timeSpent": 180,
  "isWithinTimeLimit": true
}
```

Choice card:
```json
{
  "cardId": "mind-archetype",
  "response": {"selected": "creator"},
  "timeSpent": 45
}
```

**Success Response:** `200 OK`
```json
{
  "id": 123,
  "sessionId": "uuid-string",
  "cardId": "soul-mission",
  "response": {"text": "Наша місія..."},
  "responseType": "text",
  "timeSpent": 120,
  "isWithinTimeLimit": true,
  "earnedXP": 25,
  "submittedAt": "2024-12-13T16:00:00.000Z"
}
```

---

### 16. Отримати всі відповіді сесії

**GET** `/api/game-sessions/:sessionId/responses`

**Success Response:** `200 OK`
```json
[
  {
    "id": 1,
    "sessionId": "uuid-string",
    "cardId": "soul-start",
    "response": {"text": "Привіт!"},
    "responseType": "text",
    "timeSpent": 30,
    "isWithinTimeLimit": true,
    "earnedXP": 10,
    "submittedAt": "2024-12-13T10:00:00.000Z"
  },
  {
    "id": 2,
    "sessionId": "uuid-string",
    "cardId": "soul-values",
    "response": {"values": ["innovation", "quality"]},
    "responseType": "values",
    "timeSpent": 150,
    "isWithinTimeLimit": true,
    "earnedXP": 25,
    "submittedAt": "2024-12-13T10:05:00.000Z"
  }
]
```

---

## Brand Map

### 17. Отримати Brand Map

**GET** `/api/game-sessions/:sessionId/brand-map`

Повертає структуровану карту бренду на основі всіх відповідей.

**Success Response:** `200 OK`
```json
{
  "brandId": "uuid-string",
  "brandName": "Назва бренду",
  "completedAt": "2024-12-13T18:00:00.000Z",
  "soul": {
    "mission": "Місія бренду...",
    "values": ["Інновації", "Якість", "Довіра"],
    "story": "Історія створення бренду...",
    "purpose": "Мета існування..."
  },
  "mind": {
    "targetAudience": "Підприємці 25-45 років...",
    "positioning": "Лідер у сфері...",
    "archetype": {
      "id": "creator",
      "name": "Творець",
      "description": "Інноватор, який створює нове"
    },
    "brandIdea": "Головна ідея бренду...",
    "promise": "Обіцянка клієнтам...",
    "uniqueValue": "Унікальна цінність..."
  },
  "body": {
    "products": ["Продукт 1", "Продукт 2"],
    "channels": ["Instagram", "LinkedIn", "Website"],
    "visualStyle": "Мінімалістичний, сучасний...",
    "toneOfVoice": "Дружній та експертний",
    "actions": ["Запустити сайт", "Створити контент-план"],
    "resources": ["Бюджет", "Команда", "Час"]
  },
  "totalXp": 350,
  "completionTime": 3600
}
```

---

## Статистика користувача

### 18. Отримати статистику

**GET** `/api/user/stats`

**Success Response:** `200 OK`
```json
{
  "totalXp": 450,
  "totalGames": 5,
  "completedGames": 2,
  "level": 3,
  "badges": ["values-master", "quick-thinker"],
  "averageCompletionTime": 2400
}
```

---

## Коди помилок

| HTTP Code | Значення |
|-----------|----------|
| 200 | Успішний запит |
| 201 | Успішно створено |
| 400 | Невалідні дані запиту |
| 401 | Не авторизовано (потрібен токен) |
| 403 | Доступ заборонено |
| 404 | Ресурс не знайдено |
| 500 | Серверна помилка |

---

## Приклади коду

### iOS (Swift)

```swift
import Foundation

class BrandSoulAPI {
    static let baseURL = "https://brandsoul.site/api"
    private var authToken: String?
    
    // Login
    func login(email: String, password: String) async throws -> LoginResponse {
        let url = URL(string: "\(Self.baseURL)/auth/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.loginFailed
        }
        
        let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
        self.authToken = loginResponse.authToken
        
        // Save token to Keychain
        KeychainHelper.save(key: "authToken", value: loginResponse.authToken)
        
        return loginResponse
    }
    
    // Get brands
    func getBrands() async throws -> [Brand] {
        guard let token = authToken else { throw APIError.notAuthenticated }
        
        let url = URL(string: "\(Self.baseURL)/user/brands")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode([Brand].self, from: data)
    }
    
    // Submit card response
    func submitResponse(sessionId: String, cardId: String, response: Any, timeSpent: Int) async throws {
        guard let token = authToken else { throw APIError.notAuthenticated }
        
        let url = URL(string: "\(Self.baseURL)/game-sessions/\(sessionId)/response")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let body: [String: Any] = [
            "cardId": cardId,
            "response": response,
            "timeSpent": timeSpent
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        
        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw APIError.submitFailed
        }
    }
}

// Models
struct LoginResponse: Codable {
    let message: String
    let user: User
    let authToken: String
}

struct User: Codable {
    let id: String
    let email: String
    let firstName: String?
    let lastName: String?
    let role: String
}

struct Brand: Codable {
    let id: String
    let name: String
    let description: String?
    let status: String
    let totalProgress: Int
}
```

### Android (Kotlin)

```kotlin
import retrofit2.Retrofit
import retrofit2.http.*
import retrofit2.converter.gson.GsonConverterFactory

// API Interface
interface BrandSoulAPI {
    
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse
    
    @GET("auth/me")
    suspend fun getCurrentUser(@Header("Authorization") token: String): UserResponse
    
    @GET("user/brands")
    suspend fun getBrands(@Header("Authorization") token: String): List<Brand>
    
    @POST("user/brands")
    suspend fun createBrand(
        @Header("Authorization") token: String,
        @Body request: CreateBrandRequest
    ): Brand
    
    @POST("game-sessions")
    suspend fun createSession(
        @Header("Authorization") token: String,
        @Body request: CreateSessionRequest
    ): GameSession
    
    @GET("game-sessions/{sessionId}/cards")
    suspend fun getCards(
        @Header("Authorization") token: String,
        @Path("sessionId") sessionId: String
    ): CardsResponse
    
    @POST("game-sessions/{sessionId}/response")
    suspend fun submitResponse(
        @Header("Authorization") token: String,
        @Path("sessionId") sessionId: String,
        @Body request: CardResponseRequest
    ): CardResponseResult
    
    @GET("game-sessions/{sessionId}/brand-map")
    suspend fun getBrandMap(
        @Header("Authorization") token: String,
        @Path("sessionId") sessionId: String
    ): BrandMap
}

// Data Classes
data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val message: String,
    val user: User,
    val authToken: String
)

data class User(
    val id: String,
    val email: String,
    val firstName: String?,
    val lastName: String?,
    val role: String,
    val isActive: Boolean
)

data class Brand(
    val id: String,
    val userId: String,
    val name: String,
    val description: String?,
    val status: String,
    val totalProgress: Int,
    val createdAt: String
)

data class GameSession(
    val id: String,
    val brandId: String,
    val currentLevel: String,
    val currentCard: String,
    val completedCards: List<String>,
    val progress: Int,
    val totalXp: Int
)

data class CardResponseRequest(
    val cardId: String,
    val response: Any,
    val timeSpent: Int? = null,
    val isWithinTimeLimit: Boolean? = null
)

// Repository
class BrandSoulRepository {
    private val api: BrandSoulAPI
    private var authToken: String? = null
    
    init {
        val retrofit = Retrofit.Builder()
            .baseUrl("https://brandsoul.site/api/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
        api = retrofit.create(BrandSoulAPI::class.java)
    }
    
    suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = api.login(LoginRequest(email, password))
            authToken = response.authToken
            // Save to EncryptedSharedPreferences
            saveToken(response.authToken)
            Result.success(response.user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun getBrands(): Result<List<Brand>> {
        val token = authToken ?: return Result.failure(Exception("Not authenticated"))
        return try {
            val brands = api.getBrands("Bearer $token")
            Result.success(brands)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun submitCardResponse(
        sessionId: String,
        cardId: String,
        response: Any,
        timeSpent: Int
    ): Result<Unit> {
        val token = authToken ?: return Result.failure(Exception("Not authenticated"))
        return try {
            api.submitResponse(
                "Bearer $token",
                sessionId,
                CardResponseRequest(cardId, response, timeSpent)
            )
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

---

## WebSocket (опціонально)

Для real-time оновлень можна використати WebSocket:

**URL:** `wss://brandsoul.site/ws`

**Events:**
- `session:progress` - Оновлення прогресу
- `session:complete` - Завершення гри
- `xp:earned` - Нарахування XP

---

## Rate Limits

| Endpoint | Ліміт |
|----------|-------|
| `/auth/login` | 5 запитів / хвилину |
| `/auth/register` | 3 запити / хвилину |
| Інші | 100 запитів / хвилину |

---

## Контакти для розробників

- **API Issues:** hello@redcats.agency
- **Production URL:** https://brandsoul.site
- **API Version:** 1.0

---

*Документація оновлена: Грудень 2024*
