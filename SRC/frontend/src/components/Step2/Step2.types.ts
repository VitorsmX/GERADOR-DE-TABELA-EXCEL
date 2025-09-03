export type HeaderGroup = {
  ids: number[];
  text: string;
};

export type Step2Props = {
  cols: number;
  onNext: (headers: HeaderGroup[]) => void;
};

export type DraggableHeaderProps = {
  header: HeaderGroup;
  index: number;
  moveHeader: (from: number, to: number) => void;
  updateText: (i: number, value: string) => void;
};
