import { HeaderGroup } from "@/components/Step2/Step2.types";

export type TableCell = {
  value: string;
  rowSpan?: number;
  colSpan?: number;
  merged?: boolean;
};

export type SelectedCell = { row: number; col: number } | null;

export type EditableTableProps = {
  headers: HeaderGroup[];
  data: TableCell[][];
  setHeaders: React.Dispatch<React.SetStateAction<HeaderGroup[]>>;
  setData: React.Dispatch<React.SetStateAction<TableCell[][]>>;
  selectedCell?: SelectedCell;
  setSelectedCell?: React.Dispatch<React.SetStateAction<SelectedCell>>;
};

export type CellProps = {
  r: number;
  c: number;
  cell: TableCell;
  updateCell: (r: number, c: number, value: string) => void;
  insertRow: (rowIndex: number, pos: "above" | "below") => void;
  removeRow: (rowIndex: number) => void;
  insertColumn: (colIndex: number, pos: "left" | "right") => void;
  removeColumn: (colIndex: number) => void;
  mergeColumns: (row: number, startCol: number, endCol: number) => void;
  mergeRows: (col: number, startRow: number, endRow: number) => void;
  mergeBlock: (startRow: number, endRow: number, startCol: number, endCol: number) => void;

  // seleção (opcional)
  selectedCell?: SelectedCell;
  setSelectedCell?: React.Dispatch<React.SetStateAction<SelectedCell>>;
};
