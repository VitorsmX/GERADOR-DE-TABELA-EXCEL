import { HeaderGroup } from "@/components/Step3/Step3.types";
import { TableCell } from "@/components/table/editable-table/EditableTable.types";

// total de colunas do corpo (soma dos colSpans dos headers)
const totalCols = (headers: HeaderGroup[]) =>
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

// flatten/regroup ajudam a mesclar intervalos de header com segurança
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

function makeId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// Atualiza valor de célula
export const updateCellLogic = (
  data: TableCell[][],
  r: number,
  c: number,
  value: string
): TableCell[][] => {
  if (!data[r] || !data[r][c]) return data;
  const next = data.slice();
  next[r] = data[r].slice();
  next[r][c] = { ...data[r][c], value };
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
  const next = data.slice();
  const targetIndex = pos === "above" ? rowIndex : rowIndex + 1;
  next.splice(targetIndex, 0, newRow);
  return next;
};

// Remove linha
export const removeRowLogic = (data: TableCell[][], rowIndex: number): TableCell[][] => {
  if (data.length <= 1) return data;
  if (!data[rowIndex]) return data;
  return data.filter((_, i) => i !== rowIndex);
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
  const newData = data.map((row) => {
    const newRow = row.slice();
    newRow.splice(targetAbs, 0, { value: "" });
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
    newHeaders[gi].ids.splice(offsetInGroup, 0, newId);
  } else {
    // append ao último grupo (ou cria um grupo se vazio)
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

  const newData = data.map((row) => row.filter((_, j) => j !== colIndex));
  const loc = locateColumn(headers, colIndex);
  if (!loc) return { data: newData, headers };

  const newHeaders = headers.map((g) => ({ ...g, ids: g.ids.slice() }));
  newHeaders[loc.groupIndex].ids.splice(loc.offset, 1);
  if (newHeaders[loc.groupIndex].ids.length === 0) {
    newHeaders.splice(loc.groupIndex, 1);
  }
  return { data: newData, headers: newHeaders };
}

// Merge colunas
export const mergeColumnsLogic = (
  data: TableCell[][],
  row: number,
  startCol: number,
  endCol: number
): TableCell[][] => {
  if (!data[row]) return data;
  const next = data.slice();
  next[row] = data[row].slice();
  const mainCell = { ...next[row][startCol], colSpan: endCol - startCol + 1 };
  next[row][startCol] = mainCell;
  for (let c = startCol + 1; c <= endCol; c++) {
    if (next[row][c]) next[row][c] = { ...next[row][c], merged: true };
  }
  return next;
};

// Merge linhas
export const mergeRowsLogic = (
  data: TableCell[][],
  col: number,
  startRow: number,
  endRow: number
): TableCell[][] => {
  if (!data[startRow] || !data[startRow][col]) return data;
  const next = data.slice();
  next[startRow] = data[startRow].slice();
  const mainCell = { ...next[startRow][col], rowSpan: endRow - startRow + 1 };
  next[startRow][col] = mainCell;
  for (let r = startRow + 1; r <= endRow; r++) {
    if (!data[r] || !data[r][col]) continue;
    next[r] = data[r].slice();
    next[r][col] = { ...data[r][col], merged: true };
  }
  return next;
};

// Merge bloco
export const mergeBlockLogic = (
  data: TableCell[][],
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number
): TableCell[][] => {
  if (!data[startRow] || !data[startRow][startCol]) return data;
  const next = data.slice();
  next[startRow] = data[startRow].slice();
  const mainCell = {
    ...next[startRow][startCol],
    rowSpan: endRow - startRow + 1,
    colSpan: endCol - startCol + 1,
  };
  next[startRow][startCol] = mainCell;
  for (let r = startRow; r <= endRow; r++) {
    if (r !== startRow) next[r] = data[r]?.slice() ?? [];
    for (let c = startCol; c <= endCol; c++) {
      if (r === startRow && c === startCol) continue;
      if (data[r]?.[c]) next[r][c] = { ...data[r][c], merged: true };
    }
  }
  return next;
};
