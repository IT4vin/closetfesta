import { useState, useEffect } from 'react';

interface UseCustomOptionsProps {
  storageKey: string;
  defaultOptions: readonly string[];
}

export const useCustomOptions = ({ storageKey, defaultOptions }: UseCustomOptionsProps) => {
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [allOptions, setAllOptions] = useState<string[]>([...defaultOptions]);

  // Carrega opções customizadas do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomOptions(parsed);
        setAllOptions([...defaultOptions, ...parsed]);
      }
    } catch (error) {
      console.error(`Erro ao carregar opções customizadas de ${storageKey}:`, error);
    }
  }, [storageKey, defaultOptions]);

  // Salva opções customizadas no localStorage
  const saveCustomOptions = (options: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(options));
    } catch (error) {
      console.error(`Erro ao salvar opções customizadas em ${storageKey}:`, error);
    }
  };

  // Adiciona uma nova opção
  const addOption = (newOption: string): boolean => {
    const trimmedOption = newOption.trim();
    
    // Validações
    if (!trimmedOption) return false;
    if (trimmedOption.length < 2) return false;
    if (trimmedOption.length > 50) return false;
    
    // Verifica se já existe (case insensitive)
    const existsInDefault = defaultOptions.some(
      option => option.toLowerCase() === trimmedOption.toLowerCase()
    );
    const existsInCustom = customOptions.some(
      option => option.toLowerCase() === trimmedOption.toLowerCase()
    );
    
    if (existsInDefault || existsInCustom) return false;

    // Adiciona a nova opção
    const newCustomOptions = [...customOptions, trimmedOption];
    setCustomOptions(newCustomOptions);
    setAllOptions([...defaultOptions, ...newCustomOptions]);
    saveCustomOptions(newCustomOptions);
    
    console.log(`✅ Nova opção adicionada: ${trimmedOption}`);
    return true;
  };

  // Remove uma opção customizada
  const removeOption = (optionToRemove: string): boolean => {
    // Só permite remover opções customizadas, não as padrão
    if (defaultOptions.includes(optionToRemove)) return false;
    
    const newCustomOptions = customOptions.filter(option => option !== optionToRemove);
    setCustomOptions(newCustomOptions);
    setAllOptions([...defaultOptions, ...newCustomOptions]);
    saveCustomOptions(newCustomOptions);
    
    console.log(`🗑️ Opção removida: ${optionToRemove}`);
    return true;
  };

  // Verifica se uma opção é customizada
  const isCustomOption = (option: string): boolean => {
    return customOptions.includes(option);
  };

  // Reseta para opções padrão
  const resetToDefault = () => {
    setCustomOptions([]);
    setAllOptions([...defaultOptions]);
    localStorage.removeItem(storageKey);
    console.log(`🔄 Opções resetadas para padrão: ${storageKey}`);
  };

  // Estatísticas
  const stats = {
    totalOptions: allOptions.length,
    defaultCount: defaultOptions.length,
    customCount: customOptions.length,
  };

  return {
    allOptions,
    customOptions,
    defaultOptions: [...defaultOptions],
    addOption,
    removeOption,
    isCustomOption,
    resetToDefault,
    stats,
  };
}; 