"use client";

import { memo, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { HeaderGroup } from "@/components/Step3";

export type TableCell = {
  value: string;
  rowSpan?: number;
  colSpan?: number;
  merged?: boolean;
};

type EditableTableProps = {
  headers: HeaderGroup[];
  data: TableCell[][];
  setHeaders: React.Dispatch<React.SetStateAction<HeaderGroup[]>>;
  setData: React.Dispatch<React.SetStateAction<TableCell[][]>>;
};

const EditableTable = ({ headers, data, setHeaders, setData }: EditableTableProps) => {
  // ---------- updates básicos ----------
  const updateCell = useCallback(
    (r: number, c: number, value: string) => {
      setData((prev) => {
        if (!prev[r] || !prev[r][c]) return prev;
        const next = prev.slice();
        next[r] = prev[r].slice();
        next[r][c] = { ...prev[r][c], value };
        return next;
      });
    },
    [setData]
  );

  const insertRow = useCallback(
    (rowIndex: number, pos: "above" | "below") => {
      setData((prev) => {
        const cols = prev[0]?.length ?? 0;
        if (cols === 0) return prev;
        const newRow: TableCell[] = Array.from({ length: cols }, () => ({ value: "" }));
        const next = prev.slice();
        const targetIndex = pos === "above" ? rowIndex : rowIndex + 1;
        next.splice(targetIndex, 0, newRow);
        return next;
      });
    },
    [setData]
  );

  const removeRow = useCallback(
    (rowIndex: number) => {
      setData((prev) => {
        if (prev.length <= 1) return prev;
        if (!prev[rowIndex]) return prev;
        return prev.filter((_, i) => i !== rowIndex);
      });
    },
    [setData]
  );

  const insertColumn = useCallback(
    (colIndex: number, pos: "left" | "right") => {
      setData((prev) => {
        const targetIndex = pos === "left" ? colIndex : colIndex + 1;
        const next = prev.map((row) => {
          const newRow = row.slice();
          newRow.splice(targetIndex, 0, { value: "" });
          return newRow;
        });
        return next;
      });

      const newHeader: HeaderGroup = { ids: [Date.now()], text: "" };
      setHeaders((prev) => {
        const targetIndex = pos === "left" ? colIndex : colIndex + 1;
        const next = prev.slice();
        next.splice(targetIndex, 0, newHeader);
        return next;
      });
    },
    [setData, setHeaders]
  );

  const removeColumn = useCallback(
    (colIndex: number) => {
      setData((prev) => {
        const hasCols = prev[0]?.length ?? 0;
        if (hasCols <= 1) return prev;
        return prev.map((row) => row.filter((_, j) => j !== colIndex));
      });

      setHeaders((prev) => prev.filter((_, i) => i !== colIndex));
    },
    [setData, setHeaders]
  );

  // ---------- merges (cópia mínima/dirigida) ----------
  const mergeColumns = useCallback(
    (row: number, startCol: number, endCol: number) => {
      setData((prev) => {
        if (!prev[row]) return prev;
        const next = prev.slice();
        next[row] = prev[row].slice();

        const mainCell = { ...next[row][startCol], colSpan: endCol - startCol + 1 };
        next[row][startCol] = mainCell;

        for (let c = startCol + 1; c <= endCol; c++) {
          if (next[row][c]) next[row][c] = { ...next[row][c], merged: true };
        }
        return next;
      });
    },
    [setData]
  );

  const mergeRows = useCallback(
    (col: number, startRow: number, endRow: number) => {
      setData((prev) => {
        if (!prev[startRow] || !prev[startRow][col]) return prev;
        const next = prev.slice();

        // célula principal
        next[startRow] = prev[startRow].slice();
        const mainCell = { ...next[startRow][col], rowSpan: endRow - startRow + 1 };
        next[startRow][col] = mainCell;

        // linhas subsequentes
        for (let r = startRow + 1; r <= endRow; r++) {
          if (!prev[r] || !prev[r][col]) continue;
          next[r] = prev[r].slice();
          next[r][col] = { ...prev[r][col], merged: true };
        }
        return next;
      });
    },
    [setData]
  );

  const mergeBlock = useCallback(
    (startRow: number, endRow: number, startCol: number, endCol: number) => {
      setData((prev) => {
        if (!prev[startRow] || !prev[startRow][startCol]) return prev;
        const next = prev.slice();

        // célula principal
        next[startRow] = prev[startRow].slice();
        const mainCell = {
          ...next[startRow][startCol],
          rowSpan: endRow - startRow + 1,
          colSpan: endCol - startCol + 1,
        };
        next[startRow][startCol] = mainCell;

        // restantes do bloco
        for (let r = startRow; r <= endRow; r++) {
          // para cada linha afetada (exceto a primeira já copiada)
          if (r !== startRow) next[r] = prev[r]?.slice() ?? [];
          for (let c = startCol; c <= endCol; c++) {
            if (r === startRow && c === startCol) continue;
            if (prev[r]?.[c]) next[r][c] = { ...prev[r][c], merged: true };
          }
        }
        return next;
      });
    },
    [setData]
  );

  return (
    <div className="w-[95vw] h-[53vh] p-2 bg-white overflow-auto">
      <div className="min-w-[1000px] min-h-[500px]">
        <table className="border-collapse border w-full text-center">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h.ids.join("-")}
                  colSpan={h.ids.length}
                  className="border p-2 bg-gray-100"
                >
                  <input
                    type="text"
                    value={h.text}
                    onChange={(e) =>
                      setHeaders((prev) => {
                        const next = prev.slice();
                        next[i] = { ...prev[i], text: e.target.value };
                        return next;
                      })
                    }
                    className="w-full border rounded p-1"
                    placeholder={`Cabeçalho ${h.ids.join(",")}`}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) =>
                  cell.merged ? null : (
                    <MemoCell
                      key={`${r}-${c}`}
                      r={r}
                      c={c}
                      cell={cell}
                      updateCell={updateCell}
                      insertRow={insertRow}
                      removeRow={removeRow}
                      insertColumn={insertColumn}
                      removeColumn={removeColumn}
                      mergeColumns={mergeColumns}
                      mergeRows={mergeRows}
                      mergeBlock={mergeBlock}
                    />
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type CellProps = {
  r: number;
  c: number;
  cell: TableCell;
  updateCell: (r: number, c: number, value: string) => void;
  insertRow: (rowIndex: number, pos: "above" | "below") => void;
  removeRow: (rowIndex: number) => void;
  insertColumn: (colIndex: number, pos: "left" | "right") => void;
  removeColumn: (colIndex: number) => void;
  mergeColumns: (row: number, startCol: number, endCol: number) => void;
  mergeRows: (col: number, startRow: number, endRow: number) => void;
  mergeBlock: (startRow: number, endRow: number, startCol: number, endCol: number) => void;
};

const Cell = ({
  r,
  c,
  cell,
  updateCell,
  insertRow,
  removeRow,
  insertColumn,
  removeColumn,
  mergeColumns,
  mergeRows,
  mergeBlock,
}: CellProps) => {
  return (
    <td
      className="border p-2 relative min-w-[130px]"
      rowSpan={cell.rowSpan}
      colSpan={cell.colSpan}
    >
      <div className="flex items-center justify-center gap-2">
        <input
          value={cell.value}
          onChange={(e) => updateCell(r, c, e.target.value)}
          className="w-full p-2 border rounded"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-zinc-100/95">
            <DropdownMenuItem onClick={() => insertRow(r, "above")}>
              Inserir linha acima
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertRow(r, "below")}>
              Inserir linha abaixo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertColumn(c, "left")}>
              Inserir coluna à esquerda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertColumn(c, "right")}>
              Inserir coluna à direita
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => removeRow(r)} className="text-red-600">
              Remover linha
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => removeColumn(c)} className="text-red-600">
              Remover coluna
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => mergeColumns(r, c, c + 1)}>
              Merge colunas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => mergeRows(c, r, r + 1)}>
              Merge linhas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => mergeBlock(r, r + 1, c, c + 1)}>
              Merge bloco
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  );
};

// memo para evitar re-render quando 'cell' e callbacks não mudam
const MemoCell = memo(Cell);

export default EditableTable;
