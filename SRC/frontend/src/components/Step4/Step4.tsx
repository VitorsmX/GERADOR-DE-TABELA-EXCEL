/* eslint-disable @typescript-eslint/no-require-imports */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { HyperFormula, CellValue as HFCellValue, CellError as HFCellError } from "hyperformula";
import EditableTable from "@/components/table/editable-table";
import { Step4Props, TableCellWithDisplay, SelectedCell } from "./Step4.types";
import { containerClass, titleClass, exportBarClass, inputClass, exportButtonClass } from "./Step4.styles";
import Editor from "react-simple-code-editor";
import { toRawMatrix, exportToExcel } from "./Step4.logic";

const SHEET_ID = 0;

export default function Step4({ headers: propHeaders, data: propData }: Step4Props) {
  const [headers, setHeaders] = useState(propHeaders);
  const [data, setData] = useState<TableCellWithDisplay[][]>(() => 
    propData.map(row => row.map(cell => ({ 
      ...cell, 
      displayValue: cell.value 
    })))
  );
  const [fileName, setFileName] = useState("");
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [calculatedValue, setCalculatedValue] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hfRef = useRef<HyperFormula | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Prism, setPrism] = useState<any>(null); // carregamento client-only

  // inicializa HyperFormula
  useEffect(() => {
    const hf = HyperFormula.buildFromArray(toRawMatrix(data), { licenseKey: "gpl-v3" });
    hfRef.current = hf;
    return () => hf.destroy();
  }, [data]);

  // carrega Prism apenas no client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const prism = require("prismjs");
      require("prismjs/components/prism-clike");
      require("prismjs/components/prism-javascript");
      setPrism(prism);
    }
  }, []);

  const handleValueChange = useCallback(
    (code: string) => {
      if (!selectedCell) return;
      setData(prev =>
        prev.map((row, rIdx) =>
          rIdx === selectedCell.row
            ? row.map((cell, cIdx) =>
                cIdx === selectedCell.col ? { ...cell, value: code } : cell
              )
            : row
        )
      );
    },
    [selectedCell]
  );

  const handleCalculate = useCallback(() => {
    if (!selectedCell || !hfRef.current) return;
    const hf = hfRef.current;
    hf.setSheetContent(SHEET_ID, toRawMatrix(data));
    const addr = { sheet: SHEET_ID, col: selectedCell.col, row: selectedCell.row };
    const value: HFCellValue = hf.getCellValue(addr);

    const display = value === null ? "" : value instanceof HFCellError ? "#ERRO" : String(value);
    setCalculatedValue(display);

    setData(prev =>
      prev.map((row, rIdx) =>
        rIdx === selectedCell.row
          ? row.map((cell, cIdx) =>
              cIdx === selectedCell.col ? { ...cell, displayValue: display } : cell
            )
          : row
      )
    );
  }, [selectedCell, data]);

  const handleExport = useCallback(() => exportToExcel(headers, data, fileName), [headers, data, fileName]);

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>Etapa 4 - Inserir Fórmulas</h2>

      <EditableTable
        headers={headers}
        data={data}
        setHeaders={setHeaders}
        setData={setData}
        selectedCell={selectedCell}
        setSelectedCell={setSelectedCell}
      />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Editor de Fórmulas (célula selecionada)</h3>
        {Prism && (
          <Editor
            value={selectedCell ? String(data[selectedCell.row][selectedCell.col].value ?? "") : ""}
            onValueChange={handleValueChange}
            highlight={code =>
              Prism.highlight(code, Prism.languages.javascript, "javascript")
            }
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              border: "1px solid #ccc",
              borderRadius: "8px",
              minHeight: "50px",
            }}
          />
        )}
      </div>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700 z-50"
      >
        Menu
      </button>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/5 z-40" onClick={() => setIsSidebarOpen(false)} />}

      <div
        className={`fixed top-0 right-0 h-full w-120 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Opções</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-4 space-y-6">
          <div className="rounded-2xl shadow-lg p-5">
            <button
              onClick={handleCalculate}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Calcular fórmula
            </button>
            <div className="text-lg text-center mt-2">Valor calculado: {calculatedValue}</div>
          </div>

          <div className={exportBarClass}>
            <input
              type="text"
              placeholder="Nome do arquivo"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className={inputClass}
            />
            <button onClick={handleExport} className={exportButtonClass}>
              Exportar Excel com Fórmulas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
