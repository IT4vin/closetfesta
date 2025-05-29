import React, { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  bgColor?: 'gray' | 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'marsala';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
}

const FormSection: React.FC<FormSectionProps> = ({
  title,
  icon,
  children,
  className = '',
  bgColor = 'gray',
  collapsible = false,
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  const bgColorClasses = {
    gray: 'bg-gray-50',
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    purple: 'bg-purple-50',
    yellow: 'bg-yellow-50',
    red: 'bg-red-50',
    marsala: 'bg-marsala-50',
  };

  const headerColorClasses = {
    gray: 'text-gray-800',
    blue: 'text-blue-800',
    green: 'text-green-800',
    purple: 'text-purple-800',
    yellow: 'text-yellow-800',
    red: 'text-red-800',
    marsala: 'text-marsala-800',
  };

  return (
    <div className={`${bgColorClasses[bgColor]} p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-semibold ${headerColorClasses[bgColor]} flex items-center gap-2`}>
          {icon && <span>{icon}</span>}
          {title}
        </h3>
        
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`text-sm ${headerColorClasses[bgColor]} hover:opacity-70 transition-opacity`}
            aria-label={isCollapsed ? 'Expandir seção' : 'Recolher seção'}
          >
            {isCollapsed ? '▼ Expandir' : '▲ Recolher'}
          </button>
        )}
      </div>
      
      {!isCollapsed && (
        <div className="transition-all duration-200">
          {children}
        </div>
      )}
    </div>
  );
};

export default FormSection; 