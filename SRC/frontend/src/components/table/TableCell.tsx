"use client";

import { memo } from "react";
import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { CellProps } from "@/components/Table/EditableTable/EditableTable.types";
import { cellClass } from "@/components/Table/EditableTable/EditableTable.styles";

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
}: CellProps & {
  selectedCell?: { row: number; col: number } | null;
  setSelectedCell?: (pos: { row: number; col: number }) => void;
}) {
  const isSelected = selectedCell?.row === r && selectedCell?.col === c;

  return (
    <td
      className={`${cellClass} ${isSelected ? "bg-yellow-100" : ""}`}
      rowSpan={cell.rowSpan}
      colSpan={cell.colSpan}
      onClick={() => setSelectedCell && setSelectedCell({ row: r, col: c })}
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
}

export default memo(TableCellComponent);
