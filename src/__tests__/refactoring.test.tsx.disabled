import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentSplitter } from '@/utils/refactoring/componentSplitter';
import { useFileUpload } from '@/components/products/import-export/hooks/useFileUpload';
import { useImportValidation } from '@/components/products/import-export/hooks/useImportValidation';
import { FileDropzone } from '@/components/products/import-export/components/FileDropzone';
import { ImportPreview } from '@/components/products/import-export/components/ImportPreview';
import { ImportErrors } from '@/components/products/import-export/components/ImportErrors';
import { renderHook, act } from '@testing-library/react';

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock dos utilitários Excel
vi.mock('@/utils/excelUtils', () => ({
  parseImportedExcel: vi.fn(),
  convertTemplateRowsToProducts: vi.fn(),
  downloadTemplate: vi.fn(),
}));

describe('Sistema de Refatoração', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ComponentSplitter', () => {
    it('deve analisar componente simples corretamente', () => {
      const simpleComponent = `
        import React from 'react';
        
        const SimpleComponent = () => {
          return <div>Hello World</div>;
        };
        
        export default SimpleComponent;
      `;

      const analysis = ComponentSplitter.analyzeComponent(simpleComponent, 'SimpleComponent');

      expect(analysis.name).toBe('SimpleComponent');
      expect(analysis.lineCount).toBe(8);
      expect(analysis.complexity).toBeLessThan(10);
      expect(analysis.suggestions).toHaveLength(0);
    });

    it('deve identificar componente complexo', () => {
      const complexComponent = `
        import React, { useState, useEffect, useCallback, useMemo } from 'react';
        
        const ComplexComponent = ({ prop1, prop2, prop3, prop4, prop5, prop6, prop7, prop8, prop9, prop10, prop11 }) => {
          const [state1, setState1] = useState('');
          const [state2, setState2] = useState(0);
          const [state3, setState3] = useState(false);
          
          useEffect(() => {
            if (prop1) {
              setState1('value1');
            } else if (prop2) {
              setState1('value2');
            } else {
              setState1('default');
            }
          }, [prop1, prop2]);
          
          const handleClick = useCallback(async () => {
            try {
              const response = await fetch('/api/data');
              const data = await response.json();
              setState2(data.count);
            } catch (error) {
              console.error(error);
            }
          }, []);
          
          const processedData = useMemo(() => {
            return Array.from({ length: 100 }, (_, i) => ({
              id: i,
              value: i * 2,
              isEven: i % 2 === 0,
            })).filter(item => item.isEven).map(item => ({
              ...item,
              processed: true,
            }));
          }, []);
          
          return (
            <div>
              {processedData.map(item => (
                <div key={item.id}>
                  {item.value}
                  {state1 && <span>{state1}</span>}
                  {state2 > 0 && <span>{state2}</span>}
                  {state3 ? <button>Active</button> : <button>Inactive</button>}
                </div>
              ))}
              <button onClick={handleClick}>Load Data</button>
            </div>
          );
        };
        
        export default ComplexComponent;
      `.repeat(5); // Repetir para aumentar linhas

      const analysis = ComponentSplitter.analyzeComponent(complexComponent, 'ComplexComponent');

      expect(analysis.name).toBe('ComplexComponent');
      expect(analysis.lineCount).toBeGreaterThan(200);
      expect(analysis.complexity).toBeGreaterThan(50);
      expect(analysis.suggestions.some(s => s.type === 'extract-component')).toBe(true);
      expect(analysis.suggestions.some(s => s.type === 'extract-hook')).toBe(true);
      expect(analysis.suggestions.some(s => s.type === 'reduce-props')).toBe(true);
    });

    it('deve gerar template de hook corretamente', () => {
      const template = ComponentSplitter.generateHookTemplate('useCustomHook', ['useState', 'useEffect']);

      expect(template).toContain('import { useState, useEffect } from \'react\';');
      expect(template).toContain('export const useCustomHook = () => {');
      expect(template).toContain('return {');
    });

    it('deve gerar template de componente corretamente', () => {
      const template = ComponentSplitter.generateComponentTemplate('CustomComponent', ['prop1', 'prop2']);

      expect(template).toContain('interface CustomComponentProps {');
      expect(template).toContain('prop1: any;');
      expect(template).toContain('prop2: any;');
      expect(template).toContain('export const CustomComponent: React.FC<CustomComponentProps>');
    });

    it('deve gerar relatório de refatoração', () => {
      const analyses = [
        {
          name: 'SimpleComponent',
          lineCount: 50,
          complexity: 10,
          suggestions: [],
          hooks: ['useState'],
          props: ['prop1'],
          states: ['state1'],
        },
        {
          name: 'ComplexComponent',
          lineCount: 300,
          complexity: 80,
          suggestions: [
            {
              type: 'extract-component' as const,
              priority: 'high' as const,
              description: 'Componente muito grande',
            },
          ],
          hooks: ['useState', 'useEffect', 'useCallback'],
          props: ['prop1', 'prop2'],
          states: ['state1', 'state2'],
        },
      ];

      const report = ComponentSplitter.generateRefactoringReport(analyses);

      expect(report).toContain('# Relatório de Refatoração');
      expect(report).toContain('Total de componentes analisados: 2');
      expect(report).toContain('ComplexComponent');
      expect(report).toContain('[HIGH] Componente muito grande');
    });
  });

  describe('useFileUpload Hook', () => {
    it('deve inicializar com estado correto', () => {
      const { result } = renderHook(() => useFileUpload());

      expect(result.current.dragActive).toBe(false);
      expect(result.current.fileName).toBe(null);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.file).toBe(null);
    });

    it('deve processar arquivo válido', () => {
      const onFileSelect = vi.fn();
      const { result } = renderHook(() => useFileUpload({ onFileSelect }));

      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      act(() => {
        result.current.processFile(file);
      });

      expect(result.current.fileName).toBe('test.xlsx');
      expect(result.current.file).toBe(file);
      expect(result.current.isUploading).toBe(true);
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('deve rejeitar arquivo inválido', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useFileUpload({ onError }));

      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      act(() => {
        result.current.processFile(file);
      });

      expect(result.current.fileName).toBe(null);
      expect(result.current.file).toBe(null);
      expect(result.current.isUploading).toBe(false);
      expect(onError).toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Arquivo inválido',
          variant: 'destructive',
        })
      );
    });

    it('deve resetar estado corretamente', () => {
      const { result } = renderHook(() => useFileUpload());

      // Simular arquivo carregado
      const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      act(() => {
        result.current.processFile(file);
      });

      // Resetar
      act(() => {
        result.current.reset();
      });

      expect(result.current.dragActive).toBe(false);
      expect(result.current.fileName).toBe(null);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.file).toBe(null);
    });
  });

  describe('useImportValidation Hook', () => {
    it('deve inicializar com estado correto', () => {
      const { result } = renderHook(() => useImportValidation());

      expect(result.current.stage).toBe('upload');
      expect(result.current.validData).toEqual([]);
      expect(result.current.errors).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
    });

    it('deve processar arquivo com dados válidos', async () => {
      const mockParseResult = {
        validData: [{ Nome: 'Produto 1', SKU: 'SKU001', Categoria: 'Cat1', 'Preço Venda': '100', 'Preço Aluguel': '50', Ativo: 'SIM' }],
        errors: [],
      };

      const { parseImportedExcel } = await import('@/utils/excelUtils');
      vi.mocked(parseImportedExcel).mockResolvedValue(mockParseResult);

      const { result } = renderHook(() => useImportValidation());
      const file = new File(['content'], 'test.xlsx');

      await act(async () => {
        await result.current.processExcelFile(file);
      });

      expect(result.current.stage).toBe('preview');
      expect(result.current.validData).toEqual(mockParseResult.validData);
      expect(result.current.errors).toEqual([]);
      expect(result.current.isProcessing).toBe(false);
    });

    it('deve processar arquivo com erros', async () => {
      const mockParseResult = {
        validData: [],
        errors: [{ row: 1, column: 'Nome', message: 'Campo obrigatório' }],
      };

      const { parseImportedExcel } = await import('@/utils/excelUtils');
      vi.mocked(parseImportedExcel).mockResolvedValue(mockParseResult);

      const { result } = renderHook(() => useImportValidation());
      const file = new File(['content'], 'test.xlsx');

      await act(async () => {
        await result.current.processExcelFile(file);
      });

      expect(result.current.stage).toBe('errors');
      expect(result.current.validData).toEqual([]);
      expect(result.current.errors).toEqual(mockParseResult.errors);
    });

    it('deve converter dados para produtos', () => {
      const mockProducts = [{ id: 1, name: 'Produto 1' }];
      const { convertTemplateRowsToProducts } = require('@/utils/excelUtils');
      vi.mocked(convertTemplateRowsToProducts).mockReturnValue(mockProducts);

      const { result } = renderHook(() => useImportValidation());

      // Simular dados válidos
      act(() => {
        result.current.processExcelFile = vi.fn();
        // Definir dados válidos manualmente para o teste
        (result.current as any).validData = [{ Nome: 'Produto 1' }];
      });

      const products = result.current.convertToProducts();

      expect(products).toEqual(mockProducts);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Conversão concluída',
        })
      );
    });
  });

  describe('FileDropzone Component', () => {
    const defaultProps = {
      dragActive: false,
      fileName: null,
      isUploading: false,
      dropzoneProps: {
        onDragEnter: vi.fn(),
        onDragLeave: vi.fn(),
        onDragOver: vi.fn(),
        onDrop: vi.fn(),
        onClick: vi.fn(),
      },
      inputProps: {
        ref: { current: null },
        type: 'file' as const,
        accept: '.xlsx,.xls',
        className: 'hidden',
        onChange: vi.fn(),
      },
    };

    it('deve renderizar estado inicial corretamente', () => {
      render(<FileDropzone {...defaultProps} />);

      expect(screen.getByText('Arraste o arquivo ou clique para selecionar')).toBeInTheDocument();
      expect(screen.getByText('Tipos aceitos: .xlsx, .xls')).toBeInTheDocument();
    });

    it('deve mostrar arquivo selecionado', () => {
      render(<FileDropzone {...defaultProps} fileName="test.xlsx" />);

      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Arquivo selecionado')).toBeInTheDocument();
    });

    it('deve mostrar estado de upload', () => {
      render(<FileDropzone {...defaultProps} fileName="test.xlsx" isUploading={true} />);

      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
      expect(screen.getByText('Processando arquivo...')).toBeInTheDocument();
    });

    it('deve aplicar classes de drag ativo', () => {
      const { container } = render(<FileDropzone {...defaultProps} dragActive={true} />);

      const dropzone = container.firstChild as HTMLElement;
      expect(dropzone).toHaveClass('border-blue-400', 'bg-blue-50');
    });
  });

  describe('ImportPreview Component', () => {
    const mockValidData = [
      {
        Nome: 'Produto 1',
        SKU: 'SKU001',
        Categoria: 'Categoria 1',
        'Preço Venda': '100.00',
        'Preço Aluguel': '50.00',
        Ativo: 'SIM',
      },
      {
        Nome: 'Produto 2',
        SKU: 'SKU002',
        Categoria: 'Categoria 2',
        'Preço Venda': '200.00',
        'Preço Aluguel': '',
        Ativo: 'NÃO',
      },
    ];

    it('deve renderizar preview dos dados', () => {
      render(<ImportPreview validData={mockValidData} />);

      expect(screen.getByText('Validação concluída')).toBeInTheDocument();
      expect(screen.getByText('2 produtos')).toBeInTheDocument();
      expect(screen.getByText('Produto 1')).toBeInTheDocument();
      expect(screen.getByText('Produto 2')).toBeInTheDocument();
      expect(screen.getByText('SKU001')).toBeInTheDocument();
      expect(screen.getByText('SKU002')).toBeInTheDocument();
    });

    it('deve formatar preços corretamente', () => {
      render(<ImportPreview validData={mockValidData} />);

      expect(screen.getByText('R$ 100,00')).toBeInTheDocument();
      expect(screen.getByText('R$ 200,00')).toBeInTheDocument();
      expect(screen.getByText('-')).toBeInTheDocument(); // Preço aluguel vazio
    });

    it('deve mostrar badges de status', () => {
      render(<ImportPreview validData={mockValidData} />);

      const simBadge = screen.getByText('SIM');
      const naoBadge = screen.getByText('NÃO');

      expect(simBadge).toHaveClass('bg-green-100', 'text-green-800');
      expect(naoBadge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('deve mostrar mensagem quando não há dados', () => {
      render(<ImportPreview validData={[]} />);

      expect(screen.getByText('Nenhum dado válido para exibir')).toBeInTheDocument();
    });
  });

  describe('ImportErrors Component', () => {
    const mockErrors = [
      { row: 1, column: 'Nome', message: 'Campo obrigatório' },
      { row: 2, column: 'SKU', message: 'SKU já existe' },
      { row: 3, column: 'Preço Venda', message: 'Valor inválido' },
      { row: 4, column: 'Descrição', message: 'Muito longo' },
    ];

    it('deve renderizar lista de erros', () => {
      render(<ImportErrors errors={mockErrors} />);

      expect(screen.getByText('Erros encontrados')).toBeInTheDocument();
      expect(screen.getByText('4 problemas')).toBeInTheDocument();
      expect(screen.getByText('Campo obrigatório')).toBeInTheDocument();
      expect(screen.getByText('SKU já existe')).toBeInTheDocument();
    });

    it('deve categorizar erros por severidade', () => {
      render(<ImportErrors errors={mockErrors} />);

      // Erros críticos (Nome, SKU, Preço Venda)
      const criticalBadges = screen.getAllByText('Crítico');
      expect(criticalBadges).toHaveLength(3);

      // Avisos (outros campos)
      const warningBadges = screen.getAllByText('Aviso');
      expect(warningBadges).toHaveLength(1);
    });

    it('deve mostrar resumo de erros', () => {
      render(<ImportErrors errors={mockErrors} />);

      expect(screen.getByText(/3 erros críticos/)).toBeInTheDocument();
      expect(screen.getByText(/1 avisos/)).toBeInTheDocument();
    });

    it('deve chamar callback de download template', () => {
      const onDownloadTemplate = vi.fn();
      render(<ImportErrors errors={mockErrors} onDownloadTemplate={onDownloadTemplate} />);

      const downloadButtons = screen.getAllByText('Baixar Modelo de Planilha');
      fireEvent.click(downloadButtons[0]);

      expect(onDownloadTemplate).toHaveBeenCalled();
    });

    it('deve mostrar mensagem quando não há erros', () => {
      render(<ImportErrors errors={[]} />);

      expect(screen.getByText('Nenhum erro encontrado')).toBeInTheDocument();
    });
  });

  describe('Integração dos Componentes Refatorados', () => {
    it('deve funcionar em conjunto corretamente', async () => {
      // Este teste simula o fluxo completo de importação
      const mockParseResult = {
        validData: [{ Nome: 'Produto 1', SKU: 'SKU001', Categoria: 'Cat1', 'Preço Venda': '100', 'Preço Aluguel': '50', Ativo: 'SIM' }],
        errors: [],
      };

      const { parseImportedExcel } = await import('@/utils/excelUtils');
      vi.mocked(parseImportedExcel).mockResolvedValue(mockParseResult);

      const { result: fileUploadResult } = renderHook(() => useFileUpload({
        onFileSelect: vi.fn(),
      }));

      const { result: validationResult } = renderHook(() => useImportValidation());

      // Simular seleção de arquivo
      const file = new File(['content'], 'test.xlsx');
      
      act(() => {
        fileUploadResult.current.processFile(file);
      });

      expect(fileUploadResult.current.fileName).toBe('test.xlsx');
      expect(fileUploadResult.current.isUploading).toBe(true);

      // Simular processamento
      await act(async () => {
        await validationResult.current.processExcelFile(file);
      });

      expect(validationResult.current.stage).toBe('preview');
      expect(validationResult.current.validData).toEqual(mockParseResult.validData);

      // Finalizar upload
      act(() => {
        fileUploadResult.current.finishUpload();
      });

      expect(fileUploadResult.current.isUploading).toBe(false);
    });
  });
}); 