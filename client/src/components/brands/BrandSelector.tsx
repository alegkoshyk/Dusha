import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Trash2, Calendar, BarChart3 } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { CreateBrandDialog } from "@/components/brands/CreateBrandDialog";
import type { UserBrand } from "@shared/schema";

interface BrandSelectorProps {
  onSelectBrand: (brand: UserBrand) => void;
  onCreateNew: (brandId: string) => void;
}

export function BrandSelector({ onSelectBrand, onCreateNew }: BrandSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState<string | null>(null);
  const { brands, isLoading, createBrand, deleteBrand, createBrandError, isCreatingBrand, isDeletingBrand } = useBrands();

  const handleCreateBrand = (brand: UserBrand) => {
    setShowCreateDialog(false);
    onCreateNew(brand.id);
  };

  const handleDeleteBrand = (brandId: string) => {
    setBrandToDelete(brandId);
    deleteBrand(brandId, {
      onSuccess: () => {
        setBrandToDelete(null);
      },
      onError: (error) => {
        console.error("Error deleting brand:", error);
        setBrandToDelete(null);
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Завантаження брендів...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "active": return "bg-blue-100 text-blue-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Завершено";
      case "active": return "Активний";
      case "archived": return "Архівовано";
      default: return "Невідомо";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Душа Бренду
          </h1>
          <p className="text-xl text-gray-600">
            Оберіть бренд для продовження або створіть новий
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Кнопка створення нового бренду */}
          <Card 
            className="border-2 border-dashed border-gray-300 hover:border-red-400 cursor-pointer transition-colors"
            onClick={() => setShowCreateDialog(true)}
            data-testid="card-create-brand"
          >
            <CardContent className="flex flex-col items-center justify-center min-h-[200px]">
              <Plus className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Створити новий бренд
              </h3>
              <p className="text-sm text-gray-500 text-center">
                Почніть нову подорож розкриття душі вашого бренду
              </p>
            </CardContent>
          </Card>

          {/* Існуючі бренди */}
          {brands.map((brand) => (
            <Card 
              key={brand.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              data-testid={`card-brand-${brand.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-xl font-bold text-gray-900 line-clamp-1">
                    {brand.name}
                  </CardTitle>
                  <Badge 
                    className={getStatusColor(brand.status)}
                    data-testid={`status-${brand.id}`}
                  >
                    {getStatusText(brand.status)}
                  </Badge>
                </div>
                {brand.description && (
                  <CardDescription className="text-gray-600 line-clamp-2">
                    {brand.description}
                  </CardDescription>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Прогрес */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Прогрес
                    </span>
                    <span className="text-sm text-gray-600">
                      {brand.totalProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(brand.totalProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Дата створення */}
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(brand.createdAt).toLocaleDateString('uk-UA')}
                </div>

                {/* Дії */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => onSelectBrand(brand)}
                    className="flex-1"
                    data-testid={`button-continue-${brand.id}`}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {brand.status === "completed" ? "Переглянути" : (brand.totalProgress > 0 ? "Продовжити" : "Почати")}
                  </Button>
                  
                  {brand.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBrand(brand.id);
                      }}
                      data-testid={`button-delete-${brand.id}`}
                      disabled={brandToDelete === brand.id || isDeletingBrand}
                    >
                      {brandToDelete === brand.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {brands.length === 0 && (
          <div className="text-center py-16">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ще немає брендів
            </h3>
            <p className="text-gray-500 mb-6">
              Створіть свій перший бренд, щоб почати подорож самопізнання
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              data-testid="button-create-first-brand"
            >
              <Plus className="h-4 w-4 mr-2" />
              Створити перший бренд
            </Button>
          </div>
        )}

        <CreateBrandDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onBrandCreated={handleCreateBrand}
        />
      </div>
    </div>
  );
}