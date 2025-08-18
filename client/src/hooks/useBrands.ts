import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserBrand, InsertUserBrand } from "@shared/schema";

export function useBrands() {
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery<UserBrand[]>({
    queryKey: ["/api/user/brands"],
    retry: false,
  });

  const createBrandMutation = useMutation({
    mutationFn: async (brandData: Omit<InsertUserBrand, "userId">) => {
      const response = await fetch("/api/user/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(brandData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create brand");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/brands"] });
    },
  });

  return {
    brands,
    isLoading,
    createBrand: createBrandMutation.mutate,
    isCreatingBrand: createBrandMutation.isPending,
    createBrandError: createBrandMutation.error,
  };
}