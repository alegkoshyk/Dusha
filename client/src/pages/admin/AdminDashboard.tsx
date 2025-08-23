import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Database, FileText, BarChart3, Settings, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalCards: number;
  totalResponses: number;
  completedSessions: number;
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження статистики...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Панель Адміністратора</h1>
          <p className="text-gray-500 mt-2">Управління системою "Душа Бренду"</p>
        </div>
        <Link href="/">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Повернутися до сайту
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всього Користувачів</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ігрових Сесій</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.completedSessions || 0} завершених
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Карток у Грі</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCards || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Відповідей</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Управління Картками
            </CardTitle>
            <CardDescription>
              Редагування ігрових карток, контенту та властивостей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Душа (Soul): 9 карток</Badge>
              <Badge variant="secondary">Розум (Mind): 8 карток</Badge>
              <Badge variant="secondary">Тіло (Body): 8 карток</Badge>
            </div>
            <Link href="/rcadmin/cards">
              <Button className="w-full" data-testid="button-manage-cards">
                Управляти Картками
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Управління Рівнями
            </CardTitle>
            <CardDescription>
              Налаштування рівнів гри та їх властивостей
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Душа</Badge>
              <Badge variant="outline">Розум</Badge>
              <Badge variant="outline">Тіло</Badge>
            </div>
            <Link href="/rcadmin/levels">
              <Button variant="outline" className="w-full" data-testid="button-manage-levels">
                Управляти Рівнями
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Швидкі Дії</CardTitle>
          <CardDescription>
            Часто використовувані функції адміністрування
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Link href="/rcadmin/cards/new">
              <Button variant="outline" data-testid="button-create-card">
                Створити Нову Картку
              </Button>
            </Link>
            <Link href="/rcadmin/users">
              <Button variant="outline" data-testid="button-manage-users">
                Управління Користувачами
              </Button>
            </Link>
            <Link href="/rcadmin/analytics">
              <Button variant="outline" data-testid="button-view-analytics">
                Аналітика та Звіти
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}