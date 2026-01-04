import { Button } from '@/components/ui/button';
import { User, Home, LayoutDashboard, CreditCard, Settings, Users, Eye, ChevronDown, List, Package, Map, Cog, Image, Search } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import UserDropdown from './UserDropdown';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BrandSoulLogo } from './BrandSoulLogo';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (!isAuthenticated) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <BrandSoulLogo className="h-10 w-auto" />
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
            <Link 
              href="/brand-maps" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === '/brand-maps' || location.startsWith('/brand-chat')
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
              data-testid="link-brand-maps"
            >
              <Map className="w-4 h-4 inline mr-2" />
              Карти брендів
            </Link>
            <Link 
              href="/media" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === '/media'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
              data-testid="link-media-library"
            >
              <Image className="w-4 h-4 inline mr-2" />
              Медіа
            </Link>
            <Link 
              href="/brand-analysis" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location === '/brand-analysis'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                  : 'text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400'
              }`}
              data-testid="link-brand-analysis"
            >
              <Search className="w-4 h-4 inline mr-2" />
              Аналіз
            </Link>
            
            {/* Admin Menu */}
            {user?.role === 'admin' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 text-sm font-medium">
                    <LayoutDashboard className="h-4 w-4" />
                    Адміністрування
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin" className="flex items-center gap-2 w-full">
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/cards" className="flex items-center gap-2 w-full">
                      <CreditCard className="h-4 w-4" />
                      Картки
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/card-types" className="flex items-center gap-2 w-full">
                      <Settings className="h-4 w-4" />
                      Типи карток
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/card-option-sets" className="flex items-center gap-2 w-full">
                      <List className="h-4 w-4" />
                      Набори Варіантів
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/options-list" className="flex items-center gap-2 w-full">
                      <Package className="h-4 w-4" />
                      Перелік Варіантів
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/users" className="flex items-center gap-2 w-full">
                      <Users className="h-4 w-4" />
                      Користувачі
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/settings" className="flex items-center gap-2 w-full">
                      <Cog className="h-4 w-4" />
                      Налаштування
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/brand-analysis" className="flex items-center gap-2 w-full">
                      <Search className="h-4 w-4" />
                      Аналіз брендів
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/rcadmin/brand-analysis-templates" className="flex items-center gap-2 w-full">
                      <Settings className="h-4 w-4" />
                      Шаблони аналізу
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/" className="flex items-center gap-2 w-full">
                      <Eye className="h-4 w-4" />
                      Попередній перегляд
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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