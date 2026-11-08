import React, { useState, useRef, useEffect } from "react";
import { PRODUCT_TYPES, EVENT_TYPES, SIZE_OPTIONS, COLOR_OPTIONS, VALIDATION_RULES, CUSTOM_OPTIONS_CONFIG } from '@/config/productFormConfig';
import { formatNCM, formatCFOP, formatProductCode, generateProductCode } from '@/utils/formatters';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import FormSection from './FormSection';
import FormField from './FormField';
import CustomSelectField from './CustomSelectField';

interface ProductFormProps {
  initialData?: {
    // Informações básicas
    productType?: string;
    fullCode?: string;
    storeCode?: string;
    name?: string;
    quantity?: number;
    
    // Características físicas
    color?: string;
    size?: string;
    model?: string;
    brand?: string;
    stylist?: string;
    
    // Eventos e categorização
    eventTypes?: string[];
    
    // Valores financeiros
    cost?: number;
    rentalPrice?: number;
    firstRentalPrice?: number;
    salePrice?: number;
    
    // Códigos fiscais
    ncmCode?: string;
    cfopCode?: string;
    
    // Comissão
    commissionType?: 'value' | 'percentage';
    commissionValue?: number;
    
    // Outros campos existentes
    description?: string;
    images?: Array<string | { url: string }>;
    material?: string;
    cleaningInstructions?: string;
    notes?: string;
    location?: string;
  };
  onSubmit?: (data: any) => Promise<void> | void;
  onCancel?: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    // Informações básicas
    productType: initialData?.productType || (initialData as any)?.type || "",
    fullCode: initialData?.fullCode || (initialData as any)?.sku || "",
    storeCode: initialData?.storeCode || "",
    name: initialData?.name || "",
    quantity: initialData?.quantity || 1,
    
    // Características físicas
    color: initialData?.color || "",
    size: initialData?.size || (initialData as any)?.sizes?.[0] || "",
    model: initialData?.model || "",
    brand: initialData?.brand || "",
    stylist: initialData?.stylist || "",
    
    // Eventos
    eventTypes: initialData?.eventTypes || [],
    
    // Valores financeiros
    cost: initialData?.cost || 0,
    rentalPrice: initialData?.rentalPrice || (initialData as any)?.rental_price || 0,
    firstRentalPrice: initialData?.firstRentalPrice || 0,
    salePrice: initialData?.salePrice || 0,
    
    // Códigos fiscais
    ncmCode: initialData?.ncmCode || "",
    cfopCode: initialData?.cfopCode || "",
    
    // Comissão
    commissionType: initialData?.commissionType || 'percentage' as 'value' | 'percentage',
    commissionValue: initialData?.commissionValue || 0,
    
