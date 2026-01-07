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
      className="fixed bottom-0 left-0 right-0 z-[100]"
      style={{ 
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
        position: 'fixed',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)'
      }}
    >
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-around items-center h-14 px-2">
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
