import { Link, useLocation } from 'wouter';
import { Gamepad2, CreditCard, Search, User } from 'lucide-react';

const navItems = [
  { path: '/dashboard', icon: Gamepad2, label: 'Ігри' },
  { path: '/brand-maps', icon: CreditCard, label: 'Карти' },
  { path: '/brand-analysis', icon: Search, label: 'Аналіз' },
  { path: '/profile', icon: User, label: 'Профіль' },
];

export function BottomNav() {
  const [location] = useLocation();

  // Hide bottom nav in AI chat
  if (location.startsWith('/brand-chat')) {
    return null;
  }

  return (
    <nav 
      className="fixed inset-x-0 z-[100]"
      style={{ 
        bottom: 0,
        position: 'fixed',
        WebkitBackfaceVisibility: 'hidden',
        backfaceVisibility: 'hidden',
        willChange: 'transform'
      }}
    >
      <div 
        className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
        style={{ 
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex justify-around items-center h-14 px-1 bg-white dark:bg-gray-900">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path === '/dashboard' && location === '/') ||
              (item.path === '/brand-maps' && location.startsWith('/brand-chat')) ||
              (item.path === '/profile' && (location.startsWith('/settings') || location.startsWith('/rcadmin')));
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className="flex flex-col items-center justify-center flex-1 py-2"
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div 
                  className={`flex flex-col items-center transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-600 dark:text-blue-400 scale-110' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <item.icon 
                    className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} 
                  />
                  <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
