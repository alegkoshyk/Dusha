/**
 * Тести для повного потоку гри "Душа бренду"
 * Перевіряють кожну картку та загальний флоу
 */

const BASE_URL = 'http://localhost:5000';

// Тестові дані користувача
const TEST_USER = {
  email: 'aleg@redcats.agency',
  password: 'Donttmenoww87',
  firstName: 'Aleg',
  lastName: 'Кузнецов'
};

// Тестові дані бренду
const TEST_BRAND = {
  name: 'Test Brand',
  description: 'Тестовий бренд для перевірки функціональності'
};

// Тестові відповіді для кожної картки
const CARD_RESPONSES = {
  'soul-values': ['innovation', 'quality', 'honesty'], // Множинний вибір
  'soul-deep-values': 'Наші цінності проявляються в кожному проекті: ми завжди шукаємо нові рішення, дотримуємося високих стандартів якості та чесно спілкуємося з клієнтами. Інноваційність допомагає нам створювати унікальні продукти, якість забезпечує довіру клієнтів, а чесність будує довготривалі відносини.', // Текст (для тесту картки "Глибина цінностей")
  'soul-mission': 'Ми створюємо цифрові рішення, що змінюють світ на краще', // Текст
  'soul-story': 'Наша історія почалася з мрії змінити підхід до цифрового маркетингу та допомогти бізнесу розвиватися в цифровому світі', // Довгий текст
  'soul-impact': 'Допомагаємо брендам знаходити свою аудиторію та будувати довірчі відносини', // Текст
  'soul-archetype': 'creator', // Вибір
};

