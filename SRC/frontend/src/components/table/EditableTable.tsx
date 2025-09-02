"use client";
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

export default function EditableTable({
  headers,
  data,
  setHeaders,
  setData,
}: {
  headers: HeaderGroup[];
  data: TableCell[][];
  setHeaders: (h: HeaderGroup[]) => void;
  setData: (d: TableCell[][]) => void;
}) {
  const updateCell = (r: number, c: number, value: string) => {
    const copy = data.map((row) => [...row]);
    copy[r][c].value = value;
    setData(copy);
  };

  const insertRow = (rowIndex: number, pos: "above" | "below") => {
    const newRow: TableCell[] = data[0].map(() => ({ value: "" }))
    const copy = data.map((row) => [...row])
    if (pos === "above") copy.splice(rowIndex, 0, newRow)
    else copy.splice(rowIndex + 1, 0, newRow)
    setData(copy)
  }

  const removeRow = (rowIndex: number) => {
    if (data.length <= 1) return
    const copy = data.map((row) => [...row])
    copy.splice(rowIndex, 1)
    setData(copy)
  }

  const insertColumn = (colIndex: number, pos: "left" | "right") => {
    const copy = data.map((row) => {
      const newRow = [...row]
      const newCell: TableCell = { value: "" }
      if (pos === "left") newRow.splice(colIndex, 0, newCell)
      else newRow.splice(colIndex + 1, 0, newCell)
      return newRow
    })
    setData(copy)

    const newHeader: HeaderGroup = { ids: [Date.now()], text: "" }
    const copyHeaders = [...headers]
    if (pos === "left") copyHeaders.splice(colIndex, 0, newHeader)
    else copyHeaders.splice(colIndex + 1, 0, newHeader)
    setHeaders(copyHeaders)
  }

  const removeColumn = (colIndex: number) => {
    if (data[0].length <= 1) return
    const copy = data.map((row) => {
      const newRow = [...row]
      newRow.splice(colIndex, 1)
      return newRow
    })
    setData(copy)
    const copyHeaders = [...headers]
    copyHeaders.splice(colIndex, 1)
    setHeaders(copyHeaders)
  }

  // Funções de merge
  const mergeColumns = (row: number, startCol: number, endCol: number) => {
    const copy = data.map((r) => [...r])
    const mainCell = copy[row][startCol]
    mainCell.colSpan = endCol - startCol + 1
    for (let c = startCol + 1; c <= endCol; c++) {
      copy[row][c] = { ...copy[row][c], merged: true }
    }
    setData(copy)
  }

  const mergeRows = (col: number, startRow: number, endRow: number) => {
    const copy = data.map((r) => [...r])
    const mainCell = copy[startRow][col]
    mainCell.rowSpan = endRow - startRow + 1
    for (let r = startRow + 1; r <= endRow; r++) {
      copy[r][col] = { ...copy[r][col], merged: true }
    }
    setData(copy)
  }

  const mergeBlock = (
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number
  ) => {
    const copy = data.map((r) => [...r])
    const mainCell = copy[startRow][startCol]
    mainCell.rowSpan = endRow - startRow + 1
    mainCell.colSpan = endCol - startCol + 1
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r !== startRow || c !== startCol) copy[r][c] = { ...copy[r][c], merged: true }
      }
    }
    setData(copy)
  }

  return (
    <div className="w-[95vw] h-[53vh] p-2 bg-white overflow-auto">
      <div className="min-w-[1000px] min-h-[500px]">
        <table className="border-collapse border w-full text-center">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  colSpan={h.ids.length}
                  className="border p-2 bg-gray-100"
                >
                  <input
                    type="text"
                    value={h.text}
                    onChange={(e) => {
                      const copy = [...headers];
                      copy[i].text = e.target.value;
                      setHeaders(copy);
                    }}
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
                {row.map((cell, c) => {
                  if (cell.merged) return null;
                  return (
                    <td
                      key={c}
                      className="border p-2 relative"
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            className="bg-zinc-100/95"
                          >
                            <DropdownMenuItem
                              onClick={() => insertRow(r, "above")}
                            >
                              Inserir linha acima
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => insertRow(r, "below")}
                            >
                              Inserir linha abaixo
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => insertColumn(c, "left")}
                            >
                              Inserir coluna à esquerda
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => insertColumn(c, "right")}
                            >
                              Inserir coluna à direita
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeRow(r)}
                              className="text-red-600"
                            >
                              Remover linha
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => removeColumn(c)}
                              className="text-red-600"
                            >
                              Remover coluna
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => mergeColumns(r, c, c + 1)}
                            >
                              Merge colunas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => mergeRows(c, r, r + 1)}
                            >
                              Merge linhas
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => mergeBlock(r, r + 1, c, c + 1)}
                            >
                              Merge bloco
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
