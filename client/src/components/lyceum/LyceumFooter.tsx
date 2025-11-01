import { Link } from "wouter";
import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";

export function LyceumFooter() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Про ліцей</h3>
            <p className="text-sm mb-4">
              Міжнародний ліцей МАУП - сучасний освітній заклад з високими стандартами навчання та індивідуальним підходом до кожної дитини.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="hover:text-blue-400 transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Швидкі посилання</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/lyceum/o-nas/misiya-ta-cinnosti">
                  <a className="hover:text-blue-400 transition-colors">Місія та цінності</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/o-nas/perevagi">
                  <a className="hover:text-blue-400 transition-colors">Переваги навчання</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/o-nas/pravila-prijomu">
                  <a className="hover:text-blue-400 transition-colors">Правила прийому</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/spotlight/novini">
                  <a className="hover:text-blue-400 transition-colors">Новини</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/kontakti">
                  <a className="hover:text-blue-400 transition-colors">Контакти</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Освітні послуги</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/lyceum/osvitni-poslugi/doshkilnij-licej2">
                  <a className="hover:text-blue-400 transition-colors">Дошкільний ліцей</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/osvitni-poslugi/pochatkovij-licej1">
                  <a className="hover:text-blue-400 transition-colors">Початкова школа</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/osvitni-poslugi/starshij-profilnij-licej1">
                  <a className="hover:text-blue-400 transition-colors">Старша школа</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/osvitni-poslugi/onlajn-shkola-vid-nvk-mizhnarodnij-licej-maup">
                  <a className="hover:text-blue-400 transition-colors">Онлайн-школа</a>
                </Link>
              </li>
              <li>
                <Link href="/lyceum/osvitni-poslugi/litnij-oflajn-tabir-happy-kids">
                  <a className="hover:text-blue-400 transition-colors">Літній табір</a>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Контакти</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>м. Київ, вул. Фрометівська, 2</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span>+38 (044) 254-05-85</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <span>info@ilmaup.com.ua</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          <p>&copy; {new Date().getFullYear()} Міжнародний ліцей МАУП. Всі права захищені.</p>
        </div>
      </div>
    </footer>
  );
}
