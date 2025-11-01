import { useState } from "react";
import { Link } from "wouter";
import { Menu, X, ChevronDown } from "lucide-react";

interface SubMenuItem {
  title: string;
  path: string;
}

interface MenuItem {
  title: string;
  path?: string;
  submenu?: SubMenuItem[];
}

const menuData: MenuItem[] = [
  {
    title: "Про ліцей",
    submenu: [
      { title: "Місія та цінності", path: "/lyceum/o-nas/misiya-ta-cinnosti" },
      { title: "Команда і засновники", path: "/lyceum/o-nas/zasnovniki" },
      { title: "Адміністрація", path: "/lyceum/o-nas/administraciya" },
      { title: "Переваги навчання", path: "/lyceum/o-nas/perevagi" },
      { title: "Якісна освіта", path: "/lyceum/o-nas/perevagi/yakisna-osvita" },
      { title: "Гармонійний розвиток", path: "/lyceum/o-nas/perevagi/garmonijnij-rozvitok" },
      { title: "Психолого-педагогічний супровід", path: "/lyceum/o-nas/perevagi/psihologo-pedagogichnij-suprovid" },
      { title: "Медичне обслуговування", path: "/lyceum/o-nas/perevagi/medichne-obslugovuvannya" },
      { title: "Послуги психолога", path: "/lyceum/studii-ta-dodatkovi-poslugi/dodatkovi-tvorchi-studii/poslugi-psihologa" },
      { title: "Гарантована безпека", path: "/lyceum/o-nas/perevagi/garantovana-bezpeka" },
      { title: "Корисне харчування", path: "/lyceum/o-nas/perevagi/korisne-harchuvannya" },
      { title: "Контроль харчування", path: "/lyceum/o-nas/perevagi/kontrol-harchuvannya" },
      { title: "Сертифікати", path: "/lyceum/spotlight/sertifikati" },
      { title: "Партнери", path: "/lyceum/spotlight/partneri" },
    ],
  },
  {
    title: "Навчання",
    submenu: [
      { title: "Дошкільний ліцей", path: "/lyceum/osvitni-poslugi/doshkilnij-licej2" },
      { title: "Програми навчання (дошкільний)", path: "/lyceum/osvitni-poslugi/doshkilnij-licej2/programi-navchannya" },
      { title: "Режим дня (дошкільний)", path: "/lyceum/osvitni-poslugi/doshkilnij-licej2/rezhim-dnya" },
      { title: "PresSchool", path: "/lyceum/osvitni-poslugi/preschool-pidgotovche-viddilennya" },
      { title: "Початкова школа", path: "/lyceum/osvitni-poslugi/pochatkovij-licej1" },
      { title: "Програми навчання (початкова)", path: "/lyceum/osvitni-poslugi/pochatkovij-licej1/programi-navchannya1" },
      { title: "Режим дня (початкова)", path: "/lyceum/osvitni-poslugi/pochatkovij-licej1/rezhim-dnya1" },
      { title: "Cambridge Program", path: "/lyceum/osvitni-proekti/mizhnarodni/mizhnarodni-sertifikati" },
      { title: "Pearson Partner School", path: "/lyceum/osvitni-proekti/mizhnarodni/pearson-partner-school" },
      { title: "Старша школа", path: "/lyceum/osvitni-poslugi/starshij-profilnij-licej1" },
      { title: "Програми навчання (старша)", path: "/lyceum/osvitni-poslugi/starshij-profilnij-licej1/programi-navchannya3" },
      { title: "Режим дня (старша)", path: "/lyceum/osvitni-poslugi/starshij-profilnij-licej1/rezhim-dnya3" },
      { title: "Онлайн-школа", path: "/lyceum/osvitni-poslugi/onlajn-shkola-vid-nvk-mizhnarodnij-licej-maup" },
      { title: "STEAM-лабораторія", path: "/lyceum/osvitni-poslugi/starshij-profilnij-licej1/ilmaup-steam-lab1" },
      { title: "STEAM-проект", path: "/lyceum/osvitni-proekti/metodichni-proekti/ilmaup-steam-lab2" },
      { title: "Літній табір", path: "/lyceum/osvitni-poslugi/litnij-oflajn-tabir-happy-kids" },
    ],
  },
  {
    title: "Вступ",
    submenu: [
      { title: "Етапи вступу", path: "/lyceum/o-nas/pravila-prijomu" },
      { title: "Вартість навчання", path: "/lyceum/o-nas/oplata-online" },
      { title: "Необхідні документи", path: "/lyceum/o-nas/pravila-prijomu" },
      { title: "Подати заявку", path: "/lyceum/kontakti" },
    ],
  },
  {
    title: "Життя ліцею",
    submenu: [
      { title: "Новини", path: "/lyceum/spotlight/novini" },
      { title: "Фотогалерея", path: "/lyceum/spotlight/fotogalereya1" },
      { title: "Відео", path: "/lyceum/spotlight/video" },
      { title: "Досягнення", path: "/lyceum/spotlight/dosyagnennya" },
      { title: "Освітні проєкти", path: "/lyceum/osvitni-proekti" },
      { title: "Міжнародні проєкти", path: "/lyceum/osvitni-proekti/mizhnarodni" },
      { title: "Всеукраїнські проєкти", path: "/lyceum/osvitni-proekti/vseukrainski" },
      { title: "Локальні проєкти", path: "/lyceum/osvitni-proekti/lokalni" },
      { title: "Методичні проєкти", path: "/lyceum/osvitni-proekti/metodichni-proekti" },
      { title: "Творчі студії та секції", path: "/lyceum/studii-ta-dodatkovi-poslugi/studii-sekcii" },
      { title: "Студії та послуги", path: "/lyceum/studii-ta-dodatkovi-poslugi" },
    ],
  },
  {
    title: "Для батьків",
    submenu: [
      { title: "Розклад", path: "/lyceum/o-nas" },
      { title: "Онлайн-журнал", path: "/lyceum/spotlight/onlajn-zhurnal" },
      { title: "Електронний щоденник", path: "/lyceum/multimedijnij-zvyazok-iz-batkami" },
      { title: "Поради психолога", path: "/lyceum/studii-ta-dodatkovi-poslugi/dodatkovi-tvorchi-studii/poslugi-psihologa" },
      { title: "Додаткові творчі студії", path: "/lyceum/studii-ta-dodatkovi-poslugi/dodatkovi-tvorchi-studii" },
      { title: "Додаткові послуги", path: "/lyceum/studii-ta-dodatkovi-poslugi/dodatkovi-poslugi" },
      { title: "Контакти адміністрації", path: "/lyceum/o-nas/administraciya" },
    ],
  },
  {
    title: "Контакти",
    path: "/lyceum/kontakti",
  },
];

