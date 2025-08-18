import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Download } from "lucide-react";
import { exportToPDF } from "@/lib/pdfExport";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { BrandMap, GameSession } from "@shared/schema";

interface FloatingActionsProps {
  onHelpClick: () => void;
  sessionId: string;
  canExport: boolean;
}

export default function FloatingActions({ onHelpClick, sessionId, canExport }: FloatingActionsProps) {
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["/api/game-sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: brandMap } = useQuery({
    queryKey: ["/api/game-sessions", sessionId, "brand-map"],
    enabled: !!sessionId && canExport,
  });

  const handleExportPDF = async () => {
    if (!brandMap || !session) {
      toast({
        title: "Неможливо експортувати",
        description: "Спочатку заповніть хоча б частину карти бренду",
        variant: "destructive",
      });
      return;
    }

    try {
      await exportToPDF(brandMap as BrandMap, session as GameSession);
      toast({
        title: "Експорт успішний",
        description: "Карта бренду збережена у PDF файл",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Помилка експорту",
        description: "Не вдалося створити PDF файл",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-40">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="w-14 h-14 rounded-full shadow-lg bg-white dark:bg-card hover:shadow-xl transition-all duration-300"
            onClick={onHelpClick}
            data-testid="button-help"
          >
            <HelpCircle className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Довідка</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg bg-soul-500 hover:bg-soul-600 hover:shadow-xl transition-all duration-300"
            onClick={handleExportPDF}
            disabled={!canExport}
            data-testid="button-export-floating"
          >
            <Download className="w-6 h-6 text-white" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{canExport ? "Завантажити PDF" : "Спочатку заповніть карти"}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
