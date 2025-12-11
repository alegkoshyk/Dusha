import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { User, LoginUser, RegisterUser } from "@shared/schema";

interface AuthUser {
  user: User;
  profile?: any;
  settings?: any;
}

// Check for auth_token in URL (from OAuth redirect) and store it
function checkAndStoreUrlToken() {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('auth_token');
    if (urlToken) {
      localStorage.setItem('authToken', urlToken);
      console.log('Auth token from OAuth stored');
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }
}

// Run immediately on module load
checkAndStoreUrlToken();

export function useAuth() {
  const queryClient = useQueryClient();

  // Also check on hook mount in case of client-side navigation
  useEffect(() => {
    checkAndStoreUrlToken();
  }, []);

  const { data, isLoading, error } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 хвилин
    queryFn: async () => {
      // Check URL for token first (OAuth redirect)
      checkAndStoreUrlToken();
      
      // Get auth token for iPad compatibility
      const authToken = localStorage.getItem('authToken');
      
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers: authToken ? { "x-auth-token": authToken } : {},
      });

      if (response.status === 401) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      return await response.json();
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginUser) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }

      const result = await response.json();
      
      // Store auth token for iPad compatibility
      if (result.authToken) {
        localStorage.setItem('authToken', result.authToken);
        console.log('Auth token stored for iPad compatibility');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterUser) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Logout failed");
      }

      return await response.json();
    },
    onSuccess: () => {
      // Clear auth token from localStorage
      localStorage.removeItem('authToken');
      queryClient.clear();
      window.location.reload();
    },
  });

  return {
    user: data?.user || null,
    profile: data?.profile || null,
    settings: data?.settings || null,
    isLoading,
    isAuthenticated: !!data?.user && !error,
    error,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    isRegisterPending: registerMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}