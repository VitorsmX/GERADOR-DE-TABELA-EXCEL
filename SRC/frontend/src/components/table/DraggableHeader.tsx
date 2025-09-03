"use client";

import { memo } from "react";
import { useDrag, useDrop } from "react-dnd";
import { DraggableHeaderProps } from "@/components/Step2/Step2.types";

export const DraggableHeader = memo(function DraggableHeader({
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
