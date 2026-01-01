import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, Palette, Wand2, X } from "lucide-react";

export interface BrandColor {
  name: string;
  hex: string;
  role: 'primary' | 'secondary' | 'accent' | 'neutral' | 'background' | 'text';
}

interface BrandColorPickerProps {
  colors: BrandColor[];
  onChange: (colors: BrandColor[]) => void;
  logoImage?: string | null;
}

const COLOR_ROLES = [
  { value: 'primary', label: 'Основний' },
  { value: 'secondary', label: 'Другорядний' },
  { value: 'accent', label: 'Акцентний' },
  { value: 'neutral', label: 'Нейтральний' },
  { value: 'background', label: 'Фоновий' },
  { value: 'text', label: 'Текстовий' },
];

const DEFAULT_PALETTE = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#2ECC71',
];

export function extractColorsFromImage(imageUrl: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const size = 100;
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, 0, 0, size, size);

      const imageData = ctx.getImageData(0, 0, size, size);
      const pixels = imageData.data;

      const colorCounts: Record<string, number> = {};
      
      for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const a = pixels[i + 3];
        
        if (a < 128) continue;
        
        const brightness = (r + g + b) / 3;
        if (brightness < 20 || brightness > 235) continue;
        
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }

      const sortedColors = Object.entries(colorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([hex]) => hex);

      resolve(sortedColors);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

export function BrandColorPicker({ colors, onChange, logoImage }: BrandColorPickerProps) {
  const [newColor, setNewColor] = useState<Partial<BrandColor>>({ hex: '#6366F1', role: 'primary' });
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const addColor = useCallback(() => {
    if (newColor.hex && newColor.name && newColor.role) {
      onChange([...colors, newColor as BrandColor]);
      setNewColor({ hex: '#6366F1', role: 'primary', name: '' });
    }
  }, [colors, newColor, onChange]);

  const removeColor = useCallback((index: number) => {
    onChange(colors.filter((_, i) => i !== index));
  }, [colors, onChange]);

  const updateColor = useCallback((index: number, updates: Partial<BrandColor>) => {
    const updated = [...colors];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  }, [colors, onChange]);

  const extractFromLogo = useCallback(async () => {
    if (!logoImage) return;
    setIsExtracting(true);
    try {
      const extracted = await extractColorsFromImage(logoImage);
      setExtractedColors(extracted);
    } catch (error) {
      console.error('Failed to extract colors:', error);
    } finally {
      setIsExtracting(false);
    }
  }, [logoImage]);

  const addExtractedColor = useCallback((hex: string) => {
    const roles: BrandColor['role'][] = ['primary', 'secondary', 'accent', 'neutral', 'background', 'text'];
    const usedRoles = new Set(colors.map(c => c.role));
    const availableRole = roles.find(r => !usedRoles.has(r)) || 'accent';
    
    onChange([...colors, { name: `Колір ${colors.length + 1}`, hex, role: availableRole }]);
  }, [colors, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Кольори бренду</Label>
        {logoImage && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={extractFromLogo}
            disabled={isExtracting}
            data-testid="button-extract-colors"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {isExtracting ? 'Аналіз...' : 'Витягти з лого'}
          </Button>
        )}
      </div>

      {extractedColors.length > 0 && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">Кольори з лого (натисніть щоб додати):</p>
          <div className="flex flex-wrap gap-2">
            {extractedColors.map((hex, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addExtractedColor(hex)}
                className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform"
                style={{ backgroundColor: hex }}
                title={hex}
                data-testid={`button-extracted-color-${i}`}
              />
            ))}
            <button
              type="button"
              onClick={() => setExtractedColors([])}
              className="w-8 h-8 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center hover:bg-muted"
            >
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
      )}

      {colors.length > 0 && (
        <div className="space-y-2">
          {colors.map((color, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-sm shrink-0"
                    style={{ backgroundColor: color.hex }}
                    data-testid={`button-color-picker-${index}`}
                  />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="space-y-2">
                    <Input
                      type="color"
                      value={color.hex}
                      onChange={(e) => updateColor(index, { hex: e.target.value })}
                      className="w-full h-10"
                    />
                    <Input
                      type="text"
                      value={color.hex}
                      onChange={(e) => updateColor(index, { hex: e.target.value })}
                      placeholder="#000000"
                      className="font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1">
                      {DEFAULT_PALETTE.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => updateColor(index, { hex })}
                          className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Input
                value={color.name}
                onChange={(e) => updateColor(index, { name: e.target.value })}
                placeholder="Назва кольору"
                className="flex-1"
                data-testid={`input-color-name-${index}`}
              />
              
              <Select
                value={color.role}
                onValueChange={(value) => updateColor(index, { role: value as BrandColor['role'] })}
              >
                <SelectTrigger className="w-[130px]" data-testid={`select-color-role-${index}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeColor(index)}
                className="shrink-0 text-destructive hover:text-destructive"
                data-testid={`button-remove-color-${index}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 p-2 border border-dashed border-muted-foreground/30 rounded-lg">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0"
              style={{ backgroundColor: newColor.hex }}
              data-testid="button-new-color-picker"
            >
              <Palette className="h-4 w-4 text-white mix-blend-difference" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3">
            <div className="space-y-2">
              <Input
                ref={colorInputRef}
                type="color"
                value={newColor.hex}
                onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                className="w-full h-10"
              />
              <Input
                type="text"
                value={newColor.hex}
                onChange={(e) => setNewColor({ ...newColor, hex: e.target.value })}
                placeholder="#000000"
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap gap-1">
                {DEFAULT_PALETTE.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setNewColor({ ...newColor, hex })}
                    className="w-6 h-6 rounded border hover:scale-110 transition-transform"
                    style={{ backgroundColor: hex }}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Input
          value={newColor.name || ''}
          onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
          placeholder="Назва кольору"
          className="flex-1"
          data-testid="input-new-color-name"
        />
        
        <Select
          value={newColor.role}
          onValueChange={(value) => setNewColor({ ...newColor, role: value as BrandColor['role'] })}
        >
          <SelectTrigger className="w-[130px]" data-testid="select-new-color-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COLOR_ROLES.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addColor}
          disabled={!newColor.name || !newColor.hex}
          className="shrink-0"
          data-testid="button-add-color"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {colors.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Додайте кольори вашого бренду для створення палітри
        </p>
      )}
    </div>
  );
}
