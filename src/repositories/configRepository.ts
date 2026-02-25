import { getDatabase } from '@/services/database';
import { ThemeMode } from '@/types';

const PREFIX_KEY = 'product_code_prefix';
const SEQUENCE_KEY = 'product_code_sequence';
const THEME_KEY = 'theme_mode';

async function getConfigValue(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ config_value: string }>(
    `SELECT config_value FROM SYSTEM_CONFIG WHERE config_key = ?`,
    [key]
  );
  return row?.config_value ?? null;
}

async function setConfigValue(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO SYSTEM_CONFIG (config_key, config_value)
     VALUES (?, ?)
     ON CONFLICT(config_key) DO UPDATE SET
       config_value = excluded.config_value,
       updated_at   = datetime('now')`,
    [key, value]
  );
}

export async function getPrefix(): Promise<string> {
  return (await getConfigValue(PREFIX_KEY)) ?? 'EM-';
}

export async function setPrefix(prefix: string): Promise<void> {
  const normalized = prefix.toUpperCase().trim();
  if (!/^[A-Z0-9]{2,5}-?$/.test(normalized) && !/^[A-Z0-9]{2,5}$/.test(normalized)) {
    throw new Error('El prefijo debe tener entre 2 y 5 caracteres alfanuméricos');
  }
  const clean = normalized.endsWith('-') ? normalized : `${normalized}-`;
  await setConfigValue(PREFIX_KEY, clean);
}

export async function getSequence(): Promise<number> {
  const val = await getConfigValue(SEQUENCE_KEY);
  return val ? parseInt(val, 10) : 1;
}

export async function setSequence(seq: number): Promise<void> {
  if (seq < 1) {
    throw new Error('El número secuencial debe ser mayor a 0');
  }
  await setConfigValue(SEQUENCE_KEY, String(seq));
}

/**
 * Atomically reads the current sequence, formats the product code,
 * and increments the counter.
 */
export async function consumeNextProductCode(): Promise<string> {
  const db = await getDatabase();

  return new Promise<string>((resolve, reject) => {
    (async () => {
      try {
        const prefix = (await getConfigValue(PREFIX_KEY)) ?? 'EM-';
        const seqStr = (await getConfigValue(SEQUENCE_KEY)) ?? '1';
        const seq = parseInt(seqStr, 10);
        // Pad to at least 4 digits; if seq already has more digits, keep them all
        const padWidth = Math.max(4, String(seq).length);
        const code = `${prefix}${String(seq).padStart(padWidth, '0')}`;
        await setConfigValue(SEQUENCE_KEY, String(seq + 1));
        resolve(code);
      } catch (err) {
        reject(err);
      }
    })();
  });
}

export async function previewNextProductCode(): Promise<string> {
  const prefix = (await getConfigValue(PREFIX_KEY)) ?? 'EM-';
  const seqStr = (await getConfigValue(SEQUENCE_KEY)) ?? '1';
  const seq = parseInt(seqStr, 10);
  const padWidth = Math.max(4, String(seq).length);
  return `${prefix}${String(seq).padStart(padWidth, '0')}`;
}

export async function getThemeMode(): Promise<ThemeMode> {
  const val = await getConfigValue(THEME_KEY);
  if (val === 'light' || val === 'dark' || val === 'system') return val;
  return 'system';
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await setConfigValue(THEME_KEY, mode);
}
