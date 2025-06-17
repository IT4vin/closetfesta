/**
 * Utilitários para análise e refatoração de componentes React
 */

export interface ComponentAnalysis {
  name: string;
  lineCount: number;
  complexity: number;
  suggestions: RefactoringSuggestion[];
  hooks: string[];
  props: string[];
  states: string[];
}

export interface RefactoringSuggestion {
  type: 'extract-hook' | 'extract-component' | 'split-logic' | 'reduce-props';
  priority: 'high' | 'medium' | 'low';
  description: string;
  codeBlock?: string;
  newFileName?: string;
}

export class ComponentSplitter {
  /**
   * Analisa um componente e sugere refatorações
   */
  static analyzeComponent(componentCode: string, componentName: string): ComponentAnalysis {
    const lines = componentCode.split('\n');
    const lineCount = lines.length;
    
    // Calcular complexidade baseada em diferentes fatores
    const complexity = this.calculateComplexity(componentCode);
    
    // Extrair informações do componente
    const hooks = this.extractHooks(componentCode);
    const props = this.extractProps(componentCode);
    const states = this.extractStates(componentCode);
    
    // Gerar sugestões de refatoração
    const suggestions = this.generateSuggestions(componentCode, lineCount, complexity);
    
    return {
      name: componentName,
      lineCount,
      complexity,
      suggestions,
      hooks,
      props,
      states,
    };
  }