class GameFlowTester {
  constructor() {
    this.sessionCookie = null;
    this.userId = null;
    this.brandId = null;
    this.gameSessionId = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async fetch(url, options = {}) {
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.sessionCookie ? { 'Cookie': this.sessionCookie } : {}),
        ...options.headers
      },
      credentials: 'include'
    });

    // Зберігаємо cookie для наступних запитів
    if (response.headers.get('set-cookie')) {
      this.sessionCookie = response.headers.get('set-cookie');
    }

    return response;
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 Тестую: ${name}`);
      await testFn();
      console.log(`✅ ${name} - ПРОЙДЕНО`);
      this.results.passed++;
    } catch (error) {
      console.error(`❌ ${name} - ПОМИЛКА:`, error.message);
      this.results.errors.push({ test: name, error: error.message });
      this.results.failed++;
    }
  }

  async assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  async assertResponse(response, expectedStatus, message) {
    if (response.status !== expectedStatus) {
      const errorText = await response.text();
      throw new Error(`${message}. Очікувався статус ${expectedStatus}, отримано ${response.status}. Відповідь: ${errorText}`);
    }
  }

  // Тест реєстрації користувача
  async testUserRegistration() {
    const response = await this.fetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    await this.assertResponse(response, 201, 'Не вдалося зареєструвати користувача');
    
    const data = await response.json();
    this.userId = data.user.id;
    this.assert(this.userId, 'ID користувача не повернено');
  }

  // Тест входу в систему
  async testUserLogin() {
    const response = await this.fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    await this.assertResponse(response, 200, 'Не вдалося увійти в систему');
    
    const data = await response.json();
    this.userId = data.user.id;
    this.assert(this.userId, 'ID користувача не повернено при вході');
  }

  // Тест створення бренду
  async testBrandCreation() {
    const response = await this.fetch('/api/user/brands', {
      method: 'POST',
      body: JSON.stringify(TEST_BRAND)
    });

    await this.assertResponse(response, 201, 'Не вдалося створити бренд');
    
    const brand = await response.json();
    this.brandId = brand.id;
    this.assert(this.brandId, 'ID бренду не повернено');
    this.assert(brand.name === TEST_BRAND.name, 'Назва бренду не збереглася');
  }

  // Тест створення ігрової сесії
  async testGameSessionCreation() {
    const response = await this.fetch('/api/game-sessions', {
      method: 'POST',
      body: JSON.stringify({
        brandId: this.brandId
      })
    });

    await this.assertResponse(response, 200, 'Не вдалося створити ігрову сесію');
    
    const session = await response.json();
    this.gameSessionId = session.id;
    this.assert(this.gameSessionId, 'ID сесії не повернено');
    this.assert(session.brandId === this.brandId, 'Сесія не прив\'язана до бренду');
  }

  // Тест перевірки, що створюється лише одна активна гра на бренд
  async testSingleActiveGamePerBrand() {
    const response = await this.fetch('/api/game-sessions', {
      method: 'POST',
      body: JSON.stringify({
        brandId: this.brandId
      })
    });

    await this.assertResponse(response, 200, 'Не вдалося отримати відповідь про створення другої гри');
    
    const session = await response.json();
    this.assert(session.id === this.gameSessionId, `Створилася нова гра (${session.id}) замість повернення існуючої (${this.gameSessionId})`);
  }

  // Тест збереження відповідей на картки
  async testCardResponses() {
    for (const [cardId, response] of Object.entries(CARD_RESPONSES)) {
      if (response === null) continue; // Пропускаємо інформаційні картки

      const responseData = await this.fetch(`/api/game-sessions/${this.gameSessionId}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          cardId,
          response,
          responseType: Array.isArray(response) ? 'choice' : 'text'
        })
      });

      await this.assertResponse(responseData, 200, `Не вдалося зберегти відповідь для картки ${cardId}`);
      
      const sessionData = await responseData.json();
      this.assert(sessionData.responses && sessionData.responses[cardId], `Відповідь для картки ${cardId} не збереглася`);
      
      console.log(`  ✓ Картка ${cardId} - відповідь збережена`);
    }
  }

  // Тест отримання ігрової сесії з відповідями
  async testGetGameSessionWithResponses() {
    const response = await this.fetch(`/api/game-sessions/${this.gameSessionId}`);
    
    await this.assertResponse(response, 200, 'Не вдалося отримати ігрову сесію');
    
    const session = await response.json();
    this.assert(session.responses, 'Відповіді не повернулися з сесією');
    
    // Перевіряємо що всі відповіді збереглися
    for (const [cardId, expectedResponse] of Object.entries(CARD_RESPONSES)) {
      if (expectedResponse === null) continue;
      
      this.assert(session.responses[cardId], `Відповідь для картки ${cardId} відсутня в сесії`);
    }
  }

  // Тест генерації карти бренду
  async testBrandMapGeneration() {
    const response = await this.fetch(`/api/game-sessions/${this.gameSessionId}/brand-map`);
    
    await this.assertResponse(response, 200, 'Не вдалося згенерувати карту бренду');
    
    const brandMap = await response.json();
    this.assert(brandMap.soul, 'Секція Soul відсутня в карті бренду');
    this.assert(brandMap.mind, 'Секція Mind відсутня в карті бренду');
    this.assert(brandMap.body, 'Секція Body відсутня в карті бренду');
    
    // Перевіряємо наявність ключових даних
    this.assert(brandMap.soul.values && brandMap.soul.values.length > 0, 'Цінності не збереглися в карті бренду');
    this.assert(brandMap.soul.mission, 'Місія не збереглася в карті бренду');
  }

  // Тест дашборду
  async testDashboard() {
    // Отримуємо бренди користувача
    const brandsResponse = await this.fetch('/api/user/brands');
    await this.assertResponse(brandsResponse, 200, 'Не вдалося отримати бренди користувача');
    
    const brands = await brandsResponse.json();
    this.assert(brands.length > 0, 'Бренди користувача не знайдені');
    this.assert(brands.some(b => b.id === this.brandId), 'Створений бренд не знайдений в списку');

    // Отримуємо ігрові сесії користувача
    const sessionsResponse = await this.fetch('/api/user/game-sessions');
    await this.assertResponse(sessionsResponse, 200, 'Не вдалося отримати ігрові сесії користувача');
    
    const sessions = await sessionsResponse.json();
    this.assert(sessions.length > 0, 'Ігрові сесії користувача не знайдені');
    this.assert(sessions.some(s => s.id === this.gameSessionId), 'Створена сесія не знайдена в списку');
  }

  // Очищення тестових даних
  async cleanup() {
    try {
      if (this.brandId) {
        await this.fetch(`/api/user/brands/${this.brandId}`, { method: 'DELETE' });
      }
    } catch (error) {
      console.warn('Помилка при очищенні тестових даних:', error.message);
    }
  }

  // Запуск всіх тестів
  async runAllTests() {
    console.log('🚀 Запуск тестів гри "Душа бренду"');
    console.log('=====================================');

    try {
      // Тести аутентифікації
      await this.test('Вхід користувача', () => this.testUserLogin());
      
      // Тести брендів
      await this.test('Створення бренду', () => this.testBrandCreation());
      
      // Тести ігрових сесій
      await this.test('Створення ігрової сесії', () => this.testGameSessionCreation());
      
      // Тести карток та відповідей
      await this.test('Збереження відповідей на картки', () => this.testCardResponses());
      await this.test('Отримання сесії з відповідями', () => this.testGetGameSessionWithResponses());
      
      // Тести карти бренду
      await this.test('Генерація карти бренду', () => this.testBrandMapGeneration());
      
      // Тести дашборду
      await this.test('Функціональність дашборду', () => this.testDashboard());

    } finally {
      await this.cleanup();
    }

    console.log('\n📊 Результати тестування:');
    console.log('==========================');
    console.log(`✅ Пройдено: ${this.results.passed}`);
    console.log(`❌ Помилок: ${this.results.failed}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🔍 Деталі помилок:');
      this.results.errors.forEach(({ test, error }) => {
        console.log(`  • ${test}: ${error}`);
      });
    }

    const success = this.results.failed === 0;
    console.log(`\n${success ? '🎉 Всі тести пройшли успішно!' : '⚠️  Деякі тести не пройшли'}`);
    
    return success;
  }
}

// Запуск тестів якщо файл викликається напряму
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new GameFlowTester();
  tester.runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Критична помилка:', error);
      process.exit(1);
    });
}

export default GameFlowTester;