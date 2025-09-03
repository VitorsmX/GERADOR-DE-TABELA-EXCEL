"use client"
import { HeaderGroup } from "@/components/Step3/Step3.types"

export default function TableControls({
  headers,
  data,
  setHeaders,
  setData,
}: {
  headers: HeaderGroup[]
  data: string[][]
  setHeaders: (h: HeaderGroup[]) => void
  setData: (d: string[][]) => void
}) {
  const addRow = () => {
    const newRow = Array(data[0].length).fill("")
    setData([...data, newRow])
  }

  const addColumn = () => {
    const copy = data.map((row) => [...row, ""])
    setData(copy)

    const newHeader: HeaderGroup = { ids: [Date.now()], text: "" }
    setHeaders([...headers, newHeader])
  }

  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={addRow}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        + Linha
      </button>
      <button
        onClick={addColumn}
        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
      >
        + Coluna
      </button>
    </div>
  )
}
