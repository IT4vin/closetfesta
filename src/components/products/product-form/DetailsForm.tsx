
import React from "react";
import { X, Upload } from "lucide-react";

interface DetailsFormProps {
  formData: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleImageUpload: () => void;
  removeImage: (index: number) => void;
}

const DetailsForm: React.FC<DetailsFormProps> = ({ 
  formData, 
  handleChange, 
  handleImageUpload, 
  removeImage 
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-600 mb-1">
          Descrição detalhada
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          className="input-field w-full"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-neutral-600 mb-1">
          Imagens do Produto
        </label>
        <div 
          className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center cursor-pointer hover:bg-neutral-50 transition-colors" 
          onClick={handleImageUpload}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-12 w-12 text-neutral-400 mb-2" />
            <p className="text-sm font-medium text-neutral-700">Clique para fazer upload</p>
            <p className="text-xs text-neutral-500 mt-1">Ou arraste e solte imagens aqui</p>
            <p className="text-xs text-neutral-500 mt-1">PNG, JPG até 5MB</p>
          </div>
        </div>
        
        {/* Image previews */}
        {formData.images && formData.images.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {formData.images.map((img: string, index: number) => (
              <div key={index} className="relative">
                <img src={img} alt="Preview" className="w-full h-24 object-cover rounded-md" />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsForm;
