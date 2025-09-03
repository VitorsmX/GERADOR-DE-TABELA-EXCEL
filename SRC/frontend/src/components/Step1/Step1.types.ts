export type Step1Props = {
  onNext: (rows: number, cols: number) => void;
};

export type NumberOrEmpty = number | "";

export type DimensionType = "linhas" | "colunas";
