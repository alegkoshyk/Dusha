import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Brain, ServerCog, Expand } from "lucide-react";
import type { BrandMap, GameLevel } from "@shared/schema";

interface BrandMapPreviewProps {
  brandMap: BrandMap;
  currentLevel: GameLevel;
}

export default function BrandMapPreview({ brandMap, currentLevel }: BrandMapPreviewProps) {
  const getLevelStatus = (level: GameLevel) => {
    const hasContent = (level: GameLevel) => {
      switch (level) {
        case "soul":
          return brandMap.soul.values.length > 0 || !!brandMap.soul.mission;
        case "mind":
          return !!brandMap.mind.targetAudience || !!brandMap.mind.brandIdea;
        case "body":
          return brandMap.body.products.length > 0 || brandMap.body.channels.length > 0;
        default:
          return false;
      }
    };

    if (hasContent(level)) return "progress";
    if (level === currentLevel) return "active";
    return "waiting";
  };

  const sections = [
    {
      id: "soul" as GameLevel,
      title: "Душа",
      icon: Heart,
      colorClass: "soul",
      data: brandMap.soul,
      items: [
        { label: "Місія", value: brandMap.soul.mission },
        { label: "Цінності", value: brandMap.soul.values.join(", ") },
        { label: "Історія", value: brandMap.soul.story },
        { label: "Призначення", value: brandMap.soul.purpose },
      ].filter(item => item.value),
    },
    {
      id: "mind" as GameLevel,
      title: "Розум",
      icon: Brain,
      colorClass: "mind", 
      data: brandMap.mind,
      items: [
        { label: "Стратегія", value: brandMap.mind.brandIdea },
        { label: "Аудиторія", value: brandMap.mind.targetAudience },
        { label: "Архетип", value: brandMap.mind.archetype },
        { label: "Обіцянка", value: brandMap.mind.promise },
        { label: "Позиціонування", value: brandMap.mind.positioning },
      ].filter(item => item.value),
    },
    {
      id: "body" as GameLevel,
      title: "Тіло",
      icon: ServerCog,
      colorClass: "body",
      data: brandMap.body,
      items: [
        { label: "Продукти", value: brandMap.body.products.join(", ") },
        { label: "Канали", value: brandMap.body.channels.join(", ") },
        { label: "Дії", value: brandMap.body.actions.join(", ") },
        { label: "Стиль", value: brandMap.body.visualStyle },
        { label: "Тон", value: brandMap.body.toneOfVoice },
      ].filter(item => item.value),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-200 dark:border-border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white" data-testid="preview-title">
            Ваша карта бренду
          </h3>
          <Button variant="ghost" size="sm" className="text-soul-600 hover:text-soul-700" data-testid="button-expand-preview">
            <Expand className="w-4 h-4 mr-2" />
            Переглянути повністю
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section) => {
            const status = getLevelStatus(section.id);
            const Icon = section.icon;
            
            return (
              <div
                key={section.id}
                className={`
                  border rounded-lg p-4 transition-all duration-300
                  ${status === "active" 
                    ? `border-${section.colorClass}-200`
                    : status === "progress"
                    ? `border-${section.colorClass}-200`
                    : "border-gray-200 dark:border-gray-700 opacity-50"
                  }
                `}
                data-testid={`preview-${section.id}`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`w-8 h-8 bg-${section.colorClass}-500 rounded-full flex items-center justify-center`}>
                    <Icon className="text-white text-sm" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {section.title}
                  </h4>
                  <Badge 
                    variant={status === "progress" ? "default" : "secondary"}
                    className={
                      status === "progress" 
                        ? `bg-${section.colorClass}-100 text-${section.colorClass}-700 dark:bg-${section.colorClass}-900/20 dark:text-${section.colorClass}-300` 
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }
                    data-testid={`status-${section.id}`}
                  >
                    {status === "active" && "В процесі"}
                    {status === "progress" && "Заповнено"}
                    {status === "waiting" && "Очікує"}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  {section.items.length > 0 ? (
                    section.items.map((item, index) => (
                      <div key={index}>
                        <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
                        <span className="text-gray-900 dark:text-white font-medium block truncate" data-testid={`item-${section.id}-${index}`}>
                          {item.value}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 dark:text-gray-500 space-y-1">
                      {section.id === "soul" && (
                        <>
                          <div>Місія: —</div>
                          <div>Цінності: —</div>
                          <div>Історія: —</div>
                        </>
                      )}
                      {section.id === "mind" && (
                        <>
                          <div>Стратегія: —</div>
                          <div>Аудиторія: —</div>
                          <div>Архетип: —</div>
                        </>
                      )}
                      {section.id === "body" && (
                        <>
                          <div>Продукти: —</div>
                          <div>Канали: —</div>
                          <div>Дії: —</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
