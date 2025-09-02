"use client"
import { useState } from "react";

export default function Step1({ onNext }: { onNext: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState("5")
  const [cols, setCols] = useState("3")

  const clampValue = (value: string): string => {
    if (value === "") return "1"
    const num = Number(value)
    if (isNaN(num) || num < 1) return "1"
    if (num > 60) return "60"
    return String(num)
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Defina sua Tabela</h2>

      <label className="block mb-2">
        Linhas:
        <input
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value)}
          onBlur={() => setRows(clampValue(rows))}
          className="w-full border p-2 rounded"
          min={1}
          max={60}
        />
      </label>

      <label className="block mb-4">
        Colunas:
        <input
          type="number"
          value={cols}
          onChange={(e) => setCols(e.target.value)}
          onBlur={() => setCols(clampValue(cols))}
          className="w-full border p-2 rounded"
          min={1}
          max={60}
        />
      </label>

      <button
        onClick={() => onNext(Number(rows), Number(cols))}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Próxima Etapa
      </button>
    </div>
  )
}
