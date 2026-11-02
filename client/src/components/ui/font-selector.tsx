import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Type } from "lucide-react";

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
  label?: string;
  className?: string;
}

const fonts = [
  { name: "Arial", value: "Arial, sans-serif", category: "Sans Serif" },
  { name: "Helvetica", value: "Helvetica, Arial, sans-serif", category: "Sans Serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif", category: "Sans Serif" },
  { name: "Roboto", value: "'Roboto', sans-serif", category: "Sans Serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif", category: "Sans Serif" },
  { name: "Poppins", value: "'Poppins', sans-serif", category: "Sans Serif" },
  { name: "Inter", value: "'Inter', sans-serif", category: "Sans Serif" },
  { name: "Times New Roman", value: "'Times New Roman', serif", category: "Serif" },
  { name: "Georgia", value: "Georgia, serif", category: "Serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif", category: "Serif" },
  { name: "Merriweather", value: "'Merriweather', serif", category: "Serif" },
  { name: "Courier New", value: "'Courier New', monospace", category: "Monospace" },
  { name: "Monaco", value: "Monaco, monospace", category: "Monospace" },
  { name: "Fira Code", value: "'Fira Code', monospace", category: "Monospace" },
];

export function FontSelector({ value, onChange, label, className }: FontSelectorProps) {
  const currentFont = fonts.find(f => f.value === value) || fonts[0];

  return (
    <div className={className}>
      {label && <label className="text-sm font-medium text-gray-700 mb-2 block">{label}</label>}
      
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <SelectValue placeholder="Select font">
              <span style={{ fontFamily: value }}>{currentFont.name}</span>
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {fonts.map((font) => (
            <SelectItem 
              key={font.value} 
              value={font.value}
              className="font-medium"
            >
              <div className="flex flex-col">
                <span style={{ fontFamily: font.value }}>{font.name}</span>
                <span className="text-xs text-gray-500">{font.category}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}