import { LyceumPageTemplate } from "@/components/lyceum/LyceumPageTemplate";
import { Target, Heart, Users, Award, Lightbulb, Globe } from "lucide-react";

export default function About() {
  return (
    <LyceumPageTemplate
      title="Місія та цінності"
      description="Ми створюємо освітнє середовище, де кожна дитина може розкрити свій потенціал та стати успішною особистістю"
    >
      {/* Mission */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-8 md:p-12">
          <div className="flex items-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mr-4">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Наша місія</h2>
          </div>
          <p className="text-lg text-gray-700 leading-relaxed">
            Надання якісної освіти міжнародного рівня, виховання гармонійно розвинених особистостей,
            здатних до критичного мислення, творчості та успішної самореалізації в сучасному світі.
            Ми прагнемо створити освітнє середовище, де кожна дитина почувається комфортно,
            безпечно та має можливість розкрити свій унікальний потенціал.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Наші цінності</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mb-4">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Турбота про дітей</h3>
            <p className="text-gray-600">
              Індивідуальний підхід до кожної дитини, створення безпечного та комфортного середовища для навчання та розвитку
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Якість освіти</h3>
            <p className="text-gray-600">
              Високі стандарти навчання, сучасні методики, кваліфіковані педагоги з міжнародними сертифікатами
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <Lightbulb className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Інновації</h3>
            <p className="text-gray-600">
              Впровадження сучасних технологій навчання, STEAM-освіта, розвиток критичного мислення
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Співпраця</h3>
            <p className="text-gray-600">
              Партнерство з батьками, командна робота педагогів, створення сильної освітньої спільноти
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
              <Globe className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Міжнародність</h3>
            <p className="text-gray-600">
              Міжнародні програми навчання, іноземні мови, підготовка до життя в глобальному світі
            </p>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 hover:border-blue-200 transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-4">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Емоційний інтелект</h3>
            <p className="text-gray-600">
              Розвиток соціальних навичок, емпатії, вміння працювати в команді та вирішувати конфлікти
            </p>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 md:p-12 text-white">
        <h2 className="text-3xl font-bold mb-6">Наше бачення</h2>
        <p className="text-lg leading-relaxed opacity-90">
          Ми прагнемо стати провідним освітнім закладом України, який визнають на міжнародному рівні
          за високу якість освіти, інноваційні підходи до навчання та виховання гармонійно розвинених,
          творчих особистостей, готових до викликів XXI століття. Наші випускники - це впевнені в собі,
          освічені, морально стійкі громадяни світу, здатні робити позитивний внесок у розвиток суспільства.
        </p>
      </section>
    </LyceumPageTemplate>
  );
}
