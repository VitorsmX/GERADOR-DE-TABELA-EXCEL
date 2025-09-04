// EditableTable.logic.ts

import { HeaderGroup } from "@/components/Step3/Step3.types";
import { TableCell } from "@/components/table/editable-table/EditableTable.types";

/**
 * ATENÇÃO:
 * - Não redefina TableCell/HeaderGroup aqui; use os importados.
 *   TableCell deve aceitar: value: string; merged?: boolean; rowSpan?: number; colSpan?: number;
 */

// ----------------------- Utilidades gerais -----------------------

const STORAGE_KEY = "editable-table-data";

// total de colunas do corpo (soma dos colSpans dos headers)
export const totalCols = (headers: HeaderGroup[]) =>
  headers.reduce((sum, g) => sum + g.ids.length, 0);

// encontra o grupo e offset pelo índice absoluto de coluna
function locateColumn(headers: HeaderGroup[], colIndex: number) {
  let acc = 0;
  for (let gi = 0; gi < headers.length; gi++) {
    const len = headers[gi].ids.length;
    if (colIndex < acc + len) {
      return {
        groupIndex: gi,
        offset: colIndex - acc,
        groupStart: acc,
        groupEnd: acc + len - 1,
      };
    }
    acc += len;
  }
  return null;
}

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// cria cópia profunda
function cloneData(data: TableCell[][]): TableCell[][] {
  return data.map((row) => row.map((cell) => ({ ...cell })));
}

// normaliza [a,b] para [min,max]
function normalizeRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

// limita valor em [min,max]
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

// reseta merges dentro de um intervalo
function resetMergedCells(
  data: TableCell[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): TableCell[][] {
  const next = cloneData(data);
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      if (next[r]?.[c]) {
        next[r][c].merged = false;
        next[r][c].rowSpan = undefined;
        next[r][c].colSpan = undefined;
      }
    }
  }
  return next;
}

// limpa TUDO (usado quando a estrutura muda para evitar spans inválidos)
function clearAllMerges(data: TableCell[][]): TableCell[][] {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  return resetMergedCells(data, 0, Math.max(0, rows - 1), 0, Math.max(0, cols - 1));
}

// ----------------------- Persistência -----------------------

export type TableData = {
  headers: HeaderGroup[];
  rows: TableCell[][];
};

// flatten/regroup para cabeçalhos
function flattenHeaders(headers: HeaderGroup[]) {
  return headers.flatMap((g) => g.ids.map((id) => ({ id, text: g.text })));
}

function regroup(flat: { id: number; text: string }[]): HeaderGroup[] {
  if (flat.length === 0) return [];
  const out: HeaderGroup[] = [];
  let curText = flat[0].text;
  let curIds: number[] = [flat[0].id];

  for (let i = 1; i < flat.length; i++) {
    if (flat[i].text === curText) {
      curIds.push(flat[i].id);
    } else {
      out.push({ ids: curIds, text: curText });
      curText = flat[i].text;
      curIds = [flat[i].id];
    }
  }
  out.push({ ids: curIds, text: curText });
  return out;
}

function isInEditableStage() {
  const path = window.location.pathname;
  return path.includes('step3') || path.includes('step4');
}

export function persistToStorage(data: TableData) {
  if (typeof window === 'undefined' || !isInEditableStage()) return;
  if (typeof window === "undefined") return; // Next.js SSR guard
  const flatHeaders = flattenHeaders(data.headers);
  const payload = {
    headers: flatHeaders,
    rows: data.rows, // TableCell[][]
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // storage indisponível/saturado: ignore
  }
}

export function loadFromStorage(): TableData | null {
  if (typeof window === "undefined") return null; // Next.js SSR guard
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as {
      headers: { id: number; text: string }[];
      rows: TableCell[][];
    };
    return {
      headers: regroup(parsed.headers || []),
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
    };
  } catch {
    return null;
  }
}

// ---- Criação de nova tabela ----
export function createEmptyTable(rows: number, cols: number): TableData {
  const headers: HeaderGroup[] = [
    { ids: Array.from({ length: cols }, (_, i) => i), text: "Grupo 1" },
  ];
  const dataRows = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: "" as string }))
  );
  return { headers, rows: dataRows };
}

// ----------------------- Operações de célula/estrutura -----------------------

// Atualiza valor de célula
export const updateCellLogic = (
  data: TableCell[][],
  r: number,
  c: number,
  value: string
): TableCell[][] => {
  if (!data[r] || !data[r][c]) return data;
  const next = cloneData(data);
  next[r][c].value = value;
  return next;
};

// Insere linha
export const insertRowLogic = (
  data: TableCell[][],
  rowIndex: number,
  pos: "above" | "below"
): TableCell[][] => {
  const cols = data[0]?.length ?? 0;
  if (cols === 0) return data;
  const newRow: TableCell[] = Array.from({ length: cols }, () => ({ value: "" }));
  const next = clearAllMerges(cloneData(data));
  const targetIndex = clamp(pos === "above" ? rowIndex : rowIndex + 1, 0, next.length);
  next.splice(targetIndex, 0, newRow);
  return next;
};

// Remove linha
export const removeRowLogic = (
  data: TableCell[][],
  rowIndex: number
): TableCell[][] => {
  if (data.length <= 1) return data;
  if (!data[rowIndex]) return data;
  const next = clearAllMerges(cloneData(data));
  return next.filter((_, i) => i !== rowIndex);
};

