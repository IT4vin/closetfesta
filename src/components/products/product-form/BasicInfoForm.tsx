
import React from "react";
import { Input } from "@/components/ui/input";

interface BasicInfoFormProps {
  formData: any;
  errors: Record<string, string>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ formData, errors, handleChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-600 mb-1">
          Nome do Produto*
        </label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
      </div>
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-neutral-600 mb-1">
          Categoria*
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange as any}
          className={`input-field w-full ${errors.type ? "border-red-500" : ""}`}
        >
          <option value="">Selecione uma categoria</option>
          <option value="Vestido">Vestido</option>
          <option value="Terno">Terno</option>
          <option value="Acessório">Acessório</option>
        </select>
        {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
      </div>
      
      <div>
        <label htmlFor="subtype" className="block text-sm font-medium text-neutral-600 mb-1">
          Subcategoria
        </label>
        <select
          id="subtype"
          name="subtype"
          value={formData.subtype}
          onChange={handleChange as any}
          className="input-field w-full"
        >
          <option value="">Selecione uma subcategoria</option>
          {formData.type === "Vestido" && (
            <>
              <option value="Noiva">Noiva</option>
              <option value="Madrinha">Madrinha</option>
              <option value="Festa">Festa</option>
              <option value="Debutante">Debutante</option>
            </>
          )}
          {formData.type === "Terno" && (
            <>
              <option value="Social">Social</option>
              <option value="Smoking">Smoking</option>
              <option value="Slim">Slim</option>
            </>
          )}
          {formData.type === "Acessório" && (
            <>
              <option value="Gravata">Gravata</option>
              <option value="Tiara">Tiara</option>
              <option value="Joias">Joias</option>
            </>
          )}
        </select>
      </div>
      
      <div>
        <label htmlFor="sku" className="block text-sm font-medium text-neutral-600 mb-1">
          Código SKU
        </label>
        <Input
          id="sku"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          placeholder="Gerado automaticamente"
          disabled={formData.sku ? true : false}
        />
        <p className="text-xs text-neutral-500 mt-1">
          Será gerado automaticamente se deixado em branco
        </p>
      </div>
    </div>
  );
};

export default BasicInfoForm;
