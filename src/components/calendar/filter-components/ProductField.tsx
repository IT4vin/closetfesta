
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ProductFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProductField = ({ value, onChange }: ProductFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="product">Produto</Label>
      <Input 
        id="product"
        name="product"
        value={value}
        onChange={onChange}
        placeholder="Nome do produto"
      />
    </div>
  );
};

export default ProductField;
