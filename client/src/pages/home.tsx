import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { BrandSelector } from "@/components/brands/BrandSelector";
import type { UserBrand } from "@shared/schema";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleSelectBrand = async (brand: UserBrand) => {
    try {
      // Створюємо нову ігрову сесію для вибраного бренду
      const response = await fetch("/api/game-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: brand.id,
          currentLevel: "soul",
          currentCard: "soul-start",
          progress: 0,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create game session");
      }

      const session = await response.json();
      setLocation(`/game/${session.id}`);
    } catch (error) {
      console.error("Error creating game session:", error);
      // Fallback до старого підходу
      const sessionId = `session_${Date.now()}`;
      setLocation(`/game/${sessionId}?brandId=${brand.id}`);
    }
  };

  const handleCreateNewGame = async (brandId: string) => {
    try {
      // Створюємо нову гру для щойно створеного бренду
      const response = await fetch("/api/game-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandId: brandId,
          currentLevel: "soul",
          currentCard: "soul-start",
          progress: 0,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create game session");
      }

      const session = await response.json();
      setLocation(`/game/${session.id}`);
    } catch (error) {
      console.error("Error creating game session:", error);
      // Fallback до старого підходу
      const sessionId = `session_${Date.now()}`;
      setLocation(`/game/${sessionId}?brandId=${brandId}`);
    }
  };

  return (
    <div className="relative">
      {/* User menu */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Привіт, {user?.firstName || user?.email}!
          </p>
          <button
            onClick={() => logout()}
            className="text-sm text-red-600 hover:underline"
            data-testid="button-logout"
          >
            Вийти
          </button>
        </div>
      </div>

      <BrandSelector
        onSelectBrand={handleSelectBrand}
        onCreateNew={handleCreateNewGame}
      />
    </div>
  );
}