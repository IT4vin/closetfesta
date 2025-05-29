import React, { useState } from 'react';
import { useCustomOptions } from '@/hooks/useCustomOptions';
import { PRODUCT_TYPES, COLOR_OPTIONS, SIZE_OPTIONS, CUSTOM_OPTIONS_CONFIG } from '@/config/productFormConfig';

const CustomOptionsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('productTypes');

  // Hooks para todas as opções customizáveis
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
    defaultOptions: []
  });

  const stylistsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.STYLISTS.storageKey,
    defaultOptions: ["Casa", "Externo", "Personalizado"]
  });

  const materialsOptions = useCustomOptions({
    storageKey: CUSTOM_OPTIONS_CONFIG.MATERIALS.storageKey,
    defaultOptions: ["Algodão", "Poliéster", "Seda", "Linho", "Viscose", "Lycra", "Couro", "Sintético"]
  });

  const optionsData = {
    productTypes: {
      title: 'Tipos de Produto',
      icon: '📋',
      options: productTypesOptions,
      color: 'blue'
    },
    colors: {
      title: 'Cores',
      icon: '🎨',
      options: colorsOptions,
      color: 'purple'
    },
    sizes: {
      title: 'Tamanhos',
      icon: '📏',
      options: sizesOptions,
      color: 'green'
    },
    brands: {
      title: 'Marcas',
      icon: '🏷️',
      options: brandsOptions,
      color: 'yellow'
    },
    stylists: {
      title: 'Estilistas',
      icon: '✨',
      options: stylistsOptions,
      color: 'pink'
    },
    materials: {
      title: 'Materiais',
      icon: '🧵',
      options: materialsOptions,
      color: 'gray'
    }
  };

  const currentData = optionsData[activeTab as keyof typeof optionsData];

  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    purple: 'border-purple-200 bg-purple-50 text-purple-800',
    green: 'border-green-200 bg-green-50 text-green-800',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    pink: 'border-pink-200 bg-pink-50 text-pink-800',
    gray: 'border-gray-200 bg-gray-50 text-gray-800'
  };

  const resetAllOptions = () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja resetar TODAS as opções personalizadas? Esta ação não pode ser desfeita.'
    );
    
    if (confirmed) {
      Object.values(optionsData).forEach(data => {
        data.options.resetToDefault();
      });
      alert('✅ Todas as opções foram resetadas para os valores padrão!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">🔧 Gerenciador de Opções Personalizadas</h2>
          <button
            onClick={resetAllOptions}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
          >
            🔄 Resetar Tudo
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Aqui você pode visualizar e gerenciar todas as opções personalizadas criadas nos formulários.
        </p>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {Object.entries(optionsData).map(([key, data]) => (
            <div key={key} className="text-center">
              <div className="text-2xl mb-1">{data.icon}</div>
              <div className="text-sm text-gray-600">{data.title}</div>
              <div className="font-bold text-lg">{data.options.stats.customCount}</div>
              <div className="text-xs text-gray-500">personalizadas</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {Object.entries(optionsData).map(([key, data]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === key
                ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {data.icon} {data.title} ({data.options.stats.customCount})
          </button>
        ))}
      </div>

      {/* Conteúdo da Tab Ativa */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            {currentData.icon} {currentData.title}
          </h3>
          
          {currentData.options.stats.customCount > 0 && (
            <button
              onClick={currentData.options.resetToDefault}
              className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
            >
              Resetar esta categoria
            </button>
          )}
        </div>

        {/* Estatísticas da categoria */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{currentData.options.stats.totalOptions}</div>
            <div className="text-sm text-blue-600">Total de Opções</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{currentData.options.stats.defaultCount}</div>
            <div className="text-sm text-green-600">Opções Padrão</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded">
            <div className="text-2xl font-bold text-purple-600">{currentData.options.stats.customCount}</div>
            <div className="text-sm text-purple-600">Personalizadas</div>
          </div>
        </div>

        {/* Lista de Opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opções Padrão */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              🔒 Opções Padrão ({currentData.options.defaultOptions.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentData.options.defaultOptions.map((option, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-gray-700">{option}</span>
                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                    padrão
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Opções Personalizadas */}
          <div>
            <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
              ✨ Opções Personalizadas ({currentData.options.customOptions.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {currentData.options.customOptions.length > 0 ? (
                currentData.options.customOptions.map((option, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded border border-purple-200">
                    <span className="text-purple-700">✨ {option}</span>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(`Remover "${option}"?`);
                        if (confirmed) {
                          currentData.options.removeOption(option);
                        }
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                      title={`Remover "${option}"`}
                    >
                      🗑️
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>Nenhuma opção personalizada criada ainda.</p>
                  <p className="text-sm">Use o formulário de produtos para adicionar novas opções.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Instruções */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-800 mb-2">💡 Como usar:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• No formulário de produtos, selecione "➕ Adicionar nova opção..." nos campos de seleção</li>
            <li>• Digite o nome da nova opção e pressione Enter ou clique no ✓</li>
            <li>• As opções personalizadas aparecerão marcadas com ✨</li>
            <li>• Você pode remover opções personalizadas clicando no 🗑️</li>
            <li>• As opções são salvas automaticamente no seu navegador</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomOptionsManager; 