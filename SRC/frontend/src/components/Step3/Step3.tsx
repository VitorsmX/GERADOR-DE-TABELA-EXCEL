"use client";
import { useState } from "react";
import { HeaderGroup } from "@/components/Step2/Step2.types";
import { TableCell } from "../table/editable-table/EditableTable.types";

interface Step3Props {
  headers: HeaderGroup[];
  data: TableCell[][];
  onNext: (headers: HeaderGroup[], data: TableCell[][]) => void;
}

export default function Step3({ headers, data, onNext }: Step3Props) {
  const [localHeaders, setLocalHeaders] = useState<HeaderGroup[]>(
    headers.map(h => ({ ...h, ids: [...h.ids] }))
  );
  const [localData, setLocalData] = useState<TableCell[][]>(
    data.map(row => row.map(cell => ({ ...cell })))
  );

  const handleChange = (row: number, col: number, value: string) => {
    setLocalData(prev =>
      prev.map((r, ri) =>
        ri === row
          ? r.map((c, ci) => (ci === col ? { ...c, value } : c))
          : r
      )
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Preencha a Tabela</h2>
      <table className="border border-gray-300 w-full">
        <thead>
          <tr>
            {localHeaders.map((header, i) => (
              <th key={i} className="border px-2 py-1">
                {header.text || `Col ${i + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localData.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border px-2 py-1">
                  <input
                    value={cell.value}
                    onChange={e => handleChange(ri, ci, e.target.value)}
                    className="w-full p-1"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() =>
          onNext(
            localHeaders.map(h => ({ ...h, ids: [...h.ids] })),
            localData.map(row => row.map(cell => ({ ...cell })))
          )
        }
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Próximo
      </button>
    </div>
  );
}
