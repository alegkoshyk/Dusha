import { Suspense, lazy, useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

const TldrawEditor = lazy(() =>
  import("./brand-canvas-editor").then((mod) => ({ default: mod.default }))
);

export default function BrandCanvas() {
  const { brandId } = useParams<{ brandId: string }>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: brand } = useQuery<{ id: number; name: string }>({
    queryKey: ["/api/brands", brandId],
    enabled: !!brandId,
  });

  return (
    <div className="fixed inset-0 flex flex-col bg-background z-50">
      <div className="flex items-center gap-3 px-4 py-2 border-b bg-background/95 backdrop-blur-sm shrink-0">
        <Link href={`/brand/${brandId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад
          </Button>
        </Link>
        <div className="h-5 w-px bg-border" />
        <h1 className="text-sm font-medium truncate">
          {brand?.name ? `${brand.name} — Полотно` : "Полотно"}
        </h1>
      </div>
      <div className="flex-1 relative">
        {mounted && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <TldrawEditor />
          </Suspense>
        )}
      </div>
    </div>
  );
}
