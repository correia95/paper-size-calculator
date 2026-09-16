export interface SizeMM {
  width: number;
  height: number;
}

// ISO 216 A-series (mm), portrait orientation (width x height).
export const A_SERIES: Record<string, SizeMM> = {
  A0: { width: 841, height: 1189 },
  A1: { width: 594, height: 841 },
  A2: { width: 420, height: 594 },
  A3: { width: 297, height: 420 },
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  A6: { width: 105, height: 148 },
  A7: { width: 74, height: 105 },
  A8: { width: 52, height: 74 },
  A9: { width: 37, height: 52 },
  A10: { width: 26, height: 37 },
};

export const US_SERIES: Record<string, SizeMM> = {
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  Tabloid: { width: 279.4, height: 431.8 },
  Executive: { width: 184.15, height: 266.7 },
};

export const ALL_SIZES: Record<string, SizeMM> = { ...A_SERIES, ...US_SERIES };

export function getSize(name: string): SizeMM | null {
  return ALL_SIZES[name] ?? null;
}

export function mmToInches(mm: number): number {
  return mm / 25.4;
}

export function mmToPixels(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

export function aSeriesIndex(name: string): number | null {
  const match = /^A(\d+)$/.exec(name);
  if (!match) return null;
  if (!(name in A_SERIES)) return null;
  return Number(match[1]);
}

export function sheetsPerSheet(largeName: string, smallName: string): number | null {
  const largeIndex = aSeriesIndex(largeName);
  const smallIndex = aSeriesIndex(smallName);
  if (largeIndex === null || smallIndex === null) return null;
  if (smallIndex <= largeIndex) return null;
  return 2 ** (smallIndex - largeIndex);
}

export interface State {
  sizeName: string;
  dpi: number;
  compareSizeName: string;
}

function toUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function toBase64Url(text: string): string {
  const bytes = toUint8Array(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(encoded: string): string {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeState(state: State): URLSearchParams {
  const params = new URLSearchParams();
  params.set('d', toBase64Url(JSON.stringify(state)));
  return params;
}

export function decodeState(params: URLSearchParams, fallback: State): State {
  const raw = params.get('d');
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(fromBase64Url(raw));
    if (
      typeof parsed !== 'object' || parsed === null ||
      typeof parsed.sizeName !== 'string' ||
      typeof parsed.dpi !== 'number'
    ) {
      return fallback;
    }
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}
