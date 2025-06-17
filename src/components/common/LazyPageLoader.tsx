import React from 'react';

interface LazyPageLoaderProps {
  title?: string;
  description?: string;
}

const LazyPageLoader: React.FC<LazyPageLoaderProps> = ({ 
  title = "Carregando página...", 
  description = "Aguarde enquanto preparamos o conteúdo" 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Spinner animado */}
        <div className="relative mb-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-purple-600 mx-auto"></div>
          <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-300 mx-auto animate-pulse"></div>
        </div>
        
        {/* Título */}
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {title}
        </h2>
        
        {/* Descrição */}
        <p className="text-gray-600 mb-6">
          {description}
        </p>
        
        {/* Skeleton bars para simular conteúdo */}
        <div className="space-y-3">
          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-4/5 mx-auto"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/5 mx-auto"></div>
        </div>
        
        {/* Indicador de progresso */}
        <div className="mt-6">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-purple-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LazyPageLoader; 