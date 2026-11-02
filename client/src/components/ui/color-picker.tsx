import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

const predefinedColors = [
  "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
  "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#800080",
  "#ffc0cb", "#a52a2a", "#808080", "#000080", "#008000",
  "#ff4500", "#da70d6", "#32cd32", "#ff1493", "#00ced1",
  // Social media brand colors
  "#1877f2", // Facebook
  "#1da1f2", // Twitter
  "#0077b5", // LinkedIn
  "#e4405f", // Instagram
  "#ff0000", // YouTube
  "#25d366", // WhatsApp
];

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleColorChange = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>}
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 h-10"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div
              className="w-6 h-6 rounded-md border-2 border-gray-300 flex-shrink-0"
              style={{ backgroundColor: value }}
            />
            <span className="text-sm font-mono">{value}</span>
            <Palette className="w-4 h-4 ms-auto" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Color input */}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-16 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="#000000"
                    className="font-mono text-sm"
                  />
                </div>
                
                {/* Predefined colors grid */}
                <div className="grid grid-cols-8 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform ${
                        value === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}