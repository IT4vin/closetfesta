
import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ScheduleFormFields from "./schedule/ScheduleFormFields";
import { useScheduleFormData } from "./schedule/useScheduleFormData";

interface ScheduleFormProps {
  onClose: () => void;
}

const ScheduleForm = ({ onClose }: ScheduleFormProps) => {
  const { formData, date, setDate, handleChange, clients, products, hasChanges } = useScheduleFormData();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Data obrigatória",
        description: "Por favor, selecione uma data para o agendamento",
        variant: "destructive",
      });
      return;
    }

    if (!formData.type || !formData.client || !formData.product || !formData.time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log("Form submitted:", { ...formData, date });
      
      toast({
        title: "Agendamento realizado",
        description: "Seu agendamento foi salvo com sucesso!",
      });
      
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      setIsConfirmDialogOpen(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <ScheduleFormFields 
          formData={formData}
          date={date}
          setDate={setDate}
          handleChange={handleChange}
          clients={clients}
          products={products}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" type="button" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            className="bg-marsala hover:bg-marsala-700 text-white" 
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>

      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alterações não salvas
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas. Se sair agora, essas alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                setIsConfirmDialogOpen(false);
                onClose();
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScheduleForm;
