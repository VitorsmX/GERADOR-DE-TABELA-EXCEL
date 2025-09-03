"use client";

import { useEffect, useState, useCallback } from "react";
import type { Step1Props, NumberOrEmpty } from "@/components/Step1/Step1.types";
import { clampValue } from "@/components/Step1/Step1.logic";
import { containerClass, inputClass, buttonClass } from "@/components/Step1/Step1.styles";

export default function Step1({ onNext }: Step1Props) {
  const [rows, setRows] = useState<NumberOrEmpty>(5);
  const [cols, setCols] = useState<NumberOrEmpty>(3);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNext = useCallback(() => {
    const validRows = clampValue(rows, "linhas", setError);
    const validCols = clampValue(cols, "colunas", setError);

    setRows(validRows);
    setCols(validCols);

    if (!error) {
      onNext(validRows, validCols);
    }
  }, [rows, cols, error, onNext]);

  return (
    <div className={containerClass}>
      <h2 className="text-xl font-semibold mb-4">Defina sua Tabela</h2>

      <label className="block mb-2">
        Linhas:
        <input
          type="number"
          value={rows}
          onChange={(e) => setRows(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={() => setRows(clampValue(rows, "linhas", setError))}
          className={inputClass}
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
          onBlur={() => setCols(clampValue(cols, "colunas", setError))}
          className={inputClass}
          min={1}
          max={200}
        />
      </label>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        disabled={!!error}
        onClick={handleNext}
        className={buttonClass}
      >
        Próxima Etapa
      </button>
    </div>
  );
}
