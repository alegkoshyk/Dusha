import { LyceumPageTemplate } from "@/components/lyceum/LyceumPageTemplate";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { useState } from "react";

export default function Contacts() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("Дякуємо за вашу заявку! Ми зв'яжемося з вами найближчим часом.");
    setFormData({ name: "", phone: "", email: "", message: "" });
  };

  return (
    <LyceumPageTemplate
      title="Контакти"
      description="Зв'яжіться з нами для отримання додаткової інформації або запису на екскурсію"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Контактна інформація</h2>

          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Адреса</h3>
                <p className="text-gray-600">
                  04050, м. Київ, вул. Фрометівська, 2<br />
                  Печерський район
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg">
                  <Phone className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Телефони</h3>
                <p className="text-gray-600">
                  <a href="tel:+380442540585" className="hover:text-blue-600 transition-colors">
                    +38 (044) 254-05-85
                  </a>
                  <br />
                  <a href="tel:+380675005050" className="hover:text-blue-600 transition-colors">
                    +38 (067) 500-50-50
                  </a>
                  <br />
                  <a href="tel:+380935005050" className="hover:text-blue-600 transition-colors">
                    +38 (093) 500-50-50
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg">
                  <Mail className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Email</h3>
                <p className="text-gray-600">
                  <a href="mailto:info@ilmaup.com.ua" className="hover:text-blue-600 transition-colors">
                    info@ilmaup.com.ua
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Години роботи</h3>
                <p className="text-gray-600">
                  Понеділок - П'ятниця: 8:00 - 19:00<br />
                  Субота: 9:00 - 15:00<br />
                  Неділя: вихідний
                </p>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-8">
            <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
              <p className="text-gray-500">Карта розташування</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Залишити заявку</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Ім'я *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ваше ім'я"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+38 (___) ___-__-__"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Повідомлення
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ваше повідомлення або питання"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Send className="mr-2 h-5 w-5" />
                Відправити заявку
              </button>
            </form>
          </div>

          <div className="mt-6 bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Запрошуємо на екскурсію!</h3>
            <p className="text-gray-600 text-sm">
              Запишіться на екскурсію ліцеєм та познайомтеся з нашими педагогами,
              подивіться навчальні класи та дізнайтеся більше про наші програми.
            </p>
          </div>
        </div>
      </div>
    </LyceumPageTemplate>
  );
}
