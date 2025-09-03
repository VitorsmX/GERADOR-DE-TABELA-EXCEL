import { HeaderGroup } from "@/components/Step2/Step2.types";

/**
 * Une cabeçalhos de start até end
 */
export function mergeHeadersLogic(
  headers: HeaderGroup[],
  start: number,
  end: number
): HeaderGroup[] {
  if (start < 0 || end >= headers.length || start >= end) return headers;

  const mergedIds = headers
    .slice(start, end + 1)
    .flatMap((h) => h.ids)
    .sort((a, b) => a - b);

  const mergedText = headers
    .slice(start, end + 1)
    .map((h) => h.text)
    .filter(Boolean)
    .join("/");

  return [
    ...headers.slice(0, start),
    { ids: mergedIds, text: mergedText },
    ...headers.slice(end + 1),
  ];
}

/**
 * Move e une cabeçalhos
 */
export function moveHeaderLogic(
  headers: HeaderGroup[],
  from: number,
  to: number
): HeaderGroup[] {
  return mergeHeadersLogic(headers, Math.min(from, to), Math.max(from, to));
}

/**
 * Atualiza texto de um cabeçalho
 */
export function updateHeaderTextLogic(
  headers: HeaderGroup[],
  index: number,
  value: string
): HeaderGroup[] {
  const newHeaders = [...headers];
  newHeaders[index] = { ...newHeaders[index], text: value };
  return newHeaders;
}
