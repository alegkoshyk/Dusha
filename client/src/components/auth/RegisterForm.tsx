import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isRegisterPending, registerError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
  });

  const onSubmit = (data: RegisterUser) => {
    registerUser(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="register-form">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          Створити акаунт
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Зареєструйтесь для гри "Душа бренду"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Ім'я</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="firstName"
                  placeholder="Ваше ім'я"
                  className="pl-10"
                  data-testid="input-firstName"
                  {...register("firstName")}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-600" data-testid="error-firstName">
                  {errors.firstName.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Прізвище</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="lastName"
                  placeholder="Прізвище"
                  className="pl-10"
                  data-testid="input-lastName"
                  {...register("lastName")}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-600" data-testid="error-lastName">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email адреса</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="pl-10"
                data-testid="input-email"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600" data-testid="error-email">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Мінімум 8 символів"
                className="pl-10 pr-10"
                data-testid="input-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                data-testid="button-toggle-password"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600" data-testid="error-password">
                {errors.password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Підтвердження пароля</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Повторіть пароль"
                className="pl-10 pr-10"
                data-testid="input-confirmPassword"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                data-testid="button-toggle-confirmPassword"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600" data-testid="error-confirmPassword">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {registerError && (
            <Alert variant="destructive" data-testid="register-error">
              <AlertDescription>
                {registerError.message || "Помилка реєстрації"}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isRegisterPending}
            data-testid="button-register"
          >
            {isRegisterPending ? "Реєстрація..." : "Зареєструватись"}
          </Button>
        </form>

        {onSwitchToLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Вже маєте акаунт?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:underline font-medium"
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