// EditableTable.logic.ts
import { HeaderGroup } from "@/components/Step3/Step3.types";
import { TableCell } from "@/components/table/editable-table/EditableTable.types";

/**
 * Observações:
 * - Usa os tipos importados (HeaderGroup e TableCell).
 * - Todas as funções são defensivas: checam undefined, vazio, etc.
 */

// ----------------------- Utilitários -----------------------
const STORAGE_KEY = "editable-table-data";

function makeId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function cloneData(data: TableCell[][]): TableCell[][] {
  // clone profundo suficiente para nosso formato (objetos simples)
  return data.map((row) => row.map((cell) => ({ ...cell })));
}

function normalizeRange(a: number, b: number): [number, number] {
  return a <= b ? [a, b] : [b, a];
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** retorna a quantidade total de colunas do corpo (soma dos ids dos headers) */
export const totalCols = (headers: HeaderGroup[]) =>
  (headers || []).reduce((sum, g) => sum + (g.ids?.length ?? 0), 0);

/** localiza grupo e offset a partir de índice absoluto de coluna */
function locateColumn(headers: HeaderGroup[], colIndex: number) {
  if (!headers || headers.length === 0) return null;
  let acc = 0;
  for (let gi = 0; gi < headers.length; gi++) {
    const len = headers[gi]?.ids?.length ?? 0;
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

// ----------------------- Merges helpers -----------------------
function resetMergedCells(
  data: TableCell[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): TableCell[][] {
  const next = cloneData(data);
  for (let r = startRow; r <= endRow; r++) {
    if (!next[r]) continue;
    for (let c = startCol; c <= endCol; c++) {
      if (!next[r][c]) continue;
      next[r][c].merged = false;
      // definimos explicitamente undefined para evitar herança
      next[r][c].rowSpan = undefined;
      next[r][c].colSpan = undefined;
    }
  }
  return next;
}

function clearAllMerges(data: TableCell[][]): TableCell[][] {
  if (!Array.isArray(data) || data.length === 0) return data;
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  return resetMergedCells(data, 0, Math.max(0, rows - 1), 0, Math.max(0, cols - 1));
}

// ----------------------- Persistência -----------------------
export type TableData = {
  headers: HeaderGroup[];
  rows: TableCell[][];
};

function flattenHeaders(headers: HeaderGroup[]) {
  return (headers || []).flatMap((g) =>
    (g.ids || []).map((id) => ({ id, text: g.text ?? "" }))
  );
}

function regroup(flat: { id: number; text: string }[]): HeaderGroup[] {
  if (!Array.isArray(flat) || flat.length === 0) return [];
  const out: HeaderGroup[] = [];
  let curText = flat[0].text ?? "";
  let curIds: number[] = [flat[0].id];

  for (let i = 1; i < flat.length; i++) {
    const item = flat[i];
    if (item.text === curText) {
      curIds.push(item.id);
    } else {
      out.push({ ids: curIds, text: curText });
      curText = item.text;
      curIds = [item.id];
    }
  }
  out.push({ ids: curIds, text: curText });
  return out;
}

function isClientEditableStage(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location?.pathname ?? "";
  return p.includes("step3") || p.includes("step4");
}

export function persistToStorage(data: TableData) {
  if (typeof window === "undefined") return;
  if (!isClientEditableStage()) return;
  try {
    const flatHeaders = flattenHeaders(data.headers);
    const payload = {
      headers: flatHeaders,
      rows: data.rows,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignora erros (quota, modo privado, etc.)
  }
}

export function loadFromStorage(): TableData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      headers?: { id: number; text: string }[];
      rows?: TableCell[][];
    };
    const headers = regroup(parsed.headers ?? []);
    const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
    return { headers, rows };
  } catch {
    return null;
  }
}

// ----------------------- Criação de nova tabela -----------------------
export function createEmptyTable(rows: number, cols: number): TableData {
  const headers: HeaderGroup[] = [{ ids: Array.from({ length: cols }, (_, i) => i), text: "Grupo 1" }];
  const dataRows: TableCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ value: "" as string }))
  );
  return { headers, rows: dataRows };
}

// ----------------------- Operações -----------------------
export const updateCellLogic = (data: TableCell[][], r: number, c: number, value: string): TableCell[][] => {
  if (!Array.isArray(data) || !data[r] || !data[r][c]) return data;
  const next = cloneData(data);
  next[r][c].value = value;
  return next;
};

export const insertRowLogic = (data: TableCell[][], rowIndex: number, pos: "above" | "below"): TableCell[][] => {
  if (!Array.isArray(data)) return data;
  const cols = data[0]?.length ?? 0;
  if (cols === 0) return data;
  const next = clearAllMerges(cloneData(data));
  const targetIndex = clamp(pos === "above" ? rowIndex : rowIndex + 1, 0, next.length);
  const newRow: TableCell[] = Array.from({ length: cols }, () => ({ value: "" }));
  next.splice(targetIndex, 0, newRow);
  return next;
};

