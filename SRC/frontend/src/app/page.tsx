"use client";

import { useState } from "react";
import type { HeaderGroup } from "@/components/Step2/Step2.types";
import Step1 from "@/components/Step1";
import Step2 from "@/components/Step2";
import Step3 from "@/components/Step3";
import Step4 from "@/components/Step4";
import { TableCell } from "@/components/table/editable-table/EditableTable.types";

export default function Home() {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [headers, setHeaders] = useState<HeaderGroup[]>([]);
  const [data, setData] = useState<TableCell[][]>([]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      {step === 1 && (
        <Step1
          onNext={(row, column) => {
            setRows(row);
            setCols(column);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <Step2
          cols={cols}
          onNext={(h: HeaderGroup[]) => {
            setHeaders(h);
            setData(
              Array(rows)
                .fill(null)
                .map(() =>
                  Array(cols)
                    .fill(null)
                    .map(() => ({ value: "" }))
                )
            );
            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Step3
          headers={headers}
          setHeaders={setHeaders}
          data={data}
          setData={setData}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && <Step4 headers={headers} data={data} />}
    </div>
  );
}