// Insere coluna
export function insertColumnLogic(
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number,
  pos: "left" | "right"
): { data: TableCell[][]; headers: HeaderGroup[] } {
  const targetAbs = pos === "left" ? colIndex : colIndex + 1;

  // corpo
  const newData = clearAllMerges(cloneData(data)).map((row) => {
    const newRow = row.slice();
    const idx = clamp(targetAbs, 0, newRow.length);
    newRow.splice(idx, 0, { value: "" });
    return newRow;
  });

  // headers: inserir um id dentro do grupo que cobre targetAbs (ou no limite)
  let acc = 0;
  let gi = 0;
  for (; gi < headers.length; gi++) {
    const len = headers[gi].ids.length;
    if (targetAbs <= acc + len) break;
    acc += len;
  }
  const newHeaders = headers.map((g) => ({ ...g, ids: g.ids.slice() }));
  const newId = makeId();

  if (gi < newHeaders.length) {
    const offsetInGroup = Math.max(0, targetAbs - acc);
    const safeOffset = clamp(offsetInGroup, 0, newHeaders[gi].ids.length);
    newHeaders[gi].ids.splice(safeOffset, 0, newId);
  } else {
    if (newHeaders.length === 0) newHeaders.push({ ids: [newId], text: "" });
    else newHeaders[newHeaders.length - 1].ids.push(newId);
  }

  return { data: newData, headers: newHeaders };
}

// Remove coluna
export function removeColumnLogic(
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number
): { data: TableCell[][]; headers: HeaderGroup[] } {
  const cols = data[0]?.length ?? 0;
  if (cols <= 1) return { data, headers };

  const safeIndex = clamp(colIndex, 0, cols - 1);
  const newData = clearAllMerges(cloneData(data)).map((row) =>
    row.filter((_, j) => j !== safeIndex)
  );

  const loc = locateColumn(headers, safeIndex);
  if (!loc) return { data: newData, headers };

  const newHeaders = headers.map((g) => ({ ...g, ids: g.ids.slice() }));
  newHeaders[loc.groupIndex].ids.splice(loc.offset, 1);
  if (newHeaders[loc.groupIndex].ids.length === 0) {
    newHeaders.splice(loc.groupIndex, 1);
  }
  return { data: newData, headers: newHeaders };
}

// ----------------------- Merges -----------------------

/**
 * Observações importantes sobre merges:
 * - Antes de aplicar um merge, limpamos o intervalo alvo com resetMergedCells (evita herança de merges anteriores).
 * - Intervalos são normalizados e limitados ao tamanho real da matriz.
 */

export const mergeColumnsLogic = (
  data: TableCell[][],
  row: number,
  startCol: number,
  endCol: number
): TableCell[][] => {
  if (!data[row]) return data;

  const cols = data[row].length;
  let [sc, ec] = normalizeRange(startCol, endCol);
  sc = clamp(sc, 0, cols - 1);
  ec = clamp(ec, 0, cols - 1);
  if (sc > ec) return data;

  const next = resetMergedCells(data, row, row, sc, ec);

  const mainCell = { ...next[row][sc], colSpan: ec - sc + 1 };
  next[row][sc] = mainCell;

  for (let c = sc + 1; c <= ec; c++) {
    if (next[row][c]) next[row][c] = { ...next[row][c], merged: true };
  }
  return next;
};

export const mergeRowsLogic = (
  data: TableCell[][],
  col: number,
  startRow: number,
  endRow: number
): TableCell[][] => {
  const rows = data.length;
  let [sr, er] = normalizeRange(startRow, endRow);
  sr = clamp(sr, 0, rows - 1);
  er = clamp(er, 0, rows - 1);
  if (sr > er) return data;
  if (!data[sr] || !data[sr][col]) return data;

  const next = resetMergedCells(data, sr, er, col, col);

  const mainCell = { ...next[sr][col], rowSpan: er - sr + 1 };
  next[sr][col] = mainCell;

  for (let r = sr + 1; r <= er; r++) {
    if (next[r]?.[col]) next[r][col] = { ...next[r][col], merged: true };
  }
  return next;
};

export const mergeBlockLogic = (
  data: TableCell[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): TableCell[][] => {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  if (rows === 0 || cols === 0) return data;

  let [sr, er] = normalizeRange(startRow, endRow);
  let [sc, ec] = normalizeRange(startCol, endCol);
  sr = clamp(sr, 0, rows - 1);
  er = clamp(er, 0, rows - 1);
  sc = clamp(sc, 0, cols - 1);
  ec = clamp(ec, 0, cols - 1);
  if (sr > er || sc > ec) return data;
  if (!data[sr] || !data[sr][sc]) return data;

  const next = resetMergedCells(data, sr, er, sc, ec);

  const mainCell = {
    ...next[sr][sc],
    rowSpan: er - sr + 1,
    colSpan: ec - sc + 1,
  };
  next[sr][sc] = mainCell;

  for (let r = sr; r <= er; r++) {
    for (let c = sc; c <= ec; c++) {
      if (r === sr && c === sc) continue;
      if (next[r]?.[c]) next[r][c] = { ...next[r][c], merged: true };
    }
  }
  return next;
};
