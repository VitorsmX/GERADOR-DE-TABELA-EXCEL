"use client"
import { useState } from "react";

export default function Step1({ onNext }: { onNext: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState("5") // string
  const [cols, setCols] = useState("3") // string
  const [error, setError] = useState<string | null>(null)

  const clampValue = (value: string, type: "linhas" | "colunas"): string => {
    if (value === "" || isNaN(Number(value))) {
      setError(`O número de ${type} não pode ser vazio.`)
      return "1"
    }
    const num = Number(value)
    if (num < 1) {
      setError(`O número de ${type} não pode ser menor que 1.`)
      return "1"
    }
    if (num > 200) {
      setError(`O número de ${type} não pode ser maior que 200.`)
      return "200"
    }
    setError(null)
    return String(num)
  }

  const handleNext = () => {
    const validRows = clampValue(rows, "linhas")
    const validCols = clampValue(cols, "colunas")
    setRows(validRows)
    setCols(validCols)

    // só avança se não houver erro
    if (!error) {
      onNext(Number(validRows), Number(validCols))
    }
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
          onBlur={() => setRows(clampValue(rows, "linhas"))}
          className="w-full border p-2 rounded"
          min={1}
          max={200}
        />
      </label>

      <label className="block mb-4">
        Colunas:
        <input
          type="number"
          value={cols}
          onChange={(e) => setCols(e.target.value)}
          onBlur={() => setCols(clampValue(cols, "colunas"))}
          className="w-full border p-2 rounded"
          min={1}
          max={200}
        />
      </label>

      {error && (
        <p className="text-red-600 text-sm mb-4">{error}</p>
      )}

      <button
        onClick={handleNext}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
      >
        Próxima Etapa
      </button>
    </div>
  )
}
