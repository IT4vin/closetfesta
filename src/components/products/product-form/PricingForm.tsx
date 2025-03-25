
import React from "react";
import { Input } from "@/components/ui/input";

interface PricingFormProps {
  formData: any;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const PricingForm: React.FC<PricingFormProps> = ({ formData, errors, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="price" className="block text-sm font-medium text-neutral-600 mb-1">
          Preço de Venda (R$)
        </label>
        <Input
          id="price"
          name="price"
          type="number"
          value={formData.price}
          onChange={handleChange}
          min="0"
          step="0.01"
        />
      </div>
      
      <div>
        <label htmlFor="rentalPrice" className="block text-sm font-medium text-neutral-600 mb-1">
          Preço de Aluguel (R$)*
        </label>
        <Input
          id="rentalPrice"
          name="rentalPrice"
          type="number"
          value={formData.rentalPrice}
          onChange={handleChange}
          min="0"
          step="0.01"
          className={errors.rentalPrice ? "border-red-500" : ""}
        />
        {errors.rentalPrice && <p className="text-sm text-red-500 mt-1">{errors.rentalPrice}</p>}
      </div>
      
      <div>
        <label htmlFor="size" className="block text-sm font-medium text-neutral-600 mb-1">
          Tamanho*
        </label>
        <Input
          id="size"
          name="size"
          value={formData.size}
          onChange={handleChange}
          className={errors.size ? "border-red-500" : ""}
        />
        {errors.size && <p className="text-sm text-red-500 mt-1">{errors.size}</p>}
      </div>
      
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-neutral-600 mb-1">
          Cor
        </label>
        <Input
          id="color"
          name="color"
          value={formData.color}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-neutral-600 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange as any}
          className="input-field w-full"
        >
          <option value="available">Disponível</option>
          <option value="rented">Alugado</option>
          <option value="maintenance">Em Manutenção</option>
        </select>
      </div>
    </div>
  );
};

export default PricingForm;
