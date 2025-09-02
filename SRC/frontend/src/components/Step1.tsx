"use client"
import { useEffect, useState, useCallback } from "react";

export default function Step1({ onNext }: { onNext: (rows: number, cols: number) => void }) {
  const [rows, setRows] = useState<number | "">("5");
  const [cols, setCols] = useState<number | "">("3");
  const [error, setError] = useState<string | null>(null);

  // Limpa timeout para evitar memory leaks
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const clampValue = useCallback((value: number | "", type: "linhas" | "colunas"): number => {
    if (value === "" || isNaN(Number(value))) {
      setError(`O número de ${type} não pode ser vazio.`);
      return 1;
    }
    const num = Number(value);
    if (num < 1) {
      setError(`O número de ${type} não pode ser menor que 1.`);
      return 1;
    }
    if (num > 200) {
      setError(`O número de ${type} não pode ser maior que 200.`);
      return 200;
    }
    setError(null);
    return num;
  }, []);

  const handleNext = useCallback(() => {
    const validRows = clampValue(rows, "linhas");
    const validCols = clampValue(cols, "colunas");

    setRows(validRows);
    setCols(validCols);

    // só avança se realmente não houver erro
    if (!error) {
      onNext(validRows, validCols);
    }
  }, [rows, cols, clampValue, error, onNext]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Defina sua Tabela</h2>

      <label className="block mb-2">
        Linhas:
        <input
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value === "" ? "" : Number(e.target.value))}
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
          onChange={(e) => setCols(e.target.value === "" ? "" : Number(e.target.value))}
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
        disabled={!!error}
        onClick={handleNext}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-zinc-500 disabled:hover:bg-zinc-500"
      >
        Próxima Etapa
      </button>
    </div>
  );
}
