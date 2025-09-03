"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  HyperFormula,
  CellValue as HFCellValue,
  CellError as HFCellError,
} from "hyperformula";
import EditableTable from "@/components/table/editable-table";
import { Step4Props } from "./Step4.types";
import {
  SelectedCell as SelectedCellBase,
  TableCell,
} from "@/components/table/editable-table/EditableTable.types";
import {
  containerClass,
  titleClass,
  exportBarClass,
  inputClass,
  exportButtonClass,
} from "./Step4.styles";

import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import ExcelJS from "exceljs";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import { HeaderGroup } from "../Step3/Step3.types";

type SelectedCell = SelectedCellBase | null;
type TableCellWithDisplay = TableCell & {
  displayValue?: string | number | boolean;
};

const SHEET_NAME = "Planilha";
const SHEET_ID = 0;

function toRawCell(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  return String(value);
}

function toRawMatrix(data: TableCell[][]) {
  return data.map((row) => row.map((cell) => toRawCell(cell.value)));
}

export default function Step4({
  headers: initialHeaders,
  data: initialData,
}: Step4Props) {
  const [headers, setHeaders] = useState(initialHeaders);
  const [data, setData] = useState<TableCell[][]>(initialData);
  const [fileName, setFileName] = useState("");
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const [calculatedValue, setCalculatedValue] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const hfRef = useRef<HyperFormula | null>(null);

  useEffect(() => {
    const hf = HyperFormula.buildFromArray(toRawMatrix(initialData), {
      licenseKey: "gpl-v3",
    });
    hfRef.current = hf;
    return () => {
      hf.destroy();
      hfRef.current = null;
    };
  }, [initialData]);

  const highlight = useCallback((code: string) => {
    if (code.startsWith("=")) {
      return `<span style="color:green;font-weight:bold">${code}</span>`;
    }
    return Prism.highlight(code, Prism.languages.javascript, "javascript");
  }, []);

  const handleValueChange = useCallback(
    (code: string) => {
      if (!selectedCell) return;
      setData((prev) =>
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

    // Atualiza o conteúdo do HF com os dados atuais
    hf.setSheetContent(SHEET_ID, toRawMatrix(data));

    const addr = {
      sheet: SHEET_ID,
      col: selectedCell.col,
      row: selectedCell.row,
    };
    const value: HFCellValue = hf.getCellValue(addr);

    if (value === null) {
      setCalculatedValue("");
    } else if (value instanceof HFCellError) {
      setCalculatedValue("#ERRO");
    } else {
      setCalculatedValue(String(value));
    }

    // Atualiza displayValue da célula selecionada
    setData((prev) =>
      prev.map((row, rIdx) =>
        rIdx === selectedCell.row
          ? row.map((cell, cIdx) =>
              cIdx === selectedCell.col
                ? { ...cell, displayValue: String(value ?? "") }
                : cell
            )
          : row
      )
    );
  }, [selectedCell, data]);

  function shiftFormulaRows(formula: string, rowOffset: number) {
    return formula.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
      return `${col}${parseInt(row, 10) + rowOffset}`;
    });
  }

  function parseIfNumber(val: unknown): string | number | boolean | null {
    if (val === null || val === undefined) return null;
    if (typeof val === "number" || typeof val === "boolean") return val;
    if (typeof val === "string") {
      const num = Number(val);
      if (!isNaN(num) && val.trim() !== "") {
        return num; // salva como número
      }
      return val; // mantém como string se não for número
    }
    return String(val);
  }

  const handleExport = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(SHEET_NAME);
  
    // Converte HeaderGroup[] -> TableCell[][] (uma linha com colSpan e placeholders merged)
    function headerGroupsToCells(headers: HeaderGroup[], totalCols: number): TableCell[][] {
      const row: TableCell[] = [];
      let col = 0;
      headers.forEach((g) => {
        const span = g.ids.length || 1;
        // célula mestre
        row[col] = { value: g.text ?? "", colSpan: span, rowSpan: 1 };
        // placeholders "filhas" do merge de header
        for (let i = 1; i < span; i++) {
          row[col + i] = { value: "", merged: true };
        }
        col += span;
      });
      // garante comprimento total
      while (row.length < totalCols) {
        row.push({ value: "" });
      }
      return [row];
    }
  
    const totalCols = data[0]?.length ?? 0;
    const headerCells = headerGroupsToCells(headers, totalCols);
    const headerRowsCount = headerCells.length; // normalmente 1
  
    // Monta todas as linhas: cabeçalho + corpo
    const allRows: TableCell[][] = [...headerCells, ...data];
  
    // 1️⃣ Primeiro loop: escreve valores e estilos
    allRows.forEach((row, r) => {
      const excelRowNumber = r + 1;
      const excelRow = sheet.getRow(excelRowNumber);
  
      row.forEach((cell, c) => {
        const excelCell = excelRow.getCell(c + 1);
  
        if (!cell?.merged) {
          if (typeof cell?.value === "string" && cell.value.startsWith("=")) {
            const shifted = shiftFormulaRows(cell.value.slice(1), headerRowsCount);
            excelCell.value = { formula: shifted };
          } else {
            excelCell.value = parseIfNumber(cell?.value);
          }
        } else {
          excelCell.value = null; // filhas de merge ficam vazias
        }
  
        // Estilo do cabeçalho
        if (r < headerRowsCount) {
          excelCell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri" };
          excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
        }
        // Linhas alternadas no corpo
        else if ((r - headerRowsCount) % 2 === 1) {
          excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEDED" } };
        }
  
        excelCell.alignment = { horizontal: "center", vertical: "middle" };
        excelCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });
  
    // 2️⃣ Segundo loop: aplica merges
    allRows.forEach((row, r) => {
      const excelRowNumber = r + 1;
      row.forEach((cell, c) => {
        const rowSpan = cell?.rowSpan ?? 1;
        const colSpan = cell?.colSpan ?? 1;
        const isMaster = !cell?.merged && (rowSpan > 1 || colSpan > 1);
  
        if (isMaster) {
          sheet.mergeCells(
            excelRowNumber,
            c + 1,
            excelRowNumber + rowSpan - 1,
            c + colSpan
          );
        }
      });
    });
  
    // Largura das colunas
    sheet.columns.forEach((col) => {
      col.width = 20;
    });
  
    // Gera e baixa o arquivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName.trim() || "tabela"}-${new Date().toISOString().split("T")[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }, [headers, data, fileName]);
  

  return (
    <div className={containerClass}>
      <h2 className={titleClass}>Etapa 4 - Inserir Fórmulas</h2>

      <EditableTable
        headers={headers}
        data={data as TableCellWithDisplay[][]}
        setHeaders={setHeaders}
        setData={setData}
        selectedCell={selectedCell}
        setSelectedCell={setSelectedCell}
      />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">
          Editor de Fórmulas (célula selecionada)
        </h3>
        <Editor
          value={
            selectedCell
              ? String(data[selectedCell.row][selectedCell.col].value ?? "")
              : ""
          }
          onValueChange={handleValueChange}
          highlight={highlight}
          padding={10}
          style={{
            fontFamily: '"Fira code", "Fira Mono", monospace',
            fontSize: 14,
            border: "1px solid #ccc",
            borderRadius: "8px",
            minHeight: "50px",
          }}
        />
      </div>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-1/2 right-0 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-2 rounded-l-lg shadow-lg hover:bg-blue-700 z-50"
      >
        Menu
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/5 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-120 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Opções</h3>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-6">
          <div className="rounded-2xl shadow-lg p-5">
            <button
              onClick={handleCalculate}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Calcular fórmula
            </button>
            <div className="text-lg text-center mt-2">
              Valor calculado: {calculatedValue}
            </div>
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
