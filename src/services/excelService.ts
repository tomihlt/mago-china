import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Product } from '@/types';

// Use dynamic import for xlsx to avoid bundler issues
let XLSX: typeof import('xlsx') | null = null;

async function getXLSX() {
  if (!XLSX) {
    XLSX = await import('xlsx');
  }
  return XLSX;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${mins}`;
}

export interface ExportResult {
  fileUri: string;
  filename: string;
}

export async function exportToExcel(
  products: Product[]
): Promise<ExportResult> {
  const xlsx = await getXLSX();

  // Sort: by supplier name, then by product code
  const sorted = [...products].sort((a, b) => {
    const sup = a.supplier_name.localeCompare(b.supplier_name, 'es');
    if (sup !== 0) return sup;
    return a.product_code.localeCompare(b.product_code, 'es');
  });

  // Build worksheet data
  const headers = [
    'Proveedor',
    'Código',
    'Descripción',
    'Precio',
    'Unidades/Bulto',
    'Cubicaje (m³)',
    'Peso (kg)',
    'Observaciones',
    'Fecha Registro',
  ];

  const rows = sorted.map((p) => [
    p.supplier_name,
    p.product_code,
    p.description ?? '',
    p.price.toFixed(2),
    p.units_per_package,
    p.volume.toFixed(3),
    p.weight.toFixed(2),
    p.observations ?? '',
    formatDate(p.created_at),
  ]);

  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.aoa_to_sheet([headers, ...rows]);

  // Style header row (column widths)
  ws['!cols'] = [
    { wch: 25 }, // Proveedor
    { wch: 12 }, // Código
    { wch: 40 }, // Descripción
    { wch: 10 }, // Precio
    { wch: 15 }, // Unidades
    { wch: 14 }, // Cubicaje
    { wch: 10 }, // Peso
    { wch: 40 }, // Observaciones
    { wch: 14 }, // Fecha
  ];

  xlsx.utils.book_append_sheet(wb, ws, 'Inventario');

  // Write to base64 string
  const base64 = xlsx.write(wb, { type: 'base64', bookType: 'xlsx' });

  const filename = `Inventario_${formatTimestamp()}.xlsx`;
  const cacheDir = FileSystem.cacheDirectory ?? `${FileSystem.documentDirectory}cache/`;
  const fileUri = `${cacheDir}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: 'base64' as const,
  });

  return { fileUri, filename };
}

export async function shareExcel(fileUri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo.');
  }
  await Sharing.shareAsync(fileUri, {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    dialogTitle: 'Compartir inventario',
  });
}
