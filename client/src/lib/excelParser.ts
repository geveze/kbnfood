import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedRow {
  branchName: string;
  kpiName: string;
  period: string;
  targetValue?: number;
  actualValue?: number;
  notes?: string;
  [key: string]: any;
}

export interface ParseResult {
  fileName: string;
  totalRows: number;
  processedRows: number;
  data: ParsedRow[];
  errors: Array<{ rowNumber: number; error: string; data: any }>;
  warnings: Array<{ rowNumber: number; warning: string }>;
}

/**
 * CSV dosyasını parse et
 */
function parseCSV(text: string): ParsedRow[] {
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.trim(),
      transform: (value: string) => value.trim(),
      complete: (results: any) => {
        resolve(results.data);
      },
      error: (error: any) => {
        reject(error);
      },
    });
  }) as any;
}

/**
 * Excel dosyasını parse et
 */
async function parseExcel(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        }) as any[];

        if (jsonData.length < 2) {
          reject(new Error('Excel dosyası boş veya başlık satırı yok'));
          return;
        }

        // Başlık satırını al
        const headers = jsonData[0].map((h: any) => String(h).trim());

        // Veri satırlarını işle
        const rows: ParsedRow[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.every((cell: any) => !cell)) continue; // Boş satırları atla

          const obj: any = {};
          headers.forEach((header: string, index: number) => {
            obj[header] = row[index];
          });
          rows.push(obj as ParsedRow);
        }

        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Dosya okuma hatası'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Dosyayı parse et (CSV veya Excel)
 */
export async function parseFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    fileName: file.name,
    totalRows: 0,
    processedRows: 0,
    data: [],
    errors: [],
    warnings: [],
  };

  try {
    let rows: ParsedRow[] = [];

    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const text = await file.text();
      rows = await parseCSV(text);
    } else if (
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
    ) {
      rows = await parseExcel(file);
    } else {
      throw new Error('Desteklenmeyen dosya türü. Lütfen CSV veya Excel dosyası seçiniz.');
    }

    result.totalRows = rows.length;

    // Sütun adlarını normalize et
    const normalizeHeader = (header: string): string => {
      return header.toLowerCase().trim();
    };

    // Gerekli sütunları bul
    const firstRow = rows[0];
    if (!firstRow) {
      throw new Error('Dosyada veri satırı bulunamadı');
    }

    const headers = Object.keys(firstRow).map(normalizeHeader);

    // Sütun eşleştirmesi
    const branchNameCol = headers.findIndex(
      (h) => h.includes('şube') || h.includes('branch') || h.includes('lokasyon') || h.includes('location')
    );
    const kpiNameCol = headers.findIndex(
      (h) => h.includes('kpi') || h.includes('hedef') || h.includes('target') || h.includes('boyut') || h.includes('dimension')
    );
    const periodCol = headers.findIndex(
      (h) => h.includes('dönem') || h.includes('period') || h.includes('ay') || h.includes('month')
    );
    const targetValueCol = headers.findIndex(
      (h) => h.includes('hedef') && (h.includes('değer') || h.includes('value')) || h.includes('target value')
    );
    const actualValueCol = headers.findIndex(
      (h) => h.includes('gerçek') || h.includes('actual') || h.includes('gerçekleşen') || h.includes('realized')
    );

    if (branchNameCol === -1 || kpiNameCol === -1 || periodCol === -1) {
      result.errors.push({
        rowNumber: 0,
        error: 'Gerekli sütunlar bulunamadı. Lütfen şu sütunları içeren dosya seçiniz: Şube Adı, KPI Hedefi, Dönem',
        data: headers,
      });
      return result;
    }

    // Verileri işle
    const processedRows: ParsedRow[] = [];
    rows.forEach((row, index) => {
      const rowNumber = index + 2; // Excel satır numarası (başlık + 1)

      try {
        const branchName = String(Object.values(row)[branchNameCol] || '').trim();
        const kpiName = String(Object.values(row)[kpiNameCol] || '').trim();
        const period = String(Object.values(row)[periodCol] || '').trim();

        if (!branchName || !kpiName || !period) {
          result.warnings.push({
            rowNumber,
            warning: 'Boş alan bulundu - Şube Adı, KPI Hedefi ve Dönem gereklidir',
          });
          return;
        }

        const processedRow: ParsedRow = {
          branchName,
          kpiName,
          period,
        };

        if (targetValueCol !== -1) {
          const val = Object.values(row)[targetValueCol];
          if (val !== undefined && val !== null && val !== '') {
            processedRow.targetValue = parseFloat(String(val));
          }
        }

        if (actualValueCol !== -1) {
          const val = Object.values(row)[actualValueCol];
          if (val !== undefined && val !== null && val !== '') {
            processedRow.actualValue = parseFloat(String(val));
          }
        }

        // Diğer sütunları ekle
        Object.entries(row).forEach(([key, value]) => {
          if (!processedRow[key]) {
            processedRow[key] = value;
          }
        });

        processedRows.push(processedRow);
      } catch (error: any) {
        result.errors.push({
          rowNumber,
          error: error.message || 'Veri işleme hatası',
          data: row,
        });
      }
    });

    result.data = processedRows;
    result.processedRows = processedRows.length;

    return result;
  } catch (error: any) {
    result.errors.push({
      rowNumber: 0,
      error: error.message || 'Dosya parsing hatası',
      data: null,
    });
    return result;
  }
}

/**
 * Hedef ve gerçekleşen veri için Excel şablonu oluştur
 */
export function generateTargetTemplate(): string {
  const headers = ['Şube Adı', 'KPI Hedefi', 'Dönem', 'Hedef Değer', 'Notlar'];
  const sampleData = [
    ['BY İSTANBUL AKSARAY', 'Satış Hedefi', '2026/1', '150000', 'İyi performans'],
    ['BY İSTANBUL AQUA FLORYA', 'Müşteri Memnuniyeti', '2026/1', '92.5', 'Ortalama'],
    ['BY ANKARA ÇANKIRI', 'Operasyon Verimliliği', '2026/1', '88.0', 'İyileştirme gerekli'],
  ];

  const rows = [headers, ...sampleData];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Gerçekleşen veri için Excel şablonu oluştur
 */
export function generateActualTemplate(): string {
  const headers = ['Şube Adı', 'KPI Hedefi', 'Dönem', 'Gerçekleşen Değer', 'Notlar'];
  const sampleData = [
    ['BY İSTANBUL AKSARAY', 'Satış Hedefi', '2026/1', '155000', 'Hedefi aştı'],
    ['BY İSTANBUL AQUA FLORYA', 'Müşteri Memnuniyeti', '2026/1', '90.2', 'Biraz düştü'],
    ['BY ANKARA ÇANKIRI', 'Operasyon Verimliliği', '2026/1', '89.5', 'İyi gidiyor'],
  ];

  const rows = [headers, ...sampleData];
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}
