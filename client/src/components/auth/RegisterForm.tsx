import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { registerUserSchema, type RegisterUser, type SubscriptionPlan } from "@shared/schema";
import { Eye, EyeOff, Mail, Lock, User, Crown, Check, ArrowRight, Loader2 } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

type RegistrationStep = "details" | "plan";

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [step, setStep] = useState<RegistrationStep>("details");
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [formData, setFormData] = useState<RegisterUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isRegisterPending, registerError } = useAuth();

  const { data: plans, isLoading: isLoadingPlans } = useQuery<SubscriptionPlan[]>({
    queryKey: ["/api/subscription-plans"],
  });

  const freePlan = plans?.find(p => p.priceMonthly === 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
  });

  const handleDetailsSubmit = (data: RegisterUser) => {
    setFormData(data);
    setStep("plan");
  };

  const handleFinalSubmit = (planId: number | null) => {
    if (!formData) return;
    
    const finalPlanId = planId || freePlan?.id;
    
    registerUser({ ...formData, selectedPlanId: finalPlanId || undefined }, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  const handlePlanSelect = (planId: number) => {
    setSelectedPlanId(planId);
  };

  const handleSkip = () => {
    handleFinalSubmit(freePlan?.id || null);
  };

  const handleContinueWithPlan = () => {
    if (selectedPlanId) {
      handleFinalSubmit(selectedPlanId);
    }
  };

  if (step === "plan") {
    return (
      <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl" data-testid="plan-selection">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-bold text-center text-white">
            Оберіть тариф
          </CardTitle>
          <CardDescription className="text-center text-gray-300">
            Виберіть план, який підходить вам найкраще
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {plans?.sort((a, b) => a.priceMonthly - b.priceMonthly).map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const planColor = plan.color || '#6b7280';
                const features = Array.isArray(plan.features) ? plan.features as string[] : [];
                const isFree = plan.priceMonthly === 0;
                
                return (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => handlePlanSelect(plan.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-purple-500 bg-purple-500/20' 
                        : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                    }`}
                    data-testid={`plan-option-${plan.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="p-2 rounded-full shrink-0"
                        style={{ backgroundColor: `${planColor}30` }}
                      >
                        <Crown className="h-5 w-5" style={{ color: planColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-white">{plan.displayName}</h3>
                          {plan.badge && (
                            <Badge 
                              className="text-xs"
                              style={{ backgroundColor: planColor }}
                            >
                              {plan.badge}
                            </Badge>
                          )}
                          {isSelected && (
                            <Check className="h-4 w-4 text-purple-400 ml-auto" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{plan.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{plan.maxBrands} брендів</span>
                          <span>•</span>
                          <span>{plan.maxTotalGames} ігор</span>
                          <span>•</span>
                          <span>{Math.round((plan.maxStorageBytes || 0) / 1024 / 1024)}MB</span>
                        </div>
                        {features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {features.slice(0, 3).map((feature, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-white/10 text-gray-300">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {!isFree ? (
                          <>
                            <p className="text-lg font-bold text-white">
                              {(plan.priceMonthly / 100).toFixed(0)}
                            </p>
                            <p className="text-xs text-gray-400">{plan.currency}/міс</p>
                          </>
                        ) : (
                          <p className="text-lg font-bold text-green-400">Безкоштовно</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0"
            disabled={!selectedPlanId || isRegisterPending}
            onClick={handleContinueWithPlan}
            data-testid="button-select-plan"
          >
            {isRegisterPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Реєстрація...
              </>
            ) : (
              <>
                Обрати тариф
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {registerError && (
            <Alert variant="destructive" data-testid="register-error">
              <AlertDescription>
                {registerError.message || "Помилка реєстрації"}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isRegisterPending}
              className="text-sm text-gray-500 hover:text-gray-400 transition-colors underline-offset-2 hover:underline"
              data-testid="button-skip-plan"
            >
              Пропустити (безкоштовний тариф)
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl" data-testid="register-form">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center text-white">
          Створити акаунт
        </CardTitle>
        <CardDescription className="text-center text-gray-300">
          Зареєструйтесь для гри "Душа бренду"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleDetailsSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-200">Ім'я</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="Ваше ім'я"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                  data-testid="input-firstName"
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-400" data-testid="error-firstName">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-gray-200">Прізвище</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  placeholder="Прізвище"
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                  data-testid="input-lastName"
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-400" data-testid="error-lastName">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email адреса</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                data-testid="input-email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400" data-testid="error-email">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Мінімум 8 символів"
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                data-testid="input-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-400" data-testid="error-password">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-200">Підтвердження пароля</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Повторіть пароль"
                className="pl-10 pr-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-purple-400"
                data-testid="input-confirmPassword"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-300"
                data-testid="button-toggle-confirmPassword"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-400" data-testid="error-confirmPassword">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0" 
            data-testid="button-continue"
          >
            Продовжити
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>

        <div className="my-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-white/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-gray-400">
                або зареєструватись через
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            onClick={() => window.location.href = '/api/auth/google'}
            data-testid="button-google-register"
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Google
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
            onClick={() => window.location.href = '/api/auth/apple'}
            data-testid="button-apple-register"
          >
            <SiApple className="mr-2 h-4 w-4" />
            Apple
          </Button>
        </div>

        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Вже маєте акаунт?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-purple-400 hover:text-purple-300 hover:underline font-medium"
                data-testid="link-login"
              >
                Увійти
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
