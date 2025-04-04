
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";
import ThemeSelector from "./theme/ThemeSelector";
import ContrastToggle from "./theme/ContrastToggle";
import FontSizeSelector from "./theme/FontSizeSelector";
import ColorSchemeSelector from "./theme/ColorSchemeSelector";

const SystemPersonalization = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Palette className="h-6 w-6 text-marsala" />
          <CardTitle>Personalização do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <ThemeSelector />
          <ContrastToggle />
          <FontSizeSelector />
          <ColorSchemeSelector />
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemPersonalization;
