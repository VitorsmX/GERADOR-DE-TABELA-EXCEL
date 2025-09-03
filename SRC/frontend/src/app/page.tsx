"use client";
import { useState } from "react";
import Step1 from "../components/Step1";
import Step2 from "../components/Step2";
import Step3 from "../components/Step3";
import Step4 from "../components/Step4";
import { HeaderGroup } from "@/components/Step2/Step2.types";
import { TableCell } from "../components/table/editable-table/EditableTable.types";


export default function Home() {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [headers, setHeaders] = useState<HeaderGroup[]>([]);
  const [data, setData] = useState<TableCell[][]>([]);

  return (
    <div className="p-4">
      {step === 1 && (
        <Step1
          onNext={(r, c) => {
            setRows(r);
            setCols(c);
            setStep(2);
          }}
        />
      )}

      {step === 2 && (
        <Step2
          rows={rows}
          cols={cols}
          onNext={(h: HeaderGroup[]) => {
            // sempre clonar headers antes de salvar
            setHeaders(h.map(header => ({ ...header, ids: [...header.ids] })));

            // inicializar dados da tabela
            setData(
              Array.from({ length: rows }, () =>
                Array.from({ length: cols }, () => ({ value: "" }))
              )
            );

            setStep(3);
          }}
        />
      )}

      {step === 3 && (
        <Step3
          headers={headers}
          data={data}
          onNext={(h, d) => {
            // garantir cópias seguras
            setHeaders(h.map(header => ({ ...header, ids: [...header.ids] })));
            setData(d.map(row => row.map(cell => ({ ...cell }))));
            setStep(4);
          }}
        />
      )}

      {step === 4 && (
        <Step4
          headers={headers}
          data={data}
        />
      )}
    </div>
  );
}
