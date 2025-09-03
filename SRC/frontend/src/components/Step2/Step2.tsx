"use client";
import { useState } from "react";
import { HeaderGroup } from "@/components/Step2/Step2.types";

interface Step2Props {
  rows: number;
  cols: number;
  onNext: (headers: HeaderGroup[]) => void;
}

export default function Step2({ rows, cols, onNext }: Step2Props) {
  const [headers, setHeaders] = useState<HeaderGroup[]>(
    Array.from({ length: cols }, (_, i) => ({
      ids: [i],
      text: "",
    }))
  );

  const handleChange = (index: number, value: string) => {
    setHeaders(prev =>
      prev.map((header, i) =>
        i === index ? { ...header, text: value } : header
      )
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Defina os Cabeçalhos</h2>
      <div className="grid grid-cols-2 gap-2">
        {headers.map((header, i) => (
          <input
            key={i}
            value={header.text}
            onChange={e => handleChange(i, e.target.value)}
            placeholder={`Cabeçalho ${i + 1}`}
            className="border p-2 rounded w-full"
          />
        ))}
      </div>
      <button
        onClick={() =>
          onNext(headers.map(h => ({ ...h, ids: [...h.ids] })))
        }
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Próximo
      </button>
    </div>
  );
}
