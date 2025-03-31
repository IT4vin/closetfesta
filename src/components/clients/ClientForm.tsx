
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = React.useState(
    initialData || {
      name: "",
      email: "",
      phone: "",
      address: "",
      birthdate: "",
      document: "",
      measurements: {
        bust: "",
        waist: "",
        hips: "",
        height: ""
      },
      notes: ""
    }
  );
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome Completo*</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email*</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Telefone*</Label>
            <Input
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Endereço*</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birthdate">Data de Nascimento</Label>
            <Input
              id="birthdate"
              name="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <Label htmlFor="document">CPF*</Label>
            <Input
              id="document"
              name="document"
              value={formData.document}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Medidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="measurements.bust">Busto (cm)</Label>
              <Input
                id="measurements.bust"
                name="measurements.bust"
                type="number"
                value={formData.measurements.bust}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="measurements.waist">Cintura (cm)</Label>
              <Input
                id="measurements.waist"
                name="measurements.waist"
                type="number"
                value={formData.measurements.waist}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="measurements.hips">Quadril (cm)</Label>
              <Input
                id="measurements.hips"
                name="measurements.hips"
                type="number"
                value={formData.measurements.hips}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="measurements.height">Altura (cm)</Label>
              <Input
                id="measurements.height"
                name="measurements.height"
                type="number"
                value={formData.measurements.height}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-marsala hover:bg-marsala-700">
          Salvar
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