    // Outros campos
    description: initialData?.description || "",
    material: initialData?.material || "",
    cleaningInstructions: initialData?.cleaningInstructions || "",
    notes: initialData?.notes || "",
    location: initialData?.location || "",
    images: (initialData?.images || []).map(image => typeof image === "string" ? image : image.url).filter(Boolean),
  });

  const [autoGenerateCode, setAutoGenerateCode] = useState(!initialData?.fullCode);
  const [showDraftMessage, setShowDraftMessage] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks para opções customizadas
  const productTypesOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.PRODUCT_TYPES.storageKey,
    defaultOptions: PRODUCT_TYPES
  });

  const colorsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.COLORS.storageKey,
    defaultOptions: COLOR_OPTIONS
  });

  const sizesOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.SIZES.storageKey,
    defaultOptions: SIZE_OPTIONS
  });

  const brandsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.BRANDS.storageKey,
    defaultOptions: [] // Removido todas as marcas padrão
  });

  const stylistsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.STYLISTS.storageKey,
    defaultOptions: ["Casa", "Externo", "Personalizado"] // Alguns padrão
  });

  const materialsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.MATERIALS.storageKey,
    defaultOptions: ["Algodão", "Poliéster", "Seda", "Linho", "Viscose", "Lycra", "Couro", "Sintético"]
  });

  // Schema de validação
  const validationSchema = {
    name: { required: true, minLength: 2, maxLength: 100 },
    productType: { required: true },
    quantity: { required: true, min: 1 },
    fullCode: { 
      required: true, 
      pattern: VALIDATION_RULES.CODE.pattern,
      minLength: VALIDATION_RULES.CODE.minLength,
      maxLength: VALIDATION_RULES.CODE.maxLength
    },
    ncmCode: { 
      pattern: VALIDATION_RULES.NCM.pattern,
      custom: (value: string) => value && !VALIDATION_RULES.NCM.pattern.test(value) ? VALIDATION_RULES.NCM.message : null
    },
    cfopCode: { 
      pattern: VALIDATION_RULES.CFOP.pattern,
      custom: (value: string) => value && !VALIDATION_RULES.CFOP.pattern.test(value) ? VALIDATION_RULES.CFOP.message : null
    },
    cost: { min: 0 },
    rentalPrice: { min: 0 },
    firstRentalPrice: { min: 0 },
    salePrice: { min: 0 },
    commissionValue: { 
      min: 0,
      custom: (value: number) => {
        if (formData.commissionType === 'percentage' && value > 100) {
          return 'Porcentagem não pode ser maior que 100%';
        }
        return null;
      }
    }
  };

  // Hook de validação
  const {
    errors,
    isValid,
    validateAll,
    validateSingleField,
    touchField,
    getFieldError,
    clearFieldError,
  } = useFormValidation({
    data: formData,
    schema: validationSchema,
    validateOnChange: true,
  });

  // Hook de auto-save
  const {
    hasDraft,
    loadFromStorage,
    clearStorage,
    getDraftInfo
  } = useAutoSave({
    data: formData,
    enabled: true,
    onSave: () => {
      console.log('📄 Rascunho salvo automaticamente');
    }
  });

  // Verifica se há rascunho ao carregar componente
  useEffect(() => {
    if (hasDraft() && !initialData) {
      setShowDraftMessage(true);
    }
  }, []);

  // Atualiza o código automático quando o tipo de produto muda
  useEffect(() => {
    if (autoGenerateCode && formData.productType) {
      const newCode = generateProductCode(formData.productType);
      setFormData(prev => ({
        ...prev,
        fullCode: newCode
      }));
    }
  }, [formData.productType, autoGenerateCode]);

  // Carrega rascunho
  const loadDraft = () => {
    const draftData = loadFromStorage();
    if (draftData) {
      setFormData({ ...draftData, images: (draftData.images || []).filter((url: string) => typeof url === "string" && !url.startsWith("blob:")) });
      setShowDraftMessage(false);
    }
  };

  // Descarta rascunho
  const discardDraft = () => {
    clearStorage();
    setShowDraftMessage(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    touchField(name);
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    touchField(name);
  };

  const handleMaskedChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    touchField(name);
  };

  const handleEventTypeChange = (eventType: string) => {
    setFormData(prev => ({
      ...prev,
      eventTypes: prev.eventTypes.includes(eventType)
        ? prev.eventTypes.filter(type => type !== eventType)
        : [...prev.eventTypes, eventType]
    }));
    touchField('eventTypes');
  };

  const handleCodeModeChange = (auto: boolean) => {
    setAutoGenerateCode(auto);
    if (auto) {
      const newCode = generateProductCode(formData.productType);
      setFormData(prev => ({
        ...prev,
        fullCode: newCode
      }));
      clearFieldError('fullCode');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;
    if (files.length + pendingFiles.length > 12 ||
      files.some(file => !["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024)) {
      setSaveError("Envie no máximo 12 novas imagens JPG, PNG ou WebP de até 8 MB.");
      return;
    }
    setSaveError("");
    setPendingFiles(previous => [...previous, ...files]);
    setFormData(previous => ({
      ...previous,
      images: [...previous.images, ...files.map(file => URL.createObjectURL(file))],
    }));
  };

  const removeImage = (index: number) => {
    const image = formData.images[index];
    if (!image || !image.startsWith("blob:")) return;
    const fileIndex = formData.images.slice(0, index + 1).filter(url => url.startsWith("blob:")).length - 1;
    URL.revokeObjectURL(image);
    setPendingFiles(previous => previous.filter((_, i) => i !== fileIndex));
    setFormData(previous => ({ ...previous, images: previous.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateAll() || saving || !onSubmit) return;
    setSaving(true);
    setSaveError("");
    try {
      await onSubmit({ ...formData, imageFiles: pendingFiles });
      clearStorage();
      formData.images.filter(url => url.startsWith("blob:")).forEach(url => URL.revokeObjectURL(url));
      setPendingFiles([]);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível concluir o cadastro.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    formData.images.filter(url => url.startsWith("blob:")).forEach(url => URL.revokeObjectURL(url));
    setPendingFiles([]);
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
      
      {/* Mensagem de rascunho */}
      {showDraftMessage && (
        <div className="bg-marsala-50 border border-marsala-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-marsala-900">📄 Rascunho encontrado</h4>
              <p className="text-sm text-marsala-700 mt-1">
                Encontramos um rascunho salvo automaticamente. Deseja carregar?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadDraft}
                className="px-3 py-1 bg-marsala text-white text-sm rounded hover:bg-marsala-700"
              >
                Carregar
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

            <header className="space-y-3 rounded-xl border border-marsala-100 bg-gradient-to-r from-marsala-50 to-white p-4 sm:p-5">
        <span className="inline-flex rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-marsala-800">
          Cadastro de traje para locação
        </span>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-marsala-950">
              {initialData?"Atualizar informações do produto":"Novo produto no catálogo"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha a identificação, preço de aluguel, características e fotografias.
              As demais informações podem ser adicionadas conforme a necessidade.
            </p>
          </div>
          <span className="rounded-lg border border-marsala-200 bg-white px-3 py-2 text-xs text-marsala-900">
            {formData.quantity} exemplar(es) · {formData.rentalPrice?Number(formData.rentalPrice)
              .toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):"Preço a definir"}
          </span>
        </div>
      </header>
      <nav aria-label="Seções do cadastro de produto"
        className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2 text-xs">
        {([
          ["#produto-basico","Identificação"],["#produto-caracteristicas","Características"],
          ["#produto-valores","Valores"],["#produto-imagens","Imagens"],
          ["#produto-eventos","Eventos"],["#produto-adicionais","Detalhes"],
          ["#produto-fiscal","Fiscal"],
        ] as const).map(([href,label],i)=><a key={href} href={href}
          className="rounded-lg px-3 py-2 font-medium text-muted-foreground hover:bg-marsala-50 hover:text-marsala-900 focus-visible:outline-2 focus-visible:outline-marsala-700">
          <span className="mr-1.5 text-marsala-700">{i+1}.</span>{label}
        </a>)}
      </nav>
      {/* SEÇÃO: INFORMAÇÕES BÁSICAS */}
      <FormSection id="produto-basico" title="Informações Básicas" icon="📋" bgColor="marsala">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomSelectField
            label="Tipo de Produto"
            name="productType"
            value={formData.productType}
            onChange={handleChange}
            options={productTypesOptions.allOptions}
            onAddOption={productTypesOptions.addOption}
            onRemoveOption={productTypesOptions.removeOption}
            isCustomOption={productTypesOptions.isCustomOption}
            placeholder="Selecione o tipo"
            required
            error={getFieldError('productType')}
          />

          <FormField
            label="Nome do Produto"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            error={getFieldError('name')}
          />

          {/* Código Completo */}
          <div className="md:col-span-2">
            <label className="block font-medium mb-2">Código Completo</label>
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={autoGenerateCode}
                    onChange={() => handleCodeModeChange(true)}
                    className="mr-2"
                  />
                  Gerar automaticamente
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!autoGenerateCode}
                    onChange={() => handleCodeModeChange(false)}
                    className="mr-2"
                  />
                  Inserir manualmente
                </label>
              </div>
              <FormField
                label=""
                name="fullCode"
                type="masked"
                value={formData.fullCode}
                onChange={handleChange}
                onMaskedChange={handleMaskedChange}
                mask={formatProductCode}
                disabled={autoGenerateCode}
                placeholder={autoGenerateCode ? "Código gerado automaticamente" : "Digite o código"}
                error={getFieldError('fullCode')}
                help="Código deve conter apenas letras maiúsculas, números, hífen e underscore"
              />
            </div>
          </div>

          <FormField
            label="Código Loja"
            name="storeCode"
            value={formData.storeCode}
            onChange={handleChange}
            placeholder="Código alternativo"
          />

          <FormField
            label="Quantidade"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleNumberChange}
            min={1}
            required
            error={getFieldError('quantity')}
          />
        </div>
      </FormSection>

      {/* SEÇÃO: CARACTERÍSTICAS FÍSICAS */}
      <FormSection id="produto-caracteristicas" title="Características Físicas" icon="👗" bgColor="marsala" collapsible>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CustomSelectField
            label="Cor"
            name="color"
            value={formData.color}
            onChange={handleChange}
            options={colorsOptions.allOptions}
            onAddOption={colorsOptions.addOption}
            onRemoveOption={colorsOptions.removeOption}
            isCustomOption={colorsOptions.isCustomOption}
            placeholder="Selecione a cor"
          />

          <CustomSelectField
            label="Tamanho"
            name="size"
            value={formData.size}
            onChange={handleChange}
            options={sizesOptions.allOptions}
            onAddOption={sizesOptions.addOption}
            onRemoveOption={sizesOptions.removeOption}
            isCustomOption={sizesOptions.isCustomOption}
            placeholder="Selecione o tamanho"
          />

          <FormField
            label="Modelo"
            name="model"
            value={formData.model}
            onChange={handleChange}
          />

          <CustomSelectField
            label="Marca"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            options={brandsOptions.allOptions}
            onAddOption={brandsOptions.addOption}
            onRemoveOption={brandsOptions.removeOption}
            isCustomOption={brandsOptions.isCustomOption}
            placeholder="Selecione a marca"
          />

          <CustomSelectField
            label="Estilista"
            name="stylist"
            value={formData.stylist}
            onChange={handleChange}
            options={stylistsOptions.allOptions}
            onAddOption={stylistsOptions.addOption}
            onRemoveOption={stylistsOptions.removeOption}
            isCustomOption={stylistsOptions.isCustomOption}
            placeholder="Selecione o estilista"
          />

          <CustomSelectField
            label="Material"
            name="material"
            value={formData.material}
            onChange={handleChange}
            options={materialsOptions.allOptions}
            onAddOption={materialsOptions.addOption}
            onRemoveOption={materialsOptions.removeOption}
            isCustomOption={materialsOptions.isCustomOption}
            placeholder="Selecione o material"
          />
        </div>
      </FormSection>

      {/* SEÇÃO: VALORES FINANCEIROS */}
      <FormSection id="produto-valores" title="Valores Financeiros" icon="💰" bgColor="marsala">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Custo"
            name="cost"
            type="currency"
            value={formData.cost}
            onChange={handleNumberChange}
            min={0}
            error={getFieldError('cost')}
          />

          <FormField
            label="Aluguel Padrão"
            name="rentalPrice"
            type="currency"
            value={formData.rentalPrice}
            onChange={handleNumberChange}
            min={0}
            error={getFieldError('rentalPrice')}
          />

          <FormField
            label="Primeiro Aluguel"
            name="firstRentalPrice"
            type="currency"
            value={formData.firstRentalPrice}
            onChange={handleNumberChange}
            min={0}
            error={getFieldError('firstRentalPrice')}
            help="Valor especial para primeira locação"
          />

          <FormField
            label="Preço de Venda"
            name="salePrice"
            type="currency"
            value={formData.salePrice}
            onChange={handleNumberChange}
            min={0}
            error={getFieldError('salePrice')}
          />

          {/* Comissão */}
          <div className="md:col-span-2">
            <label className="block font-medium mb-2">Comissão do Vendedor</label>
            <div className="flex gap-4 mb-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.commissionType === 'percentage'}
                  onChange={() => setFormData(prev => ({ ...prev, commissionType: 'percentage' }))}
                />
                <span>Porcentagem (%)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={formData.commissionType === 'value'}
                  onChange={() => setFormData(prev => ({ ...prev, commissionType: 'value' }))}
                />
                <span>Valor Fixo (R$)</span>
              </label>
            </div>
            <FormField
              label=""
              name="commissionValue"
              type={formData.commissionType === 'percentage' ? 'number' : 'currency'}
              value={formData.commissionValue}
              onChange={handleNumberChange}
              min={0}
              max={formData.commissionType === 'percentage' ? 100 : undefined}
              step={formData.commissionType === 'percentage' ? 0.1 : 0.01}
              placeholder={formData.commissionType === 'percentage' ? "0.0%" : "R$ 0,00"}
              error={getFieldError('commissionValue')}
            />
          </div>
        </div>
      </FormSection>

      {/* SEÇÃO: IMAGENS */}
      <FormSection id="produto-imagens" title="Imagens do Produto" icon="📷" bgColor="marsala">
        {formData.images.length > 0 && (
          <div className="flex flex-wrap gap-4 mb-4">
            {formData.images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 border rounded overflow-hidden group">
                <img
                  src={img}
                  alt={`Imagem ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  disabled={!img.startsWith("blob:")}
                  title={!img.startsWith("blob:") ? "Foto já salva — gerencie pela API do produto" : "Remover prévia"}
                  aria-label={`Remover imagem ${i + 1}`}
                  className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700 transition-colors opacity-80 group-hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-4 py-2 bg-marsala text-white rounded hover:bg-marsala-700 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            📷 Adicionar Imagens
          </button>
          
          {formData.images.length > 0 && (
            <span className="text-sm text-gray-600">
              {formData.images.length} imagem{formData.images.length !== 1 ? 's' : ''} selecionada{formData.images.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          ref={fileInputRef}
          className="hidden"
        />
        
        <p className="text-xs text-gray-500 mt-2">
          JPG, PNG ou WebP; até 12 novas fotos com 8 MB cada. Imagens existentes não são apagadas pelo formulário.
        </p>
      </FormSection>

{/* SEÇÃO: TIPOS DE EVENTO */}
      <FormSection id="produto-eventos" title="Tipos de Evento" icon="🎉" bgColor="marsala" collapsible>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {EVENT_TYPES.map(eventType => (
            <label key={eventType} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.eventTypes.includes(eventType)}
                onChange={() => handleEventTypeChange(eventType)}
                className="rounded"
              />
              <span className="text-sm">{eventType}</span>
            </label>
          ))}
        </div>
      </FormSection>

      {/* SEÇÃO: INFORMAÇÕES ADICIONAIS */}
      <FormSection id="produto-adicionais" title="Informações Adicionais" icon="📝" bgColor="gray" collapsible defaultCollapsed>
        <div className="space-y-4">
          <FormField
            label="Descrição"
            name="description"
            type="textarea"
            value={formData.description}
            onChange={handleChange}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Instruções de Limpeza"
              name="cleaningInstructions"
              type="textarea"
              value={formData.cleaningInstructions}
              onChange={handleChange}
              rows={3}
            />

            <FormField
              label="Observações"
              name="notes"
              type="textarea"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <FormField
            label="Localização no Estoque"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Ex: Prateleira A3, Setor B"
          />
        </div>
      </FormSection>

      {/* SEÇÃO: CÓDIGOS FISCAIS */}
      <FormSection id="produto-fiscal" title="Códigos Fiscais" icon="📋" bgColor="gray" collapsible defaultCollapsed>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Código NCM"
            name="ncmCode"
            type="masked"
            value={formData.ncmCode}
            onChange={handleChange}
            onMaskedChange={handleMaskedChange}
            mask={formatNCM}
            placeholder="0000.00.00"
            error={getFieldError('ncmCode')}
            help="Nomenclatura Comum do Mercosul"
          />

          <FormField
            label="Código CFOP"
            name="cfopCode"
            type="masked"
            value={formData.cfopCode}
            onChange={handleChange}
            onMaskedChange={handleMaskedChange}
            mask={formatCFOP}
            placeholder="0000"
            error={getFieldError('cfopCode')}
            help="Código Fiscal de Operações e Prestações"
          />
        </div>
      </FormSection>

            {saveError && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{saveError}</p>}

      {/* BOTÕES DE AÇÃO */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t bg-white/95 px-4 py-4 shadow-[0_-8px_18px_-15px_rgba(0,0,0,.25)] backdrop-blur sm:-mx-6 sm:px-6">
        <button
          type="submit"
          disabled={!isValid || saving}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
            isValid 
              ? 'bg-marsala text-white hover:bg-marsala-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {saving ? "Salvando produto e imagens..." : initialData ? "Salvar alterações" : "Cadastrar produto"}
        </button>
        
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-border bg-white px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
        )}

        {/* Indicador de status */}
        <div className="flex items-center text-sm text-gray-500 ml-auto">
          {Object.keys(errors).length > 0 && (
            <span className="text-red-600">⚠️ {Object.keys(errors).length} erro(s) encontrado(s)</span>
          )}
          {Object.keys(errors).length === 0 && formData.name && (
            <span className="text-green-600">✅ Formulário válido</span>
          )}
        </div>
      </div>
    </form>
  );
};

export default ProductForm;
