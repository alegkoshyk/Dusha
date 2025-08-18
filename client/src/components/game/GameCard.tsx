import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Lightbulb, Plus, Check } from "lucide-react";
import type { GameCard } from "@shared/schema";

interface GameCardProps {
  card: GameCard;
  responses: Record<string, any>;
  onSubmit: (responses: Record<string, any>) => void;
  onPrevious?: () => void;
  isLoading: boolean;
  cardNumber: number;
  totalCards: number;
}

export default function GameCardComponent({ 
  card, 
  responses, 
  onSubmit, 
  onPrevious, 
  isLoading, 
  cardNumber, 
  totalCards 
}: GameCardProps) {
  const [formData, setFormData] = useState<Record<string, any>>(responses || {});
  const [customValue, setCustomValue] = useState("");

  useEffect(() => {
    setFormData(responses || {});
  }, [responses]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case "soul": return "soul";
      case "mind": return "mind";
      case "body": return "body";
      default: return "soul";
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "soul": return "💎";
      case "mind": return "🧠";
      case "body": return "⚙️";
      default: return "💎";
    }
  };

  const colorClass = getLevelColor(card.level);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleValueSelection = (optionId: string) => {
    const selectedValues = formData.selectedValues || [];
    const maxSelections = card.validation?.maxSelections || 3;
    
    if (selectedValues.includes(optionId)) {
      // Remove selection
      handleInputChange("selectedValues", selectedValues.filter((id: string) => id !== optionId));
    } else if (selectedValues.length < maxSelections) {
      // Add selection
      handleInputChange("selectedValues", [...selectedValues, optionId]);
    }
  };

  const handleAddCustomValue = () => {
    if (customValue.trim()) {
      const selectedValues = formData.selectedValues || [];
      const maxSelections = card.validation?.maxSelections || 3;
      
      if (selectedValues.length < maxSelections) {
        handleInputChange("selectedValues", [...selectedValues, customValue.trim()]);
        setCustomValue("");
      }
    }
  };

  const handleSubmit = () => {
    if (isValid()) {
      onSubmit(formData);
    }
  };

  const isValid = () => {
    if (!card.required) return true;
    
    if (card.type === "values") {
      const selectedValues = formData.selectedValues || [];
      const minSelections = card.validation?.minSelections || 1;
      return selectedValues.length >= minSelections;
    }
    
    if (card.type === "text" || card.type === "reflection") {
      const textValue = formData.text || formData.reflection || "";
      const minLength = card.validation?.minLength || 10;
      return textValue.trim().length >= minLength;
    }
    
    if (card.type === "choice" || card.type === "archetype" || card.type === "audience") {
      return !!formData.choice;
    }
    
    return true;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-8">
      <div className="level-transition">
        <div className={`bg-white dark:bg-card rounded-2xl shadow-lg border border-${colorClass}-200 overflow-hidden`}>
          {/* Card Header */}
          <div className={`bg-gradient-to-r from-${colorClass}-500 to-${colorClass}-600 p-6 text-white`}>
            <div className="flex items-center justify-between">
              <div>
                <span className={`text-${colorClass}-100 text-sm font-medium`} data-testid="card-counter">
                  Картка {cardNumber} з {totalCards}
                </span>
                <h2 className="text-2xl font-bold mt-1" data-testid="card-title">
                  {card.title}
                </h2>
              </div>
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">{getLevelIcon(card.level)}</span>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="p-8">
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-4">
                {card.description}
              </p>
              
              {card.hint && (
                <div className={`bg-${colorClass}-50 dark:bg-${colorClass}-900/20 border-l-4 border-${colorClass}-500 p-4 rounded-r-lg`}>
                  <p className={`text-${colorClass}-800 dark:text-${colorClass}-200 text-sm`}>
                    <Lightbulb className="inline w-4 h-4 mr-2" />
                    <strong>Підказка:</strong> {card.hint}
                  </p>
                </div>
              )}
            </div>

            {/* Interactive Form */}
            <div className="space-y-6">
              {card.type === "values" && card.options && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                      Оберіть ваші ключові цінності:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {card.options.map((option) => {
                        const isSelected = (formData.selectedValues || []).includes(option.id);
                        return (
                          <div
                            key={option.id}
                            className={`
                              border-2 rounded-lg p-3 cursor-pointer transition-all duration-200
                              ${isSelected 
                                ? `border-${colorClass}-500 bg-${colorClass}-50 dark:bg-${colorClass}-900/20`
                                : `border-gray-200 dark:border-gray-700 hover:border-${colorClass}-300 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/10`
                              }
                            `}
                            onClick={() => handleValueSelection(option.id)}
                            data-testid={`option-${option.id}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">{option.icon}</span>
                              <span className="text-sm font-medium">{option.label}</span>
                              {isSelected && <Check className={`text-${colorClass}-500 ml-auto w-4 h-4`} />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Обрано: {(formData.selectedValues || []).length}/{card.validation?.maxSelections || 3}
                    </p>
                  </div>

                  {/* Custom Value Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Або додайте власну цінність:
                    </label>
                    <div className="flex space-x-3">
                      <Input
                        value={customValue}
                        onChange={(e) => setCustomValue(e.target.value)}
                        placeholder="Введіть свою цінність..."
                        className="flex-1"
                        data-testid="input-custom-value"
                      />
                      <Button
                        onClick={handleAddCustomValue}
                        disabled={!customValue.trim() || (formData.selectedValues || []).length >= (card.validation?.maxSelections || 3)}
                        className={`bg-${colorClass}-500 hover:bg-${colorClass}-600`}
                        data-testid="button-add-custom"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Selected Values Display */}
                  {(formData.selectedValues || []).length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                        Обрані цінності:
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {(formData.selectedValues || []).map((value: string, index: number) => (
                          <Badge 
                            key={index} 
                            className={`bg-${colorClass}-100 text-${colorClass}-700 dark:bg-${colorClass}-900/20 dark:text-${colorClass}-300`}
                            data-testid={`selected-value-${index}`}
                          >
                            {value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {(card.type === "text" || card.type === "reflection") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    {card.type === "reflection" ? "Поділіться своїми думками:" : "Ваша відповідь:"}
                  </label>
                  <Textarea
                    value={formData[card.type] || ""}
                    onChange={(e) => handleInputChange(card.type, e.target.value)}
                    placeholder={card.type === "reflection" ? "Поділіться своїми думками..." : "Введіть вашу відповідь..."}
                    className="h-24 resize-none"
                    data-testid={`input-${card.type}`}
                  />
                  {card.validation?.minLength && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Мінімум {card.validation.minLength} символів
                    </p>
                  )}
                </div>
              )}

              {(card.type === "choice" || card.type === "archetype" || card.type === "audience") && card.options && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
                    Оберіть найбільш підходящий варіант:
                  </label>
                  <div className="space-y-3">
                    {card.options.map((option) => (
                      <div
                        key={option.id}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                          ${formData.choice === option.id
                            ? `border-${colorClass}-500 bg-${colorClass}-50 dark:bg-${colorClass}-900/20`
                            : `border-gray-200 dark:border-gray-700 hover:border-${colorClass}-300 hover:bg-${colorClass}-50 dark:hover:bg-${colorClass}-900/10`
                          }
                        `}
                        onClick={() => handleInputChange("choice", option.id)}
                        data-testid={`choice-${option.id}`}
                      >
                        <div className="flex items-start space-x-3">
                          {option.icon && <span className="text-lg">{option.icon}</span>}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {option.label}
                            </h4>
                            {option.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {option.description}
                              </p>
                            )}
                          </div>
                          {formData.choice === option.id && (
                            <Check className={`text-${colorClass}-500 w-5 h-5 flex-shrink-0`} />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Actions */}
          <div className="bg-gray-50 dark:bg-gray-900/20 px-8 py-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={onPrevious}
              disabled={!onPrevious || isLoading}
              className="flex items-center space-x-2"
              data-testid="button-previous"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Попередня</span>
            </Button>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                disabled={isLoading}
                data-testid="button-skip"
              >
                Пропустити
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isValid() || isLoading}
                className={`bg-${colorClass}-500 hover:bg-${colorClass}-600 text-white`}
                data-testid="button-next"
              >
                {isLoading ? (
                  "Збереження..."
                ) : (
                  <>
                    <span>Далі</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
