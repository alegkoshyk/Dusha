import { Button } from '@/components/ui/button';
import { User, Home, Gamepad2 } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import UserDropdown from './UserDropdown';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              <Gamepad2 className="w-8 h-8" />
              <span>Душа Бренду</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === '/' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Головна
            </Link>
            <Link 
              href="/dashboard" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === '/dashboard' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Мої Бренди
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}