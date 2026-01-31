import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Users, ChevronRight, ChevronDown, Loader2, Check, X, Target } from "lucide-react";
import type { BrandProduct, TargetAudience, DemographicSegment, DemographicSubSegment } from "@shared/schema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProductPersonasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId: string;
  product: BrandProduct;
}

interface SegmentWithPersonas extends DemographicSegment {
  personas: TargetAudience[];
  subSegments: (DemographicSubSegment & { personas: TargetAudience[] })[];
}

export function ProductPersonasDialog({ open, onOpenChange, brandId, product }: ProductPersonasDialogProps) {
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<Set<string>>(new Set());
  const [expandedSegments, setExpandedSegments] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: segments, isLoading: segmentsLoading } = useQuery<SegmentWithPersonas[]>({
    queryKey: ["/api/brands", brandId, "demographic-segments"],
    enabled: open && !!brandId,
  });

  const { data: currentPersonas, isLoading: personasLoading } = useQuery<TargetAudience[]>({
    queryKey: ["/api/products", product.id, "personas"],
    enabled: open && !!product.id,
  });

  useEffect(() => {
    if (currentPersonas) {
      setSelectedPersonaIds(new Set(currentPersonas.map(p => p.id)));
    }
  }, [currentPersonas]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const currentIds = new Set(currentPersonas?.map(p => p.id) || []);
      const toAdd = Array.from(selectedPersonaIds).filter(id => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter(id => !selectedPersonaIds.has(id));

      for (const personaId of toRemove) {
        await apiRequest("DELETE", `/api/products/${product.id}/personas/${personaId}`);
      }

      if (toAdd.length > 0) {
        await apiRequest("POST", `/api/products/${product.id}/personas/bulk`, {
          personaIds: toAdd,
        });
      }
    },
    onSuccess: () => {
      toast({ title: "Успішно", description: "Персони продукту оновлено" });
      queryClient.invalidateQueries({ queryKey: ["/api/products", product.id, "personas"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Помилка", description: "Не вдалося оновити персони", variant: "destructive" });
    },
  });

  const togglePersona = (personaId: string) => {
    setSelectedPersonaIds(prev => {
      const next = new Set(prev);
      if (next.has(personaId)) {
        next.delete(personaId);
      } else {
        next.add(personaId);
      }
      return next;
    });
  };

  const toggleSegment = (segment: SegmentWithPersonas) => {
    const segmentPersonaIds = [
      ...segment.personas.map(p => p.id),
      ...segment.subSegments.flatMap(ss => ss.personas.map(p => p.id)),
    ];

    const allSelected = segmentPersonaIds.every(id => selectedPersonaIds.has(id));

    setSelectedPersonaIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        segmentPersonaIds.forEach(id => next.delete(id));
      } else {
        segmentPersonaIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const toggleSubSegment = (subSegment: DemographicSubSegment & { personas: TargetAudience[] }) => {
    const subSegmentPersonaIds = subSegment.personas.map(p => p.id);
    const allSelected = subSegmentPersonaIds.every(id => selectedPersonaIds.has(id));

    setSelectedPersonaIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        subSegmentPersonaIds.forEach(id => next.delete(id));
      } else {
        subSegmentPersonaIds.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const getSegmentSelectionState = (segment: SegmentWithPersonas): "none" | "partial" | "all" => {
    const segmentPersonaIds = [
      ...segment.personas.map(p => p.id),
      ...segment.subSegments.flatMap(ss => ss.personas.map(p => p.id)),
    ];
    if (segmentPersonaIds.length === 0) return "none";
    const selectedCount = segmentPersonaIds.filter(id => selectedPersonaIds.has(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === segmentPersonaIds.length) return "all";
    return "partial";
  };

  const getSubSegmentSelectionState = (subSegment: DemographicSubSegment & { personas: TargetAudience[] }): "none" | "partial" | "all" => {
    const personaIds = subSegment.personas.map(p => p.id);
    if (personaIds.length === 0) return "none";
    const selectedCount = personaIds.filter(id => selectedPersonaIds.has(id)).length;
    if (selectedCount === 0) return "none";
    if (selectedCount === personaIds.length) return "all";
    return "partial";
  };

  const isLoading = segmentsLoading || personasLoading;

  const allPersonas = segments?.flatMap(s => [
    ...s.personas,
    ...s.subSegments.flatMap(ss => ss.personas),
  ]) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Цільова аудиторія продукту
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {product.name}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : !segments || segments.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Немає сегментів аудиторії. Спочатку створіть сегменти та персони.
              </p>
            </div>
          ) : (
            <Accordion 
              type="multiple" 
              value={expandedSegments}
              onValueChange={setExpandedSegments}
              className="space-y-2"
            >
              {segments.map(segment => {
                const selectionState = getSegmentSelectionState(segment);
                const totalPersonas = segment.personas.length + 
                  segment.subSegments.reduce((sum, ss) => sum + ss.personas.length, 0);

                return (
                  <AccordionItem 
                    key={segment.id} 
                    value={segment.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center gap-2 p-3 bg-muted/30">
                      <Checkbox
                        checked={selectionState === "all"}
                        data-state={selectionState === "partial" ? "indeterminate" : undefined}
                        onCheckedChange={() => toggleSegment(segment)}
                        className="data-[state=indeterminate]:bg-primary/50"
                      />
                      <AccordionTrigger className="flex-1 hover:no-underline py-0">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="font-medium">{segment.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {totalPersonas} персон
                          </Badge>
                        </div>
                      </AccordionTrigger>
                    </div>
                    <AccordionContent className="pb-0">
                      <div className="p-3 space-y-3">
                        {segment.personas.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                              Персони сегменту
                            </p>
                            <div className="grid gap-2">
                              {segment.personas.map(persona => (
                                <label
                                  key={persona.id}
                                  className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    checked={selectedPersonaIds.has(persona.id)}
                                    onCheckedChange={() => togglePersona(persona.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium">{persona.name}</span>
                                    {persona.ageRange && (
                                      <span className="text-sm text-muted-foreground ml-2">
                                        {persona.ageRange}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {segment.subSegments.map(subSegment => {
                          const ssState = getSubSegmentSelectionState(subSegment);
                          return (
                            <div key={subSegment.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={ssState === "all"}
                                  data-state={ssState === "partial" ? "indeterminate" : undefined}
                                  onCheckedChange={() => toggleSubSegment(subSegment)}
                                  className="data-[state=indeterminate]:bg-primary/50"
                                />
                                <span className="text-sm font-medium">{subSegment.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {subSegment.personas.length}
                                </Badge>
                              </div>
                              <div className="grid gap-2 ml-6">
                                {subSegment.personas.map(persona => (
                                  <label
                                    key={persona.id}
                                    className="flex items-center gap-3 p-2 rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                                  >
                                    <Checkbox
                                      checked={selectedPersonaIds.has(persona.id)}
                                      onCheckedChange={() => togglePersona(persona.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium">{persona.name}</span>
                                      {persona.ageRange && (
                                        <span className="text-sm text-muted-foreground ml-2">
                                          {persona.ageRange}
                                        </span>
                                      )}
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Обрано: {selectedPersonaIds.size} з {allPersonas.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Скасувати
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Зберігаємо...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Зберегти
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
