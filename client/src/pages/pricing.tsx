import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Check, Sparkles, Crown, Zap, ArrowLeft, Loader2 } from "lucide-react";

interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxBrands: number;
  maxTotalGames: number;
  maxStorageBytes: number;
  maxMediaFiles: number;
  features: string[] | null;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

interface UserSubscription {
  subscription: {
    id: number;
    userId: string;
    planId: number;
    billingPeriod: string;
    status: string;
  };
  plan: SubscriptionPlan;
}

export default function PricingPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const { data: plans, isLoading: plansLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/subscriptions/plans'],
  });

  const { data: currentSubscription, isLoading: subLoading } = useQuery<UserSubscription | null>({
    queryKey: ['/api/subscriptions/current'],
    enabled: !!user,
  });

  const { data: quotas } = useQuery<{ maxBrands: number; maxTotalGames: number; usedBrands: number; usedGames: number }>({
    queryKey: ['/api/subscriptions/quotas'],
    enabled: !!user,
  });

  const checkoutMutation = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: number; billingPeriod: string }) => {
      const response = await apiRequest('POST', '/api/payments/create', { planId, billingPeriod });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pageUrl) {
        window.location.href = data.pageUrl;
      } else {
        toast({
          title: "Успішно!",
          description: "Підписку оформлено",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
        queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/quotas'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося створити платіж",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscriptions/cancel', {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Підписку скасовано",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/current'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/quotas'] });
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося скасувати підписку",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    checkoutMutation.mutate({ planId: plan.id, billingPeriod });
  };

  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return "Безкоштовно";
    return new Intl.NumberFormat('uk-UA', { 
      style: 'currency', 
      currency,
      minimumFractionDigits: 0,
    }).format(price / 100);
  };

  const formatStorage = (bytes: number) => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(0)} ГБ`;
    }
    return `${(bytes / 1048576).toFixed(0)} МБ`;
  };

  const getPlanIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'pro': return <Crown className="h-6 w-6 text-yellow-500" />;
      case 'basic': return <Zap className="h-6 w-6 text-blue-500" />;
      default: return <Sparkles className="h-6 w-6 text-gray-500" />;
    }
  };

  const isCurrentPlan = (plan: SubscriptionPlan) => {
    return currentSubscription?.plan.id === plan.id;
  };

  if (plansLoading || subLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation('/dashboard')}
          data-testid="button-back-dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          До дашборду
        </Button>

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Оберіть свій тариф</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Розблокуйте всі можливості для розвитку вашого бренду
          </p>

          {user && quotas && (
            <div className="inline-flex items-center gap-4 bg-muted/50 rounded-lg px-6 py-3 mb-8">
              <div className="text-sm">
                <span className="text-muted-foreground">Бренди: </span>
                <span className="font-medium">{quotas.usedBrands} / {quotas.maxBrands}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-sm">
                <span className="text-muted-foreground">Ігри: </span>
                <span className="font-medium">{quotas.usedGames} / {quotas.maxTotalGames}</span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-4">
            <span className={billingPeriod === 'monthly' ? 'font-medium' : 'text-muted-foreground'}>
              Щомісяця
            </span>
            <Switch
              checked={billingPeriod === 'yearly'}
              onCheckedChange={(checked) => setBillingPeriod(checked ? 'yearly' : 'monthly')}
              data-testid="switch-billing-period"
            />
            <span className={billingPeriod === 'yearly' ? 'font-medium' : 'text-muted-foreground'}>
              Щорічно
              <Badge variant="secondary" className="ml-2">Знижка 20%</Badge>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans?.sort((a, b) => a.sortOrder - b.sortOrder).map((plan) => {
            const isCurrent = isCurrentPlan(plan);
            const price = billingPeriod === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const isPopular = plan.name.toLowerCase() === 'basic';
            
            return (
              <Card 
                key={plan.id} 
                className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Популярний
                  </Badge>
                )}
                {isCurrent && (
                  <Badge variant="outline" className="absolute -top-3 right-4">
                    Ваш тариф
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.name)}
                  </div>
                  <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">
                      {formatPrice(price, plan.currency)}
                    </span>
                    {price > 0 && (
                      <span className="text-muted-foreground">
                        /{billingPeriod === 'yearly' ? 'рік' : 'міс'}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 text-left">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>До {plan.maxBrands} {plan.maxBrands === 1 ? 'бренд' : plan.maxBrands < 5 ? 'бренди' : 'брендів'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>До {plan.maxTotalGames} {plan.maxTotalGames === 1 ? 'гра' : plan.maxTotalGames < 5 ? 'гри' : 'ігор'}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{formatStorage(plan.maxStorageBytes)} сховища</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>До {plan.maxMediaFiles} файлів</span>
                    </li>
                    {plan.features?.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    plan.isDefault ? (
                      <Button variant="outline" className="w-full" disabled>
                        Активний
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => cancelMutation.mutate()}
                        disabled={cancelMutation.isPending}
                        data-testid={`button-cancel-plan-${plan.id}`}
                      >
                        {cancelMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Скасувати
                      </Button>
                    )
                  ) : (
                    <Button 
                      className="w-full" 
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={checkoutMutation.isPending}
                      data-testid={`button-select-plan-${plan.id}`}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      {price === 0 ? 'Обрати' : 'Оформити'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center text-muted-foreground text-sm">
          <p>
            * Оплата здійснюється через Stripe. Ви можете скасувати підписку в будь-який момент.
          </p>
          <p className="mt-2">
            Маєте питання? <a href="mailto:support@soulofbrand.com" className="text-primary hover:underline">Зв'яжіться з нами</a>
          </p>
        </div>
      </div>
    </div>
  );
}
