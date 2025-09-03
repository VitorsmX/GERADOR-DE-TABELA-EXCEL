"use client";

import { useState, useCallback } from "react";
import EditableTable from "@/components/Table/editable-table";
import { Step3Props, HeaderGroup } from "./Step3.types";
import { handleExportLogic } from "./Step3.logic";
import {
  containerClass,
  titleClass,
  exportBarClass,
  inputClass,
  exportButtonClass,
} from "./Step3.styles";

export default function Step3({
  headers: initialHeaders,
  data,
  setData,
  onNext,
}: Step3Props) {
  // Inicializa estado apenas uma vez
  const [headers, setHeaders] = useState<HeaderGroup[]>(() => initialHeaders);
  const [fileName, setFileName] = useState("");

  const handleExport = useCallback(async () => {
    await handleExportLogic({ headers, data, fileName });
  }, [headers, data, fileName]);

  const handleFileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFileName(e.target.value);
    },
    []
  );

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>Monte sua Tabela</h2>

      <EditableTable
        headers={headers}
        data={data}
        setHeaders={setHeaders}
        setData={setData}
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={onNext}
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
        <button onClick={handleExport} className={exportButtonClass}>
          Gerar Tabela Excel
        </button>
      </div>
    </div>
  );
}
