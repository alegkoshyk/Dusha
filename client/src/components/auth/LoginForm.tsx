import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoginPending, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
  });

  const onSubmit = (data: LoginUser) => {
    login(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto" data-testid="login-form">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          Увійти до гри
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          Введіть свої дані для входу в систему
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                placeholder="Введіть пароль"
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

          {loginError && (
            <Alert variant="destructive" data-testid="login-error">
              <AlertDescription>
                {loginError.message || "Помилка входу в систему"}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoginPending}
            data-testid="button-login"
          >
            {isLoginPending ? "Вхід..." : "Увійти"}
          </Button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Ще немає акаунту?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:underline font-medium"
                data-testid="link-register"
              >
                Зареєструватися
              </button>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}