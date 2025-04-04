
import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ContrastToggle = () => {
  const { highContrast, setHighContrast } = useTheme();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Acessibilidade</h3>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Eye size={18} />
          <Label htmlFor="high-contrast">Modo de alto contraste</Label>
        </div>
        <Switch 
          id="high-contrast" 
          checked={highContrast} 
          onCheckedChange={setHighContrast} 
        />
      </div>
    </div>
  );
};

export default ContrastToggle;
