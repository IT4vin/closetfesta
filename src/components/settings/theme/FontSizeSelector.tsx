
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";

const FontSizeSelector = () => {
  const { fontSize, setFontSize } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tamanho da Fonte</h3>
      <RadioGroup 
        value={fontSize} 
        onValueChange={(value) => setFontSize(value as "small" | "medium" | "large" | "xlarge")}
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="small" id="small" />
          <Label htmlFor="small">Pequeno</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="medium" id="medium" />
          <Label htmlFor="medium">Médio</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="large" id="large" />
          <Label htmlFor="large">Grande</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="xlarge" id="xlarge" />
          <Label htmlFor="xlarge">Extra Grande</Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default FontSizeSelector;
