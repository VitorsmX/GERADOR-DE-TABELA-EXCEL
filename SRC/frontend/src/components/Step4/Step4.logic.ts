import ExcelJS from "exceljs";
import { HeaderGroup } from "@/components/Step2/Step2.types";
import { TableCell } from "@/components/Table/EditableTable/EditableTable.types";

export async function exportWithFormulas(
  headers: HeaderGroup[],
  data: TableCell[][],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Planilha");

  // Cabeçalhos
  const headerRow = sheet.addRow(headers.map((h) => h.text));

  headerRow.eachCell((cell, colNumber) => {
    const header = headers[colNumber - 1];
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    if (header?.ids?.length > 1) {
      sheet.mergeCells(
        headerRow.number,
        colNumber,
        headerRow.number,
        colNumber + header.ids.length - 1
      );
    }
  });

  // Dados
  data.forEach((row) => {
    const excelRow = sheet.addRow([]);
    row.forEach((cell, colIndex) => {
      const targetCell = excelRow.getCell(colIndex + 1);
      if (typeof cell.value === "string" && cell.value.startsWith("=")) {
        targetCell.value = { formula: cell.value.slice(1) };
      } else {
        targetCell.value = cell.value;
      }
      targetCell.alignment = { horizontal: "center", vertical: "middle" };
      targetCell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  // Ajustar largura automática
  sheet.columns.forEach((col) => {
    if (!col) return;
    let maxLength = 10;
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value ? cell.value.toString() : "";
      maxLength = Math.max(maxLength, cellValue.length);
    });
    col.width = maxLength + 2;
  });

  await workbook.xlsx.writeFile(fileName);
}
