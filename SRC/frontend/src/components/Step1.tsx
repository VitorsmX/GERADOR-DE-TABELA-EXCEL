"use client"
import { useState } from "react";

export default function Step1({ onNext }: { onNext: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState(5)
  const [cols, setCols] = useState(3)

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Defina sua Tabela</h2>

      <label className="block mb-2">
        Linhas:
        <input
          type="number"
          value={rows}
          onChange={(e) => setRows(Number(e.target.value))}
          className="w-full border p-2 rounded"
          min={1}
          max={50}
        />
      </label>

      <label className="block mb-4">
        Colunas:
        <input
          type="number"
          value={cols}
          onChange={(e) => setCols(Number(e.target.value))}
          className="w-full border p-2 rounded"
          min={1}
          max={50}
        />
      </label>

      <button
        onClick={() => onNext(rows, cols)}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Próxima Etapa
      </button>
    </div>
  )
}
