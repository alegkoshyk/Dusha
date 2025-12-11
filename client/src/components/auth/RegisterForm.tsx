import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { SiGoogle, SiApple } from "react-icons/si";

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

          {registerError && (
            <Alert variant="destructive" data-testid="register-error">
              <AlertDescription>
                {registerError.message || "Помилка реєстрації"}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0" 
            disabled={isRegisterPending}
            data-testid="button-register"
          >
            {isRegisterPending ? "Реєстрація..." : "Зареєструватись"}
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