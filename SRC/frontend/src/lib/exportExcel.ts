import ExcelJS from "exceljs"
import { TableCell } from "@/components/Table/EditableTable/EditableTable.types"

export default async function exportExcel(
  headers: TableCell[][],
  data: TableCell[][],
  fileName: string
) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet("Tabela")

  const allRows = [...headers, ...data]

  allRows.forEach((row, r) => {
    const excelRow = worksheet.getRow(r + 1)
    row.forEach((cell, c) => {
      const excelCell = excelRow.getCell(c + 1)
      excelCell.value = cell.value

      if (r < headers.length) {
        excelCell.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Calibri" }
        excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F81BD" } }
      } else if (r % 2 === 1) {
        excelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEDED" } }
      }

      excelCell.alignment = { horizontal: "center", vertical: "middle" }
      excelCell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      }

      if ((cell.rowSpan ?? 1) > 1 || (cell.colSpan ?? 1) > 1) {
        worksheet.mergeCells(
          r + 1,
          c + 1,
          r + (cell.rowSpan ?? 1),
          c + (cell.colSpan ?? 1)
        )
      }
    })
  })

  worksheet.columns.forEach(col => { col.width = 20 })

  const buf = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
