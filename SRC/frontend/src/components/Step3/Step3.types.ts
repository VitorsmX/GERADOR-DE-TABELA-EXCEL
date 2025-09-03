import { TableCell } from "@/components/Table/editable-table/EditableTable.types";

export type HeaderGroup = {
  ids: number[];
  text: string;
};

export type Step3Props = {
  headers: HeaderGroup[];
  data: TableCell[][];
  setData: React.Dispatch<React.SetStateAction<TableCell[][]>>;
  onNext: () => void;
};

export type ExportParams = {
  headers: HeaderGroup[];
  data: TableCell[][];
  fileName: string;
};
