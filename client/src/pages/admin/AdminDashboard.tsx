import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Database, FileText, BarChart3, Settings, ArrowLeft, CreditCard, Eye, List, Package, RefreshCw, Map, Crown } from "lucide-react";
import { Link, useLocation } from "wouter";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalCards: number;
  totalResponses: number;
  completedSessions: number;
}

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-white">Завантаження статистики...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white overflow-x-hidden">
      <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-4 space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold text-white">Панель Адміністратора</h1>
            <p className="text-gray-400 mt-1 text-xs sm:text-base">Управління системою "Душа Бренду"</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800 flex-shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Повернутися до сайту</span>
              <span className="sm:hidden">Назад</span>
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Всього Користувачів</CardTitle>
              <Users className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Ігрових Сесій</CardTitle>
              <Database className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalSessions || 0}</div>
              <p className="text-[10px] sm:text-xs text-gray-400">
                {stats?.completedSessions || 0} завершених
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Карток у Грі</CardTitle>
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalCards || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Відповідей</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-xl sm:text-2xl font-bold text-white">{stats?.totalResponses || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500 overflow-hidden" onClick={() => navigate('/rcadmin/cards')}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-900 rounded-lg flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Картки</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Редагувати</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500 overflow-hidden" onClick={() => navigate('/rcadmin/card-types')}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-900 rounded-lg flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Типи</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Налаштування</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-yellow-500 overflow-hidden" onClick={() => navigate('/rcadmin/card-option-sets')}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-yellow-900 rounded-lg flex-shrink-0">
                  <List className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Набори</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Варіанти</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500 overflow-hidden" onClick={() => navigate('/rcadmin/options-list')}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-900 rounded-lg flex-shrink-0">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Варіанти</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Пошук</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500 overflow-hidden" onClick={() => navigate('/rcadmin/users')}>
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-900 rounded-lg flex-shrink-0">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Користувачі</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Управління</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-gray-500 overflow-hidden" onClick={() => navigate('/rcadmin/settings')} data-testid="card-settings">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gray-700 rounded-lg flex-shrink-0">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Налаштування</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">БД та інше</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-pink-500 overflow-hidden" onClick={() => navigate('/rcadmin/brand-space')} data-testid="card-brand-space">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-pink-900 rounded-lg flex-shrink-0">
                  <Map className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Простір</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">React Flow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-cyan-500 overflow-hidden" onClick={() => navigate('/rcadmin/visual-map')} data-testid="card-visual-map">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-cyan-900 rounded-lg flex-shrink-0">
                  <Map className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Карта</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Rete.js</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-amber-500 overflow-hidden" onClick={() => navigate('/rcadmin/subscriptions')} data-testid="card-subscriptions">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-amber-900 rounded-lg flex-shrink-0">
                  <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Тарифи</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Підписки</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500 overflow-hidden" onClick={() => navigate('/rcadmin/transactions')} data-testid="card-transactions">
            <CardContent className="p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-green-900 rounded-lg flex-shrink-0">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Транзакції</h3>
                  <p className="text-[10px] sm:text-xs text-gray-400 truncate">Платежі</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}