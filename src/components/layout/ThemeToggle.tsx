
import React from "react";
import { Moon, Sun } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    toast({
      title: "Tema alterado",
      description: `Alterado para o tema ${newTheme === 'dark' ? 'escuro' : 'claro'}.`,
      duration: 2000,
    });
  };

  return (
    <Toggle 
      pressed={theme === "dark"} 
      onPressedChange={toggleTheme}
      aria-label="Alternar tema"
      className="rounded-full p-2"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </Toggle>
  );
};

export default ThemeToggle;
