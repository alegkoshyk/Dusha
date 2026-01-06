import { useQuery } from "@tanstack/react-query";
import type { BrandAnalysisTemplate } from "@shared/schema";

export function useBrandAnalysisEnabled() {
  const { data: templates = [], isLoading } = useQuery<BrandAnalysisTemplate[]>({
    queryKey: ['/api/admin/brand-analysis-templates'],
    staleTime: 1000 * 60 * 5,
  });

  const activeTemplates = templates.filter(t => t.isActive);
  const isEnabled = activeTemplates.length > 0;

  return { isEnabled, isLoading, activeTemplates };
}
