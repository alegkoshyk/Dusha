import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Edit, Trash2, Plus, Save, User, Crown, CreditCard, History, Package, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
}

interface UserSubscription {
  id: string;
  userId: string;
  planId: number;
  billingPeriod: string;
  status: string;
  startedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
}

interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  monoInvoiceId: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subscriptionUser, setSubscriptionUser] = useState<User | null>(null);
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: subscriptionData, isLoading: isLoadingSubscription } = useQuery<{
    subscription: UserSubscription | null;
    plans: SubscriptionPlan[];
  }>({
    queryKey: [`/api/admin/users/${subscriptionUser?.id}/subscription`],
    enabled: !!subscriptionUser?.id,
  });

  const { data: payments, isLoading: isLoadingPayments } = useQuery<Payment[]>({
    queryKey: [`/api/admin/users/${subscriptionUser?.id}/payments`],
    enabled: !!subscriptionUser?.id,
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: Partial<User> }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Користувача оновлено",
        description: "Зміни успішно збережені",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити користувача",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Користувача видалено",
        description: "Користувача успішно видалено з системи",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося видалити користувача",
        variant: "destructive",
      });
    },
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: { planId?: number; status?: string; billingPeriod?: string } }) => {
      return await apiRequest("PUT", `/api/admin/users/${userId}/subscription`, data);
    },
    onSuccess: () => {
      if (subscriptionUser) {
        queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${subscriptionUser.id}/subscription`] });
      }
      toast({
        title: "Підписку оновлено",
        description: "Зміни успішно збережені",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити підписку",
        variant: "destructive",
      });
    },
  });

  const handleSaveUser = () => {
    if (!editingUser) return;
    
    updateUserMutation.mutate({
      userId: editingUser.id,
      userData: editingUser,
    });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const handleOpenSubscription = (user: User) => {
    setSubscriptionUser(user);
    setIsSubscriptionDialogOpen(true);
  };

  const handleChangePlan = (planId: number) => {
    if (!subscriptionUser) return;
    updateSubscriptionMutation.mutate({
      userId: subscriptionUser.id,
      data: { planId },
    });
  };

  const handleChangeStatus = (status: string) => {
    if (!subscriptionUser) return;
    updateSubscriptionMutation.mutate({
      userId: subscriptionUser.id,
      data: { status },
    });
  };

  const handleChangeBillingPeriod = (billingPeriod: string) => {
    if (!subscriptionUser) return;
    updateSubscriptionMutation.mutate({
      userId: subscriptionUser.id,
      data: { billingPeriod },
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Адміністратор</Badge>;
      case 'user': return <Badge variant="secondary">Користувач</Badge>;
      default: return <Badge variant="outline">Невідомо</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Активний</Badge>
      : <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Неактивний</Badge>;
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"><CheckCircle className="h-3 w-3 mr-1" />Активна</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"><XCircle className="h-3 w-3 mr-1" />Скасована</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"><AlertCircle className="h-3 w-3 mr-1" />Закінчилась</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" />Очікування</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Успішно</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Очікування</Badge>;
      case 'failure':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Невдало</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Обробка</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number, currency: string = 'UAH') => {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  };

  const getPlanBadge = (planName: string) => {
    switch (planName) {
      case 'pro':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"><Crown className="h-3 w-3 mr-1" />Професійний</Badge>;
      case 'basic':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"><Package className="h-3 w-3 mr-1" />Базовий</Badge>;
      case 'free':
      default:
        return <Badge variant="outline">Безкоштовний</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Завантаження користувачів...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Користувачі</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Управління користувачами та їх правами доступу</p>
        </div>
        <div className="flex items-center gap-4">
          <Button className="flex items-center gap-2" data-testid="button-create-new-user">
            <Plus className="h-4 w-4" />
            Додати Користувача
          </Button>
          <Link href="/rcadmin">
            <Button variant="outline" className="flex items-center gap-2" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {users?.map((user) => (
          <Card key={user.id} className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <CardTitle className="text-lg dark:text-white">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.isActive)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleOpenSubscription(user)}
                    data-testid={`button-subscription-${user.id}`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Підписка
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingUser(user);
                      setIsDialogOpen(true);
                    }}
                    data-testid={`button-edit-${user.id}`}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 dark:border-red-800 dark:hover:border-red-700"
                        data-testid={`button-delete-${user.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Видалити
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="dark:text-white">Видалити користувача?</AlertDialogTitle>
                        <AlertDialogDescription className="dark:text-gray-400">
                          Ця дія незворотна. Користувач "{user.firstName} {user.lastName}" буде видалений назавжди разом із усіма даними.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Скасувати</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUser(user.id)}
                          className="bg-red-600 hover:bg-red-700"
                          data-testid="button-confirm-delete"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">ID:</span>
                  <p className="font-mono text-xs dark:text-gray-300">{user.id.slice(0, 8)}...</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Створено:</span>
                  <p className="dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Оновлено:</span>
                  <p className="dark:text-gray-300">{new Date(user.updatedAt).toLocaleDateString('uk-UA')}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Останній вхід:</span>
                  <p className="dark:text-gray-300">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('uk-UA') : 'Ніколи'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Редагувати користувача</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Внесіть зміни до профілю користувача "{editingUser?.firstName} {editingUser?.lastName}"
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="dark:text-gray-300">Ім'я</Label>
                  <Input
                    id="firstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      firstName: e.target.value
                    })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="dark:text-gray-300">Прізвище</Label>
                  <Input
                    id="lastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      lastName: e.target.value
                    })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({
                    ...editingUser,
                    email: e.target.value
                  })}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role" className="dark:text-gray-300">Роль</Label>
                  <Select 
                    value={editingUser.role} 
                    onValueChange={(value: 'user' | 'admin') => setEditingUser({
                      ...editingUser,
                      role: value
                    })}
                  >
                    <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                      <SelectItem value="user">Користувач</SelectItem>
                      <SelectItem value="admin">Адміністратор</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({
                      ...editingUser,
                      isActive: e.target.checked
                    })}
                    className="dark:bg-gray-700"
                  />
                  <Label htmlFor="isActive" className="dark:text-gray-300">Активний користувач</Label>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">
                  Скасувати
                </Button>
                <Button 
                  onClick={handleSaveUser}
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-user"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateUserMutation.isPending ? "Збереження..." : "Зберегти"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Subscription Dialog */}
      <Dialog open={isSubscriptionDialogOpen} onOpenChange={setIsSubscriptionDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Підписка користувача
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Управління підпискою для "{subscriptionUser?.firstName} {subscriptionUser?.lastName}" ({subscriptionUser?.email})
            </DialogDescription>
          </DialogHeader>

          {isLoadingSubscription ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="subscription" className="w-full">
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="subscription" className="dark:data-[state=active]:bg-gray-600">
                  <Package className="h-4 w-4 mr-2" />
                  Підписка
                </TabsTrigger>
                <TabsTrigger value="payments" className="dark:data-[state=active]:bg-gray-600">
                  <History className="h-4 w-4 mr-2" />
                  Історія платежів
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="mt-4 space-y-4">
                {subscriptionData?.subscription ? (
                  <>
                    {/* Current Subscription Info */}
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-lg dark:text-white flex items-center justify-between">
                          Поточна підписка
                          {getSubscriptionStatusBadge(subscriptionData.subscription.status)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Тарифний план</span>
                            <div className="flex items-center gap-2 mt-1">
                              {getPlanBadge(subscriptionData.subscription.plan?.name || 'free')}
                              <span className="dark:text-white">{subscriptionData.subscription.plan?.displayName}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Період оплати</span>
                            <p className="dark:text-white mt-1">
                              {subscriptionData.subscription.billingPeriod === 'yearly' ? 'Річна' : 'Місячна'}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Дата початку</span>
                            <p className="dark:text-white mt-1 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(subscriptionData.subscription.startedAt).toLocaleDateString('uk-UA')}
                            </p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">Дата закінчення</span>
                            <p className="dark:text-white mt-1 flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {subscriptionData.subscription.endsAt 
                                ? new Date(subscriptionData.subscription.endsAt).toLocaleDateString('uk-UA')
                                : 'Безстроково'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator className="dark:bg-gray-600" />

                    {/* Change Plan */}
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-lg dark:text-white">Змінити тарифний план</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {subscriptionData.plans.map((plan) => (
                            <Card 
                              key={plan.id} 
                              className={`cursor-pointer transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-600 ${
                                subscriptionData.subscription?.planId === plan.id ? 'ring-2 ring-primary' : ''
                              }`}
                              onClick={() => handleChangePlan(plan.id)}
                            >
                              <CardContent className="p-4 text-center">
                                {getPlanBadge(plan.name)}
                                <h3 className="font-bold mt-2 dark:text-white">{plan.displayName}</h3>
                                <p className="text-2xl font-bold text-primary mt-2">
                                  {(plan.priceMonthly / 100).toFixed(0)} ₴
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">/ місяць</p>
                                {subscriptionData.subscription?.planId === plan.id && (
                                  <Badge className="mt-2 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Поточний
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Change Status */}
                    <Card className="dark:bg-gray-700 dark:border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-lg dark:text-white">Керування підпискою</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="dark:text-gray-300">Статус підписки</Label>
                            <Select 
                              value={subscriptionData.subscription.status}
                              onValueChange={handleChangeStatus}
                            >
                              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                <SelectItem value="active">Активна</SelectItem>
                                <SelectItem value="cancelled">Скасована</SelectItem>
                                <SelectItem value="expired">Закінчилась</SelectItem>
                                <SelectItem value="pending">Очікування</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="dark:text-gray-300">Період оплати</Label>
                            <Select 
                              value={subscriptionData.subscription.billingPeriod}
                              onValueChange={handleChangeBillingPeriod}
                            >
                              <SelectTrigger className="mt-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                                <SelectItem value="monthly">Місячна</SelectItem>
                                <SelectItem value="yearly">Річна</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="dark:bg-gray-700 dark:border-gray-600">
                    <CardContent className="py-8 text-center">
                      <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium dark:text-white mb-2">Немає активної підписки</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Цей користувач ще не має підписки. Оберіть тарифний план для створення.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {subscriptionData?.plans.map((plan) => (
                          <Card 
                            key={plan.id} 
                            className="cursor-pointer transition-all hover:shadow-md dark:bg-gray-800 dark:border-gray-600"
                            onClick={() => handleChangePlan(plan.id)}
                          >
                            <CardContent className="p-4 text-center">
                              {getPlanBadge(plan.name)}
                              <h3 className="font-bold mt-2 dark:text-white">{plan.displayName}</h3>
                              <p className="text-2xl font-bold text-primary mt-2">
                                {(plan.priceMonthly / 100).toFixed(0)} ₴
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">/ місяць</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                <Card className="dark:bg-gray-700 dark:border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-lg dark:text-white flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Історія транзакцій
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingPayments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : payments && payments.length > 0 ? (
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                          {payments.map((payment) => (
                            <Card key={payment.id} className="dark:bg-gray-800 dark:border-gray-600">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${
                                      payment.status === 'success' 
                                        ? 'bg-green-100 dark:bg-green-900/30' 
                                        : payment.status === 'failure'
                                        ? 'bg-red-100 dark:bg-red-900/30'
                                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                                    }`}>
                                      <CreditCard className={`h-5 w-5 ${
                                        payment.status === 'success' 
                                          ? 'text-green-600 dark:text-green-400' 
                                          : payment.status === 'failure'
                                          ? 'text-red-600 dark:text-red-400'
                                          : 'text-yellow-600 dark:text-yellow-400'
                                      }`} />
                                    </div>
                                    <div>
                                      <p className="font-medium dark:text-white">
                                        {payment.description || 'Оплата підписки'}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {new Date(payment.createdAt).toLocaleString('uk-UA')}
                                        </span>
                                        <span className="text-sm text-gray-400 dark:text-gray-500">•</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                          {payment.paymentMethod}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className={`font-bold ${
                                      payment.status === 'success' 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'dark:text-white'
                                    }`}>
                                      {formatAmount(payment.amount, payment.currency)}
                                    </p>
                                    <div className="mt-1">
                                      {getPaymentStatusBadge(payment.status)}
                                    </div>
                                  </div>
                                </div>
                                {payment.monoInvoiceId && (
                                  <p className="text-xs text-gray-400 mt-2 font-mono">
                                    ID: {payment.monoInvoiceId}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Немає історії платежів для цього користувача
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsSubscriptionDialogOpen(false)}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Закрити
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
