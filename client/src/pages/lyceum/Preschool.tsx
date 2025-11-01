import { LyceumPageTemplate } from "@/components/lyceum/LyceumPageTemplate";
import { Heart, Users, Palette, Music, Book, Smile, Shield, Apple } from "lucide-react";
import { Link } from "wouter";

export default function Preschool() {
  return (
    <LyceumPageTemplate
      title="Дошкільний ліцей"
      description="Розвиток дітей від 2 до 6 років у комфортній та безпечній атмосфері"
    >
      {/* Overview */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 md:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Про дошкільний ліцей</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            Наш дошкільний ліцей - це теплий та затишний простір, де діти отримують перші знання,
            розвивають творчі здібності та соціальні навички. Ми створили середовище,
            яке стимулює природну допитливість дитини та підтримує її індивідуальний розвиток.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            У нас працюють досвідчені педагоги, психологи та вихователі, які забезпечують
            індивідуальний підхід до кожної дитини та створюють атмосферу любові й турботи.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Наші переваги</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 text-center hover:border-yellow-200 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
              <Heart className="h-8 w-8 text-yellow-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Турбота та увага</h3>
            <p className="text-gray-600 text-sm">
              Індивідуальний підхід до кожної дитини
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 text-center hover:border-yellow-200 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Малі групи</h3>
            <p className="text-gray-600 text-sm">
              До 15 дітей у групі для кращої уваги
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 text-center hover:border-yellow-200 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Безпека</h3>
            <p className="text-gray-600 text-sm">
              Відеоспостереження та охорона
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 text-center hover:border-yellow-200 transition-colors">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <Apple className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">Здорове харчування</h3>
            <p className="text-gray-600 text-sm">
              5-разове збалансоване харчування
            </p>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Наші програми</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mr-4">
                <Book className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold">Розвиток мовлення</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Навчання читанню та письму, розвиток словникового запасу,
              вивчення англійської мови з носієм
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Українська мова та література</li>
              <li>• Англійська мова (щоденно)</li>
              <li>• Логопедичні заняття</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mr-4">
                <Palette className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold">Творчий розвиток</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Розвиток творчих здібностей через малювання, ліплення,
              аплікацію та інші види мистецтва
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Образотворче мистецтво</li>
              <li>• Ліплення та моделювання</li>
              <li>• Театральна майстерня</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mr-4">
                <Music className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold">Музичний розвиток</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Музичні заняття, співи, ритміка та хореографія
              для розвитку музичного слуху
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Музичні заняття</li>
              <li>• Хореографія</li>
              <li>• Ритміка</li>
            </ul>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 hover:border-blue-200 transition-colors">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mr-4">
                <Smile className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">Фізичний розвиток</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Рухливі ігри, гімнастика, плавання та спортивні заняття
              для міцного здоров'я
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Фізкультура</li>
              <li>• Плавання</li>
              <li>• Спортивні ігри</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Daily Schedule */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Режим дня</h2>
        <div className="bg-white border-2 border-gray-100 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">8:00 - 9:00</span>
                <span className="text-gray-600">Прийом дітей, ранкова гімнастика</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">9:00 - 9:30</span>
                <span className="text-gray-600">Сніданок</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">9:30 - 11:30</span>
                <span className="text-gray-600">Заняття, розвиваючі ігри</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">11:30 - 12:00</span>
                <span className="text-gray-600">Прогулянка</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">12:00 - 13:00</span>
                <span className="text-gray-600">Обід</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">13:00 - 15:00</span>
                <span className="text-gray-600">Денний сон</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">15:00 - 16:00</span>
                <span className="text-gray-600">Полудень, творчі заняття</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <span className="font-semibold text-gray-900">16:00 - 19:00</span>
                <span className="text-gray-600">Ігри, гуртки, вечеря</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Записатися до дошкільного ліцею</h2>
          <p className="text-lg mb-6 opacity-90">
            Зателефонуйте нам або залиште заявку онлайн
          </p>
          <Link href="/lyceum/kontakti">
            <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Подати заявку
            </button>
          </Link>
        </div>
      </section>
    </LyceumPageTemplate>
  );
}