export function LyceumNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="bg-white shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/lyceum" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-blue-600">
              МАУП
            </div>
            <div className="text-sm text-gray-600 hidden md:block">
              Міжнародний ліцей
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex space-x-1">
            {menuData.map((item, index) => (
              <div
                key={index}
                className="relative group"
                onMouseEnter={() => setActiveMenu(index)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                {item.path ? (
                  <Link href={item.path}>
                    <button className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium">
                      {item.title}
                    </button>
                  </Link>
                ) : (
                  <button className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors font-medium flex items-center">
                    {item.title}
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </button>
                )}

                {item.submenu && activeMenu === index && (
                  <div className="absolute left-0 mt-0 w-64 bg-white rounded-md shadow-lg py-2 z-50">
                    {item.submenu.map((subitem, subindex) => (
                      <Link key={subindex} href={subitem.path}>
                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                          {subitem.title}
                        </button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-screen overflow-y-auto">
            {menuData.map((item, index) => (
              <div key={index}>
                {item.path ? (
                  <Link href={item.path}>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      {item.title}
                    </button>
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => setActiveMenu(activeMenu === index ? null : index)}
                      className="flex justify-between items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    >
                      {item.title}
                      <ChevronDown
                        className={`h-5 w-5 transition-transform ${
                          activeMenu === index ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {item.submenu && activeMenu === index && (
                      <div className="pl-4 space-y-1">
                        {item.submenu.map((subitem, subindex) => (
                          <Link key={subindex} href={subitem.path}>
                            <button
                              onClick={() => setIsOpen(false)}
                              className="block w-full text-left px-3 py-2 rounded-md text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                            >
                              {subitem.title}
                            </button>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
