"use client"
import { useState } from "react"
import { useDrag, useDrop, DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

export type HeaderGroup = {
  ids: number[]
  text: string
}

function DraggableHeader({
  header,
  index,
  moveHeader,
  updateText
}: {
  header: HeaderGroup
  index: number
  moveHeader: (from: number, to: number) => void
  updateText: (i: number, value: string) => void
}) {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "HEADER",
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  const [, dropRef] = useDrop(() => ({
    accept: "HEADER",
    drop: (item: { index: number }) => {
      if (item.index !== index) {
        moveHeader(item.index, index)
      }
    },
  }))

  return (
    <div
      ref={(node) => {if (node) dragRef(dropRef(node))}}
      className={`border rounded p-2 w-32 text-center cursor-move bg-gray-50 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <input
        type="text"
        value={header.text}
        onChange={(e) => updateText(index, e.target.value)}
        className="w-full border rounded p-1"
      />
      {header.ids.length > 1 && (
        <div className="text-xs text-gray-500">
          ({header.ids.length} colunas unidas)
        </div>
      )}
    </div>
  )
}

export default function Step2({
  cols,
  onNext,
}: {
  cols: number
  onNext: (headers: HeaderGroup[]) => void
}) {
  const [headers, setHeaders] = useState<HeaderGroup[]>(
    Array(cols)
      .fill(null)
      .map((_, i) => ({ ids: [i], text: "" }))
  )

  const moveHeader = (from: number, to: number) => {
    // une os dois grupos
    const newHeaders = [...headers]
    const fromGroup = newHeaders[from]
    const toGroup = newHeaders[to]

    const merged: HeaderGroup = {
      ids: [...fromGroup.ids, ...toGroup.ids].sort((a, b) => a - b),
      text:
        fromGroup.text && toGroup.text
          ? `${fromGroup.text}/${toGroup.text}`
          : fromGroup.text || toGroup.text,
    }

    // remove ambos
    newHeaders.splice(Math.max(from, to), 1)
    newHeaders.splice(Math.min(from, to), 1)

    // adiciona grupo unido na posição "to"
    newHeaders.splice(Math.min(from, to), 0, merged)

    setHeaders(newHeaders)
  }

  const updateText = (i: number, value: string) => {
    const newHeaders = [...headers]
    newHeaders[i].text = value
    setHeaders(newHeaders)
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[700px] max-w-full">
        <h2 className="text-xl font-semibold mb-4">Defina os Cabeçalhos</h2>

        <div className="flex flex-wrap gap-2 mb-4">
          {headers.map((h, i) => (
            <DraggableHeader
              key={i}
              header={h}
              index={i}
              moveHeader={moveHeader}
              updateText={updateText}
            />
          ))}
        </div>

        <button
          onClick={() => onNext(headers)}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Próxima Etapa
        </button>
      </div>
    </DndProvider>
  )
}
