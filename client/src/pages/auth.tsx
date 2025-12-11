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
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* Animated neon background */}
      <div className="absolute inset-0 bg-[#0a0a12]">
        {/* Animated gradient blobs */}
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-60 blur-[120px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(128,0,255,0.8) 0%, rgba(75,0,130,0.4) 50%, transparent 70%)',
            animation: 'float1 8s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-1/2 right-1/4 w-[400px] h-[400px] rounded-full opacity-50 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(0,100,255,0.7) 0%, rgba(0,50,150,0.3) 50%, transparent 70%)',
            animation: 'float2 10s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute bottom-1/4 left-1/3 w-[350px] h-[350px] rounded-full opacity-40 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(0,200,150,0.6) 0%, rgba(0,100,80,0.3) 50%, transparent 70%)',
            animation: 'float3 12s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full opacity-50 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, rgba(180,0,255,0.7) 0%, rgba(100,0,180,0.3) 50%, transparent 70%)',
            animation: 'float4 9s ease-in-out infinite',
          }}
        />
      </div>
      
      {/* CSS animations */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(-30px, -20px) scale(1.02); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(30px, -40px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -30px) scale(1.1); }
        }
        @keyframes float4 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-35px, 25px) scale(1.05); }
          80% { transform: translate(25px, -35px) scale(0.95); }
        }
      `}</style>
      
      {/* Content */}
      <div className="w-full max-w-md relative z-10">
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