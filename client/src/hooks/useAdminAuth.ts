import { useAuth } from "./useAuth";

export function useAdminAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  
  const isAdmin = isAuthenticated && user?.role === 'admin';
  
  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    hasAdminAccess: isAdmin,
  };
}