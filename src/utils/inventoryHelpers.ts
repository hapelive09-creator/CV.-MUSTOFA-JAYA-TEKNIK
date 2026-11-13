export interface StockParseResult {
  valid: boolean;
  value: number;
  error?: string;
}

/**
 * Parses and validates user-entered stock quantity (supports dot or comma decimals, >= 0).
 */
export function parseStockInput(raw: string): StockParseResult {
  const normalized = raw.trim().replace(',', '.');
  if (!normalized) {
    return {
      valid: false,
      value: 0,
      error: 'Stok wajib diisi',
    };
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) {
    return {
      valid: false,
      value: 0,
      error: 'Masukkan angka yang valid',
    };
  }

  if (num < 0) {
    return {
      valid: false,
      value: 0,
      error: 'Stok tidak boleh negatif',
    };
  }

  return {
    valid: true,
    value: Math.round(num * 1000) / 1000,
  };
}
