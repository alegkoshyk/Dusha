import { useState } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";

type AuthMode = "login" | "register";

export function Auth() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");

  const handleAuthSuccess = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === "login" ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </div>
    </div>
  );
}