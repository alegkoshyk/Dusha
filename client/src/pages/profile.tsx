import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  User, Camera, Building2, Briefcase, Globe, Trophy, Star, 
  ArrowLeft, Save, Loader2, Award, Target, Zap, CreditCard, 
  Receipt, Crown, Check, Calendar, ExternalLink, Clock, AlertTriangle, RefreshCw, XCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import type { UserProfile, SubscriptionPlan, UserSubscription, PaymentHistory } from "@shared/schema";
import { format } from "date-fns";
import { uk } from "date-fns/locale";

const INDUSTRIES = [
  "IT та технології",
  "Маркетинг та реклама",
  "Електронна комерція",
  "Освіта",
  "Фінанси та банкінг",
  "Медицина та здоров'я",
  "Виробництво",
  "Нерухомість",
  "Туризм та гостинність",
  "Роздрібна торгівля",
  "Консалтинг",
  "Медіа та розваги",
  "Інше"
];

const EMPLOYEE_COUNTS = [
  { value: "1", label: "Тільки я" },
  { value: "2-10", label: "2-10 співробітників" },
  { value: "11-50", label: "11-50 співробітників" },
  { value: "51-200", label: "51-200 співробітників" },
  { value: "201-500", label: "201-500 співробітників" },
  { value: "500+", label: "Більше 500" }
];

