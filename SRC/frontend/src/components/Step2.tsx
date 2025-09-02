"use client";
import { useState, useCallback, memo } from "react";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { FaArrowsAltH } from "react-icons/fa";

export type HeaderGroup = {
  ids: number[];
  text: string;
};

type DraggableHeaderProps = {
  header: HeaderGroup;
  index: number;
  moveHeader: (from: number, to: number) => void;
  updateText: (i: number, value: string) => void;
};

const DraggableHeader = memo(function DraggableHeader({
  header,
  index,
  moveHeader,
  updateText,
}: DraggableHeaderProps) {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "HEADER",
      item: { index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [index]
  );

  const [, dropRef] = useDrop(
    () => ({
      accept: "HEADER",
      drop: (item: { index: number }) => {
        if (item.index !== index) {
          moveHeader(item.index, index);
        }
      },
    }),
    [index, moveHeader]
  );

  return (
    <div
      ref={(node) => {
        if (node) dragRef(dropRef(node));
      }}
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
  );
});

export default function Step2({
  cols,
  onNext,
}: {
  cols: number;
  onNext: (headers: HeaderGroup[]) => void;
}) {
  const [headers, setHeaders] = useState<HeaderGroup[]>(
    Array.from({ length: cols }, (_, i) => ({ ids: [i], text: "" }))
  );

  const mergeHeaders = useCallback(
    (start: number, end: number) => {
      if (start < 0 || end >= headers.length || start >= end) return;

      const mergedIds = headers
        .slice(start, end + 1)
        .flatMap((h) => h.ids)
        .sort((a, b) => a - b);

      const mergedText = headers
        .slice(start, end + 1)
        .map((h) => h.text)
        .filter(Boolean)
        .join("/");

      const newHeaders = [
        ...headers.slice(0, start),
        { ids: mergedIds, text: mergedText },
        ...headers.slice(end + 1),
      ];

      setHeaders(newHeaders);
    },
    [headers]
  );

  const moveHeader = useCallback(
    (from: number, to: number) => {
      mergeHeaders(Math.min(from, to), Math.max(from, to));
    },
    [mergeHeaders]
  );

  const updateText = useCallback(
    (i: number, value: string) => {
      setHeaders((prev) => {
        const newHeaders = [...prev];
        newHeaders[i] = { ...newHeaders[i], text: value };
        return newHeaders;
      });
    },
    []
  );

  // Detecta se é touch para usar backend apropriado
  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <div className="bg-white p-6 rounded-2xl shadow-lg w-[700px] max-w-full">
        <h2 className="text-xl font-semibold mb-4">Defina os Cabeçalhos</h2>

        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {headers.map((h, i) => (
            <div key={i} className="flex items-center">
              <DraggableHeader
                header={h}
                index={i}
                moveHeader={moveHeader}
                updateText={updateText}
              />
              {i < headers.length - 1 && (
                <button
                  onClick={() => mergeHeaders(i, i + 1)}
                  className="mx-1 p-1 bg-gray-200 rounded hover:bg-gray-300"
                  title="Unir colunas"
                >
                  <FaArrowsAltH />
                </button>
              )}
            </div>
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
  );
}
