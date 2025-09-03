import exportExcel from "@/lib/exportExcel";
import { ExportParams } from "@/components/Step3/Step3.types";

/**
 * Exporta a tabela para Excel
 */
export async function handleExportLogic({
  headers,
  data,
  fileName,
}: ExportParams) {
  const now = new Date().toISOString().split("T")[0];
  const name = fileName.trim() || "tabela";

  await exportExcel(
    [headers.map((h) => ({ value: h.text, colSpan: h.ids.length }))],
    data,
    `${name}-${now}.xlsx`
  );
}
