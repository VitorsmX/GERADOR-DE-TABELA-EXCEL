"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  HyperFormula,
  CellValue as HFCellValue,
  CellError as HFCellError,
} from "hyperformula";
import Editor from "react-simple-code-editor";
import EditableTable from "@/components/table/editable-table";
import { Step4Props, TableCellWithDisplay, SelectedCell } from "./Step4.types";
import {
  containerClass,
  titleClass,
  exportBarClass,
  inputClass,
  exportButtonClass,
} from "./Step4.styles";
import { toRawMatrix, exportToExcel } from "./Step4.logic";

const SHEET_NAME = "main";

export default function Step4({ headers: propHeaders, data: propData }: Step4Props) {
  const [headers, setHeaders] = useState(propHeaders);
  const [data, setData] = useState<TableCellWithDisplay[][]>(() =>
    (propData || []).map((row) =>
      (row || []).map((cell) => ({ ...cell, displayValue: cell.value ?? "" }))
    )
  );

  const [fileName, setFileName] = useState("");
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [calculatedValue, setCalculatedValue] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hfRef = useRef<HyperFormula | null>(null);
  const sheetIdRef = useRef<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [Prism, setPrism] = useState<any>(null); // se quiser tipar, crie declaration

  // --- Inicializa HyperFormula apenas uma vez (mount)
  useEffect(() => {
    const hf = HyperFormula.buildEmpty({ licenseKey: "gpl-v3" });
    hfRef.current = hf;

    try {
      // adiciona uma sheet e recupera o id dela
      const sheetName = hf.addSheet(SHEET_NAME);
      // addSheet pode, em cenários especiais, retornar false; guardamos isso
      if (!(!!sheetName)) {
        // fallback: criar HF com buildFromArray (garante sheet 0)
        hf.destroy();
        const hf2 = HyperFormula.buildFromArray(toRawMatrix(data), { licenseKey: "gpl-v3" });
        hfRef.current = hf2;
        sheetIdRef.current = 0;
      } else {
        const id = hf.getSheetId(sheetName);
        sheetIdRef.current = id || null;
        // preenche conteúdo inicial
        if(id) hf.setSheetContent(id, toRawMatrix(data));
      }
    } catch (err) {
      // fallback robusto: tenta criar a partir do array (garante uma sheet)
      console.warn("HyperFormula: falha ao criar sheet via addSheet, tentando buildFromArray. Erro:", err);
      try {
        const hf2 = HyperFormula.buildFromArray(toRawMatrix(data), { licenseKey: "gpl-v3" });
        hfRef.current = hf2;
        sheetIdRef.current = 0;
      } catch (err2) {
        console.error("HyperFormula fallback também falhou:", err2);
        // Destrói se algo estiver parti
        hfRef.current?.destroy();
        hfRef.current = null;
        sheetIdRef.current = null;
      }
    }

    return () => {
      hfRef.current?.destroy();
      hfRef.current = null;
      sheetIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // rodar só no mount

  // --- Mantém o conteúdo da sheet sincronizado quando 'data' muda (fallback seguro) ---
  useEffect(() => {
    const hf = hfRef.current;
    const sid = sheetIdRef.current;
    if (!hf || sid == null) return;
    try {
      hf.setSheetContent(sid, toRawMatrix(data));
    } catch (err) {
      console.warn("HyperFormula: setSheetContent falhou", err);
    }
  }, [data]);

  // --- Carrega Prism (client-side) ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (typeof window === "undefined") return;
      try {
        const prism = await import("prismjs");
        await import("prismjs/components/prism-clike");
        await import("prismjs/components/prism-javascript");
        if (mounted) setPrism(prism);
      } catch (err) {
        console.warn("Não foi possível carregar Prism dinamicamente:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Atualiza apenas a célula editada no HyperFormula (mais eficiente) ---
  const handleValueChange = useCallback(
    (code: string) => {
      if (!selectedCell) return;
      const { row, col } = selectedCell;
      setData((prev) => {
        if (!prev?.[row]?.[col]) return prev;
        const next = prev.map((r, rIdx) =>
          rIdx === row ? r.map((cell, cIdx) => (cIdx === col ? { ...cell, value: code } : cell)) : r
        );
        return next;
      });

      // também atualiza apenas a célula no engine (evita reescrever toda a sheet)
      const hf = hfRef.current;
      const sid = sheetIdRef.current;
      if (hf && sid != null) {
        try {
          // setCellContents recebe endereço e matriz (neste caso 1x1)
          hf.setCellContents({ sheet: sid, row, col }, [[code]]);
        } catch (err) {
          // fallback: marcar para sincronizar toda a sheet via efeito de 'data'
          console.warn("HyperFormula: setCellContents falhou, fallback para setSheetContent na próxima render", err);
        }
      }
    },
    [selectedCell]
  );

  // --- Calcula o valor da célula selecionada usando HyperFormula ---
  const handleCalculate = useCallback(() => {
    if (!selectedCell) return;
    const hf = hfRef.current;
    const sid = sheetIdRef.current;
    if (!hf || sid == null) return;

    const addr = { sheet: sid, col: selectedCell.col, row: selectedCell.row };
    try {
      const value: HFCellValue = hf.getCellValue(addr);
      const display = value === null ? "" : value instanceof HFCellError ? "#ERRO" : String(value);
      setCalculatedValue(display);

      setData((prev) => {
        if (!prev?.[selectedCell.row]?.[selectedCell.col]) return prev;
        return prev.map((r, rIdx) =>
          rIdx === selectedCell.row
            ? r.map((cell, cIdx) =>
                cIdx === selectedCell.col ? { ...cell, displayValue: display } : cell
              )
            : r
        );
      });
    } catch (err) {
      console.error("Erro ao calcular fórmula (HyperFormula):", err);
      setCalculatedValue("#ERRO");
    }
  }, [selectedCell]);

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
            value={selectedCell ? String(data[selectedCell.row]?.[selectedCell.col]?.value ?? "") : ""}
            onValueChange={handleValueChange}
            highlight={(code) => Prism.highlight(code, Prism.languages.javascript, "javascript")}
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

      <div className={`fixed top-0 right-0 h-full w-120 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`}>
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
