import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ProductDialog } from "@/components/ProductDialog";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Pencil, 
  Trash2, 
  Search, 
  Sparkles,
  Loader2,
  Image,
  DollarSign,
  Tag
} from "lucide-react";
import type { BrandProduct, UserBrand } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProductsPage() {
  const { brandId } = useParams<{ brandId: string }>();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<BrandProduct | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<BrandProduct | null>(null);
  const [generatingImageFor, setGeneratingImageFor] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: brand, isLoading: brandLoading } = useQuery<UserBrand>({
    queryKey: ["/api/user/brands", brandId],
    enabled: !!brandId,
  });

  const { data: products, isLoading: productsLoading } = useQuery<BrandProduct[]>({
    queryKey: ["/api/brands", brandId, "products"],
    enabled: !!brandId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await apiRequest("DELETE", `/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to delete product");
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Продукт видалено" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "products"] });
      setDeleteProduct(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося видалити продукт", variant: "destructive" });
    },
  });

  const generateImageMutation = useMutation({
    mutationFn: async (productId: string) => {
      setGeneratingImageFor(productId);
      const response = await apiRequest("POST", `/api/products/${productId}/generate-image`);
      if (!response.ok) throw new Error("Failed to generate image");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Зображення згенеровано" });
      queryClient.invalidateQueries({ queryKey: ["/api/brands", brandId, "products"] });
      setGeneratingImageFor(null);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося згенерувати зображення", variant: "destructive" });
      setGeneratingImageFor(null);
    },
  });

  const filteredProducts = products?.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (product: BrandProduct) => {
    setSelectedProduct(product);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Активний</Badge>;
      case "archived":
        return <Badge variant="secondary">Архів</Badge>;
      default:
        return <Badge variant="outline">Чернетка</Badge>;
    }
  };

  if (brandLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Бренд не знайдено</p>
        <Button onClick={() => navigate("/brands")} className="mt-4">
          До брендів
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/brand-edit/${brandId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Продукти
            </h1>
            <p className="text-muted-foreground">{brand.name}</p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Додати продукт
        </Button>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук продуктів..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {productsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Немає продуктів</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? "Продуктів за вашим запитом не знайдено" : "Додайте перший продукт для вашого бренду"}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Додати продукт
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <Card key={product.id} className={product.isHighlighted ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{product.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(product.status)}
                      {product.category && (
                        <Badge variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {product.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Редагувати
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => generateImageMutation.mutate(product.id)}
                        disabled={generatingImageFor === product.id}
                      >
                        {generatingImageFor === product.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Згенерувати фото
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => setDeleteProduct(product)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Видалити
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video rounded-lg bg-muted/50 overflow-hidden">
                  {product.mainImageUrl ? (
                    <img 
                      src={product.mainImageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {product.shortDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.shortDescription}
                  </p>
                )}

                {product.price && (
                  <div className="flex items-center gap-1 text-lg font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {product.priceType === "from" && "від "}
                    {product.price} {product.currency}
                    {product.priceType === "negotiable" && " (договірна)"}
                  </div>
                )}

                {((product.features as string[])?.length > 0) && (
                  <div className="flex flex-wrap gap-1">
                    {((product.features as string[]).slice(0, 3)).map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                    {(product.features as string[]).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(product.features as string[]).length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brandId={brandId!}
        product={selectedProduct}
      />

      <AlertDialog open={!!deleteProduct} onOpenChange={(open) => !open && setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити продукт?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви впевнені, що хочете видалити "{deleteProduct?.name}"? Цю дію неможливо скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Видалити"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