  /**
   * Calcula a complexidade do componente
   */
  private static calculateComplexity(code: string): number {
    let complexity = 0;
    
    // Contar estruturas condicionais
    const conditionals = (code.match(/if\s*\(|switch\s*\(|\?\s*:|&&|\|\|/g) || []).length;
    complexity += conditionals * 2;
    
    // Contar loops
    const loops = (code.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(|\.filter\(|\.reduce\(/g) || []).length;
    complexity += loops * 3;
    
    // Contar funções aninhadas
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(|=>\s*{/g) || []).length;
    complexity += functions;
    
    // Contar hooks
    const hooks = (code.match(/use[A-Z]\w*/g) || []).length;
    complexity += hooks;
    
    // Contar JSX elements
    const jsxElements = (code.match(/<[A-Z]\w*/g) || []).length;
    complexity += Math.floor(jsxElements / 5);
    
    return complexity;
  }

  /**
   * Extrai hooks utilizados no componente
   */
  private static extractHooks(code: string): string[] {
    const hookMatches = code.match(/use[A-Z]\w*/g) || [];
    return [...new Set(hookMatches)];
  }

  /**
   * Extrai props do componente
   */
  private static extractProps(code: string): string[] {
    const propsMatch = code.match(/\{\s*([^}]+)\s*\}\s*:\s*\w+Props/);
    if (!propsMatch) return [];
    
    const propsString = propsMatch[1];
    return propsString
      .split(',')
      .map(prop => prop.trim())
      .filter(prop => prop.length > 0);
  }

  /**
   * Extrai estados do componente
   */
  private static extractStates(code: string): string[] {
    const stateMatches = code.match(/const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g) || [];
    return stateMatches.map(match => {
      const stateMatch = match.match(/const\s+\[(\w+),/);
      return stateMatch ? stateMatch[1] : '';
    }).filter(state => state.length > 0);
  }

  /**
   * Gera sugestões de refatoração
   */
  private static generateSuggestions(code: string, lineCount: number, complexity: number): RefactoringSuggestion[] {
    const suggestions: RefactoringSuggestion[] = [];

    // Componente muito grande
    if (lineCount > 200) {
      suggestions.push({
        type: 'extract-component',
        priority: 'high',
        description: `Componente com ${lineCount} linhas. Considere dividir em componentes menores.`,
      });
    }

    // Muitos hooks
    const hooks = this.extractHooks(code);
    if (hooks.length > 8) {
      suggestions.push({
        type: 'extract-hook',
        priority: 'high',
        description: `${hooks.length} hooks encontrados. Considere criar hooks customizados.`,
      });
    }

    // Complexidade alta
    if (complexity > 50) {
      suggestions.push({
        type: 'split-logic',
        priority: 'high',
        description: `Complexidade alta (${complexity}). Considere separar lógica de negócio.`,
      });
    }

    // Muitas props
    const props = this.extractProps(code);
    if (props.length > 10) {
      suggestions.push({
        type: 'reduce-props',
        priority: 'medium',
        description: `${props.length} props encontradas. Considere agrupar props relacionadas.`,
      });
    }

    // Lógica de formulário complexa
    if (code.includes('useForm') && code.includes('validation')) {
      suggestions.push({
        type: 'extract-hook',
        priority: 'medium',
        description: 'Lógica de formulário complexa. Considere extrair para hook customizado.',
        newFileName: 'useFormValidation.ts',
      });
    }

    // Muitas operações async
    const asyncOperations = (code.match(/async\s+|await\s+|\.then\(|\.catch\(/g) || []).length;
    if (asyncOperations > 5) {
      suggestions.push({
        type: 'extract-hook',
        priority: 'medium',
        description: `${asyncOperations} operações assíncronas. Considere extrair para hook de API.`,
        newFileName: 'useApiOperations.ts',
      });
    }

    return suggestions;
  }

  /**
   * Gera template para hook customizado
   */
  static generateHookTemplate(hookName: string, dependencies: string[] = []): string {
    const imports = dependencies.length > 0 
      ? `import { ${dependencies.join(', ')} } from 'react';\n`
      : '';

    return `${imports}
export const ${hookName} = () => {
  // Estado do hook
  
  // Efeitos
  
  // Métodos
  
  // Retorno
  return {
    // Expor estado e métodos necessários
  };
};`;
  }

  /**
   * Gera template para componente extraído
   */
  static generateComponentTemplate(componentName: string, props: string[]): string {
    const propsInterface = props.length > 0 
      ? `interface ${componentName}Props {
  ${props.map(prop => `${prop}: any; // Definir tipo correto`).join('\n  ')}
}

` : '';

    const propsParam = props.length > 0 
      ? `{ ${props.join(', ')} }: ${componentName}Props`
      : '';

    return `import React from 'react';

${propsInterface}export const ${componentName}: React.FC${props.length > 0 ? `<${componentName}Props>` : ''} = (${propsParam}) => {
  return (
    <div>
      {/* Implementar componente */}
    </div>
  );
};`;
  }

  /**
   * Analisa diretório de componentes
   */
  static analyzeDirectory(components: { name: string; code: string }[]): ComponentAnalysis[] {
    return components.map(({ name, code }) => this.analyzeComponent(code, name));
  }

  /**
   * Gera relatório de refatoração
   */
  static generateRefactoringReport(analyses: ComponentAnalysis[]): string {
    const totalComponents = analyses.length;
    const complexComponents = analyses.filter(a => a.complexity > 30).length;
    const largeComponents = analyses.filter(a => a.lineCount > 200).length;
    
    let report = `# Relatório de Refatoração\n\n`;
    report += `## Resumo\n`;
    report += `- Total de componentes analisados: ${totalComponents}\n`;
    report += `- Componentes complexos (>30): ${complexComponents}\n`;
    report += `- Componentes grandes (>200 linhas): ${largeComponents}\n\n`;
    
    report += `## Componentes que precisam de refatoração\n\n`;
    
    analyses
      .filter(a => a.suggestions.some(s => s.priority === 'high'))
      .forEach(analysis => {
        report += `### ${analysis.name}\n`;
        report += `- Linhas: ${analysis.lineCount}\n`;
        report += `- Complexidade: ${analysis.complexity}\n`;
        report += `- Hooks: ${analysis.hooks.join(', ')}\n\n`;
        
        report += `**Sugestões:**\n`;
        analysis.suggestions.forEach(suggestion => {
          report += `- [${suggestion.priority.toUpperCase()}] ${suggestion.description}\n`;
        });
        report += `\n`;
      });
    
    return report;
  }
} 