
import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Tema</h3>
      <div className="flex items-center space-x-4">
        <RadioGroup 
          value={theme} 
          onValueChange={(value) => setTheme(value as "light" | "dark")}
          className="flex space-x-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="light" id="light" />
            <Label htmlFor="light" className="flex items-center gap-2">
              <Sun size={18} /> Claro
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="dark" id="dark" />
            <Label htmlFor="dark" className="flex items-center gap-2">
              <Moon size={18} /> Escuro
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default ThemeSelector;
