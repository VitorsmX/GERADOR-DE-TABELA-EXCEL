"use client";

import React, { memo, useCallback } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CellProps } from "@/components/table/editable-table/EditableTable.types";
import { cellClass } from "@/components/table/editable-table/EditableTable.styles";

type Props = CellProps & {
  selectedCell?: { row: number; col: number } | null;
  setSelectedCell?: (pos: { row: number; col: number }) => void;
  rowsCount?: number;
  colsCount?: number;
};

function TableCellComponent({
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
  selectedCell,
  setSelectedCell,
  rowsCount = 0,
  colsCount = 0,
}: Props) {
  const isSelected = selectedCell?.row === r && selectedCell?.col === c;

  const onCellClick = useCallback(() => {
    setSelectedCell && setSelectedCell({ row: r, col: c });
  }, [r, c, setSelectedCell]);

  const safeUpdate = useCallback(
    (val: string) => {
      updateCell && updateCell(r, c, val);
    },
    [r, c, updateCell]
  );

  const canMergeRight = c + 1 < colsCount;
  const canMergeDown = r + 1 < rowsCount;

  return (
    <td
      className={`${cellClass} ${isSelected ? "bg-yellow-100" : ""}`}
      rowSpan={cell.rowSpan}
      colSpan={cell.colSpan}
      onClick={onCellClick}
    >
      <div className="flex items-center justify-center gap-2">
        <input
          value={cell?.value ?? ""}
          onChange={(e) => safeUpdate(e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full p-2 border rounded"
          aria-label={`Célula ${r + 1}-${c + 1}`}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-zinc-100/95">
            <DropdownMenuItem onClick={() => insertRow && insertRow(r, "above")}>
              Inserir linha acima
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertRow && insertRow(r, "below")}>
              Inserir linha abaixo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertColumn && insertColumn(c, "left")}>
              Inserir coluna à esquerda
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => insertColumn && insertColumn(c, "right")}>
              Inserir coluna à direita
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => removeRow && removeRow(r)}
              className="text-red-600"
            >
              Remover linha
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => removeColumn && removeColumn(c)}
              className="text-red-600"
            >
              Remover coluna
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => canMergeRight && mergeColumns && mergeColumns(r, c, c + 1)}
              disabled={!canMergeRight}
            >
              Merge colunas (direita)
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => canMergeDown && mergeRows && mergeRows(c, r, r + 1)}
              disabled={!canMergeDown}
            >
              Merge linhas (abaixo)
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() =>
                canMergeRight && canMergeDown && mergeBlock && mergeBlock(r, r + 1, c, c + 1)
              }
              disabled={!(canMergeRight && canMergeDown)}
            >
              Merge bloco 2x2
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </td>
  );
}

function areEqual(prev: Props, next: Props) {
  // comparador leve: evita re-render se somente referências externas mudaram
  const p = prev;
  const n = next;
  const sameValue = (p.cell?.value ?? "") === (n.cell?.value ?? "");
  const sameMerged =
    (p.cell?.merged ?? false) === (n.cell?.merged ?? false) &&
    (p.cell?.rowSpan ?? 0) === (n.cell?.rowSpan ?? 0) &&
    (p.cell?.colSpan ?? 0) === (n.cell?.colSpan ?? 0);
  const sameSelection =
    (p.selectedCell?.row ?? -1) === (n.selectedCell?.row ?? -1) &&
    (p.selectedCell?.col ?? -1) === (n.selectedCell?.col ?? -1);
  return sameValue && sameMerged && sameSelection;
}

export default memo(TableCellComponent, areEqual);
