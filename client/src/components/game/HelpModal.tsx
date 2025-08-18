import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Heart, Brain, ServerCog, ArrowRight } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="modal-help">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
            Як грати в "Душа Бренду"
          </DialogTitle>
          <DialogDescription>
            Повний гайд по проходженню трансформаційної гри
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Game Structure */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Структура гри
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">
              Гра складається з трьох послідовних рівнів, кожен з яких розкриває різні аспекти вашого бренду:
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-soul-50 dark:bg-soul-900/20 rounded-lg">
                <div className="w-8 h-8 bg-soul-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-soul-700 dark:text-soul-300">Душа Бренду</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Визначення місії, цінностей та історії вашого бренду
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-mind-50 dark:bg-mind-900/20 rounded-lg">
                <div className="w-8 h-8 bg-mind-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-mind-700 dark:text-mind-300">Розум Бренду</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Розробка стратегії, визначення аудиторії та позиціонування
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-center">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-body-50 dark:bg-body-900/20 rounded-lg">
                <div className="w-8 h-8 bg-body-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <ServerCog className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h4 className="font-medium text-body-700 dark:text-body-300">Тіло Бренду</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Практична реалізація через продукти, канали та дії
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How to Play */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Як проходити картки
            </h3>
            <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-soul-500 font-bold">•</span>
                <span>Уважно прочитайте питання або завдання на кожній картці</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-soul-500 font-bold">•</span>
                <span>Заповніть всі обов'язкові поля перед переходом далі</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-soul-500 font-bold">•</span>
                <span>Використовуйте підказки для кращого розуміння завдань</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-soul-500 font-bold">•</span>
                <span>Ваші відповіді автоматично зберігаються при переході</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-soul-500 font-bold">•</span>
                <span>Ви можете повертатися до попередніх карток для редагування</span>
              </li>
            </ul>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Поради для кращого результату
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <ul className="text-gray-700 dark:text-gray-300 text-sm space-y-2">
                <li>✨ Будьте чесними з собою при відповідях на питання</li>
                <li>⏰ Виділіть достатньо часу для глибокої рефлексії</li>
                <li>💭 Не поспішайте - обдумуйте кожне питання ретельно</li>
                <li>📝 Робіть нотатки, якщо виникають додаткові ідеї</li>
                <li>🎯 Фокусуйтеся на тому, що дійсно важливо для вас</li>
              </ul>
            </div>
          </div>

          {/* Final Result */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Що ви отримаєте
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
              Після завершення всіх рівнів ви матимете повну карту бренду, яка включає:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-soul-50 dark:bg-soul-900/20 p-3 rounded">
                <div className="font-medium text-soul-700 dark:text-soul-300 mb-1">Душа</div>
                <div className="text-gray-600 dark:text-gray-400">Місія, цінності, історія</div>
              </div>
              <div className="bg-mind-50 dark:bg-mind-900/20 p-3 rounded">
                <div className="font-medium text-mind-700 dark:text-mind-300 mb-1">Розум</div>
                <div className="text-gray-600 dark:text-gray-400">Стратегія, аудиторія, архетип</div>
              </div>
              <div className="bg-body-50 dark:bg-body-900/20 p-3 rounded">
                <div className="font-medium text-body-700 dark:text-body-300 mb-1">Тіло</div>
                <div className="text-gray-600 dark:text-gray-400">Продукти, канали, дії</div>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mt-3">
              Цю карту можна експортувати у PDF та використовувати як дороговказ для розвитку вашого бізнесу.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
