import { Link } from "wouter";
import { LyceumNavigation } from "@/components/lyceum/LyceumNavigation";
import { LyceumFooter } from "@/components/lyceum/LyceumFooter";
import {
  GraduationCap,
  Users,
  Globe,
  Award,
  BookOpen,
  Shield,
  Heart,
  Lightbulb,
  ArrowRight
} from "lucide-react";

export default function LyceumHome() {
  return (
    <div className="min-h-screen bg-white">
      <LyceumNavigation />

      {/* Hero Section */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Міжнародний ліцей <span className="text-blue-600">МАУП</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Сучасна якісна освіта європейського рівня.
                Гармонійний розвиток кожної дитини в безпечному та комфортному середовищі.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/lyceum/o-nas/pravila-prijomu">
                  <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center">
                    Подати заявку
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </button>
                </Link>
                <Link href="/lyceum/o-nas/perevagi">
                  <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
                    Переваги навчання
                  </button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                <GraduationCap className="h-64 w-64 text-blue-600 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Чому обирають наш ліцей?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Якісна освіта</h3>
              <p className="text-gray-600">
                Сучасні програми навчання відповідно до міжнародних стандартів
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Індивідуальний підхід</h3>
              <p className="text-gray-600">
                Увага до кожної дитини, розкриття талантів та здібностей
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Міжнародні програми</h3>
              <p className="text-gray-600">
                Cambridge Program, Pearson Partner School
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Безпека</h3>
              <p className="text-gray-600">
                Цілодобова охорона, відеоспостереження, безпечне середовище
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Education Levels Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Освітні рівні
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Preschool */}
            <Link href="/lyceum/osvitni-poslugi/doshkilnij-licej2">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
                  <Heart className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Дошкільний ліцей</h3>
                <p className="text-gray-600 mb-4">
                  Розвиток дітей від 2 до 6 років у комфортній та безпечній атмосфері
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Дізнатися більше
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </div>
            </Link>

            {/* Elementary */}
            <Link href="/lyceum/osvitni-poslugi/pochatkovij-licej1">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Початкова школа</h3>
                <p className="text-gray-600 mb-4">
                  1-4 класи. Міцний фундамент знань та навичок для успішного майбутнього
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Дізнатися більше
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </div>
            </Link>

            {/* High School */}
            <Link href="/lyceum/osvitni-poslugi/starshij-profilnij-licej1">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Старша школа</h3>
                <p className="text-gray-600 mb-4">
                  5-11 класи. Профільне навчання та підготовка до університету
                </p>
                <div className="flex items-center text-blue-600 font-semibold">
                  Дізнатися більше
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Additional Programs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Додаткові можливості
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-8">
              <Lightbulb className="h-12 w-12 text-purple-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">STEAM-лабораторія</h3>
              <p className="text-gray-700 mb-4">
                Сучасний навчальний простір для вивчення науки, технологій, інженерії, мистецтва та математики
              </p>
              <Link href="/lyceum/osvitni-poslugi/starshij-profilnij-licej1/ilmaup-steam-lab1">
                <button className="text-purple-600 font-semibold flex items-center">
                  Дізнатися більше
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
              <Award className="h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-2xl font-bold mb-3">Творчі студії</h3>
              <p className="text-gray-700 mb-4">
                Розвиток творчих здібностей: музика, танці, образотворче мистецтво, спорт та багато іншого
              </p>
              <Link href="/lyceum/studii-ta-dodatkovi-poslugi/studii-sekcii">
                <button className="text-green-600 font-semibold flex items-center">
                  Дізнатися більше
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Готові приєднатися до нашої родини?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Запишіться на екскурсію та дізнайтеся більше про наш ліцей
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/lyceum/kontakti">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Записатися на екскурсію
              </button>
            </Link>
            <Link href="/lyceum/o-nas/pravila-prijomu">
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                Подати заявку
              </button>
            </Link>
          </div>
        </div>
      </section>

      <LyceumFooter />
    </div>
  );
}