function getLevelInfo(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXp = xp % 100;
  const xpToNextLevel = 100;
  return { level, currentLevelXp, xpToNextLevel };
}

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
    company: "",
    position: "",
    industry: "",
    employeeCount: "",
    website: ""
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const { data: user } = useQuery<{ id: string; email: string; displayName: string }>({
    queryKey: ["/api/auth/me"],
    select: (data: any) => data.user
  });

  const { data: profile, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: ["/api/user/profile"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<{ totalXp: number; totalGames: number; completedGames: number }>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  const { data: subscriptionData } = useQuery<{ subscription: UserSubscription; plan: SubscriptionPlan }>({
    queryKey: ["/api/subscriptions/current"],
    enabled: !!user,
  });

  const { data: allPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscriptions/plans"],
    enabled: !!user,
  });

  const { data: paymentHistory } = useQuery<PaymentHistory[]>({
    queryKey: ["/api/subscriptions/payments"],
    enabled: !!user,
  });

  interface BillingStatus {
    status: string;
    planName: string;
    hasBillingIssue: boolean;
    isInGracePeriod: boolean;
    graceDaysRemaining: number;
    graceUntil: string | null;
    lastBillingError: string | null;
    billingRetryCount: number;
    nextPaymentAt: string | null;
    amount: number;
    currency: string;
  }

  const { data: billingStatus } = useQuery<BillingStatus>({
    queryKey: ["/api/billing/status"],
    enabled: !!user,
  });

  const retryPaymentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/payments/retry", {});
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Не вдалося повторити платіж");
      }
      return result;
    },
    onSuccess: (data: any) => {
      if (data.pageUrl) {
        window.location.href = data.pageUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося повторити платіж",
        variant: "destructive",
      });
    },
  });

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/subscriptions/cancel", {});
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Не вдалося скасувати підписку");
      }
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Підписку скасовано",
        description: "Ви переведені на безкоштовний тариф",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscriptions/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/status"] });
      setShowCancelDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скасувати підписку",
        variant: "destructive",
      });
    },
  });

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        bio: profile.bio || "",
        company: profile.company || "",
        position: profile.position || "",
        industry: profile.industry || "",
        employeeCount: profile.employeeCount || "",
        website: profile.website || ""
      });
      if (profile.avatarUrl) {
        setAvatarPreview(profile.avatarUrl);
      }
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<typeof formData> & { avatarUrl?: string }) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Не вдалося оновити профіль");
      }
      return result;
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Профіль оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const reader = new FileReader();
      return new Promise<string>((resolve, reject) => {
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const response = await apiRequest("POST", "/api/user/avatar", { imageData: base64 });
            const result = await response.json();
            if (!response.ok) {
              throw new Error(result.error || "Не вдалося завантажити аватар");
            }
            resolve(result.avatarUrl);
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Помилка читання файлу"));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: (avatarUrl) => {
      toast({ title: "Успішно", description: "Аватар оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setAvatarPreview(null);
    },
    onError: (error: any) => {
      toast({ title: "Помилка", description: error.message, variant: "destructive" });
    }
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Помилка", description: "Файл занадто великий (макс. 5MB)", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadAvatarMutation.mutate(file);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const levelInfo = getLevelInfo(stats?.totalXp || profile?.totalXp || 0);

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.firstName && profile?.lastName 
    ? `${profile.firstName} ${profile.lastName}` 
    : user?.displayName || user?.email?.split("@")[0] || "Користувач";

  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Назад
        </Button>

        <div className="grid gap-6">
          {/* Header Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={avatarPreview || profile?.avatarUrl || undefined} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAvatarMutation.isPending}
                    data-testid="button-change-avatar"
                  >
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-2xl font-bold" data-testid="text-display-name">{displayName}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {profile?.position && profile?.company && (
                    <p className="text-sm mt-1">
                      {profile.position} @ {profile.company}
                    </p>
                  )}
                </div>

                {/* Level Badge */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-primary/20 rounded-full px-4 py-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    <span className="font-bold text-lg">Рівень {levelInfo.level}</span>
                  </div>
                  <div className="mt-2 w-32">
                    <Progress value={(levelInfo.currentLevelXp / levelInfo.xpToNextLevel) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {levelInfo.currentLevelXp}/{levelInfo.xpToNextLevel} XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <Zap className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                <p className="text-3xl font-bold">{stats?.totalXp || profile?.totalXp || 0}</p>
                <p className="text-sm text-muted-foreground">Всього XP</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                <p className="text-3xl font-bold">{stats?.totalGames || 0}</p>
                <p className="text-sm text-muted-foreground">Ігор розпочато</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Award className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-3xl font-bold">{stats?.completedGames || 0}</p>
                <p className="text-sm text-muted-foreground">Ігор завершено</p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Особиста інформація</CardTitle>
                  <CardDescription>Ваш профіль та дані про компанію</CardDescription>
                </div>
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                    Редагувати
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Скасувати
                    </Button>
                    <Button 
                      onClick={handleSave} 
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Зберегти
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <div className="overflow-x-auto -mx-2 px-2 mb-4">
                  <TabsList className="w-full md:w-auto inline-flex">
                    <TabsTrigger value="personal" className="text-xs md:text-sm">
                      <User className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Особисте</span>
                      <span className="sm:hidden">Особ.</span>
                    </TabsTrigger>
                    <TabsTrigger value="company" className="text-xs md:text-sm">
                      <Building2 className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Компанія</span>
                      <span className="sm:hidden">Комп.</span>
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="text-xs md:text-sm">
                      <Crown className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Підписка</span>
                      <span className="sm:hidden">Підп.</span>
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="text-xs md:text-sm">
                      <Receipt className="h-4 w-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Платежі</span>
                      <span className="sm:hidden">Плат.</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="personal" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Ім'я</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Ваше ім'я"
                        data-testid="input-first-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Прізвище</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Ваше прізвище"
                        data-testid="input-last-name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Про себе</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Коротко про себе та свій досвід..."
                      rows={3}
                      data-testid="input-bio"
                    />
                  </div>

                  <div>
                    <Label htmlFor="website">Вебсайт</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://example.com"
                      data-testid="input-website"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="company" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Назва компанії</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Назва вашої компанії"
                        data-testid="input-company"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">Посада</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        disabled={!isEditing}
                        placeholder="Ваша посада"
                        data-testid="input-position"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="industry">Сфера діяльності</Label>
                      <Select 
                        value={formData.industry} 
                        onValueChange={(value) => setFormData({ ...formData, industry: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Оберіть сферу" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRIES.map((ind) => (
                            <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="employeeCount">Кількість співробітників</Label>
                      <Select 
                        value={formData.employeeCount} 
                        onValueChange={(value) => setFormData({ ...formData, employeeCount: value })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger data-testid="select-employee-count">
                          <SelectValue placeholder="Оберіть розмір" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYEE_COUNTS.map((ec) => (
                            <SelectItem key={ec.value} value={ec.value}>{ec.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscription" className="space-y-6">
                  {/* Billing Alert for Grace Period */}
                  {billingStatus?.hasBillingIssue && (
                    <Alert variant="destructive" className="border-orange-500 bg-orange-500/10">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex flex-col gap-3">
                          <div>
                            <p className="font-semibold">Проблема з оплатою</p>
                            <p className="text-sm">
                              {billingStatus.isInGracePeriod ? (
                                <>
                                  Не вдалося списати кошти за підписку. 
                                  У вас є <strong>{billingStatus.graceDaysRemaining} {billingStatus.graceDaysRemaining === 1 ? 'день' : 'дні'}</strong> щоб оновити спосіб оплати.
                                </>
                              ) : (
                                "Ваша підписка буде понижена до безкоштовного тарифу."
                              )}
                            </p>
                            {billingStatus.lastBillingError && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Помилка: {billingStatus.lastBillingError}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => retryPaymentMutation.mutate()}
                              disabled={retryPaymentMutation.isPending}
                              data-testid="button-retry-payment"
                            >
                              {retryPaymentMutation.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-2" />
                              )}
                              Повторити оплату
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => retryPaymentMutation.mutate()}
                              disabled={retryPaymentMutation.isPending}
                              data-testid="button-change-payment-method"
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Змінити спосіб оплати
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Current Plan */}
                  {subscriptionData?.plan && (() => {
                    const planColor = subscriptionData.plan.color || '#6b7280';
                    const planFeatures = Array.isArray(subscriptionData.plan.features) ? subscriptionData.plan.features as string[] : [];
                    return (
                    <div className="p-6 rounded-lg border-2" style={{ borderColor: planColor }}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className="p-3 rounded-full" 
                            style={{ backgroundColor: `${planColor}20` }}
                          >
                            <Crown className="h-6 w-6" style={{ color: planColor }} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{subscriptionData.plan.displayName}</h3>
                            <p className="text-sm text-muted-foreground">{subscriptionData.plan.description}</p>
                          </div>
                        </div>
                        {subscriptionData.plan.badge && (
                          <Badge style={{ backgroundColor: planColor }}>
                            {subscriptionData.plan.badge}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{subscriptionData.plan.maxBrands}</p>
                          <p className="text-xs text-muted-foreground">Брендів</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{subscriptionData.plan.maxTotalGames}</p>
                          <p className="text-xs text-muted-foreground">Ігор</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{Math.round((subscriptionData.plan.maxStorageBytes || 0) / 1024 / 1024)}MB</p>
                          <p className="text-xs text-muted-foreground">Сховище</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <p className="text-2xl font-bold">{subscriptionData.plan.maxMediaFiles}</p>
                          <p className="text-xs text-muted-foreground">Медіа</p>
                        </div>
                      </div>

                      {planFeatures.length > 0 && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium mb-2">Включені функції:</h4>
                          <div className="flex flex-wrap gap-2">
                            {planFeatures.map((feature: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Check className="h-3 w-3 mr-1" />
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          {subscriptionData.plan.priceMonthly > 0 ? (
                            <p className="text-lg font-semibold">
                              {(subscriptionData.plan.priceMonthly / 100).toFixed(0)} {subscriptionData.plan.currency}/міс
                            </p>
                          ) : (
                            <p className="text-lg font-semibold text-green-600">Безкоштовно</p>
                          )}
                          {subscriptionData.subscription.expiresAt && (
                            <p className="text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              Діє до: {format(new Date(subscriptionData.subscription.expiresAt), "d MMMM yyyy", { locale: uk })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Link href="/pricing">
                            <Button data-testid="button-change-plan" className="w-full sm:w-auto">
                              Змінити тариф
                            </Button>
                          </Link>
                          {subscriptionData.plan.priceMonthly > 0 && (
                            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  className="w-full sm:w-auto text-destructive hover:text-destructive"
                                  data-testid="button-cancel-subscription"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Скасувати
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Скасувати підписку?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ви впевнені, що хочете скасувати підписку "{subscriptionData.plan.displayName}"? 
                                    Ви втратите доступ до преміум-функцій і будете переведені на безкоштовний тариф.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Ні, залишити</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelSubscriptionMutation.mutate()}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={cancelSubscriptionMutation.isPending}
                                  >
                                    {cancelSubscriptionMutation.isPending ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Скасування...
                                      </>
                                    ) : (
                                      "Так, скасувати"
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })()}

                  {/* Available Plans */}
                  {allPlans && allPlans.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Доступні тарифи</h3>
                      <div className="grid gap-3">
                        {allPlans.filter(p => p.id !== subscriptionData?.plan?.id).map((plan) => {
                          const color = plan.color || '#6b7280';
                          return (
                          <div 
                            key={plan.id} 
                            className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start gap-3 mb-3">
                              <div 
                                className="p-2 rounded-full shrink-0" 
                                style={{ backgroundColor: `${color}20` }}
                              >
                                <Crown className="h-4 w-4" style={{ color }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-medium">{plan.displayName}</h4>
                                  {plan.badge && (
                                    <Badge variant="secondary" className="text-xs">{plan.badge}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {plan.maxBrands} брендів • {plan.maxTotalGames} ігор
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold">
                                {plan.priceMonthly > 0 ? `${(plan.priceMonthly / 100).toFixed(0)} ${plan.currency}/міс` : 'Безкоштовно'}
                              </p>
                              <Link href="/pricing">
                                <Button variant="outline" size="sm" data-testid={`button-select-plan-${plan.id}`}>
                                  Обрати
                                </Button>
                              </Link>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="payments" className="space-y-4">
                  <h3 className="text-lg font-semibold">Історія платежів</h3>

                  {paymentHistory && paymentHistory.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.map((payment) => (
                        <div 
                          key={payment.id} 
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className={`p-2 rounded-full shrink-0 ${
                              payment.status === 'success' ? 'bg-green-100 dark:bg-green-900' :
                              payment.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900' :
                              'bg-red-100 dark:bg-red-900'
                            }`}>
                              {payment.status === 'success' ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : payment.status === 'pending' ? (
                                <Clock className="h-4 w-4 text-yellow-600" />
                              ) : (
                                <CreditCard className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{payment.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(payment.createdAt), "d MMM yyyy, HH:mm", { locale: uk })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold">
                              {(payment.amount / 100).toFixed(0)} {payment.currency}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={payment.status === 'success' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {payment.status === 'success' ? 'Сплачено' : 
                                 payment.status === 'pending' ? 'Очікує' : 
                                 payment.status === 'failure' ? 'Помилка' : payment.status}
                              </Badge>
                              {payment.monoPageUrl && payment.status === 'pending' && (
                                <a 
                                  href={payment.monoPageUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  Оплатити <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Історія платежів порожня</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
