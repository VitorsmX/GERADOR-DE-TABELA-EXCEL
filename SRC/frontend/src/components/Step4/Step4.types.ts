import { TableCell } from "@/components/table/editable-table/EditableTable.types";
import { HeaderGroup } from "@/components/Step2/Step2.types";

export type Step4Props = {
  headers: HeaderGroup[];
  data: TableCell[][];
};

export type FormulaCell = TableCell & {
  isFormula?: boolean;
};
