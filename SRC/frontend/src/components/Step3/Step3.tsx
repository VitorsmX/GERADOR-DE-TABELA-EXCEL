"use client";

import { useState, useCallback } from "react";
import EditableTable from "@/components/table/editable-table";
import { Step3Props, HeaderGroup } from "./Step3.types";
import { handleExportLogic } from "./Step3.logic";
import {
  containerClass,
  titleClass,
  exportBarClass,
  inputClass,
  exportButtonClass,
} from "./Step3.styles";

type Step3WithSetters = Step3Props & {
  setHeaders: React.Dispatch<React.SetStateAction<HeaderGroup[]>>;
};

export default function Step3({
  headers,
  setHeaders,
  data,
  setData,
  onNext,
}: Step3WithSetters) {
  const [fileName, setFileName] = useState<string>("");

  const handleExport = useCallback(async () => {
    if (!fileName.trim()) return; // evita export sem nome
    try {
      await handleExportLogic({ headers, data, fileName });
    } catch (err) {
      console.error("Erro ao exportar tabela:", err);
    }
  }, [headers, data, fileName]);

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileName(e.target.value ?? "");
    },
    []
  );

  const handleNext = useCallback(() => {
    if (typeof onNext === "function") {
      onNext();
    }
  }, [onNext]);

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>Monte sua Tabela</h2>

      <EditableTable
        headers={headers ?? []}
        data={data ?? []}
        setHeaders={setHeaders}
        setData={setData}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Ir para Etapa 4
        </button>
      </div>

      <div className={exportBarClass}>
        <input
          type="text"
          placeholder="Nome do arquivo"
          value={fileName}
          onChange={handleFileNameChange}
          className={inputClass}
        />
        <button
          onClick={handleExport}
          className={exportButtonClass}
          disabled={!fileName.trim()}
        >
          Gerar Tabela Excel
        </button>
      </div>
    </div>
  );
}
