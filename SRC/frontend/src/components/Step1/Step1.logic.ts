import { DimensionType, NumberOrEmpty } from "@/components/Step1/Step1.types";

/**
 * Valida e limita o valor de linhas/colunas
 */
export function clampValue(
  value: NumberOrEmpty,
  type: DimensionType,
  setError: (msg: string | null) => void
): number {
  if (value === "" || isNaN(Number(value))) {
    setError(`O número de ${type} não pode ser vazio.`);
    return 1;
  }

  const num = Number(value);

  if (num < 1) {
    setError(`O número de ${type} não pode ser menor que 1.`);
    return 1;
  }

  if (num > 200) {
    setError(`O número de ${type} não pode ser maior que 200.`);
    return 200;
  }

  setError(null);
  return num;
}
