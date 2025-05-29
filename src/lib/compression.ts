// Sistema de compressão de dados para otimização de storage
// Usando compressão LZ baseada em algoritmos nativos do JavaScript

interface CompressionResult {
  compressed: string;
  original_size: number;
  compressed_size: number;
  compression_ratio: number;
}

interface CompressionStats {
  total_operations: number;
  total_original_bytes: number;
  total_compressed_bytes: number;
  total_savings_bytes: number;
  average_compression_ratio: number;
}

// Implementação de compressão LZ simplificada
class SimpleCompressor {
  private static readonly DICT_SIZE = 256;
  private static readonly MAGIC_HEADER = 'CLZ1'; // ClosetFesta LZ version 1

  // Compressão usando LZ78 modificado
  static compress(data: string): CompressionResult {
    const original_size = new Blob([data]).size;
    
    if (data.length === 0) {
      return {
        compressed: this.MAGIC_HEADER + data,
        original_size,
        compressed_size: this.MAGIC_HEADER.length,
        compression_ratio: 1
      };
    }

    const dictionary: { [key: string]: number } = {};
    let dictIndex = 0;
    let compressed: number[] = [];
    let current = '';
    
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      const newStr = current + char;
      
      if (dictionary[newStr] !== undefined) {
        current = newStr;
      } else {
        // Adicionar código da string atual
        if (current === '') {
          compressed.push(char.charCodeAt(0));
        } else {
          compressed.push(dictionary[current] || current.charCodeAt(0));
        }
        
        // Adicionar nova string ao dicionário
        if (dictIndex < this.DICT_SIZE) {
          dictionary[newStr] = this.DICT_SIZE + dictIndex;
          dictIndex++;
        }
        
        current = char;
      }
    }
    
    // Adicionar último código
    if (current !== '') {
      compressed.push(dictionary[current] || current.charCodeAt(0));
    }
    
    // Converter para string usando base64
    const compressedStr = this.MAGIC_HEADER + btoa(String.fromCharCode(...compressed));
    const compressed_size = new Blob([compressedStr]).size;
    
    return {
      compressed: compressedStr,
      original_size,
      compressed_size,
      compression_ratio: original_size > 0 ? compressed_size / original_size : 1
    };
  }

  // Descompressão
  static decompress(compressedData: string): string {
    if (!compressedData.startsWith(this.MAGIC_HEADER)) {
      // Dados não comprimidos, retornar como está
      return compressedData;
    }
    
    const base64Data = compressedData.slice(this.MAGIC_HEADER.length);
    
    try {
      const compressed = Array.from(atob(base64Data)).map(char => char.charCodeAt(0));
      
      if (compressed.length === 0) return '';
      
      const dictionary: { [key: number]: string } = {};
      let dictIndex = 0;
      let result = String.fromCharCode(compressed[0]);
      let current = result;
      
      for (let i = 1; i < compressed.length; i++) {
        const code = compressed[i];
        let entry: string;
        
        if (code < this.DICT_SIZE) {
          entry = String.fromCharCode(code);
        } else if (dictionary[code]) {
          entry = dictionary[code];
        } else if (code === this.DICT_SIZE + dictIndex) {
          entry = current + current[0];
        } else {
          throw new Error('Dados comprimidos corrompidos');
        }
        
        result += entry;
        
        // Adicionar ao dicionário
        if (dictIndex < this.DICT_SIZE) {
          dictionary[this.DICT_SIZE + dictIndex] = current + entry[0];
          dictIndex++;
        }
        
        current = entry;
      }
      
      return result;
    } catch (error) {
      console.error('Erro na descompressão:', error);
      return compressedData; // Retornar dados originais em caso de erro
    }
  }
}

// Wrapper para localStorage com compressão automática
export class CompressedStorage {
  private static readonly COMPRESSION_THRESHOLD = 1024; // 1KB
  private static readonly STATS_KEY = 'closetfesta_compression_stats';

