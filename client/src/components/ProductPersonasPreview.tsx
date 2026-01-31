import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Users } from "lucide-react";
import type { TargetAudience } from "@shared/schema";

interface ProductPersonasPreviewProps {
  productId: string;
  maxShow?: number;
}

export function ProductPersonasPreview({ productId, maxShow = 4 }: ProductPersonasPreviewProps) {
  const { data: personas } = useQuery<TargetAudience[]>({
    queryKey: ["/api/products", productId, "personas"],
  });

  if (!personas || personas.length === 0) {
    return null;
  }

  const visiblePersonas = personas.slice(0, maxShow);
  const remaining = personas.length - maxShow;

  return (
    <div className="flex items-center gap-1">
      <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      <div className="flex -space-x-2">
        {visiblePersonas.map(persona => (
          <Avatar key={persona.id} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={persona.aiPortraitImageUrl || undefined} alt={persona.name} />
            <AvatarFallback className="text-[10px]">
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
        ))}
        {remaining > 0 && (
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
            +{remaining}
          </div>
        )}
      </div>
    </div>
  );
}
