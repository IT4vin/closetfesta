import React, { useRef } from "react";

interface DetailsFormProps {
  formData: {
    description: string;
    images: string[];
  };
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleImageUpload: (files: FileList) => void;
  removeImage: (index: number) => void;
}

const DetailsForm: React.FC<DetailsFormProps> = ({
  formData,
  handleChange,
  handleImageUpload,
  removeImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
      e.target.value = ""; // limpa para permitir re-upload do mesmo arquivo
    }
  };

  return (
    <div>
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Descrição do produto"
        className="w-full p-2 border rounded"
      />

      <div className="my-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-gray-300 px-3 py-1 rounded"
        >
          Clique para fazer upload
        </button>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileChange}
          ref={fileInputRef}
          className="hidden"
        />
      </div>

      <div className="flex flex-wrap gap-4">
        {formData.images.map((src, i) => (
          <div key={i} className="relative">
            <img
              src={src}
              alt={`Preview ${i}`}
              className="w-24 h-24 object-cover rounded"
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 text-center leading-6"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetailsForm;
