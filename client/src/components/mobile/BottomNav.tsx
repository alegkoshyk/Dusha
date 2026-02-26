import { Link, useLocation } from 'wouter';
import { Home, Briefcase, Search, User } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Головна' },
  { path: '/brands', icon: Briefcase, label: 'Бренди' },
  { path: '/brand-analysis', icon: Search, label: 'Аналіз' },
  { path: '/profile', icon: User, label: 'Профіль' },
];

export function BottomNav() {
  const [location] = useLocation();

  if (location.startsWith('/brand-chat') || location.startsWith('/canvas')) {
    return null;
  }

  return (
    <nav 
      className="fixed left-4 right-4 z-[9999]"
      style={{ 
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
        transform: 'translateZ(0)',
        WebkitTransform: 'translateZ(0)',
        isolation: 'isolate'
      }}
    >
      <div 
        className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-xl border border-white/20 dark:border-gray-600/30"
        style={{
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div 
          className="flex justify-around items-center px-2 py-2"
        >
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path === '/' && location === '/') ||
              (item.path === '/brands' && location.startsWith('/brand-chat')) ||
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
