import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useFormValidation } from "@/hooks/useFormValidation";
import { formatCPF, formatPhone, formatCEP, fetchAddressByCEP } from "@/utils/formatters";

interface ClientFormProps {
  initialData?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      cep?: string;
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
    };
    birthdate?: string;
    document?: string;
    measurements?: {
      bust?: string;
      waist?: string;
      hips?: string;
      height?: string;
    };
    notes?: string;
  };
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const ClientForm: React.FC<ClientFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      email: "",
      phone: "",
      address: {
        cep: "",
        street: "",
        number: "",
        complement: "",
        neighborhood: "",
        city: "",
        state: ""
      },
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

  const [showDraftMessage, setShowDraftMessage] = useState(false);
  const [isLoadingCEP, setIsLoadingCEP] = useState(false);
  const [cepError, setCepError] = useState("");

  // Schema de validação
  const validationSchema = {
    name: { required: true, minLength: 2, maxLength: 100 },
    email: { required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    phone: { required: true, minLength: 10 },
    'address.cep': { required: true, minLength: 9 },
    'address.street': { required: true, minLength: 5 },
    'address.number': { required: true, minLength: 1 },
    'address.neighborhood': { required: true, minLength: 2 },
    'address.city': { required: true, minLength: 2 },
    'address.state': { required: true, minLength: 2 },
    document: { required: true, minLength: 11 },
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
    storageKey: 'client_form_draft',
    onSave: () => {
      console.log('📄 Rascunho de cliente salvo automaticamente');
    }
  });

  // Verifica se há rascunho ao carregar componente
  useEffect(() => {
    if (hasDraft() && !initialData) {
      setShowDraftMessage(true);
    }
  }, []);

  // Carrega rascunho
  const loadDraft = () => {
    const draftData = loadFromStorage();
    if (draftData) {
      setFormData(draftData);
      setShowDraftMessage(false);
    }
  };

  // Descarta rascunho
  const discardDraft = () => {
    clearStorage();
    setShowDraftMessage(false);
  };

  // Busca endereço pelo CEP
  const handleCEPChange = async (cep: string) => {
    const formattedCEP = formatCEP(cep);
    handleMaskedChange('address.cep', formattedCEP);
    setCepError("");

    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length === 8) {
      setIsLoadingCEP(true);
      
      try {
        const addressData = await fetchAddressByCEP(cleanCEP);
        
        if (addressData) {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              cep: formattedCEP,
              street: addressData.logradouro,
              neighborhood: addressData.bairro,
              city: addressData.localidade,
              state: addressData.uf
            }
          }));
          
          // Limpa erros dos campos que foram preenchidos
          clearFieldError('address.street');
          clearFieldError('address.neighborhood');
          clearFieldError('address.city');
          clearFieldError('address.state');
          
          console.log('✅ Endereço encontrado e preenchido automaticamente');
        } else {
          setCepError("CEP não encontrado. Verifique o número digitado.");
        }
      } catch (error) {
        setCepError("Erro ao buscar CEP. Tente novamente.");
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setIsLoadingCEP(false);
      }
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Debug log
    console.log(`Campo alterado: ${name} = ${value}`);
    touchField(name);
    
    // Valida o campo após mudança se já foi tocado
    setTimeout(() => {
      validateSingleField(name);
    }, 100);
  };

  const handleMaskedChange = (name: string, value: string) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Debug log
    console.log(`Campo mascarado alterado: ${name} = ${value}`);
    touchField(name);
    
    // Valida o campo após mudança se já foi tocado
    setTimeout(() => {
      validateSingleField(name);
    }, 100);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateAll()) {
      console.log('❌ Formulário contém erros:', errors);
      return;
    }
    
    // Monta o endereço completo para compatibilidade
    const fullAddress = `${formData.address.street}, ${formData.address.number}${formData.address.complement ? ', ' + formData.address.complement : ''}, ${formData.address.neighborhood}, ${formData.address.city} - ${formData.address.state}, ${formData.address.cep}`;
    
    const submitData = {
      ...formData,
      address: fullAddress, // Para compatibilidade com o sistema atual
      addressDetails: formData.address // Dados detalhados do endereço
    };
    
    console.log("✅ Dados do cliente válidos:", submitData);
    
    // Limpa rascunho após envio bem-sucedido
    clearStorage();
    
    onSubmit(submitData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 max-h-[80vh] overflow-y-auto">
      
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

      <div className="space-y-6">
        {/* SEÇÃO: DADOS PESSOAIS */}
        <div className="bg-marsala-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-marsala-800 mb-4 flex items-center gap-2">
            👤 Dados Pessoais
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={getFieldError('name') ? 'border-red-500' : ''}
              />
              {getFieldError('name') && (
                <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('name')}</p>
              )}
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
                  className={getFieldError('email') ? 'border-red-500' : ''}
                />
                {getFieldError('email') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('email')}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone*</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    handleMaskedChange('phone', formatted);
                  }}
                  placeholder="(11) 99999-9999"
                  required
                  className={getFieldError('phone') ? 'border-red-500' : ''}
                />
                {getFieldError('phone') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('phone')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="document">CPF*</Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={(e) => {
                    const formatted = formatCPF(e.target.value);
                    handleMaskedChange('document', formatted);
                  }}
                  placeholder="000.000.000-00"
                  required
                  className={getFieldError('document') ? 'border-red-500' : ''}
                />
                {getFieldError('document') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('document')}</p>
                )}
              </div>
              
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
            </div>
          </div>
        </div>

        {/* SEÇÃO: ENDEREÇO */}
        <div className="bg-marsala-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-marsala-800 mb-4 flex items-center gap-2">
            📍 Endereço
          </h3>
          
          <div className="space-y-4">
            {/* CEP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address.cep">CEP*</Label>
                <div className="relative">
                  <Input
                    id="address.cep"
                    name="address.cep"
                    value={formData.address.cep}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    required
                    className={getFieldError('address.cep') || cepError ? 'border-red-500' : ''}
                  />
                  {isLoadingCEP && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin h-4 w-4 border-2 border-marsala border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                {getFieldError('address.cep') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.cep')}</p>
                )}
                {cepError && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {cepError}</p>
                )}
                {!cepError && !getFieldError('address.cep') && (
                  <p className="text-sm text-gray-500 mt-1">
                    Digite o CEP para preenchimento automático
                  </p>
                )}
              </div>
            </div>

            {/* Endereço completo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address.street">Logradouro*</Label>
                <Input
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  placeholder="Rua, Avenida, etc."
                  required
                  className={getFieldError('address.street') ? 'border-red-500' : ''}
                />
                {getFieldError('address.street') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.street')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address.number">Número*</Label>
                <Input
                  id="address.number"
                  name="address.number"
                  value={formData.address.number}
                  onChange={handleChange}
                  placeholder="123"
                  required
                  className={getFieldError('address.number') ? 'border-red-500' : ''}
                />
                {getFieldError('address.number') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.number')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="address.complement">Complemento</Label>
                <Input
                  id="address.complement"
                  name="address.complement"
                  value={formData.address.complement}
                  onChange={handleChange}
                  placeholder="Apto, casa, etc."
                />
              </div>

              <div>
                <Label htmlFor="address.neighborhood">Bairro*</Label>
                <Input
                  id="address.neighborhood"
                  name="address.neighborhood"
                  value={formData.address.neighborhood}
                  onChange={handleChange}
                  placeholder="Nome do bairro"
                  required
                  className={getFieldError('address.neighborhood') ? 'border-red-500' : ''}
                />
                {getFieldError('address.neighborhood') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.neighborhood')}</p>
                )}
              </div>

              <div>
                <Label htmlFor="address.city">Cidade*</Label>
                <Input
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  placeholder="Nome da cidade"
                  required
                  className={getFieldError('address.city') ? 'border-red-500' : ''}
                />
                {getFieldError('address.city') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.city')}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="address.state">Estado*</Label>
                <Input
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  placeholder="SP"
                  required
                  maxLength={2}
                  className={getFieldError('address.state') ? 'border-red-500' : ''}
                />
                {getFieldError('address.state') && (
                  <p className="text-sm text-red-600 mt-1">⚠️ {getFieldError('address.state')}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* SEÇÃO: MEDIDAS */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📏 Medidas (opcional)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="measurements.bust">Busto (cm)</Label>
              <Input
                id="measurements.bust"
                name="measurements.bust"
                type="number"
                value={formData.measurements.bust}
                onChange={handleChange}
                placeholder="Ex: 90"
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
                placeholder="Ex: 70"
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
                placeholder="Ex: 95"
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
                placeholder="Ex: 165"
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO: OBSERVAÇÕES */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📝 Observações
          </h3>
          
          <div>
            <Label htmlFor="notes">Informações Adicionais</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Preferências, restrições, informações importantes..."
              rows={4}
            />
          </div>
        </div>
      </div>
      
      {/* BOTÕES DE AÇÃO */}
      <div className="flex gap-4 pt-4 border-t">
        <button
          type="submit"
          disabled={!isValid}
          className={`px-6 py-3 rounded font-medium transition-colors ${
            isValid 
              ? 'bg-marsala text-white hover:bg-marsala-700' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          💾 Salvar Cliente
        </button>
        
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="px-6 py-3"
        >
          ❌ Cancelar
        </Button>

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

export default ClientForm;
