"use client";

import { useCallback } from "react";
import {
  EditableTableProps,
} from "./EditableTable.types";
import {
  containerClass,
  tableWrapperClass,
  tableClass,
  headerCellClass,
} from "./EditableTable.styles";
import {
  updateCellLogic,
  insertRowLogic,
  removeRowLogic,
  insertColumnLogic,
  removeColumnLogic,
  mergeColumnsLogic,
  mergeRowsLogic,
  mergeBlockLogic,
} from "./EditableTable.logic";
import EditableCell from "@/components/table/TableCell";

export default function EditableTable({
  headers,
  data,
  setHeaders,
  setData,
  selectedCell,
  setSelectedCell,
}: EditableTableProps) {
  const updateCell = useCallback(
    (r: number, c: number, value: string) => {
      setData((prev) => updateCellLogic(prev, r, c, value));
    },
    [setData]
  );

  const insertRow = useCallback(
    (rowIndex: number, pos: "above" | "below") => {
      setData((prev) => insertRowLogic(prev, rowIndex, pos));
    },
    [setData]
  );

  const removeRow = useCallback(
    (rowIndex: number) => {
      setData((prev) => removeRowLogic(prev, rowIndex));
    },
    [setData]
  );

  const insertColumn = useCallback(
    (colIndex: number, pos: "left" | "right") => {
      const { data: newData, headers: newHeaders } = insertColumnLogic(
        data,
        headers,
        colIndex,
        pos
      );
      setData(newData);
      setHeaders(newHeaders);
    },
    [data, headers, setData, setHeaders]
  );

  const removeColumn = useCallback(
    (colIndex: number) => {
      const { data: newData, headers: newHeaders } = removeColumnLogic(
        data,
        headers,
        colIndex
      );
      setData(newData);
      setHeaders(newHeaders);
    },
    [data, headers, setData, setHeaders]
  );

  const mergeColumns = useCallback(
    (row: number, startCol: number, endCol: number) => {
      setData((prev) => mergeColumnsLogic(prev, row, startCol, endCol));
    },
    [setData]
  );

  const mergeRows = useCallback(
    (col: number, startRow: number, endRow: number) => {
      setData((prev) => mergeRowsLogic(prev, col, startRow, endRow));
    },
    [setData]
  );

  const mergeBlock = useCallback(
    (startRow: number, endRow: number, startCol: number, endCol: number) => {
      setData((prev) => mergeBlockLogic(prev, startRow, endRow, startCol, endCol));
    },
    [setData]
  );

  return (
    <div className={containerClass}>
      <div className={tableWrapperClass}>
        <table className={tableClass}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th
                  key={h.ids.join("-")}
                  colSpan={h.ids.length}
                  className={headerCellClass}
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
                    <EditableCell
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
                      selectedCell={selectedCell}
                      setSelectedCell={setSelectedCell}
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
}
