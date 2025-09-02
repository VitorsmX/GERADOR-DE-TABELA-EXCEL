"use client"
import { useState } from "react"
import exportExcel from "@/lib/exportExcel"
import EditableTable, { TableCell } from "@/components/table/EditableTable"

export type HeaderGroup = {
  ids: number[]
  text: string
}

export default function Step3({
  rows,
  cols,
  headers: initialHeaders,
}: {
  rows: number
  cols: number
  headers: HeaderGroup[]
}) {
  const [headers, setHeaders] = useState<HeaderGroup[]>(initialHeaders)
  const [data, setData] = useState<TableCell[][]>(
    Array(rows)
      .fill(null)
      .map(() =>
        Array(cols)
          .fill(null)
          .map(() => ({ value: "" }))
      )
  )
  const [fileName, setFileName] = useState("")

  const handleExport = async () => {
    const now = new Date().toISOString().split("T")[0]
    const name = fileName.trim() || "tabela"
    await exportExcel(
      [headers.map(h => ({ value: h.text, colSpan: h.ids.length }))],
      data,
      `${name}-${now}.xlsx`
    )
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg w-[90%] max-w-5xl overflow-auto">
      <h2 className="text-xl font-semibold mb-4">Monte sua Tabela</h2>

      <EditableTable
        headers={headers}
        data={data}
        setHeaders={setHeaders}
        setData={setData}
      />

      <div className="flex fixed gap-2 items-center justify-end mt-4 top-[2vh] right-2.5 bg-zinc-50 rounded-2xl px-3 py-2">
        <input
          type="text"
          placeholder="Nome do arquivo"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          className="border rounded p-2 bg-zinc-50"
        />
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Gerar Tabela Excel
        </button>
      </div>
    </div>
  )
}
