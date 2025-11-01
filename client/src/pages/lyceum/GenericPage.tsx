import { LyceumPageTemplate } from "@/components/lyceum/LyceumPageTemplate";
import { useRoute } from "wouter";
import { BookOpen, Users, Award, Lightbulb, Heart, Shield } from "lucide-react";

// Контент для різних сторінок
const pageContent: Record<string, { title: string; description: string; content: any }> = {
  "/lyceum/o-nas/zasnovniki": {
    title: "Команда і засновники",
    description: "Професійна команда, яка створює майбутнє української освіти",
    content: (
      <div className="space-y-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          Міжнародний ліцей МАУП був заснований групою освітян та підприємців,
          які об'єднали свої зусилля для створення освітнього закладу нового покоління.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-3">Георгій Климович Вернидубов</h3>
            <p className="text-blue-600 mb-3">Президент МАУП, засновник ліцею</p>
            <p className="text-gray-600">
              Доктор економічних наук, професор, академік. Більше 30 років присвятив розвитку освіти в Україні.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  "/lyceum/o-nas/administraciya": {
    title: "Адміністрація",
    description: "Керівництво ліцею - досвідчені професіонали у сфері освіти",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">Директор</h3>
            <p className="text-gray-600 mb-2">Керівник освітнього процесу</p>
            <p className="text-sm text-gray-500">Email: director@ilmaup.com.ua</p>
            <p className="text-sm text-gray-500">Тел: +38 (044) 254-05-85</p>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">Заступник директора з НВР</h3>
            <p className="text-gray-600 mb-2">Навчально-виховна робота</p>
            <p className="text-sm text-gray-500">Email: nvr@ilmaup.com.ua</p>
          </div>
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-2">Заступник директора з ВР</h3>
            <p className="text-gray-600 mb-2">Виховна робота</p>
            <p className="text-sm text-gray-500">Email: vr@ilmaup.com.ua</p>
          </div>
        </div>
      </div>
    ),
  },
  "/lyceum/o-nas/perevagi": {
    title: "Переваги навчання",
    description: "Чому батьки обирають наш ліцей для своїх дітей",
    content: (
      <div className="space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-8">
            <BookOpen className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Якісна освіта</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Сучасні програми навчання</li>
              <li>✓ Досвідчені педагоги</li>
              <li>✓ Міжнародні стандарти</li>
              <li>✓ Індивідуальний підхід</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-8">
            <Users className="h-12 w-12 text-green-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Розвиток особистості</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Творчі студії</li>
              <li>✓ Спортивні секції</li>
              <li>✓ Психологічна підтримка</li>
              <li>✓ Розвиток талантів</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-8">
            <Shield className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Безпека</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Цілодобова охорона</li>
              <li>✓ Відеоспостереження</li>
              <li>✓ Контроль доступу</li>
              <li>✓ Медичний супровід</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-8">
            <Heart className="h-12 w-12 text-orange-600 mb-4" />
            <h3 className="text-2xl font-bold mb-3">Комфорт</h3>
            <ul className="space-y-2 text-gray-700">
              <li>✓ Сучасні класи</li>
              <li>✓ Здорове харчування</li>
              <li>✓ Затишна атмосфера</li>
              <li>✓ Зелена територія</li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  "/lyceum/o-nas/perevagi/yakisna-osvita": {
    title: "Якісна освіта",
    description: "Сучасні програми навчання та висококваліфіковані педагоги",
    content: (
      <div className="space-y-8">
        <p className="text-lg text-gray-700 leading-relaxed">
          Наш ліцей пропонує освітні програми, які відповідають найвищим національним та міжнародним стандартам.
          Ми використовуємо інноваційні методики навчання, сучасні технології та індивідуальний підхід до кожного учня.
        </p>
        <div className="bg-blue-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">Що ми пропонуємо:</h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">▪</span>
              Програми Cambridge та Pearson для вивчення англійської мови
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">▪</span>
              STEAM-освіта для розвитку науково-технічних навичок
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">▪</span>
              Проектна діяльність та критичне мислення
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">▪</span>
              Підготовка до міжнародних іспитів
            </li>
          </ul>
        </div>
      </div>
    ),
  },
  "/lyceum/spotlight/novini": {
    title: "Новини ліцею",
    description: "Останні події та досягнення нашого ліцею",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100" />
              <div className="p-6">
                <div className="text-sm text-gray-500 mb-2">15 жовтня 2025</div>
                <h3 className="text-xl font-bold mb-2">Новина {i}</h3>
                <p className="text-gray-600">
                  Короткий опис події або досягнення ліцею...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  "/lyceum/o-nas/pravila-prijomu": {
    title: "Правила прийому",
    description: "Етапи вступу до Міжнародного ліцею МАУП",
    content: (
      <div className="space-y-12">
        <div className="space-y-6">
          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
              <h3 className="text-xl font-bold">Подача заявки</h3>
            </div>
            <p className="text-gray-700 ml-11">
              Заповніть онлайн-форму або зателефонуйте нам для запису на співбесіду
            </p>
          </div>

          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
              <h3 className="text-xl font-bold">Екскурсія ліцеєм</h3>
            </div>
            <p className="text-gray-700 ml-11">
              Познайомтеся з педагогами, подивіться навчальні класи та інфраструктуру
            </p>
          </div>

          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
              <h3 className="text-xl font-bold">Співбесіда</h3>
            </div>
            <p className="text-gray-700 ml-11">
              Знайомство з дитиною, визначення рівня підготовки
            </p>
          </div>

          <div className="bg-white border-l-4 border-blue-600 p-6 rounded-r-lg">
            <div className="flex items-center mb-3">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">4</div>
              <h3 className="text-xl font-bold">Оформлення документів</h3>
            </div>
            <p className="text-gray-700 ml-11">
              Підписання договору та надання необхідних документів
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">Необхідні документи:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Заява від батьків</li>
            <li>• Свідоцтво про народження дитини (копія)</li>
            <li>• Паспорт одного з батьків (копія)</li>
            <li>• Медична картка дитини</li>
            <li>• Фотографії 3x4 (2 шт.)</li>
          </ul>
        </div>
      </div>
    ),
  },
  "/lyceum/o-nas/oplata-online": {
    title: "Вартість навчання",
    description: "Інформація про вартість навчання та способи оплати",
    content: (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Дошкільний ліцей</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">від 15 000₴</div>
            <p className="text-gray-600">на місяць</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Початкова школа</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">від 18 000₴</div>
            <p className="text-gray-600">на місяць</p>
          </div>
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Старша школа</h3>
            <div className="text-4xl font-bold text-blue-600 mb-2">від 20 000₴</div>
            <p className="text-gray-600">на місяць</p>
          </div>
        </div>
        <div className="bg-green-50 rounded-xl p-8">
          <h3 className="text-xl font-bold mb-4">Знижки:</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• 10% для другої дитини в родині</li>
            <li>• 15% для третьої та наступних дітей</li>
            <li>• Індивідуальні умови для випускників МАУП</li>
          </ul>
        </div>
      </div>
    ),
  },
};

export default function GenericPage() {
  const [, params] = useRoute("/lyceum/:rest*");
  const currentPath = `/lyceum/${params?.rest || ""}`;

  const content = pageContent[currentPath];

  if (!content) {
    return (
      <LyceumPageTemplate title="Сторінка в розробці">
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">
            Ця сторінка наразі в розробці
          </p>
          <p className="text-gray-500">
            Будь ласка, зверніться до нас за додатковою інформацією
          </p>
        </div>
      </LyceumPageTemplate>
    );
  }

  return (
    <LyceumPageTemplate title={content.title} description={content.description}>
      {content.content}
    </LyceumPageTemplate>
  );
}
