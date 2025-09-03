"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  HyperFormula,
  CellValue as HFCellValue,
  CellError as HFCellError,
} from "hyperformula";
import EditableTable from "@/components/Table/EditableTable";
import { Step4Props } from "./Step4.types";
import {
  SelectedCell as SelectedCellBase,
  TableCell,
} from "@/components/Table/EditableTable/EditableTable.types";
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

    // Converte cabeçalhos para string
    const headerRow = headers.map((h) => {
      if (typeof h === "string") return h;
      if (h && typeof h === "object") {
        return h.text ?? String(h);
      }
      return String(h ?? "");
    });

    // Monta todas as linhas (cabeçalho + dados)
    const allRows: (
      | string
      | number
      | boolean
      | null
      | { formula: string }
    )[][] = [
      headerRow,
      ...data.map((row) =>
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        row.map((cell, idx) => {
          const v = cell.value;
          if (typeof v === "string" && v.startsWith("=")) {
            const shifted = shiftFormulaRows(v.slice(1), 1);
            return { formula: shifted };
          }
          return parseIfNumber(v);
        })
      ),
    ];

    // Aplica valores e estilos
    allRows.forEach((row, r) => {
      const excelRow = sheet.getRow(r + 1);
      row.forEach((cellValue, c) => {
        const excelCell = excelRow.getCell(c + 1);
        excelCell.value = cellValue;

        // Estilo do cabeçalho
        if (r === 0) {
          excelCell.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            name: "Calibri",
          };
          excelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF4F81BD" },
          };
        }
        // Linhas alternadas (apenas dados)
        else if (r % 2 === 1) {
          excelCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFEDEDED" },
          };
        }

        excelCell.alignment = { horizontal: "center", vertical: "middle" };
        excelCell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        // Se tiver rowSpan/colSpan no TableCell original
        if (r > 0) {
          const tableCell = data[r - 1]?.[c];
          if ((tableCell?.rowSpan ?? 1) > 1 || (tableCell?.colSpan ?? 1) > 1) {
            sheet.mergeCells(
              r + 1,
              c + 1,
              r + (tableCell.rowSpan ?? 1),
              c + (tableCell.colSpan ?? 1)
            );
          }
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
    a.download = `${fileName.trim() || "tabela"}-${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
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

      <div className="flex flex-col justify-evenly items-center mt-4 overflow-scroll">
        <div className="rounded-2xl shadow-lg p-5">
          <button
            onClick={handleCalculate}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Calcular fórmula
          </button>
          <div className="text-xl text-center">
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
  );
}
