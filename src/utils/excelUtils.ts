
import * as XLSX from 'xlsx';
import { toast } from '@/hooks/use-toast';

// Define product template structure
export interface ProductTemplateRow {
  Nome: string;
  Descrição: string;
  SKU: string;
  'Preço Venda': number;
  'Preço Aluguel': number;
  Categoria: string;
  Subcategoria: string;
  Tamanho: string;
  Cor: string;
  Estoque: number;
  Ativo: 'SIM' | 'NÃO';
}

// Function to generate the template workbook
export const generateTemplateWorkbook = (): XLSX.WorkBook => {
  const wb = XLSX.utils.book_new();
  
  // Create the instructions sheet
  const instructionsData = [
    ['INSTRUÇÕES PARA IMPORTAÇÃO DE PRODUTOS'],
    [''],
    ['1. Preencha todos os campos obrigatórios (Nome, SKU, Preço Venda, Estoque, Ativo)'],
    ['2. O SKU deve ser único para cada produto'],
    ['3. Os campos numéricos devem conter apenas números (use ponto para decimais)'],
    ['4. O campo Ativo deve ser preenchido com "SIM" ou "NÃO"'],
    ['5. Não altere a estrutura da planilha ou os nomes das colunas'],
    ['6. Limite de 10.000 produtos por importação'],
    [''],
    ['Observações:'],
    ['- Para atualizar um produto existente, mantenha o mesmo SKU'],
    ['- Campos deixados em branco serão considerados vazios ou valores padrão'],
    ['- Em caso de dúvidas, entre em contato com o suporte'],
  ];
  
  const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
  XLSX.utils.book_append_sheet(wb, instructionsWs, 'Instruções');
  
  // Create the products template sheet
  const headers = [
    'Nome', 'Descrição', 'SKU', 'Preço Venda', 'Preço Aluguel', 
    'Categoria', 'Subcategoria', 'Tamanho', 'Cor', 'Estoque', 'Ativo'
  ];
  
  // Example data rows
  const exampleRows = [
    [
      'Vestido de Noiva Elegance', 'Vestido longo de cetim com bordados', 'VEST-001', 
      1200, 300, 'Vestido', 'Noiva', 'M', 'Branco', 1, 'SIM'
    ],
    [
      'Terno Preto Classic', 'Terno preto em lã fria', 'TERN-001', 
      900, 180, 'Terno', 'Social', '42', 'Preto', 1, 'SIM'
    ]
  ];
  
  const productsData = [headers, ...exampleRows];
  const productsWs = XLSX.utils.aoa_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsWs, 'Produtos');
  
  return wb;
};

// Function to download template
export const downloadTemplate = () => {
  const wb = generateTemplateWorkbook();
  XLSX.writeFile(wb, 'modelo_produtos.xlsx');
};

// Function to export products data to Excel
export const exportProductsToExcel = (products: any[]) => {
  try {
    // Transform products to match template format
    const formattedData = products.map(product => ({
      Nome: product.name,
      Descrição: product.description || '',
      SKU: product.sku,
      'Preço Venda': product.price || 0,
      'Preço Aluguel': product.rentalPrice || 0,
      Categoria: product.type || '',
      Subcategoria: product.subtype || '',
      Tamanho: product.size || '',
      Cor: product.color || '',
      Estoque: 1, // Default as 1 since the current model doesn't have stock
      Ativo: product.status === 'available' ? 'SIM' : 'NÃO'
    }));
    
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
    
    // Generate file and trigger download
    XLSX.writeFile(wb, 'produtos_exportados.xlsx');
    
    toast({
      title: 'Exportação concluída',
      description: `${formattedData.length} produtos exportados com sucesso.`,
      variant: 'default',
    });
  } catch (error) {
    console.error('Erro ao exportar produtos:', error);
    toast({
      title: 'Erro na exportação',
      description: 'Não foi possível exportar os produtos. Tente novamente.',
      variant: 'destructive',
    });
  }
};

// Function to parse and validate imported Excel data
export const parseImportedExcel = (file: File): Promise<{
  validData: ProductTemplateRow[];
  errors: { row: number; column: string; message: string }[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check if the file has the Products sheet
        if (!workbook.SheetNames.includes('Produtos')) {
          reject(new Error('Arquivo inválido: aba "Produtos" não encontrada.'));
          return;
        }
        
        const worksheet = workbook.Sheets['Produtos'];
        const jsonData = XLSX.utils.sheet_to_json<ProductTemplateRow>(worksheet);
        
        if (jsonData.length === 0) {
          reject(new Error('Arquivo vazio ou sem dados válidos.'));
          return;
        }
        
        if (jsonData.length > 10000) {
          reject(new Error('Limite excedido: máximo de 10.000 produtos por importação.'));
          return;
        }
        
        // Validate required fields and data types
        const validData: ProductTemplateRow[] = [];
        const errors: { row: number; column: string; message: string }[] = [];
        
        jsonData.forEach((row, index) => {
          const rowNumber = index + 2; // +2 because of header row and 0-based index
          
          // Check required fields
          if (!row.Nome) {
            errors.push({ row: rowNumber, column: 'Nome', message: 'Campo obrigatório' });
          }
          
          if (!row.SKU) {
            errors.push({ row: rowNumber, column: 'SKU', message: 'Campo obrigatório' });
          }
          
          if (row['Preço Venda'] === undefined || isNaN(Number(row['Preço Venda']))) {
            errors.push({ row: rowNumber, column: 'Preço Venda', message: 'Valor numérico obrigatório' });
          }
          
          if (row.Estoque === undefined || isNaN(Number(row.Estoque))) {
            errors.push({ row: rowNumber, column: 'Estoque', message: 'Valor numérico obrigatório' });
          }
          
          if (row.Ativo !== 'SIM' && row.Ativo !== 'NÃO') {
            errors.push({ row: rowNumber, column: 'Ativo', message: 'Deve ser "SIM" ou "NÃO"' });
          }
          
          // If no errors, add to valid data
          if (!errors.some(e => e.row === rowNumber)) {
            validData.push(row);
          }
        });
        
        // Check for duplicate SKUs
        const skuMap = new Map<string, number>();
        validData.forEach((row, index) => {
          const rowNumber = index + 2;
          if (skuMap.has(row.SKU)) {
            errors.push({ 
              row: rowNumber, 
              column: 'SKU', 
              message: `SKU duplicado na linha ${skuMap.get(row.SKU)}` 
            });
          } else {
            skuMap.set(row.SKU, rowNumber);
          }
        });
        
        resolve({ validData, errors });
      } catch (error) {
        reject(new Error('Erro ao processar o arquivo. Verifique o formato e tente novamente.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo. Tente novamente.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Convert template rows to product objects for the application
export const convertTemplateRowsToProducts = (rows: ProductTemplateRow[]): any[] => {
  return rows.map(row => ({
    name: row.Nome,
    description: row.Descrição || '',
    sku: row.SKU,
    price: Number(row['Preço Venda']),
    rentalPrice: Number(row['Preço Aluguel']),
    type: row.Categoria || '',
    subtype: row.Subcategoria || '',
    size: row.Tamanho || '',
    color: row.Cor || '',
    // Using a placeholder image for imported products
    image: "https://images.unsplash.com/photo-1594552072238-5b1076134e85?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
    status: row.Ativo === 'SIM' ? 'available' : 'maintenance'
  }));
};
