import { TableCell } from "@/components/table/editable-table/EditableTable.types";
import { HeaderGroup } from "@/components/Step2/Step2.types";

export type Step4Props = {
  headers: HeaderGroup[];
  data: TableCell[][];
};

export type TableCellWithDisplay = TableCell & {
  displayValue?: string | number | boolean;
};

// Step4.types.ts
export type SelectedCell = { row: number; col: number } | null;
