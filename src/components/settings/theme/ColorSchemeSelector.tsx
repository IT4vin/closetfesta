
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";

const ColorSchemeSelector = () => {
  const { colorScheme, setColorScheme } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Esquema de Cores</h3>
      <RadioGroup 
        value={colorScheme} 
        onValueChange={(value) => setColorScheme(value as "marsala" | "blue" | "green" | "purple")}
        className="grid grid-cols-2 gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="marsala" id="marsala" />
          <Label htmlFor="marsala" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-marsala"></div>
            Marsala (padrão)
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="blue" id="blue" />
          <Label htmlFor="blue" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-blue-600"></div>
            Azul
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="green" id="green" />
          <Label htmlFor="green" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-emerald-600"></div>
            Verde
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="purple" id="purple" />
          <Label htmlFor="purple" className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-purple-600"></div>
            Roxo
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ColorSchemeSelector;
