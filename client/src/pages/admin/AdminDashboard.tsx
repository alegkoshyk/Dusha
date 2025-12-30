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
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Панель Адміністратора</h1>
            <p className="text-gray-400 mt-2">Управління системою "Душа Бренду"</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2 border-gray-600 text-gray-300 hover:bg-gray-800">
              <ArrowLeft className="h-4 w-4" />
              Повернутися до сайту
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Всього Користувачів</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Ігрових Сесій</CardTitle>
              <Database className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalSessions || 0}</div>
              <p className="text-xs text-gray-400">
                {stats?.completedSessions || 0} завершених
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Карток у Грі</CardTitle>
              <FileText className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalCards || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Відповідей</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalResponses || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500" onClick={() => navigate('/rcadmin/cards')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Управління Картками</h3>
                  <p className="text-xs text-gray-400">Редагувати картки гри</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-purple-500" onClick={() => navigate('/rcadmin/card-types')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-900 rounded-lg">
                  <Settings className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Типи Карток</h3>
                  <p className="text-xs text-gray-400">Налаштування типів</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-yellow-500" onClick={() => navigate('/rcadmin/card-option-sets')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-900 rounded-lg">
                  <List className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Набори Варіантів</h3>
                  <p className="text-xs text-gray-400">Управління варіантами</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-orange-500" onClick={() => navigate('/rcadmin/options-list')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-900 rounded-lg">
                  <Package className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Перелік Варіантів</h3>
                  <p className="text-xs text-gray-400">Пошук по всіх варіантах</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500" onClick={() => navigate('/rcadmin/users')}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900 rounded-lg">
                  <Users className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Користувачі</h3>
                  <p className="text-xs text-gray-400">Управління користувачами</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-gray-500" onClick={() => navigate('/rcadmin/settings')} data-testid="card-settings">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-700 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Налаштування</h3>
                  <p className="text-xs text-gray-400">Синхронізація БД та інше</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-pink-500" onClick={() => navigate('/rcadmin/brand-space')} data-testid="card-brand-space">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-900 rounded-lg">
                  <Map className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Простір Бренду</h3>
                  <p className="text-xs text-gray-400">React Flow візуалізація</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-cyan-500" onClick={() => navigate('/rcadmin/visual-map')} data-testid="card-visual-map">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-900 rounded-lg">
                  <Map className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Візуальна Карта</h3>
                  <p className="text-xs text-gray-400">Rete.js редактор</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-amber-500" onClick={() => navigate('/rcadmin/subscriptions')} data-testid="card-subscriptions">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-900 rounded-lg">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Тарифні Плани</h3>
                  <p className="text-xs text-gray-400">Управління підписками</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500" onClick={() => navigate('/rcadmin/transactions')} data-testid="card-transactions">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-900 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">Транзакції</h3>
                  <p className="text-xs text-gray-400">Історія платежів</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}