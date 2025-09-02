"use client";

import { useState } from "react";
import Step1 from "@/components/Step1";
import Step2, { HeaderGroup } from "@/components/Step2";
import Step3 from "@/components/Step3";

export default function Home() {
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [headers, setHeaders] = useState<HeaderGroup[]>([]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
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
          cols={cols}
          onNext={(h: HeaderGroup[]) => {
            setHeaders(h);
            setStep(3);
          }}
        />
      )}

      {step === 3 && <Step3 rows={rows} cols={cols} headers={headers} />}
    </div>
  );
}