  static setItem(key: string, value: any): void {
    const jsonString = JSON.stringify(value);
    const shouldCompress = jsonString.length > this.COMPRESSION_THRESHOLD;
    
    let finalData: string;
    let stats: CompressionStats;
    
    if (shouldCompress) {
      const result = SimpleCompressor.compress(jsonString);
      finalData = result.compressed;
      
      // Atualizar estatísticas
      stats = this.getStats();
      stats.total_operations++;
      stats.total_original_bytes += result.original_size;
      stats.total_compressed_bytes += result.compressed_size;
      stats.total_savings_bytes += (result.original_size - result.compressed_size);
      stats.average_compression_ratio = stats.total_compressed_bytes / stats.total_original_bytes;
      
      this.saveStats(stats);
      
      console.log(`🗜️ Compressão ${key}: ${result.original_size}B → ${result.compressed_size}B (${Math.round((1 - result.compression_ratio) * 100)}% economia)`);
    } else {
      finalData = jsonString;
    }
    
    try {
      localStorage.setItem(key, finalData);
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
      // Tentar comprimir forçadamente se falhou por falta de espaço
      if (!shouldCompress && jsonString.length > 500) {
        const result = SimpleCompressor.compress(jsonString);
        localStorage.setItem(key, result.compressed);
      } else {
        throw error;
      }
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      if (data === null) return null;
      
      const decompressed = SimpleCompressor.decompress(data);
      return JSON.parse(decompressed);
    } catch (error) {
      console.error(`Erro ao recuperar ${key}:`, error);
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    localStorage.clear();
  }

  private static getStats(): CompressionStats {
    const stats = localStorage.getItem(this.STATS_KEY);
    if (stats) {
      try {
        return JSON.parse(stats);
      } catch {
        // Se stats corrompidas, reiniciar
      }
    }
    
    return {
      total_operations: 0,
      total_original_bytes: 0,
      total_compressed_bytes: 0,
      total_savings_bytes: 0,
      average_compression_ratio: 1
    };
  }

  private static saveStats(stats: CompressionStats): void {
    try {
      localStorage.setItem(this.STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.warn('Não foi possível salvar estatísticas de compressão:', error);
    }
  }

  static getCompressionStats(): CompressionStats {
    return this.getStats();
  }

  static optimizeStorage(): { freed_bytes: number; operations: number } {
    let freedBytes = 0;
    let operations = 0;
    
    // Recomprimir todos os dados grandes do sistema
    const systemKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('closetfesta_') && 
      key !== this.STATS_KEY
    );
    
    systemKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data && data.length > this.COMPRESSION_THRESHOLD) {
          const originalSize = new Blob([data]).size;
          
          // Tentar recomprimir
          const decompressed = SimpleCompressor.decompress(data);
          const recompressed = SimpleCompressor.compress(decompressed);
          
          if (recompressed.compressed_size < originalSize) {
            localStorage.setItem(key, recompressed.compressed);
            freedBytes += (originalSize - recompressed.compressed_size);
            operations++;
          }
        }
      } catch (error) {
        console.warn(`Erro ao otimizar ${key}:`, error);
      }
    });
    
    return { freed_bytes: freedBytes, operations };
  }

  // Função para migrar dados existentes para formato comprimido
  static migrateExistingData(): { migrated: number; errors: number } {
    let migrated = 0;
    let errors = 0;
    
    const systemKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('closetfesta_') && 
      !key.includes('_compression_') &&
      key !== this.STATS_KEY
    );
    
    systemKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data && !data.startsWith(SimpleCompressor['MAGIC_HEADER'])) {
          // Dados não comprimidos, migrar
          const parsed = JSON.parse(data);
          this.setItem(key, parsed);
          migrated++;
        }
      } catch (error) {
        console.warn(`Erro ao migrar ${key}:`, error);
        errors++;
      }
    });
    
    return { migrated, errors };
  }
}

export default CompressedStorage; 