export const removeRowLogic = (data: TableCell[][], rowIndex: number): TableCell[][] => {
  if (!Array.isArray(data) || data.length <= 1) return data;
  if (rowIndex < 0 || rowIndex >= data.length) return data;
  const next = clearAllMerges(cloneData(data));
  next.splice(rowIndex, 1);
  return next;
};

export function insertColumnLogic(
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number,
  pos: "left" | "right"
): { data: TableCell[][]; headers: HeaderGroup[] } {
  if (!Array.isArray(data)) return { data, headers };
  const targetAbs = pos === "left" ? colIndex : colIndex + 1;

  const newData = clearAllMerges(cloneData(data)).map((row) => {
    const newRow = row.slice();
    const idx = clamp(targetAbs, 0, newRow.length);
    newRow.splice(idx, 0, { value: "" });
    return newRow;
  });

  const newHeaders = (headers || []).map((g) => ({ ...g, ids: (g.ids || []).slice() }));
  const newId = makeId();

  // encontra grupo para inserir (poderá inserir no final)
  let acc = 0;
  let gi = 0;
  for (; gi < newHeaders.length; gi++) {
    const len = newHeaders[gi].ids.length;
    if (targetAbs <= acc + len) break;
    acc += len;
  }

  if (gi < newHeaders.length) {
    const offsetInGroup = Math.max(0, targetAbs - acc);
    const safeOffset = clamp(offsetInGroup, 0, newHeaders[gi].ids.length);
    newHeaders[gi].ids.splice(safeOffset, 0, newId);
  } else {
    if (newHeaders.length === 0) {
      newHeaders.push({ ids: [newId], text: "" });
    } else {
      newHeaders[newHeaders.length - 1].ids.push(newId);
    }
  }

  return { data: newData, headers: newHeaders };
}

export function removeColumnLogic(
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number
): { data: TableCell[][]; headers: HeaderGroup[] } {
  if (!Array.isArray(data)) return { data, headers };
  const cols = data[0]?.length ?? 0;
  if (cols <= 1) return { data, headers };
  const safeIndex = clamp(colIndex, 0, cols - 1);
  const newData = clearAllMerges(cloneData(data)).map((row) => row.filter((_, j) => j !== safeIndex));

  const loc = locateColumn(headers, safeIndex);
  if (!loc) return { data: newData, headers };
  const newHeaders = (headers || []).map((g) => ({ ...g, ids: (g.ids || []).slice() }));
  newHeaders[loc.groupIndex].ids.splice(loc.offset, 1);
  if (newHeaders[loc.groupIndex].ids.length === 0) {
    newHeaders.splice(loc.groupIndex, 1);
  }
  return { data: newData, headers: newHeaders };
}

// ----------------------- Merges -----------------------
export const mergeColumnsLogic = (data: TableCell[][], row: number, startCol: number, endCol: number): TableCell[][] => {
  if (!Array.isArray(data) || !data[row]) return data;
  const cols = data[row].length;
  let [sc, ec] = normalizeRange(startCol, endCol);
  sc = clamp(sc, 0, cols - 1);
  ec = clamp(ec, 0, cols - 1);
  if (sc > ec) return data;

  const next = resetMergedCells(data, row, row, sc, ec);
  const mainCell = { ...next[row][sc], colSpan: ec - sc + 1, merged: false };
  next[row][sc] = mainCell;
  for (let c = sc + 1; c <= ec; c++) {
    if (next[row][c]) next[row][c] = { ...next[row][c], merged: true };
  }
  return next;
};

export const mergeRowsLogic = (data: TableCell[][], col: number, startRow: number, endRow: number): TableCell[][] => {
  if (!Array.isArray(data)) return data;
  const rows = data.length;
  let [sr, er] = normalizeRange(startRow, endRow);
  sr = clamp(sr, 0, rows - 1);
  er = clamp(er, 0, rows - 1);
  if (sr > er) return data;
  if (!data[sr] || !data[sr][col]) return data;

  const next = resetMergedCells(data, sr, er, col, col);
  const mainCell = { ...next[sr][col], rowSpan: er - sr + 1, merged: false };
  next[sr][col] = mainCell;
  for (let r = sr + 1; r <= er; r++) {
    if (next[r]?.[col]) next[r][col] = { ...next[r][col], merged: true };
  }
  return next;
};

export const mergeBlockLogic = (data: TableCell[][], startRow: number, endRow: number, startCol: number, endCol: number): TableCell[][] => {
  if (!Array.isArray(data) || data.length === 0) return data;
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
  const mainCell = { ...next[sr][sc], rowSpan: er - sr + 1, colSpan: ec - sc + 1, merged: false };
  next[sr][sc] = mainCell;

  for (let r = sr; r <= er; r++) {
    for (let c = sc; c <= ec; c++) {
      if (r === sr && c === sc) continue;
      if (next[r]?.[c]) next[r][c] = { ...next[r][c], merged: true };
    }
  }
  return next;
};
