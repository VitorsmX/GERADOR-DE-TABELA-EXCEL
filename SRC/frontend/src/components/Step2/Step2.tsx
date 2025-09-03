"use client";

import { useState, useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import { FaArrowsAltH } from "react-icons/fa";
import { Step2Props, HeaderGroup } from "@/components/Step2/Step2.types";
import {
  mergeHeadersLogic,
  moveHeaderLogic,
  updateHeaderTextLogic,
} from "./Step2.logic";
import {
  containerClass,
  headerWrapperClass,
  mergeButtonClass,
  nextButtonClass,
} from "./Step2.styles";
import { DraggableHeader } from "@/components/Table/DraggableHeader";

export default function Step2({ cols, onNext }: Step2Props) {
  const [headers, setHeaders] = useState<HeaderGroup[]>(
    Array.from({ length: cols }, (_, i) => ({ ids: [i], text: "" }))
  );

  const mergeHeaders = useCallback(
    (start: number, end: number) => {
      setHeaders((prev) => mergeHeadersLogic(prev, start, end));
    },
    []
  );

  const moveHeader = useCallback(
    (from: number, to: number) => {
      setHeaders((prev) => moveHeaderLogic(prev, from, to));
    },
    []
  );

  const updateText = useCallback((i: number, value: string) => {
    setHeaders((prev) => updateHeaderTextLogic(prev, i, value));
  }, []);

  const isTouchDevice =
    typeof window !== "undefined" &&
    ("ontouchstart" in window || navigator.maxTouchPoints > 0);

  return (
    <DndProvider backend={isTouchDevice ? TouchBackend : HTML5Backend}>
      <div className={containerClass}>
        <h2 className="text-xl font-semibold mb-4">Defina os Cabeçalhos</h2>

        <div className={headerWrapperClass}>
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
                  className={mergeButtonClass}
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
          className={nextButtonClass}
        >
          Próxima Etapa
        </button>
      </div>
    </DndProvider>
  );
}
