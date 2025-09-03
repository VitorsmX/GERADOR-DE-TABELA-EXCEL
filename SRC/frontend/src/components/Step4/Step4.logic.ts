import ExcelJS from "exceljs";
import { HeaderGroup } from "../Step3/Step3.types";
import { TableCell } from "@/components/table/editable-table/EditableTable.types";

export function toRawCell(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  return String(value);
}

// Step4.logic.ts
export function highlightFormula(code: string): string {
  // Aqui podemos usar PrismJS ou apenas adicionar classes simples para JS/ fórmulas
  // Exemplo básico, destaca números e operadores
  return code
    .replace(/([0-9]+)/g, '<span class="text-blue-500">$1</span>')
    .replace(/([+\-*/=()])/g, '<span class="text-red-500">$1</span>');
}


export function toRawMatrix(data: TableCell[][]) {
  return data.map((row) => row.map((cell) => toRawCell(cell.value)));
}

export function shiftFormulaRows(formula: string, rowOffset: number) {
  return formula.replace(/([A-Z]+)(\d+)/g, (_, col, row) => {
    return `${col}${parseInt(row, 10) + rowOffset}`;
  });
}

export function parseIfNumber(val: unknown): string | number | boolean | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "number" || typeof val === "boolean") return val;
  if (typeof val === "string") {
    const num = Number(val);
    if (!isNaN(num) && val.trim() !== "") {
      return num;
    }
    return val;
  }
  return String(val);
}

function headerGroupsToCells(headers: HeaderGroup[], totalCols: number): TableCell[][] {
  const row: TableCell[] = [];
  let col = 0;
  headers.forEach((g) => {
    const span = g.ids.length || 1;
    row[col] = { value: g.text ?? "", colSpan: span, rowSpan: 1 };
    for (let i = 1; i < span; i++) {
      row[col + i] = { value: "", merged: true };
    }
    col += span;
  });
  while (row.length < totalCols) {
    row.push({ value: "" });
  }
  return [row];
}

export async function exportToExcel(
  headers: HeaderGroup[],
  data: TableCell[][],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Planilha");

  const totalCols = data[0]?.length ?? 0;
  const headerCells = headerGroupsToCells(headers, totalCols);
  const headerRowsCount = headerCells.length;

  const allRows: TableCell[][] = [...headerCells, ...data];

  // valores
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
        excelCell.value = null;
      }

      // estilo
      if (r < headerRowsCount) {
        excelCell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } };
      } else if ((r - headerRowsCount) % 2 === 1) {
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

  // merges
  allRows.forEach((row, r) => {
    const excelRowNumber = r + 1;
    row.forEach((cell, c) => {
      const rowSpan = cell?.rowSpan ?? 1;
      const colSpan = cell?.colSpan ?? 1;
      const isMaster = !cell?.merged && (rowSpan > 1 || colSpan > 1);
      if (isMaster) {
        sheet.mergeCells(excelRowNumber, c + 1, excelRowNumber + rowSpan - 1, c + colSpan);
      }
    });
  });

  sheet.columns.forEach((col) => {
    col.width = 20;
  });

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
}
