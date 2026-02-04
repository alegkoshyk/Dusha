import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Package, 
  Pencil, 
  DollarSign, 
  Tag, 
  Users, 
  User,
  Image,
  CheckCircle,
  Target,
  Lightbulb,
  FileText
} from "lucide-react";
import type { BrandProduct, UserBrand, TargetAudience } from "@shared/schema";

interface ProductDetailDialogProps {
  product: BrandProduct | null;
  brand?: UserBrand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (product: BrandProduct) => void;
  brandId: string;
}

export function ProductDetailDialog({ 
  product, 
  brand,
  open, 
  onOpenChange, 
  onEdit,
  brandId 
}: ProductDetailDialogProps) {
  const { data: personas } = useQuery<TargetAudience[]>({
    queryKey: ["/api/products", product?.id, "personas"],
    enabled: !!product?.id,
  });

  if (!product) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Активний</Badge>;
      case "draft":
        return <Badge variant="secondary">Чернетка</Badge>;
      case "archived":
        return <Badge variant="outline">Архів</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const features = (product.features as string[]) || [];
  const benefits = (product.benefits as string[]) || [];
  const useCases = (product.useCases as string[]) || [];
  const keywords = (product.keywords as string[]) || [];
  const specifications = (product.specifications as Record<string, string>) || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(product.status || "draft")}
                  {product.category && (
                    <Badge variant="outline">{product.category}</Badge>
                  )}
                  {product.isHighlighted && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Виділений
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onEdit(product)}>
              <Pencil className="h-4 w-4 mr-2" />
              Редагувати
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 space-y-6">
            {/* Main Image */}
            <div className="aspect-video rounded-lg bg-muted/50 overflow-hidden max-w-2xl">
              {product.mainImageUrl ? (
                <img 
                  src={product.mainImageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Price */}
            {product.price && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">
                  {product.priceType === "from" && "від "}
                  {product.price} {product.currency}
                  {product.priceType === "negotiable" && " (договірна)"}
                </span>
              </div>
            )}

            {/* Descriptions */}
            {product.shortDescription && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Короткий опис</h3>
                <p className="text-foreground">{product.shortDescription}</p>
              </div>
            )}

            {product.fullDescription && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Повний опис
                </h3>
                <p className="text-foreground whitespace-pre-wrap">{product.fullDescription}</p>
              </div>
            )}

            <Separator />

            {/* Features */}
            {features.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Особливості
                </h3>
                <div className="flex flex-wrap gap-2">
                  {features.map((f, i) => (
                    <Badge key={i} variant="secondary">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Benefits */}
            {benefits.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Переваги
                </h3>
                <ul className="space-y-2">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Use Cases */}
            {useCases.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Сценарії використання
                </h3>
                <div className="flex flex-wrap gap-2">
                  {useCases.map((u, i) => (
                    <Badge key={i} variant="outline">{u}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {Object.keys(specifications).length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Характеристики</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between p-2 bg-muted/50 rounded">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Ключові слова
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((k, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{k}</Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Target Audiences / Personas */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Цільова аудиторія продукту
              </h3>
              
              {product.targetAudience && (
                <p className="text-sm text-foreground mb-4">{product.targetAudience}</p>
              )}

              {personas && personas.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {personas.map(persona => (
                    <div 
                      key={persona.id} 
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={persona.aiPortraitImageUrl || undefined} alt={persona.name} />
                        <AvatarFallback>
                          <User className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{persona.name}</p>
                        {persona.ageRange && (
                          <p className="text-sm text-muted-foreground">{persona.ageRange}</p>
                        )}
                        {persona.gender && (
                          <p className="text-sm text-muted-foreground capitalize">{persona.gender}</p>
                        )}
                        {persona.occupation && (
                          <p className="text-sm text-muted-foreground">{persona.occupation}</p>
                        )}
                        {(persona.values as string[] | undefined)?.length && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {((persona.values as string[]).slice(0, 3)).map((v, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Персони не призначені. Додайте цільову аудиторію через меню продукту.
                </p>
              )}
            </div>

            {/* SKU */}
            {product.sku && (
              <div className="text-sm text-muted-foreground">
                Артикул: <span className="font-mono">{product.sku}</span>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
