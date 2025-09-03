import { HeaderGroup } from "@/components/Step3/Step3.types";
import { TableCell } from "@/components/Table/editable-table/EditableTable.types";

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
export const insertColumnLogic = (
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number,
  pos: "left" | "right"
): { data: TableCell[][]; headers: HeaderGroup[] } => {
  const targetIndex = pos === "left" ? colIndex : colIndex + 1;
  const newData = data.map((row) => {
    const newRow = row.slice();
    newRow.splice(targetIndex, 0, { value: "" });
    return newRow;
  });

  const newHeader: HeaderGroup = { ids: [Date.now()], text: "" };
  const newHeaders = headers.slice();
  newHeaders.splice(targetIndex, 0, newHeader);

  return { data: newData, headers: newHeaders };
};

// Remove coluna
export const removeColumnLogic = (
  data: TableCell[][],
  headers: HeaderGroup[],
  colIndex: number
): { data: TableCell[][]; headers: HeaderGroup[] } => {
  const hasCols = data[0]?.length ?? 0;
  if (hasCols <= 1) return { data, headers };
  const newData = data.map((row) => row.filter((_, j) => j !== colIndex));
  const newHeaders = headers.filter((_, i) => i !== colIndex);
  return { data: newData, headers: newHeaders };
};

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
